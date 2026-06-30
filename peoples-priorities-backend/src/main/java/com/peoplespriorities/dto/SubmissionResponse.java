package com.peoplespriorities.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

/** Response envelope for submission operations. */
@Data
@Builder
public class SubmissionResponse {
    private UUID id;
    private String status;
    private String type;
    private String rawContent;
    private String translatedContent;
    private String ward;
    private String gcsUri;
    private String themeLabel;
    private Instant createdAt;
}
