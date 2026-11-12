package com.grantora.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record EligibilityEvaluationResult(
        Long applicationId,
        Long schemeId,
        String eligibilityStatus,
        BigDecimal scoreOutOf100,
        BigDecimal pointsEarned,
        BigDecimal maximumAvailablePoints,
        List<MandatoryCriterionResult> mandatoryCriteriaResults,
        List<QuestionResult> customQuestionResults,
        List<String> failedCriteria,
        List<String> missingInformation,
        String explanation,
        BigDecimal eligibilityThreshold,
        LocalDateTime evaluatedAt) {

    public record MandatoryCriterionResult(
            String criterion,
            String status,
            String expected,
            String actual,
            String explanation) {
    }

    public record QuestionResult(
            Long questionId,
            String questionText,
            String answer,
            String answerValue,
            BigDecimal pointsEarned,
            BigDecimal maximumAvailablePoints,
            boolean meetsEligibilityCondition,
            boolean required,
            String explanation) {
    }
}
