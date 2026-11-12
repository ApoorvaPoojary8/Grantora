package com.grantora.dto;

import java.time.LocalDateTime;

public record VerificationHistoryResponse(
        Long id,
        String stage,
        String previousStatus,
        String newStatus,
        String nextStage,
        String action,
        Long actorId,
        String actorName,
        Long assignedOfficerId,
        String assignedOfficerName,
        String remarks,
        LocalDateTime createdAt,
        boolean identityVerified,
        boolean addressVerified,
        boolean documentsVerified,
        boolean applicationDetailsVerified
) {}
