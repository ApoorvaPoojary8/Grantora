package com.grantora.service;

import com.grantora.dto.VerificationDecisionRequest;
import com.grantora.entity.*;
import com.grantora.repository.ApplicationDocumentRepository;
import com.grantora.repository.ApplicationVerificationRepository;
import com.grantora.repository.GrantApplicationRepository;
import com.grantora.repository.UserRepository;
import com.grantora.repository.VerificationRoutingRuleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class VerificationWorkflowServiceTest {

    private GrantApplicationRepository applicationRepository;
    private UserRepository userRepository;
    private ApplicationVerificationRepository historyRepository;
    private ApplicationDocumentRepository documentRepository;
    private VerificationWorkflowService workflow;
    private GrantApplication application;
    private User fieldOfficer;
    private User districtOfficer;
    private User stateOfficer;

    @BeforeEach
    void setUp() throws Exception {
        applicationRepository = mock(GrantApplicationRepository.class);
        userRepository = mock(UserRepository.class);
        historyRepository = mock(ApplicationVerificationRepository.class);
        documentRepository = mock(ApplicationDocumentRepository.class);
        VerificationRoutingRuleRepository routingRules =
                mock(VerificationRoutingRuleRepository.class);
        workflow = new VerificationWorkflowService(
                applicationRepository,
                userRepository,
                historyRepository,
                documentRepository,
                routingRules);

        User beneficiaryUser = user(1L, Role.BENEFICIARY, null, null, null);
        Beneficiary beneficiary = new Beneficiary();
        beneficiary.setUser(beneficiaryUser);
        beneficiary.setState("Test State");
        beneficiary.setDistrict("Test District");
        application = new GrantApplication();
        setId(application, 99L);
        application.setBeneficiary(beneficiary);
        application.setRequestedAmount(new BigDecimal("5000.00"));
        application.setStatus(GrantApplicationStatus.FIELD_VERIFICATION);
        application.setWorkflowStage(VerificationStage.FIELD);

        fieldOfficer = user(10L, Role.OFFICER, "FIELD", "Test State", "Test District");
        districtOfficer = user(20L, Role.OFFICER, "DISTRICT", "Test State", "Test District");
        stateOfficer = user(30L, Role.OFFICER, "STATE", "Test State", null);
        application.setAssignedOfficer(fieldOfficer);

        when(applicationRepository.findById(99L)).thenReturn(Optional.of(application));
        when(applicationRepository.findByIdForUpdate(99L)).thenReturn(Optional.of(application));
        when(applicationRepository.save(any(GrantApplication.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(historyRepository.save(any(ApplicationVerification.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void applicationAdvancesOnlyThroughFieldDistrictAndState() {
        when(userRepository.findByEmail("field@test.local"))
                .thenReturn(Optional.of(fieldOfficer));
        when(userRepository.findAll()).thenReturn(List.of(districtOfficer));
        when(documentRepository.countByApplication_Id(99L)).thenReturn(1L);

        workflow.decide(99L, "field@test.local", false, new VerificationDecisionRequest(
                VerificationDecision.VERIFIED, "Identity and documents reviewed.",
                true, true, true, true));

        assertEquals(VerificationStage.DISTRICT, application.getWorkflowStage());
        assertEquals(GrantApplicationStatus.UNDER_VERIFICATION, application.getStatus());
        assertEquals(districtOfficer, application.getAssignedOfficer());

        when(userRepository.findByEmail("district@test.local"))
                .thenReturn(Optional.of(districtOfficer));
        when(userRepository.findAll()).thenReturn(List.of(stateOfficer));
        workflow.decide(99L, "district@test.local", false,
                new VerificationDecisionRequest(
                        VerificationDecision.APPROVED, "District review complete.",
                        false, false, false, false));

        assertEquals(VerificationStage.STATE, application.getWorkflowStage());
        assertEquals(GrantApplicationStatus.UNDER_VERIFICATION, application.getStatus());
        assertEquals(stateOfficer, application.getAssignedOfficer());

        when(userRepository.findByEmail("state@test.local"))
                .thenReturn(Optional.of(stateOfficer));
        workflow.decide(99L, "state@test.local", false,
                new VerificationDecisionRequest(
                        VerificationDecision.APPROVED, "Final review complete.",
                        false, false, false, false));

        assertEquals(GrantApplicationStatus.APPROVED, application.getStatus());
        assertEquals(null, application.getAssignedOfficer());
        verify(historyRepository, times(5)).save(any(ApplicationVerification.class));
    }

    @Test
    void submissionAndCorrectionResubmissionKeepTheApplicationInSubmittedStatus() {
        when(userRepository.findByEmail("beneficiary@test.local"))
                .thenReturn(Optional.of(application.getBeneficiary().getUser()));
        when(userRepository.findAll()).thenReturn(List.of(fieldOfficer));
        application.setStatus(GrantApplicationStatus.DRAFT);

        workflow.submit(application, "beneficiary@test.local");

        assertEquals(GrantApplicationStatus.SUBMITTED, application.getStatus());
        assertEquals(VerificationStage.FIELD, application.getWorkflowStage());
        assertEquals(fieldOfficer, application.getAssignedOfficer());

        application.setStatus(GrantApplicationStatus.NEEDS_CORRECTION);
        workflow.submit(application, "beneficiary@test.local");

        assertEquals(GrantApplicationStatus.SUBMITTED, application.getStatus());
        assertEquals(VerificationStage.FIELD, application.getWorkflowStage());
        assertEquals(fieldOfficer, application.getAssignedOfficer());
        verify(historyRepository, times(3)).save(any(ApplicationVerification.class));
    }

    @Test
    void fieldOfficerCannotSkipTheDistrictStage() {
        when(userRepository.findByEmail("field@test.local"))
                .thenReturn(Optional.of(fieldOfficer));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> workflow.decide(99L, "field@test.local", false,
                        new VerificationDecisionRequest(
                                VerificationDecision.APPROVED, "Attempted final approval.",
                                true, true, true, true)));

        assertEquals(409, exception.getStatusCode().value());
        assertEquals(GrantApplicationStatus.FIELD_VERIFICATION, application.getStatus());
        verify(historyRepository, never()).save(any(ApplicationVerification.class));
    }

    @Test
    void fieldVerificationRequiresChecklistAndUploadedDocuments() {
        when(userRepository.findByEmail("field@test.local"))
                .thenReturn(Optional.of(fieldOfficer));

        ResponseStatusException checklistError = assertThrows(
                ResponseStatusException.class,
                () -> workflow.decide(99L, "field@test.local", false,
                        new VerificationDecisionRequest(
                                VerificationDecision.VERIFIED, "Checked.",
                                true, true, false, true)));
        assertEquals(400, checklistError.getStatusCode().value());

        when(documentRepository.countByApplication_Id(99L)).thenReturn(0L);
        ResponseStatusException documentError = assertThrows(
                ResponseStatusException.class,
                () -> workflow.decide(99L, "field@test.local", false,
                        new VerificationDecisionRequest(
                                VerificationDecision.VERIFIED, "Checked.",
                                true, true, true, true)));
        assertEquals(409, documentError.getStatusCode().value());
    }

    @Test
    void officerCannotDecideAnApplicationAssignedToSomeoneElse() throws Exception {
        User otherFieldOfficer =
                user(11L, Role.OFFICER, "FIELD", "Test State", "Test District");
        when(userRepository.findByEmail("other@test.local"))
                .thenReturn(Optional.of(otherFieldOfficer));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> workflow.decide(99L, "other@test.local", false,
                        new VerificationDecisionRequest(
                                VerificationDecision.REJECTED, "Not assigned.",
                                false, false, false, false)));

        assertEquals(403, exception.getStatusCode().value());
    }

    @Test
    void correctionRequestRetainsCurrentStageAndAssignee() {
        when(userRepository.findByEmail("field@test.local"))
                .thenReturn(Optional.of(fieldOfficer));

        workflow.decide(99L, "field@test.local", false,
                new VerificationDecisionRequest(
                        VerificationDecision.NEEDS_CORRECTION,
                        "Please provide a current address proof.",
                        false, false, false, false));

        assertEquals(VerificationStage.FIELD, application.getWorkflowStage());
        assertEquals(GrantApplicationStatus.NEEDS_CORRECTION, application.getStatus());
        assertEquals(fieldOfficer, application.getAssignedOfficer());
    }

    private User user(
            Long id, Role role, String level, String state, String district)
            throws Exception {
        User user = new User();
        setId(user, id);
        user.setRole(role);
        user.setOfficerLevel(level);
        user.setJurisdictionState(state);
        user.setJurisdictionDistrict(district);
        user.setFullName("Test Officer " + id);
        user.setEmail("test" + id + "@test.local");
        user.setActive(true);
        return user;
    }

    private void setId(Object entity, Long id) throws Exception {
        Field field = entity.getClass().getDeclaredField("id");
        field.setAccessible(true);
        field.set(entity, id);
    }
}
