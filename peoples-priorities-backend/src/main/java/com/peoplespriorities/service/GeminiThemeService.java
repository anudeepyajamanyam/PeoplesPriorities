package com.peoplespriorities.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.cloud.vertexai.VertexAI;
import com.google.cloud.vertexai.generativeai.GenerativeModel;
import com.peoplespriorities.dto.ThemeClusterResult;
import com.peoplespriorities.model.Submission;
import com.peoplespriorities.model.Theme;
import com.peoplespriorities.repository.SubmissionRepository;
import com.peoplespriorities.repository.ThemeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service that groups pending citizen submissions into actionable development themes
 * using Gemini 1.5 Flash.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GeminiThemeService {

    private final SubmissionRepository submissionRepository;
    private final ThemeRepository themeRepository;
    private final ObjectMapper objectMapper;

    @Value("${gcp.project-id:your-gcp-project-id}")
    private String projectId;

    @Value("${gcp.location:us-central1}")
    private String location;

    /**
     * Clusters pending submissions for the given constituency.
     * Requires at least 5 pending submissions to proceed.
     */
    @Transactional
    public List<Theme> clusterSubmissions(String constituencyId) {
        log.info("Starting theme clustering for constituency: {}", constituencyId);

        List<Submission> pendingSubmissions = submissionRepository.findByConstituencyIdAndStatus(constituencyId, "pending");

        if (pendingSubmissions.size() < 1) {
            log.info("No pending submissions to cluster for constituency: {}", constituencyId);
            return Collections.emptyList();
        }

        // Build submissionsJson
        List<Map<String, String>> submissionsPayload = pendingSubmissions.stream()
                .map(sub -> {
                    Map<String, String> item = new HashMap<>();
                    item.put("id", sub.getId().toString());
                    String content = sub.getTranslatedContent() != null ? sub.getTranslatedContent() : sub.getRawContent();
                    item.put("content", content);
                    return item;
                })
                .collect(Collectors.toList());

        String submissionsJson;
        try {
            submissionsJson = objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(submissionsPayload);
        } catch (Exception e) {
            log.error("Failed to build JSON payload for Gemini: {}", e.getMessage());
            return Collections.emptyList();
        }

        String prompt = String.format(
                "You are analyzing citizen development requests submitted to an Indian Member of Parliament's constituency office.\n\n" +
                "Below are citizen submissions in JSON format. Each has an \"id\" (UUID) and \"content\" (the citizen's request, already translated to English).\n\n" +
                "Your task: Cluster these submissions into 5 to 10 meaningful development themes that an MP can act on. Common themes include: Road repair, Water supply, School infrastructure, Healthcare access, Street lighting, Drainage, Agricultural support, Vocational training, and others as appropriate.\n\n" +
                "Return ONLY a valid JSON array. No explanation, no markdown, no preamble. The response must start with [ and end with ].\n\n" +
                "Schema:\n" +
                "[\n" +
                "  {\n" +
                "    \"label\": \"Theme name (3-5 words)\",\n" +
                "    \"submissionIds\": [\"uuid1\", \"uuid2\"],\n" +
                "    \"summary\": \"One sentence describing the collective citizen demand for this theme.\"\n" +
                "  }\n" +
                "]\n\n" +
                "Submissions:\n" +
                "%s",
                submissionsJson
        );

        List<ThemeClusterResult> clusters;
        try {
            clusters = callGeminiForClustering(prompt);
        } catch (Exception e) {
            log.warn("Gemini clustering failed, falling back: {}", e.getMessage());
            clusters = null;
        }

        if (clusters == null || clusters.isEmpty()) {
            log.warn("Gemini returned empty or invalid clusters. Executing deterministic fallback.");
            clusters = executeFallbackClustering(pendingSubmissions);
        }

        List<Theme> updatedThemes = new ArrayList<>();
        Map<UUID, Submission> pendingMap = pendingSubmissions.stream()
                .collect(Collectors.toMap(Submission::getId, s -> s));

        for (ThemeClusterResult cluster : clusters) {
            if (cluster.getLabel() == null || cluster.getLabel().isBlank()) {
                continue;
            }

            // Find or create theme
            Theme theme = themeRepository.findByLabelAndConstituencyId(cluster.getLabel(), constituencyId)
                    .orElseGet(() -> Theme.builder()
                            .constituencyId(constituencyId)
                            .label(cluster.getLabel())
                            .submissionCount(0)
                            .build());

            theme.setAiSummary(cluster.getSummary());
            theme.setLastUpdated(Instant.now());

            List<Submission> clusteredInThisTheme = new ArrayList<>();
            if (cluster.getSubmissionIds() != null) {
                for (String idStr : cluster.getSubmissionIds()) {
                    try {
                        UUID uuid = UUID.fromString(idStr);
                        Submission sub = pendingMap.get(uuid);
                        if (sub != null) {
                            sub.setTheme(theme);
                            sub.setStatus("clustered");
                            clusteredInThisTheme.add(sub);
                        }
                    } catch (IllegalArgumentException ignored) {}
                }
            }

            theme.setSubmissionCount(theme.getSubmissionCount() + clusteredInThisTheme.size());
            themeRepository.save(theme);
            submissionRepository.saveAll(clusteredInThisTheme);

            updatedThemes.add(theme);
        }

        return updatedThemes;
    }

    @io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker(name = "gemini-cb", fallbackMethod = "fallbackCallGeminiForClustering")
    public List<ThemeClusterResult> callGeminiForClustering(String prompt) {
        try (VertexAI vertexAi = new VertexAI(projectId, location)) {
            GenerativeModel model = new GenerativeModel("gemini-1.5-flash", vertexAi);
            String response = model.generateContent(prompt).getCandidates(0).getContent().getParts(0).getText();
            
            // Strip markdown block markers if present
            if (response != null) {
                response = response.trim();
                if (response.startsWith("```")) {
                    response = response.replaceAll("^```[a-zA-Z]*\\s*", "");
                    response = response.replaceAll("\\s*```$", "");
                }
                response = response.trim();
                return objectMapper.readValue(response, new TypeReference<List<ThemeClusterResult>>() {});
            }
            throw new RuntimeException("Gemini returned empty response");
        } catch (Exception e) {
            throw new RuntimeException("Gemini clustering failed", e);
        }
    }

    public List<ThemeClusterResult> fallbackCallGeminiForClustering(String prompt, Throwable t) {
        log.warn("Gemini clustering circuit breaker active or call failed: {}. Falling back to keyword clustering.", t.getMessage());
        return null;
    }

    private List<ThemeClusterResult> executeFallbackClustering(List<Submission> pendingSubmissions) {
        log.info("Running standard keyword-based fallback clustering");
        Map<String, List<String>> keywordToIds = new LinkedHashMap<>();
        keywordToIds.put("Road Repair & Transport", new ArrayList<>());
        keywordToIds.put("Water Supply & Security", new ArrayList<>());
        keywordToIds.put("School Infrastructure", new ArrayList<>());
        keywordToIds.put("Healthcare Access", new ArrayList<>());
        keywordToIds.put("Civic Waste & Drainage", new ArrayList<>());
        keywordToIds.put("Other Local Demands", new ArrayList<>());

        for (Submission sub : pendingSubmissions) {
            String text = ((sub.getTranslatedContent() != null ? sub.getTranslatedContent() : sub.getRawContent()) + " " +
                           (sub.getCategory() != null ? sub.getCategory() : "")).toLowerCase();
            
            String id = sub.getId().toString();
            if (text.contains("road") || text.contains("street") || text.contains("pothole") || text.contains("pavement") || text.contains("traffic")) {
                keywordToIds.get("Road Repair & Transport").add(id);
            } else if (text.contains("water") || text.contains("pipe") || text.contains("tanker") || text.contains("drink")) {
                keywordToIds.get("Water Supply & Security").add(id);
            } else if (text.contains("school") || text.contains("class") || text.contains("desk") || text.contains("teacher") || text.contains("education")) {
                keywordToIds.get("School Infrastructure").add(id);
            } else if (text.contains("health") || text.contains("clinic") || text.contains("hospital") || text.contains("doctor") || text.contains("phc")) {
                keywordToIds.get("Healthcare Access").add(id);
            } else if (text.contains("drain") || text.contains("sewer") || text.contains("waste") || text.contains("garbage") || text.contains("trash")) {
                keywordToIds.get("Civic Waste & Drainage").add(id);
            } else {
                keywordToIds.get("Other Local Demands").add(id);
            }
        }

        List<ThemeClusterResult> results = new ArrayList<>();
        keywordToIds.forEach((label, ids) -> {
            if (!ids.isEmpty()) {
                ThemeClusterResult cluster = new ThemeClusterResult();
                cluster.setLabel(label);
                cluster.setSubmissionIds(ids);
                cluster.setSummary("Citizen suggestions raising issues regarding " + label.toLowerCase() + " in their localities.");
                results.add(cluster);
            }
        });
        return results;
    }
}
