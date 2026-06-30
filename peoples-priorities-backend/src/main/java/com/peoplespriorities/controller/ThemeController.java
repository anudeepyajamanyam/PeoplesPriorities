package com.peoplespriorities.controller;

import com.peoplespriorities.dto.HeatmapPoint;
import com.peoplespriorities.dto.SubmissionResponse;
import com.peoplespriorities.model.Submission;
import com.peoplespriorities.model.Theme;
import com.peoplespriorities.repository.SubmissionRepository;
import com.peoplespriorities.repository.ThemeRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Controller to handle clustered themes, spatial mapping datasets, and theme-wise submissions.
 */
@RestController
@RequestMapping("/api/themes")
@RequiredArgsConstructor
@Tag(name = "Themes & Heatmaps", description = "Query clustered themes, fetch GIS heatmap coordinates, or inspect submissions under a theme")
public class ThemeController {

    private final ThemeRepository themeRepository;
    private final SubmissionRepository submissionRepository;

    @GetMapping("/heatmap")
    @Operation(summary = "Get spatial heatmap data", description = "Fetches aggregated lat/lng/weight points for Google Maps Heatmap visualization.")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved spatial data points")
    @org.springframework.cache.annotation.Cacheable(value = "heatmap", key = "#constituencyId")
    public ResponseEntity<List<HeatmapPoint>> getHeatmapPoints(@RequestParam("constituencyId") String constituencyId) {
        return ResponseEntity.ok(submissionRepository.findHeatmapPoints(constituencyId));
    }

    @GetMapping
    @Operation(summary = "Get all constituency themes", description = "Fetches a listing of all identified development themes for a constituency.")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved themes")
    @org.springframework.cache.annotation.Cacheable(value = "themes", key = "#constituencyId")
    public ResponseEntity<List<Theme>> getThemes(@RequestParam("constituencyId") String constituencyId) {
        return ResponseEntity.ok(themeRepository.findByConstituencyId(constituencyId));
    }

    @GetMapping("/{themeId}/submissions")
    @Operation(summary = "Get submissions by theme", description = "Retrieves a paginated list of individual citizen suggestions categorized under this theme.")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved page of submissions")
    public ResponseEntity<Page<SubmissionResponse>> getThemeSubmissions(
            @PathVariable("themeId") UUID themeId,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Submission> submissionsPage = submissionRepository.findByThemeId(themeId, pageable);
        
        Page<SubmissionResponse> responsePage = submissionsPage.map(this::mapToResponse);
        return ResponseEntity.ok(responsePage);
    }

    private SubmissionResponse mapToResponse(Submission s) {
        return SubmissionResponse.builder()
                .id(s.getId())
                .status(s.getStatus())
                .type(s.getType())
                .rawContent(s.getRawContent())
                .translatedContent(s.getTranslatedContent())
                .ward(s.getWard())
                .gcsUri(s.getGcsUri())
                .themeLabel(s.getTheme() != null ? s.getTheme().getLabel() : null)
                .createdAt(s.getCreatedAt())
                .build();
    }
}
