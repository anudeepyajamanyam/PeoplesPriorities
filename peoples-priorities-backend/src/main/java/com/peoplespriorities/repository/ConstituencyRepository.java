package com.peoplespriorities.repository;

import com.peoplespriorities.model.Constituency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/** Standard CRUD repository for constituencies. */
@Repository
public interface ConstituencyRepository extends JpaRepository<Constituency, String> {
}
