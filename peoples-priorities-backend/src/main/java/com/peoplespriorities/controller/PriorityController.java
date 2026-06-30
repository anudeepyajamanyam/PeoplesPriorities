package com.peoplespriorities.controller;

import com.peoplespriorities.dto.PriorityResponse;
import com.peoplespriorities.model.Priority;
import com.peoplespriorities.repository.PriorityRepository;
import com.peoplespriorities.service.PriorityRankingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Controller to manage development priority boards, approvals, flagging, and data export.
 */
@RestController
@RequestMapping("/api/priorities")
@RequiredArgsConstructor
@Tag(name = "Priorities", description = "Query, approve, flag, or export ranked development priorities")
public class PriorityController {

    private final PriorityRepository priorityRepository;
    private final PriorityRankingService priorityRankingService;

    @GetMapping
    @Operation(summary = "Get constituency priorities", description = "Fetches the current AI-ranked development priorities for a constituency.")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved priorities")
    @org.springframework.cache.annotation.Cacheable(value = "priorities", key = "#constituencyId")
    public ResponseEntity<List<PriorityResponse>> getPriorities(@RequestParam("constituencyId") String constituencyId) {
        List<PriorityResponse> list = priorityRepository.findByConstituencyIdOrderByRankAsc(constituencyId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Approve a priority", description = "MP approves this development priority for active implementation.")
    @ApiResponse(responseCode = "200", description = "Priority marked approved")
    @org.springframework.cache.annotation.CacheEvict(value = "priorities", key = "#result.body.constituencyId")
    public ResponseEntity<Priority> approvePriority(
            @PathVariable("id") UUID id,
            @AuthenticationPrincipal String adminId) {
        // Fallback admin ID if principal details are mock/empty
        String auditor = adminId != null ? adminId : "mp-demo-user";
        Priority approved = priorityRankingService.approvePriority(id, auditor);
        return ResponseEntity.ok(approved);
    }

    @PostMapping("/{id}/flag")
    @Operation(summary = "Flag a priority", description = "MP flags this development priority to filter or request recalculation.")
    @ApiResponse(responseCode = "200", description = "Priority marked flagged")
    @org.springframework.cache.annotation.CacheEvict(value = "priorities", key = "#result.body.constituencyId")
    public ResponseEntity<Priority> flagPriority(
            @PathVariable("id") UUID id,
            @AuthenticationPrincipal String adminId) {
        String auditor = adminId != null ? adminId : "mp-demo-user";
        Priority flagged = priorityRankingService.flagPriority(id, auditor);
        return ResponseEntity.ok(flagged);
    }

    @PostMapping("/{id}/upvote")
    @Operation(summary = "Upvote a priority", description = "Allows public citizens to upvote a priority to indicate they have the same issue.")
    @ApiResponse(responseCode = "200", description = "Priority upvote registered")
    @org.springframework.cache.annotation.CacheEvict(value = "priorities", key = "#result.body.constituencyId")
    public ResponseEntity<Priority> upvotePriority(@PathVariable("id") UUID id) {
        Priority upvoted = priorityRankingService.upvotePriority(id);
        return ResponseEntity.ok(upvoted);
    }

    @GetMapping("/export")
    @Operation(summary = "Export priorities to CSV", description = "Generates a downloadable CSV summary of ranked priorities and their evidence.")
    @ApiResponse(responseCode = "200", description = "CSV generated and attached")
    public ResponseEntity<byte[]> exportPriorities(@RequestParam("constituencyId") String constituencyId) {
        List<Priority> priorities = priorityRepository.findByConstituencyIdOrderByRankAsc(constituencyId);

        StringBuilder sb = new StringBuilder();
        sb.append("Rank,Theme,Score,Citizen Submissions,AI Evidence,Status,Approved At\n");

        for (Priority p : priorities) {
            String label = p.getTheme() != null ? p.getTheme().getLabel() : "N/A";
            int count = p.getTheme() != null ? p.getTheme().getSubmissionCount() : 0;
            String evidence = p.getEvidence() != null ? p.getEvidence().replace("\"", "\"\"") : "";
            String status = p.getStatus() != null ? p.getStatus() : "pending";
            String approvedAt = p.getApprovedAt() != null ? p.getApprovedAt().toString() : "N/A";

            sb.append(String.format("%d,\"%s\",%s,%d,\"%s\",\"%s\",\"%s\"\n",
                    p.getRank(),
                    label.replace("\"", "\"\""),
                    p.getScore(),
                    count,
                    evidence,
                    status,
                    approvedAt
            ));
        }

        byte[] csvBytes = sb.toString().getBytes(StandardCharsets.UTF_8);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", "priorities-" + constituencyId + ".csv");
        headers.setContentLength(csvBytes.length);

        return ResponseEntity.ok().headers(headers).body(csvBytes);
    }

    private PriorityResponse mapToResponse(Priority p) {
        return PriorityResponse.builder()
                .id(p.getId())
                .rank(p.getRank())
                .themeLabel(p.getTheme() != null ? p.getTheme().getLabel() : "N/A")
                .score(p.getScore())
                .submissionCount(p.getTheme() != null ? p.getTheme().getSubmissionCount() : 0)
                .evidence(p.getEvidence())
                .status(p.getStatus())
                .approvedAt(p.getApprovedAt())
                .build();
    }
}
