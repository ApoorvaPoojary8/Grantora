package com.grantora.dto;

import com.grantora.entity.VerificationDecision;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record VerificationDecisionRequest(
        @NotNull VerificationDecision decision,
        @Size(max = 2000) String remarks,
        boolean identityVerified,
        boolean addressVerified,
        boolean documentsVerified,
        boolean applicationDetailsVerified
) {}
