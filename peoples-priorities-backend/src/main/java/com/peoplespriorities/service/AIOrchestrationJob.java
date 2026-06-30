package com.peoplespriorities.service;

import com.peoplespriorities.model.Theme;
import com.peoplespriorities.repository.SubmissionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

/**
 * Scheduled background job that scans for constituencies with pending citizen
 * submissions and runs the Gemini theme clustering and priority ranking pipeline.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AIOrchestrationJob {

    private final SubmissionRepository submissionRepository;
    private final GeminiThemeService geminiThemeService;
    private final PriorityRankingService priorityRankingService;

    private Instant lastRunTimestamp;

    /**
     * Periodic trigger that runs every 2 hours.
     */
    @Scheduled(cron = "0 0 */2 * * *")
    public void runPipeline() {
        log.info("Starting AI Orchestration pipeline job at {}", Instant.now());
        
        List<String> activeConstituencyIds = submissionRepository.findDistinctConstituencyIdsWithPendingSubmissions();
        log.info("Found {} constituencies with pending submissions to process", activeConstituencyIds.size());

        for (String id : activeConstituencyIds) {
            try {
                runPipelineForConstituency(id);
            } catch (Exception e) {
                log.error("Pipeline failure for constituency {}: {}", id, e.getMessage(), e);
            }
        }

        lastRunTimestamp = Instant.now();
        log.info("AI Orchestration pipeline job completed at {}", lastRunTimestamp);
    }

    /**
     * Synchronously clusters and ranks priorities for a single constituency.
     * Useful for manual triggers from the admin controller.
     */
    @org.springframework.cache.annotation.CacheEvict(value = {"priorities", "themes", "heatmap", "dashboard-stats"}, key = "#constituencyId")
    public void runPipelineForConstituency(String constituencyId) {
        log.info("Triggering AI pipeline for constituency: {}", constituencyId);
        List<Theme> themes = geminiThemeService.clusterSubmissions(constituencyId);
        if (!themes.isEmpty()) {
            priorityRankingService.rankThemes(constituencyId, themes);
            log.info("AI pipeline successfully processed constituency: {} (generated {} themes)",
                    constituencyId, themes.size());
        } else {
            log.info("No themes generated for constituency: {} (insufficient submissions)", constituencyId);
        }
    }

    public Instant getLastRunTimestamp() {
        return lastRunTimestamp != null ? lastRunTimestamp : Instant.now();
    }
}
