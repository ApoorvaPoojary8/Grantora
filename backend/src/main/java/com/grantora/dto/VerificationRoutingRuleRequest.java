package com.grantora.dto;

import com.grantora.entity.RoutingPriority;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record VerificationRoutingRuleRequest(
        @NotNull @DecimalMin("0.00") @DecimalMax("100.00")
        BigDecimal minimumScore,
        @NotNull @DecimalMin("0.00") @DecimalMax("100.00")
        BigDecimal maximumScore,
        @NotNull @DecimalMin("0.00")
        BigDecimal minimumAmount,
        @DecimalMin("0.00")
        BigDecimal maximumAmount,
        @NotNull RoutingPriority priority,
        Boolean stateApprovalRequired
) {}
