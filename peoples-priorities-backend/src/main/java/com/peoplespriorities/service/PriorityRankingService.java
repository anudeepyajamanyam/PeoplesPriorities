package com.peoplespriorities.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.cloud.vertexai.VertexAI;
import com.google.cloud.vertexai.generativeai.GenerativeModel;
import com.peoplespriorities.exception.AppException;
import com.peoplespriorities.model.Priority;
import com.peoplespriorities.model.Submission;
import com.peoplespriorities.model.Theme;
import com.peoplespriorities.repository.PriorityRepository;
import com.peoplespriorities.repository.SubmissionRepository;
import com.peoplespriorities.service.BigQueryEnrichmentService.WardContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service to score and rank development priorities based on citizen demand,
 * demographics, and severity.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PriorityRankingService {

    private final SubmissionRepository submissionRepository;
    private final PriorityRepository priorityRepository;
    private final BigQueryEnrichmentService bigQueryEnrichmentService;
    private final ObjectMapper objectMapper;

    @Value("${gcp.project-id:your-gcp-project-id}")
    private String projectId;

    @Value("${gcp.location:us-central1}")
    private String location;

    @Transactional
    public List<Priority> rankThemes(String constituencyId, List<Theme> themes) {
        log.info("Ranking {} themes for constituency: {}", themes.size(), constituencyId);

        List<Priority> freshPriorities = new ArrayList<>();

        for (Theme theme : themes) {
            // Get submissions to find wards and aggregate context
            List<Submission> submissions = submissionRepository.findByTheme(theme);
            Set<String> wards = submissions.stream()
                    .map(Submission::getWard)
                    .filter(Objects::nonNull)
                    .filter(w -> !w.isBlank())
                    .collect(Collectors.toSet());

            String wardsListStr = wards.isEmpty() ? "Unknown Wards" : String.join(", ", wards);

            // Fetch demographics & notes for all unique wards
            int totalPopulation = 0;
            List<String> infraNotes = new ArrayList<>();
            for (String ward : wards) {
                WardContext context = bigQueryEnrichmentService.getWardContext(constituencyId, ward);
                totalPopulation += context.getPopulation();
                infraNotes.add(ward + ": " + context.getExistingInfraNote());
            }

            if (totalPopulation == 0) {
                totalPopulation = 50000; // default baseline
            }
            String combinedInfraNote = infraNotes.isEmpty() ? "No recent development recorded" : String.join("; ", infraNotes);

            // Build Prompt
            String prompt = String.format(
                    "You are advising an Indian Member of Parliament on constituency development priorities.\n\n" +
                    "Theme: %s\n" +
                    "Number of citizen submissions: %d\n" +
                    "Wards where demand was reported: %s\n" +
                    "AI summary of citizen demand: %s\n" +
                    "Estimated population in affected wards: %d\n" +
                    "Existing infrastructure note: %s\n\n" +
                    "Score this development priority on a scale of 0 to 100 based on:\n" +
                    "- Volume and spread of citizen demand (across wards)\n" +
                    "- Estimated population impact\n" +
                    "- Severity of the gap (how urgently is this needed)\n" +
                    "- Feasibility of MP-level intervention\n\n" +
                    "Return ONLY valid JSON. No explanation, no markdown:\n" +
                    "{\"score\": 82, \"evidence\": \"One sentence explaining why this is ranked where it is, citing the citizen demand and impact.\"}",
                    theme.getLabel(),
                    theme.getSubmissionCount(),
                    wardsListStr,
                    theme.getAiSummary(),
                    totalPopulation,
                    combinedInfraNote
            );

            ScoringResult scoringResult;
            try {
                scoringResult = callGeminiForScoring(prompt);
            } catch (Exception e) {
                log.warn("Gemini scoring failed, falling back: {}", e.getMessage());
                scoringResult = null;
            }

            if (scoringResult == null) {
                scoringResult = executeDeterministicScoring(theme, totalPopulation, wards.size());
            }

            Priority priority = Priority.builder()
                    .constituencyId(constituencyId)
                    .theme(theme)
                    .score(BigDecimal.valueOf(scoringResult.score))
                    .evidence(scoringResult.evidence)
                    .status("pending")
                    .build();

            freshPriorities.add(priority);
        }

        // Sort by score descending
        freshPriorities.sort((p1, p2) -> p2.getScore().compareTo(p1.getScore()));

        // Assign ranks (1-indexed)
        for (int i = 0; i < freshPriorities.size(); i++) {
            freshPriorities.get(i).setRank(i + 1);
        }

        // Replace existing priorities for the constituency
        priorityRepository.deleteByConstituencyId(constituencyId);
        List<Priority> saved = priorityRepository.saveAll(freshPriorities);

        log.info("Saved {} fresh ranked priorities for constituency: {}", saved.size(), constituencyId);
        return saved;
    }

    @Transactional
    public Priority approvePriority(UUID id, String adminId) {
        log.info("Approving priority ID: {} by admin: {}", id, adminId);
        Priority priority = priorityRepository.findById(id)
                .orElseThrow(() -> new AppException("Priority not found: " + id, HttpStatus.NOT_FOUND));
        priority.setStatus("approved");
        priority.setApprovedBy(adminId);
        priority.setApprovedAt(Instant.now());
        return priorityRepository.save(priority);
    }

    @Transactional
    public Priority flagPriority(UUID id, String adminId) {
        log.info("Flagging priority ID: {} by admin: {}", id, adminId);
        Priority priority = priorityRepository.findById(id)
                .orElseThrow(() -> new AppException("Priority not found: " + id, HttpStatus.NOT_FOUND));
        priority.setStatus("flagged");
        priority.setApprovedBy(adminId);
        priority.setApprovedAt(Instant.now());
        return priorityRepository.save(priority);
    }

    @io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker(name = "gemini-cb", fallbackMethod = "fallbackCallGeminiForScoring")
    public ScoringResult callGeminiForScoring(String prompt) {
        try (VertexAI vertexAi = new VertexAI(projectId, location)) {
            GenerativeModel model = new GenerativeModel("gemini-1.5-flash", vertexAi);
            String response = model.generateContent(prompt).getCandidates(0).getContent().getParts(0).getText();

            if (response != null) {
                response = response.trim();
                if (response.startsWith("```")) {
                    response = response.replaceAll("^```[a-zA-Z]*\\s*", "");
                    response = response.replaceAll("\\s*```$", "");
                }
                response = response.trim();

                JsonNode root = objectMapper.readTree(response);
                double score = root.get("score").asDouble();
                String evidence = root.get("evidence").asText();
                return new ScoringResult(score, evidence);
            }
            throw new RuntimeException("Gemini returned empty response for scoring");
        } catch (Exception e) {
            throw new RuntimeException("Gemini scoring failed", e);
        }
    }

    public ScoringResult fallbackCallGeminiForScoring(String prompt, Throwable t) {
        log.warn("Gemini scoring circuit breaker active or call failed: {}. Falling back to deterministic scoring.", t.getMessage());
        return null;
    }

    private ScoringResult executeDeterministicScoring(Theme theme, int population, int wardCount) {
        // Simple formula: volume weighting + log of population size
        double volumeFactor = Math.min(40.0, theme.getSubmissionCount() * 1.5);
        double populationFactor = Math.min(30.0, Math.log10(population) * 6.0);
        double spreadFactor = Math.min(30.0, wardCount * 6.0);

        double score = Math.round((volumeFactor + populationFactor + spreadFactor) * 10.0) / 10.0;
        if (score < 10) score = 45.0; // baseline

        String evidence = String.format("Ranked at score %.1f based on %d submissions across %d wards affecting up to %d residents.",
                score, theme.getSubmissionCount(), wardCount, population);

        return new ScoringResult(score, evidence);
    }

    private static class ScoringResult {
        double score;
        String evidence;

        ScoringResult(double score, String evidence) {
            this.score = score;
            this.evidence = evidence;
        }
    }

    @Transactional
    public Priority upvotePriority(UUID id) {
        Priority priority = priorityRepository.findById(id)
                .orElseThrow(() -> new AppException("Priority not found", HttpStatus.NOT_FOUND));

        if (priority.getTheme() != null) {
            priority.getTheme().setSubmissionCount(priority.getTheme().getSubmissionCount() + 1);
        }

        BigDecimal currentScore = priority.getScore() != null ? priority.getScore() : BigDecimal.ZERO;
        BigDecimal newScore = currentScore.add(BigDecimal.valueOf(1.50)).min(BigDecimal.valueOf(100.00));
        priority.setScore(newScore);

        log.info("Priority {} upvoted. New submission count: {}, new score: {}",
                id, priority.getTheme() != null ? priority.getTheme().getSubmissionCount() : 0, newScore);

        return priorityRepository.save(priority);
    }
}
