package com.grantora.repository;

import com.grantora.entity.Beneficiary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BeneficiaryRepository
        extends JpaRepository<Beneficiary, Long> {

    boolean existsByUser_Id(Long userId);

    Optional<Beneficiary> findByUser_Id(Long userId);

    Optional<Beneficiary> findByUser_Email(String email);
}