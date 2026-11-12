package com.grantora.repository;
import com.grantora.entity.*; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface WorkflowEscalationRepository extends JpaRepository<WorkflowEscalation,Long>{
 boolean existsByApplication_IdAndStageAndResolvedFalse(Long id, VerificationStage stage);
 List<WorkflowEscalation> findAllByOrderByCreatedAtDesc();
 Optional<WorkflowEscalation> findByIdAndResolvedFalse(Long id);
}
