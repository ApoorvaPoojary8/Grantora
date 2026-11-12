package com.grantora.repository;

import com.grantora.entity.GrantApplication;
import com.grantora.entity.GrantApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

public interface GrantApplicationRepository
        extends JpaRepository<GrantApplication, Long> {

    boolean existsByBeneficiary_IdAndScheme_Id(Long beneficiaryId, Long schemeId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select application from GrantApplication application where application.id = :id")
    Optional<GrantApplication> findByIdForUpdate(@Param("id") Long id);

    List<GrantApplication> findAllByOrderByIdDesc();

    List<GrantApplication> findByBeneficiary_IdOrderByIdDesc(Long beneficiaryId);

    List<GrantApplication> findByAssignedOfficer_IdAndStatusInOrderByIdDesc(
            Long officerId, List<GrantApplicationStatus> statuses);
}
