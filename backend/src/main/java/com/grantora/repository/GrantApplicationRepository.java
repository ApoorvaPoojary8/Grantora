package com.grantora.repository;

import com.grantora.entity.GrantApplication;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GrantApplicationRepository
        extends JpaRepository<GrantApplication, Long> {

    boolean existsByBeneficiary_IdAndScheme_Id(Long beneficiaryId, Long schemeId);

    List<GrantApplication> findAllByOrderByIdDesc();

    List<GrantApplication> findByBeneficiary_IdOrderByIdDesc(Long beneficiaryId);
}
