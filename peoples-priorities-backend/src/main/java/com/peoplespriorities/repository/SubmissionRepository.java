package com.peoplespriorities.repository;

import com.peoplespriorities.dto.HeatmapPoint;
import com.peoplespriorities.model.Submission;
import com.peoplespriorities.model.Theme;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Repository for citizen submission access and aggregation queries. */
@Repository
public interface SubmissionRepository extends JpaRepository<Submission, UUID> {

    @Query("SELECT s FROM Submission s WHERE s.constituency.id = :cid AND s.status = :status")
    List<Submission> findByConstituencyIdAndStatus(@Param("cid") String constituencyId,
                                                    @Param("status") String status);

    List<Submission> findByTheme(Theme theme);

    Page<Submission> findByThemeId(UUID themeId, Pageable pageable);

    @Query("SELECT COUNT(s) FROM Submission s WHERE s.constituency.id = :cid")
    long countByConstituencyId(@Param("cid") String constituencyId);

    @Query("SELECT COUNT(s) FROM Submission s WHERE s.constituency.id = :cid AND s.createdAt > :since")
    long countByConstituencyIdAndCreatedAtAfter(@Param("cid") String constituencyId,
                                                 @Param("since") Instant since);

    @Query("SELECT COUNT(DISTINCT s.ward) FROM Submission s WHERE s.constituency.id = :cid AND s.ward IS NOT NULL")
    long countDistinctWardsByConstituencyId(@Param("cid") String constituencyId);

    @Query("SELECT DISTINCT s.constituency.id FROM Submission s WHERE s.status = 'pending'")
    List<String> findDistinctConstituencyIdsWithPendingSubmissions();

    /**
     * Returns heatmap aggregation points — one row per unique (lat, lng, ward, theme) combination.
     * COUNT is returned as Long via the JPQL constructor expression.
     */
    @Query("SELECT new com.peoplespriorities.dto.HeatmapPoint(s.lat, s.lng, COUNT(s), t.label, s.ward) " +
           "FROM Submission s JOIN s.theme t " +
           "WHERE s.constituency.id = :cid AND s.lat IS NOT NULL AND s.lng IS NOT NULL " +
           "GROUP BY s.lat, s.lng, s.ward, t.label")
    List<HeatmapPoint> findHeatmapPoints(@Param("cid") String constituencyId);
}
