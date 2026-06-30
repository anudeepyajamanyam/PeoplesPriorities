package com.peoplespriorities.controller;

import com.peoplespriorities.model.Constituency;
import com.peoplespriorities.repository.ConstituencyRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller to manage and query parliamentary constituencies.
 */
@RestController
@RequestMapping("/api/constituencies")
@RequiredArgsConstructor
@Tag(name = "Constituencies", description = "Query parliamentary constituencies for demo")
public class ConstituencyController {

    private final ConstituencyRepository constituencyRepository;

    /**
     * Lists all available constituencies.
     */
    @GetMapping
    @Operation(summary = "Get all constituencies", description = "Fetches a list of all constituencies available for citizen submissions.")
    @ApiResponse(responseCode = "200", description = "Successfully retrieved list")
    @org.springframework.cache.annotation.Cacheable(value = "constituencies", key = "'all'")
    public ResponseEntity<List<Constituency>> getAllConstituencies() {
        return ResponseEntity.ok(constituencyRepository.findAll());
    }
}
