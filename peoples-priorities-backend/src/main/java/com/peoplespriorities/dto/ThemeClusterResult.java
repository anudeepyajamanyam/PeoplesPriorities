package com.peoplespriorities.dto;

import lombok.Data;

import java.util.List;

/** Represents one theme cluster as returned by the Gemini JSON response. */
@Data
public class ThemeClusterResult {
    private String label;
    private List<String> submissionIds;
    private String summary;
}
