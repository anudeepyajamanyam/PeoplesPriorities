package com.peoplespriorities.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * A clustered theme grouping related citizen submissions under one development topic.
 */
@Entity
@Table(name = "themes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Theme {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "constituency_id", length = 50)
    private String constituencyId;

    @Column(name = "label", nullable = false)
    private String label;

    @Column(name = "submission_count")
    private Integer submissionCount;

    @Column(name = "ai_summary", columnDefinition = "TEXT")
    private String aiSummary;

    @Column(name = "last_updated")
    private Instant lastUpdated;

    @OneToMany(mappedBy = "theme", fetch = FetchType.LAZY)
    @JsonIgnore
    @Builder.Default
    private List<Submission> submissions = new ArrayList<>();
}
