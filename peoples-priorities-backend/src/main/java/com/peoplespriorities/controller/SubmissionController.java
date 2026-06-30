package com.peoplespriorities.controller;

import com.peoplespriorities.dto.SubmissionRequest;
import com.peoplespriorities.dto.SubmissionResponse;
import com.peoplespriorities.service.SubmissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

/**
 * Controller to handle citizen development suggestions (text, voice, photo).
 */
@RestController
@RequestMapping("/api/submissions")
@RequiredArgsConstructor
@Tag(name = "Submissions", description = "Endpoints for citizens to submit suggestions via text, voice, or photo")
public class SubmissionController {

    private final SubmissionService submissionService;

    @PostMapping("/text")
    @Operation(summary = "Submit a text suggestion", description = "Creates a new development suggestion from text input.")
    @ApiResponse(responseCode = "200", description = "Submission successfully accepted")
    public ResponseEntity<SubmissionResponse> submitText(@Valid @RequestBody SubmissionRequest req) {
        return ResponseEntity.ok(submissionService.saveTextSubmission(req));
    }

    @PostMapping(value = "/voice", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Submit a voice suggestion", description = "Ingests an audio file, transcribes it using Google Cloud Speech-to-Text, and translates if necessary.")
    @ApiResponse(responseCode = "200", description = "Voice recording successfully transcribed and accepted")
    public ResponseEntity<SubmissionResponse> submitVoice(
            @RequestParam("audio") MultipartFile audio,
            @RequestParam("language") String language,
            @RequestParam("constituencyId") String constituencyId,
            @RequestParam(value = "lat", required = false) Double lat,
            @RequestParam(value = "lng", required = false) Double lng,
            @RequestParam(value = "ward", required = false) String ward) {
        return ResponseEntity.ok(submissionService.saveVoiceSubmission(audio, language, constituencyId, lat, lng, ward));
    }

    @PostMapping(value = "/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Submit a photo suggestion", description = "Ingests an image, describes the civic issue using Gemini Vision, and saves the request.")
    @ApiResponse(responseCode = "200", description = "Photo successfully analyzed and accepted")
    public ResponseEntity<SubmissionResponse> submitPhoto(
            @RequestParam("photo") MultipartFile photo,
            @RequestParam("constituencyId") String constituencyId,
            @RequestParam(value = "lat", required = false) Double lat,
            @RequestParam(value = "lng", required = false) Double lng,
            @RequestParam(value = "ward", required = false) String ward) {
        return ResponseEntity.ok(submissionService.savePhotoSubmission(photo, constituencyId, lat, lng, ward));
    }

    @GetMapping("/status/{id}")
    @Operation(summary = "Check submission status", description = "Allows citizens to check the current clustering or approval status of their suggestion.")
    @ApiResponse(responseCode = "200", description = "Submission found")
    public ResponseEntity<SubmissionResponse> getStatus(@PathVariable("id") UUID id) {
        return ResponseEntity.ok(submissionService.getSubmissionStatus(id));
    }
}
