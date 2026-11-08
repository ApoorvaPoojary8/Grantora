package com.grantora.entity;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.List;

@Converter
public class AnswerOptionListConverter
        implements AttributeConverter<List<SchemeEligibilityQuestion.AnswerOption>, String> {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final TypeReference<List<SchemeEligibilityQuestion.AnswerOption>>
            TYPE = new TypeReference<>() {};

    @Override
    public String convertToDatabaseColumn(
            List<SchemeEligibilityQuestion.AnswerOption> options) {
        try {
            return OBJECT_MAPPER.writeValueAsString(options);
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException(
                    "Unable to serialize scheme answer options", exception);
        }
    }

    @Override
    public List<SchemeEligibilityQuestion.AnswerOption> convertToEntityAttribute(
            String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        try {
            return OBJECT_MAPPER.readValue(value, TYPE);
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException(
                    "Unable to read scheme answer options", exception);
        }
    }
}
