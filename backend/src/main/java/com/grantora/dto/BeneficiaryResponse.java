package com.grantora.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record BeneficiaryResponse(
        Long id,
        Long userId,
        String fullName,
        String email,
        String phone,
        LocalDate dateOfBirth,
        BigDecimal annualIncome,
        String address,
        String state,
        String district,
        String category
) {}