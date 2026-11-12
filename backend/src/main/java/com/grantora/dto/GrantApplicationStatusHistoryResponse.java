package com.grantora.dto;

import java.time.LocalDateTime;

public record GrantApplicationStatusHistoryResponse(
        Long id,
        String fromStatus,
        String status,
        String action,
        String actorName,
        String remarks,
        LocalDateTime createdAt
) {}
