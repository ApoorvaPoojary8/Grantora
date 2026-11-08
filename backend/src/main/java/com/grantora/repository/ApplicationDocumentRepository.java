package com.grantora.repository;

import com.grantora.dto.ApplicationDocumentResponse;
import com.grantora.entity.ApplicationDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

public interface ApplicationDocumentRepository
        extends JpaRepository<ApplicationDocument, Long> {
    @Query("""
            select new com.grantora.dto.ApplicationDocumentResponse(
                d.id, d.fileName, d.contentType, d.fileSize, d.uploadedBy.fullName, d.uploadedAt)
            from ApplicationDocument d
            where d.application.id = :applicationId
            order by d.uploadedAt asc
            """)
    List<ApplicationDocumentResponse> findMetadataByApplicationId(
            @Param("applicationId") Long applicationId);
    Optional<ApplicationDocument> findByIdAndApplication_Id(Long id, Long applicationId);
    long countByApplication_Id(Long applicationId);
}
