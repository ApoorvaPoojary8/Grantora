package com.grantora.service;

import com.grantora.dto.GrantApplicationRequest;
import com.grantora.dto.GrantApplicationResponse;
import com.grantora.dto.GrantApplicationStatusRequest;
import com.grantora.dto.GrantApplicationUpdateRequest;
import com.grantora.entity.Beneficiary;
import com.grantora.entity.GrantApplication;
import com.grantora.entity.GrantApplicationStatus;
import com.grantora.entity.Scheme;
import com.grantora.repository.BeneficiaryRepository;
import com.grantora.repository.GrantApplicationRepository;
import com.grantora.repository.SchemeRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class GrantApplicationService {

    private final GrantApplicationRepository applicationRepository;
    private final BeneficiaryRepository beneficiaryRepository;
    private final SchemeRepository schemeRepository;

    public GrantApplicationService(
            GrantApplicationRepository applicationRepository,
            BeneficiaryRepository beneficiaryRepository,
            SchemeRepository schemeRepository) {
        this.applicationRepository = applicationRepository;
        this.beneficiaryRepository = beneficiaryRepository;
        this.schemeRepository = schemeRepository;
    }

    @Transactional(readOnly = true)
    public List<GrantApplicationResponse> getAllApplications() {
        return applicationRepository.findAllByOrderByIdDesc()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<GrantApplicationResponse> getMyApplications(String email) {
        Beneficiary beneficiary = getBeneficiary(email);
        return applicationRepository
                .findByBeneficiary_IdOrderByIdDesc(beneficiary.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public GrantApplicationResponse getApplication(Long id) {
        return toResponse(findApplication(id));
    }

    @Transactional(readOnly = true)
    public GrantApplicationResponse getMyApplication(Long id, String email) {
        GrantApplication application = findApplication(id);
        requireOwner(application, email);
        return toResponse(application);
    }

    public GrantApplicationResponse createApplication(
            String email,
            GrantApplicationRequest request) {
        Beneficiary beneficiary = getBeneficiary(email);
        Scheme scheme = schemeRepository.findById(request.schemeId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Scheme not found"));

        if (!"ACTIVE".equalsIgnoreCase(scheme.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Applications are only available for active schemes");
        }

        if (applicationRepository.existsByBeneficiary_IdAndScheme_Id(
                beneficiary.getId(), scheme.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "An application for this scheme already exists");
        }

        GrantApplication application = new GrantApplication();
        application.setBeneficiary(beneficiary);
        application.setScheme(scheme);
        application.setApplicationDetails(request.applicationDetails().trim());
        application.setRequestedAmount(request.requestedAmount());

        return saveApplication(application);
    }

    public GrantApplicationResponse updateDraft(
            Long id,
            String email,
            GrantApplicationUpdateRequest request) {
        GrantApplication application = findApplication(id);
        requireOwner(application, email);
        requireDraft(application);

        application.setApplicationDetails(request.applicationDetails().trim());
        application.setRequestedAmount(request.requestedAmount());

        return saveApplication(application);
    }

    public GrantApplicationResponse submitDraft(Long id, String email) {
        GrantApplication application = findApplication(id);
        requireOwner(application, email);
        requireDraft(application);

        application.setStatus(GrantApplicationStatus.SUBMITTED);
        application.setSubmittedAt(LocalDateTime.now());
        return toResponse(applicationRepository.save(application));
    }

    public GrantApplicationResponse updateStatus(
            Long id,
            GrantApplicationStatusRequest request) {
        GrantApplication application = findApplication(id);
        application.setStatus(request.status());
        application.setSubmittedAt(
                request.status() == GrantApplicationStatus.DRAFT
                        ? null
                        : application.getSubmittedAt() == null
                                ? LocalDateTime.now()
                                : application.getSubmittedAt());
        return toResponse(applicationRepository.save(application));
    }

    private GrantApplicationResponse saveApplication(GrantApplication application) {
        try {
            return toResponse(applicationRepository.saveAndFlush(application));
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "An application for this scheme already exists",
                    exception);
        }
    }

    private Beneficiary getBeneficiary(String email) {
        return beneficiaryRepository.findByUser_Email(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Beneficiary profile not found"));
    }

    private GrantApplication findApplication(Long id) {
        return applicationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Application not found"));
    }

    private void requireOwner(GrantApplication application, String email) {
        if (!application.getBeneficiary().getUser().getEmail().equals(email)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "You cannot access this application");
        }
    }

    private void requireDraft(GrantApplication application) {
        if (application.getStatus() != GrantApplicationStatus.DRAFT) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Only draft applications can be changed or submitted");
        }
    }

    private GrantApplicationResponse toResponse(GrantApplication application) {
        return new GrantApplicationResponse(
                application.getId(),
                application.getBeneficiary().getId(),
                application.getBeneficiary().getUser().getFullName(),
                application.getScheme().getId(),
                application.getScheme().getSchemeName(),
                application.getApplicationDetails(),
                application.getRequestedAmount(),
                application.getStatus(),
                application.getSubmittedAt());
    }
}
