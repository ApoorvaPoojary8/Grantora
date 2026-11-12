package com.grantora.dto;

import jakarta.validation.constraints.NotNull;

public record OfficerAssignmentRequest(@NotNull Long officerId) {}
