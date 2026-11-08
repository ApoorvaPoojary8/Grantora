package com.grantora.dto;

import com.grantora.entity.GrantApplicationStatus;
import jakarta.validation.constraints.NotNull;

public record GrantApplicationStatusRequest(
        @NotNull GrantApplicationStatus status
) {}
