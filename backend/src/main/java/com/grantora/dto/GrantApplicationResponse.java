package com.grantora.dto;

import com.grantora.entity.GrantApplicationStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record GrantApplicationResponse(
        Long id,
        Long beneficiaryId,
        String beneficiaryName,
        Long schemeId,
        String schemeName,
        String applicationDetails,
        BigDecimal requestedAmount,
        GrantApplicationStatus status,
        LocalDateTime submittedAt,
        EligibilityEvaluationResult eligibilityEvaluation
) {}
