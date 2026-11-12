package com.grantora.repository;

import com.grantora.entity.GrantApplicationStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GrantApplicationStatusHistoryRepository
        extends JpaRepository<GrantApplicationStatusHistory, Long> {
    List<GrantApplicationStatusHistory> findByApplicationIdOrderByCreatedAtAscIdAsc(
            Long applicationId);
}
