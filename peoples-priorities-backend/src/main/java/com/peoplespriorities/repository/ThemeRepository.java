package com.peoplespriorities.repository;

import com.peoplespriorities.model.Theme;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Repository for theme cluster operations. */
@Repository
public interface ThemeRepository extends JpaRepository<Theme, UUID> {

    List<Theme> findByConstituencyId(String constituencyId);

    Optional<Theme> findByLabelAndConstituencyId(String label, String constituencyId);

    long countByConstituencyId(String constituencyId);
}
