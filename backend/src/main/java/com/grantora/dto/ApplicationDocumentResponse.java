package com.grantora.dto;

import java.time.LocalDateTime;

public record ApplicationDocumentResponse(
        Long id,
        String fileName,
        String contentType,
        long fileSize,
        String uploadedBy,
        LocalDateTime uploadedAt
) {}
