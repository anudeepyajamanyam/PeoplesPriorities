package com.peoplespriorities.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** Response envelope for a ranked development priority. */
@Data
@Builder
public class PriorityResponse {
    private UUID id;
    private Integer rank;
    private String themeLabel;
    private BigDecimal score;
    private Integer submissionCount;
    private String evidence;
    private String status;
    private Instant approvedAt;
}
