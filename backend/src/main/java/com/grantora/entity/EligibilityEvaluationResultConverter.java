package com.grantora.entity;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.grantora.dto.EligibilityEvaluationResult;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class EligibilityEvaluationResultConverter
        implements AttributeConverter<EligibilityEvaluationResult, String> {

    private static final ObjectMapper OBJECT_MAPPER =
            new ObjectMapper().registerModule(new JavaTimeModule());

    @Override
    public String convertToDatabaseColumn(EligibilityEvaluationResult result) {
        if (result == null) {
            return null;
        }
        try {
            return OBJECT_MAPPER.writeValueAsString(result);
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException(
                    "Unable to serialize eligibility evaluation", exception);
        }
    }

    @Override
    public EligibilityEvaluationResult convertToEntityAttribute(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return OBJECT_MAPPER.readValue(value, EligibilityEvaluationResult.class);
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException(
                    "Unable to read eligibility evaluation", exception);
        }
    }
}
