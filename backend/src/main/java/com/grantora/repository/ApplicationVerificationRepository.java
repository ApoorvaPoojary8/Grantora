package com.grantora.repository;

import com.grantora.entity.ApplicationVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ApplicationVerificationRepository
        extends JpaRepository<ApplicationVerification, Long> {
    List<ApplicationVerification> findByApplication_IdOrderByCreatedAtAsc(Long applicationId);
}
