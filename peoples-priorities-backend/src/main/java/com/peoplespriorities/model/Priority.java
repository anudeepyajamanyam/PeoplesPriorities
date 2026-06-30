package com.peoplespriorities.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * A ranked development priority derived by the AI pipeline from clustered citizen submissions.
 */
@Entity
@Table(name = "priorities")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Priority {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "constituency_id", length = 50)
    private String constituencyId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "theme_id")
    private Theme theme;

    @Column(name = "rank")
    private Integer rank;

    @Column(name = "score", precision = 5, scale = 2)
    private BigDecimal score;

    @Column(name = "evidence", columnDefinition = "TEXT")
    private String evidence;

    @Column(name = "status", length = 20)
    private String status;

    @Column(name = "approved_by")
    private String approvedBy;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
