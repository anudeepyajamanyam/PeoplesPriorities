package com.peoplespriorities.repository;

import com.peoplespriorities.model.Priority;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/** Repository for ranked development priorities. */
@Repository
public interface PriorityRepository extends JpaRepository<Priority, UUID> {

    List<Priority> findByConstituencyIdOrderByRankAsc(String constituencyId);

    long countByConstituencyIdAndStatus(String constituencyId, String status);

    @Modifying
    @Transactional
    @Query("DELETE FROM Priority p WHERE p.constituencyId = :cid")
    void deleteByConstituencyId(@Param("cid") String constituencyId);
}
