package com.peoplespriorities.controller;

import com.peoplespriorities.dto.DashboardStats;
import com.peoplespriorities.repository.PriorityRepository;
import com.peoplespriorities.repository.SubmissionRepository;
import com.peoplespriorities.repository.ThemeRepository;
import com.peoplespriorities.service.AIOrchestrationJob;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;

/**
 * Controller providing aggregate metric counters and pipeline manual controls
 * for the MP constituency dashboard.
 */
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Query dashboard statistics or trigger the development analysis pipeline manually")
public class DashboardController {

    private final SubmissionRepository submissionRepository;
    private final ThemeRepository themeRepository;
    private final PriorityRepository priorityRepository;
    private final AIOrchestrationJob aiOrchestrationJob;

    @GetMapping("/stats")
    @Operation(summary = "Get constituency dashboard statistics", description = "Retrieves aggregate counts (total submissions, themes, active wards, etc.) for dashboard display.")
    @ApiResponse(responseCode = "200", description = "Metrics successfully calculated")
    @org.springframework.cache.annotation.Cacheable(value = "dashboard-stats", key = "#constituencyId")
    public ResponseEntity<DashboardStats> getStats(@RequestParam("constituencyId") String constituencyId) {
        long totalSubmissions = submissionRepository.countByConstituencyId(constituencyId);
        long totalThemes = themeRepository.countByConstituencyId(constituencyId);
        long wardsActive = submissionRepository.countDistinctWardsByConstituencyId(constituencyId);
        long pendingApprovals = priorityRepository.countByConstituencyIdAndStatus(constituencyId, "pending");
        Instant lastRun = aiOrchestrationJob.getLastRunTimestamp();
        long last24h = submissionRepository.countByConstituencyIdAndCreatedAtAfter(constituencyId, Instant.now().minus(24, ChronoUnit.HOURS));

        DashboardStats stats = DashboardStats.builder()
                .totalSubmissions(totalSubmissions)
                .totalThemes(totalThemes)
                .wardsActive(wardsActive)
                .pendingApprovals(pendingApprovals)
                .lastPipelineRun(lastRun)
                .submissionsLast24h(last24h)
                .build();

        return ResponseEntity.ok(stats);
    }

    @PostMapping("/admin/trigger-pipeline")
    @Operation(summary = "Manually trigger AI pipeline", description = "Runs theme clustering and ranking operations for a constituency immediately.")
    @ApiResponse(responseCode = "200", description = "Pipeline finished processing successfully")
    @org.springframework.cache.annotation.CacheEvict(value = {"priorities", "themes", "heatmap", "dashboard-stats"}, key = "#constituencyId")
    public ResponseEntity<Map<String, Object>> triggerPipeline(@RequestParam("constituencyId") String constituencyId) {
        aiOrchestrationJob.runPipelineForConstituency(constituencyId);
        
        long themes = themeRepository.countByConstituencyId(constituencyId);
        long priorities = priorityRepository.countByConstituencyIdAndStatus(constituencyId, "pending");

        return ResponseEntity.ok(Map.of(
                "message", "Pipeline completed",
                "themesGenerated", themes,
                "prioritiesRanked", priorities
        ));
    }
}
