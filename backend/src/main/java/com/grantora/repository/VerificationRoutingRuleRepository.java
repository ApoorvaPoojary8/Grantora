package com.grantora.repository;

import com.grantora.entity.VerificationRoutingRule;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VerificationRoutingRuleRepository
        extends JpaRepository<VerificationRoutingRule, Long> {
    List<VerificationRoutingRule> findAllByOrderByIdAsc();
}
