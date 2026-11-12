package com.grantora.repository;
import com.grantora.entity.InAppNotification; import org.springframework.data.jpa.repository.JpaRepository; import java.util.*;
public interface InAppNotificationRepository extends JpaRepository<InAppNotification,Long>{
 List<InAppNotification> findByUser_IdOrderByCreatedAtDesc(Long userId);
 long countByUser_IdAndReadAtIsNull(Long userId);
 boolean existsByUser_IdAndEventKey(Long userId,String eventKey);
 Optional<InAppNotification> findByIdAndUser_Id(Long id,Long userId);
}
