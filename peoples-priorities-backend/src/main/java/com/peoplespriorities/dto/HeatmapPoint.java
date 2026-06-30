package com.peoplespriorities.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * A single point in the heatmap — aggregated from submissions sharing the same
 * (lat, lng, ward, theme) combination. The weight is a submission count.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HeatmapPoint {
    private Double lat;
    private Double lng;
    private Long weight;
    private String themeLabel;
    private String ward;
}
