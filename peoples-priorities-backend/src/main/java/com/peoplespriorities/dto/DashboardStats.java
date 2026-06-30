package com.peoplespriorities.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;

/** Aggregate statistics for the MP dashboard. */
@Data
@Builder
public class DashboardStats {
    private Long totalSubmissions;
    private Long totalThemes;
    private Long wardsActive;
    private Long pendingApprovals;
    private Instant lastPipelineRun;
    private Long submissionsLast24h;
}
