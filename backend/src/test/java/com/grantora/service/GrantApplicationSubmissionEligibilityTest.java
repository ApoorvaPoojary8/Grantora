package com.grantora.service;

import com.grantora.dto.EligibilityEvaluationResult;
import com.grantora.entity.Beneficiary;
import com.grantora.entity.GrantApplication;
import com.grantora.entity.GrantApplicationStatus;
import com.grantora.entity.Scheme;
import com.grantora.entity.User;
import com.grantora.repository.ApplicationDocumentRepository;
import com.grantora.repository.ApplicationVerificationRepository;
import com.grantora.repository.BeneficiaryRepository;
import com.grantora.repository.GrantApplicationRepository;
import com.grantora.repository.GrantApplicationStatusHistoryRepository;
import com.grantora.repository.SchemeRepository;
import com.grantora.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class GrantApplicationSubmissionEligibilityTest {

    private GrantApplicationRepository applicationRepository;
    private EligibilityScoringService eligibilityScoringService;
    private VerificationWorkflowService verificationWorkflowService;
    private GrantApplication application;
    private GrantApplicationService applicationService;

    @BeforeEach
    void setUp() throws Exception {
        applicationRepository = mock(GrantApplicationRepository.class);
        GrantApplicationStatusHistoryRepository statusHistoryRepository =
                mock(GrantApplicationStatusHistoryRepository.class);
        BeneficiaryRepository beneficiaryRepository = mock(BeneficiaryRepository.class);
        SchemeRepository schemeRepository = mock(SchemeRepository.class);
        eligibilityScoringService = mock(EligibilityScoringService.class);
        verificationWorkflowService = mock(VerificationWorkflowService.class);
        ApplicationVerificationRepository verificationRepository =
                mock(ApplicationVerificationRepository.class);
        ApplicationDocumentRepository documentRepository =
                mock(ApplicationDocumentRepository.class);
        UserRepository userRepository = mock(UserRepository.class);

        applicationService = new GrantApplicationService(
                applicationRepository,
                statusHistoryRepository,
                beneficiaryRepository,
                schemeRepository,
                eligibilityScoringService,
                verificationWorkflowService,
                verificationRepository,
                documentRepository,
                userRepository);

        User beneficiaryUser = new User();
        beneficiaryUser.setEmail("beneficiary@test.local");
        Beneficiary beneficiary = new Beneficiary();
        beneficiary.setUser(beneficiaryUser);
        Scheme scheme = new Scheme();
        scheme.setStatus("ACTIVE");
        application = new GrantApplication();
        setId(application, 42L);
        application.setBeneficiary(beneficiary);
        application.setScheme(scheme);
        application.setApplicationDetails("Application details");
        application.setRequestedAmount(new BigDecimal("5000.00"));
        application.setStatus(GrantApplicationStatus.DRAFT);
        application.setEligibilityAnswers(List.of());
        when(applicationRepository.findByIdForUpdate(42L))
                .thenReturn(Optional.of(application));
    }

    @Test
    void ineligibleApplicationCannotEnterVerification() {
        when(eligibilityScoringService.evaluate(any(), any(), any(), any()))
                .thenReturn(evaluation("INELIGIBLE"));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> applicationService.submitDraft(42L, "beneficiary@test.local"));

        assertEquals(422, exception.getStatusCode().value());
        assertEquals(GrantApplicationStatus.DRAFT, application.getStatus());
        verify(verificationWorkflowService, never()).submit(any(), any());
    }

    @Test
    void applicationNeedingMoreInformationCannotEnterVerification() {
        when(eligibilityScoringService.evaluate(any(), any(), any(), any()))
                .thenReturn(evaluation("NEEDS_MORE_INFORMATION"));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> applicationService.submitDraft(42L, "beneficiary@test.local"));

        assertEquals(422, exception.getStatusCode().value());
        assertEquals(GrantApplicationStatus.DRAFT, application.getStatus());
        verify(verificationWorkflowService, never()).submit(any(), any());
    }

    private EligibilityEvaluationResult evaluation(String status) {
        return new EligibilityEvaluationResult(
                42L, null, status, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                List.of(), List.of(), List.of(), List.of(),
                "Test eligibility result.", BigDecimal.valueOf(70), LocalDateTime.now());
    }

    private void setId(Object entity, Long id) throws Exception {
        Field field = entity.getClass().getDeclaredField("id");
        field.setAccessible(true);
        field.set(entity, id);
    }
}
