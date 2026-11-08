package com.grantora.service;

import com.grantora.dto.EligibilityAnswer;
import com.grantora.dto.EligibilityEvaluationResult;
import com.grantora.entity.AnswerOptionListConverter;
import com.grantora.entity.Beneficiary;
import com.grantora.entity.EligibilityAnswerListConverter;
import com.grantora.entity.EligibilityEvaluationResultConverter;
import com.grantora.entity.Scheme;
import com.grantora.entity.SchemeEligibilityQuestion;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;

class EligibilityScoringServiceTest {

    private final EligibilityScoringService scoringService =
            new EligibilityScoringService();
    private final LocalDate today = LocalDate.of(2026, 1, 1);

    @Test
    void normalizesConfiguredPointsAndUsesThreshold() throws Exception {
        Scheme scheme = configuredScheme();
        Beneficiary beneficiary = completeBeneficiary();
        List<EligibilityAnswer> answers = List.of(
                answer(1, "YES"),
                answer(2, "YES"),
                answer(3, "YES"),
                answer(4, "YES"),
                answer(5, "NO"));

        EligibilityEvaluationResult result = scoringService.evaluate(
                42L, scheme, beneficiary, answers, today);

        assertEquals("ELIGIBLE", result.eligibilityStatus());
        assertEquals(new BigDecimal("80.00"), result.scoreOutOf100());
        assertEquals(new BigDecimal("80"), result.pointsEarned());
        assertEquals(new BigDecimal("100"), result.maximumAvailablePoints());
        assertEquals(42L, result.applicationId());
        assertEquals(5, result.customQuestionResults().size());
    }

    @Test
    void mandatoryFailureOverridesAHighCustomScore() throws Exception {
        Scheme scheme = configuredScheme();
        Beneficiary beneficiary = completeBeneficiary();
        beneficiary.setCategory("UNLISTED");
        List<EligibilityAnswer> answers = List.of(
                answer(1, "YES"),
                answer(2, "YES"),
                answer(3, "YES"),
                answer(4, "YES"),
                answer(5, "YES"));

        EligibilityEvaluationResult result = scoringService.evaluate(
                7L, scheme, beneficiary, answers, today);

        assertEquals("INELIGIBLE", result.eligibilityStatus());
        assertEquals(new BigDecimal("100.00"), result.scoreOutOf100());
        assertEquals(1, result.failedCriteria().size());
    }

    @Test
    void scoreBelowTheConfiguredThresholdIsIneligible() throws Exception {
        Scheme scheme = configuredScheme();
        Beneficiary beneficiary = completeBeneficiary();
        List<EligibilityAnswer> answers = List.of(
                answer(1, "YES"),
                answer(2, "YES"),
                answer(3, "YES"),
                answer(4, "NO"),
                answer(5, "NO"));

        EligibilityEvaluationResult result = scoringService.evaluate(
                8L, scheme, beneficiary, answers, today);

        assertEquals("INELIGIBLE", result.eligibilityStatus());
        assertEquals(new BigDecimal("60.00"), result.scoreOutOf100());
        assertEquals(0, result.failedCriteria().size());
    }

    @Test
    void missingRequiredInformationDoesNotProduceEligibility() throws Exception {
        Scheme scheme = configuredScheme();
        Beneficiary beneficiary = completeBeneficiary();
        beneficiary.setDateOfBirth(null);
        List<EligibilityAnswer> answers = List.of(
                answer(1, "YES"),
                answer(2, "YES"),
                answer(3, "YES"),
                answer(4, "YES"));

        EligibilityEvaluationResult result = scoringService.evaluate(
                9L, scheme, beneficiary, answers, today);

        assertEquals("NEEDS_MORE_INFORMATION", result.eligibilityStatus());
        assertEquals(2, result.missingInformation().size());
    }

    @Test
    void persistedEligibilityJsonValuesRoundTrip() throws Exception {
        Scheme scheme = configuredScheme();
        EligibilityEvaluationResult evaluation = scoringService.evaluate(
                11L,
                scheme,
                completeBeneficiary(),
                List.of(answer(1, "YES")),
                today);

        EligibilityEvaluationResultConverter evaluationConverter =
                new EligibilityEvaluationResultConverter();
        EligibilityAnswerListConverter answerConverter =
                new EligibilityAnswerListConverter();
        AnswerOptionListConverter optionConverter = new AnswerOptionListConverter();
        List<EligibilityAnswer> answers = List.of(answer(1, "YES"));
        List<SchemeEligibilityQuestion.AnswerOption> options =
                scheme.getEligibilityQuestions().get(0).getAnswerOptions();

        assertEquals(evaluation, evaluationConverter.convertToEntityAttribute(
                evaluationConverter.convertToDatabaseColumn(evaluation)));
        assertEquals(answers, answerConverter.convertToEntityAttribute(
                answerConverter.convertToDatabaseColumn(answers)));
        assertEquals(options, optionConverter.convertToEntityAttribute(
                optionConverter.convertToDatabaseColumn(options)));
    }

    private Scheme configuredScheme() throws Exception {
        Scheme scheme = new Scheme();
        scheme.setMinimumAge(18);
        scheme.setMaximumAge(65);
        scheme.setMaximumAnnualIncome(new BigDecimal("100000"));
        scheme.setEligibleCategories(Set.of("GENERAL"));
        scheme.setEligibilityThreshold(new BigDecimal("80"));

        List<SchemeEligibilityQuestion> questions = new ArrayList<>();
        for (long id = 1; id <= 5; id++) {
            SchemeEligibilityQuestion question = new SchemeEligibilityQuestion();
            setQuestionId(question, id);
            question.setQuestionText("Question " + id);
            question.setQuestionType("YES_NO");
            question.setRequired(true);
            question.setAnswerOptions(List.of(
                    new SchemeEligibilityQuestion.AnswerOption(
                            "YES", "Yes", new BigDecimal("20"), true),
                    new SchemeEligibilityQuestion.AnswerOption(
                            "NO", "No", BigDecimal.ZERO, false)));
            questions.add(question);
        }
        scheme.setEligibilityQuestions(questions);
        return scheme;
    }

    private Beneficiary completeBeneficiary() {
        Beneficiary beneficiary = new Beneficiary();
        beneficiary.setDateOfBirth(LocalDate.of(1996, 1, 1));
        beneficiary.setAnnualIncome(new BigDecimal("50000"));
        beneficiary.setCategory("general");
        return beneficiary;
    }

    private EligibilityAnswer answer(long questionId, String value) {
        return new EligibilityAnswer(questionId, value);
    }

    private void setQuestionId(SchemeEligibilityQuestion question, long id)
            throws Exception {
        Field idField = SchemeEligibilityQuestion.class.getDeclaredField("id");
        idField.setAccessible(true);
        idField.set(question, id);
    }
}
