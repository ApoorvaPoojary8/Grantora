package com.grantora.service;

import com.grantora.entity.Scheme;
import com.grantora.entity.SchemeEligibilityQuestion;
import com.grantora.repository.SchemeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class SchemeService {

    private final SchemeRepository schemeRepository;

    public SchemeService(SchemeRepository schemeRepository) {
        this.schemeRepository = schemeRepository;
    }

    public List<Scheme> getAllSchemes() {
        return schemeRepository.findAll();
    }

    public Scheme getSchemeById(Long id) {
        return schemeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Scheme not found with ID: " + id));
    }

    public Scheme createScheme(Scheme scheme) {
        validateEligibilityConfiguration(scheme);
        replaceQuestions(scheme, scheme.getEligibilityQuestions());
        return schemeRepository.save(scheme);
    }

    public Scheme updateScheme(Long id, Scheme updatedScheme) {
        validateEligibilityConfiguration(updatedScheme);
        Scheme existing = getSchemeById(id);

        existing.setSchemeName(updatedScheme.getSchemeName());
        existing.setDescription(updatedScheme.getDescription());
        existing.setDepartment(updatedScheme.getDepartment());
        existing.setMinimumAge(updatedScheme.getMinimumAge());
        existing.setMaximumAge(updatedScheme.getMaximumAge());
        existing.setMaximumAnnualIncome(updatedScheme.getMaximumAnnualIncome());
        existing.setMaximumGrantAmount(updatedScheme.getMaximumGrantAmount());
        existing.setEligibilityThreshold(updatedScheme.getEligibilityThreshold());
        existing.setEligibleCategories(updatedScheme.getEligibleCategories());
        replaceQuestions(existing, updatedScheme.getEligibilityQuestions());
        existing.setApplicationStartDate(updatedScheme.getApplicationStartDate());
        existing.setApplicationEndDate(updatedScheme.getApplicationEndDate());
        existing.setStatus(updatedScheme.getStatus());

        return schemeRepository.save(existing);
    }

    private void replaceQuestions(
            Scheme scheme,
            List<SchemeEligibilityQuestion> incomingQuestions) {
        List<SchemeEligibilityQuestion> replacements = new ArrayList<>();
        for (int index = 0; index < incomingQuestions.size(); index++) {
            SchemeEligibilityQuestion incoming = incomingQuestions.get(index);
            SchemeEligibilityQuestion question = new SchemeEligibilityQuestion();
            question.setScheme(scheme);
            question.setDisplayOrder(index);
            question.setQuestionText(incoming.getQuestionText().trim());
            question.setQuestionType(
                    incoming.getQuestionType().trim().toUpperCase(Locale.ROOT));
            question.setRequired(incoming.isRequired());
            question.setAnswerOptions(incoming.getAnswerOptions().stream()
                    .map(option -> new SchemeEligibilityQuestion.AnswerOption(
                            option.value().trim(),
                            option.label().trim(),
                            option.points(),
                            option.meetsEligibilityCondition()))
                    .toList());
            replacements.add(question);
        }
        scheme.setEligibilityQuestions(replacements);
    }

    private void validateEligibilityConfiguration(Scheme scheme) {
        if (scheme.getMinimumAge() == null || scheme.getMinimumAge() < 0
                || scheme.getMaximumAge() == null || scheme.getMaximumAge() < 0
                || scheme.getMaximumAge() < scheme.getMinimumAge()) {
            invalidConfiguration("Minimum and maximum ages must be valid and ordered");
        }
        if (scheme.getMaximumAnnualIncome() == null
                || scheme.getMaximumAnnualIncome().signum() < 0) {
            invalidConfiguration("Maximum annual income must be zero or greater");
        }
        if (scheme.getEligibleCategories() == null
                || scheme.getEligibleCategories().isEmpty()) {
            invalidConfiguration("At least one eligible beneficiary category is required");
        }
        Set<String> normalizedCategories = new LinkedHashSet<>();
        Set<String> categoryKeys = new HashSet<>();
        for (String category : scheme.getEligibleCategories()) {
            if (category == null || category.isBlank() || category.trim().length() > 50) {
                invalidConfiguration("Eligible categories must be non-empty and at most 50 characters");
            }
            String normalized = category.trim();
            if (!categoryKeys.add(normalized.toLowerCase(Locale.ROOT))) {
                invalidConfiguration("Eligible categories must be unique");
            }
            normalizedCategories.add(normalized);
        }
        scheme.setEligibleCategories(normalizedCategories);
        if (scheme.getEligibilityThreshold() == null
                || scheme.getEligibilityThreshold().compareTo(BigDecimal.ZERO) < 0
                || scheme.getEligibilityThreshold().compareTo(BigDecimal.valueOf(100)) > 0
                || scheme.getEligibilityThreshold().stripTrailingZeros().scale() > 2) {
            invalidConfiguration("Eligibility threshold must be between 0 and 100");
        }
        if (scheme.getMaximumAnnualIncome() != null
                && (scheme.getMaximumAnnualIncome().stripTrailingZeros().scale() > 2
                || scheme.getMaximumAnnualIncome().precision()
                        - scheme.getMaximumAnnualIncome().scale() > 10)) {
            invalidConfiguration("Maximum annual income supports up to two decimal places");
        }
        if (scheme.getEligibilityQuestions() == null
                || scheme.getEligibilityQuestions().size() != 5) {
            invalidConfiguration("Exactly five custom eligibility questions are required");
        }

        BigDecimal maximumPoints = BigDecimal.ZERO;
        for (SchemeEligibilityQuestion question : scheme.getEligibilityQuestions()) {
            if (question == null || question.getQuestionText() == null
                    || question.getQuestionText().isBlank()
                    || question.getQuestionText().length() > 500) {
                invalidConfiguration("Each eligibility question needs valid question text");
            }
            String type = question.getQuestionType() == null
                    ? ""
                    : question.getQuestionType().trim().toUpperCase(Locale.ROOT);
            List<SchemeEligibilityQuestion.AnswerOption> options =
                    question.getAnswerOptions();
            if (!type.equals("YES_NO") && !type.equals("MULTIPLE_CHOICE")) {
                invalidConfiguration("Question type must be YES_NO or MULTIPLE_CHOICE");
            }
            if (options == null || options.size() < 2) {
                invalidConfiguration("Each eligibility question needs at least two options");
            }

            Set<String> optionValues = new HashSet<>();
            BigDecimal questionMaximum = BigDecimal.ZERO;
            for (SchemeEligibilityQuestion.AnswerOption option : options) {
                if (option == null || option.value() == null || option.value().isBlank()
                        || option.value().length() > 100
                        || option.label() == null || option.label().isBlank()
                        || option.label().length() > 200
                        || option.points() == null || option.points().signum() < 0
                        || option.points().stripTrailingZeros().scale() > 2
                        || option.points().precision() - option.points().scale() > 10) {
                    invalidConfiguration(
                            "Answer options need a value, label, and non-negative points");
                }
                if (!optionValues.add(option.value().trim().toLowerCase(Locale.ROOT))) {
                    invalidConfiguration("Answer option values must be unique per question");
                }
                questionMaximum = questionMaximum.max(option.points());
            }
            if (type.equals("YES_NO")
                    && (options.size() != 2
                    || !optionValues.contains("yes")
                    || !optionValues.contains("no"))) {
                invalidConfiguration("YES_NO questions must have YES and NO answer values");
            }
            maximumPoints = maximumPoints.add(questionMaximum);
        }
        if (maximumPoints.signum() <= 0) {
            invalidConfiguration("Custom question options must offer a positive score");
        }
    }

    private void invalidConfiguration(String message) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    public void deleteScheme(Long id) {
        Scheme scheme = getSchemeById(id);
        schemeRepository.delete(scheme);
    }
}