package com.grantora.service;

import com.grantora.dto.EligibilityAnswer;
import com.grantora.dto.EligibilityEvaluationResult;
import com.grantora.entity.Beneficiary;
import com.grantora.entity.Scheme;
import com.grantora.entity.SchemeEligibilityQuestion;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Period;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class EligibilityScoringService {

    public EligibilityEvaluationResult evaluate(
            Long applicationId,
            Scheme scheme,
            Beneficiary beneficiary,
            List<EligibilityAnswer> answers) {
        return evaluate(applicationId, scheme, beneficiary, answers, LocalDate.now());
    }

    EligibilityEvaluationResult evaluate(
            Long applicationId,
            Scheme scheme,
            Beneficiary beneficiary,
            List<EligibilityAnswer> answers,
            LocalDate today) {
        List<EligibilityEvaluationResult.MandatoryCriterionResult> criteria =
                new ArrayList<>();
        List<EligibilityEvaluationResult.QuestionResult> questionResults =
                new ArrayList<>();
        List<String> failedCriteria = new ArrayList<>();
        List<String> missingInformation = new ArrayList<>();

        evaluateAge(scheme, beneficiary, today, criteria, failedCriteria, missingInformation);
        evaluateIncome(scheme, beneficiary, criteria, failedCriteria, missingInformation);
        evaluateCategory(scheme, beneficiary, criteria, failedCriteria, missingInformation);

        Map<Long, EligibilityAnswer> answersByQuestion = answers == null
                ? Map.of()
                : answers.stream().collect(Collectors.toMap(
                        EligibilityAnswer::questionId,
                        Function.identity()));

        BigDecimal pointsEarned = BigDecimal.ZERO;
        BigDecimal maximumAvailablePoints = BigDecimal.ZERO;
        List<SchemeEligibilityQuestion> questions =
                scheme.getEligibilityQuestions() == null
                        ? List.of()
                        : scheme.getEligibilityQuestions();
        for (SchemeEligibilityQuestion question : questions) {
            EligibilityAnswer answer = answersByQuestion.get(question.getId());
            SchemeEligibilityQuestion.AnswerOption selected = answer == null
                    ? null
                    : question.getAnswerOptions().stream()
                            .filter(option -> option.value().equals(answer.answer()))
                            .findFirst()
                            .orElse(null);
            BigDecimal questionMaximum = question.getAnswerOptions().stream()
                    .map(SchemeEligibilityQuestion.AnswerOption::points)
                    .max(BigDecimal::compareTo)
                    .orElse(BigDecimal.ZERO);

            if (answer != null || question.isRequired()) {
                maximumAvailablePoints = maximumAvailablePoints.add(questionMaximum);
            }
            if (selected == null) {
                if (question.isRequired()) {
                    missingInformation.add(
                            "Answer required: " + question.getQuestionText());
                }
                questionResults.add(new EligibilityEvaluationResult.QuestionResult(
                        question.getId(),
                        question.getQuestionText(),
                        null,
                        null,
                        BigDecimal.ZERO,
                        questionMaximum,
                        false,
                        question.isRequired(),
                        question.isRequired()
                                ? "A response is required."
                                : "This optional question was not answered."));
            } else {
                pointsEarned = pointsEarned.add(selected.points());
                questionResults.add(new EligibilityEvaluationResult.QuestionResult(
                        question.getId(),
                        question.getQuestionText(),
                        selected.label(),
                        answer.answer(),
                        selected.points(),
                        questionMaximum,
                        selected.meetsEligibilityCondition(),
                        question.isRequired(),
                        selected.meetsEligibilityCondition()
                                ? "The answer meets this configured condition."
                                : "The answer does not meet this configured condition; its configured points still contribute to the score."));
            }
        }

        if (questions.size() != 5) {
            missingInformation.add("This scheme does not have a complete eligibility question configuration.");
        }

        BigDecimal score = maximumAvailablePoints.signum() == 0
                ? BigDecimal.ZERO
                : pointsEarned.multiply(BigDecimal.valueOf(100))
                        .divide(maximumAvailablePoints, 2, RoundingMode.HALF_UP);

        String status;
        if (!failedCriteria.isEmpty()) {
            status = "INELIGIBLE";
        } else if (!missingInformation.isEmpty()) {
            status = "NEEDS_MORE_INFORMATION";
        } else if (scheme.getEligibilityThreshold() == null) {
            status = "NEEDS_MORE_INFORMATION";
            missingInformation.add("The scheme eligibility score threshold is not configured.");
        } else {
            status = score.compareTo(scheme.getEligibilityThreshold()) >= 0
                    ? "ELIGIBLE"
                    : "INELIGIBLE";
        }

        String explanation = switch (status) {
            case "ELIGIBLE" -> "All mandatory criteria passed and the custom eligibility score meets the scheme threshold.";
            case "INELIGIBLE" -> failedCriteria.isEmpty()
                    ? "The custom eligibility score is below the scheme threshold."
                    : "One or more mandatory eligibility criteria were not met.";
            default -> "More information is required before eligibility can be determined.";
        };
        return new EligibilityEvaluationResult(
                applicationId,
                scheme.getId(),
                status,
                score,
                pointsEarned,
                maximumAvailablePoints,
                criteria,
                questionResults,
                failedCriteria,
                missingInformation,
                explanation,
                LocalDateTime.now());
    }

    private void evaluateAge(
            Scheme scheme,
            Beneficiary beneficiary,
            LocalDate today,
            List<EligibilityEvaluationResult.MandatoryCriterionResult> results,
            List<String> failed,
            List<String> missing) {
        Integer minimum = scheme.getMinimumAge();
        Integer maximum = scheme.getMaximumAge();
        if (minimum == null || maximum == null) {
            addMissingCriterion("Age", "The scheme age range is not configured.",
                    results, missing);
            return;
        }
        LocalDate dateOfBirth = beneficiary.getDateOfBirth();
        if (dateOfBirth == null) {
            addMissingCriterion("Age", "Date of birth is missing from the beneficiary profile.",
                    results, missing);
            return;
        }
        if (dateOfBirth.isAfter(today)) {
            addFailedCriterion("Age", "Date of birth cannot be in the future.",
                    minimum + " to " + maximum, dateOfBirth.toString(), results, failed);
            return;
        }
        int age = Period.between(dateOfBirth, today).getYears();
        boolean passed = age >= minimum && age <= maximum;
        String explanation = passed
                ? "Age is within the scheme range."
                : "Age is outside the scheme range.";
        results.add(new EligibilityEvaluationResult.MandatoryCriterionResult(
                "Age", passed ? "PASS" : "FAIL",
                minimum + " to " + maximum, Integer.toString(age), explanation));
        if (!passed) {
            failed.add("Age: " + explanation);
        }
    }

    private void evaluateIncome(
            Scheme scheme,
            Beneficiary beneficiary,
            List<EligibilityEvaluationResult.MandatoryCriterionResult> results,
            List<String> failed,
            List<String> missing) {
        BigDecimal maximum = scheme.getMaximumAnnualIncome();
        if (maximum == null) {
            addMissingCriterion("Annual income",
                    "The scheme maximum annual income is not configured.", results, missing);
            return;
        }
        BigDecimal income = beneficiary.getAnnualIncome();
        if (income == null) {
            addMissingCriterion("Annual income",
                    "Annual income is missing from the beneficiary profile.", results, missing);
            return;
        }
        boolean passed = income.signum() >= 0 && income.compareTo(maximum) <= 0;
        String explanation = passed
                ? "Annual income is within the scheme limit."
                : "Annual income exceeds the scheme limit.";
        results.add(new EligibilityEvaluationResult.MandatoryCriterionResult(
                "Annual income", passed ? "PASS" : "FAIL",
                "At most " + maximum, income.toPlainString(), explanation));
        if (!passed) {
            failed.add("Annual income: " + explanation);
        }
    }

    private void evaluateCategory(
            Scheme scheme,
            Beneficiary beneficiary,
            List<EligibilityEvaluationResult.MandatoryCriterionResult> results,
            List<String> failed,
            List<String> missing) {
        if (scheme.getEligibleCategories() == null
                || scheme.getEligibleCategories().isEmpty()) {
            addMissingCriterion("Beneficiary category",
                    "The scheme eligible categories are not configured.", results, missing);
            return;
        }
        String category = beneficiary.getCategory();
        if (category == null || category.isBlank()) {
            addMissingCriterion("Beneficiary category",
                    "Beneficiary category is missing from the profile.", results, missing);
            return;
        }
        boolean passed = scheme.getEligibleCategories().stream()
                .anyMatch(value -> value.equalsIgnoreCase(category.trim()));
        String explanation = passed
                ? "Beneficiary category is eligible for this scheme."
                : "Beneficiary category is not included in this scheme.";
        results.add(new EligibilityEvaluationResult.MandatoryCriterionResult(
                "Beneficiary category", passed ? "PASS" : "FAIL",
                String.join(", ", scheme.getEligibleCategories()), category, explanation));
        if (!passed) {
            failed.add("Beneficiary category: " + explanation);
        }
    }

    private void addMissingCriterion(
            String criterion,
            String explanation,
            List<EligibilityEvaluationResult.MandatoryCriterionResult> results,
            List<String> missing) {
        results.add(new EligibilityEvaluationResult.MandatoryCriterionResult(
                criterion, "MISSING", null, null, explanation));
        missing.add(criterion + ": " + explanation);
    }

    private void addFailedCriterion(
            String criterion,
            String explanation,
            String expected,
            String actual,
            List<EligibilityEvaluationResult.MandatoryCriterionResult> results,
            List<String> failed) {
        results.add(new EligibilityEvaluationResult.MandatoryCriterionResult(
                criterion, "FAIL", expected, actual, explanation));
        failed.add(criterion + ": " + explanation);
    }
}
