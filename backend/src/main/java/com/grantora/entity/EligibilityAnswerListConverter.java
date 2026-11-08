package com.grantora.entity;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.grantora.dto.EligibilityAnswer;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

import java.util.List;

@Converter
public class EligibilityAnswerListConverter
        implements AttributeConverter<List<EligibilityAnswer>, String> {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final TypeReference<List<EligibilityAnswer>> TYPE =
            new TypeReference<>() {};

    @Override
    public String convertToDatabaseColumn(List<EligibilityAnswer> answers) {
        try {
            return OBJECT_MAPPER.writeValueAsString(answers);
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException(
                    "Unable to serialize eligibility answers", exception);
        }
    }

    @Override
    public List<EligibilityAnswer> convertToEntityAttribute(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        try {
            return OBJECT_MAPPER.readValue(value, TYPE);
        } catch (JsonProcessingException exception) {
            throw new IllegalArgumentException(
                    "Unable to read eligibility answers", exception);
        }
    }
}
