package com.grantora.service;

import com.grantora.entity.Scheme;
import com.grantora.repository.SchemeRepository;
import org.springframework.stereotype.Service;

import java.util.List;

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
        return schemeRepository.save(scheme);
    }

    public Scheme updateScheme(Long id, Scheme updatedScheme) {
        Scheme existing = getSchemeById(id);

        existing.setSchemeName(updatedScheme.getSchemeName());
        existing.setDescription(updatedScheme.getDescription());
        existing.setDepartment(updatedScheme.getDepartment());
        existing.setMinimumAge(updatedScheme.getMinimumAge());
        existing.setMaximumAge(updatedScheme.getMaximumAge());
        existing.setMaximumAnnualIncome(updatedScheme.getMaximumAnnualIncome());
        existing.setMaximumGrantAmount(updatedScheme.getMaximumGrantAmount());
        existing.setEligibilityThreshold(updatedScheme.getEligibilityThreshold());
        existing.setApplicationStartDate(updatedScheme.getApplicationStartDate());
        existing.setApplicationEndDate(updatedScheme.getApplicationEndDate());
        existing.setStatus(updatedScheme.getStatus());

        return schemeRepository.save(existing);
    }

    public void deleteScheme(Long id) {
        Scheme scheme = getSchemeById(id);
        schemeRepository.delete(scheme);
    }
}