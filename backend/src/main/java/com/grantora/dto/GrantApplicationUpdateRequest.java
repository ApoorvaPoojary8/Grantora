package com.grantora.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record GrantApplicationUpdateRequest(
        @NotBlank @Size(max = 10000) String applicationDetails,
        @NotNull @DecimalMin(value = "0.01") @Digits(integer = 10, fraction = 2)
        BigDecimal requestedAmount,
        @Size(max = 5) List<EligibilityAnswer> eligibilityAnswers
) {}
