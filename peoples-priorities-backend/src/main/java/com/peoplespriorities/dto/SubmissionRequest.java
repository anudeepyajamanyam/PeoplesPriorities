package com.peoplespriorities.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Payload for POST /api/submissions/text. */
@Data
public class SubmissionRequest {

    @NotBlank(message = "Constituency ID is required")
    private String constituencyId;

    @NotBlank(message = "Content is required")
    @Size(max = 500, message = "Content must not exceed 500 characters")
    private String content;

    private String category;
    private String language;
    private Double lat;
    private Double lng;
    private String ward;
}
