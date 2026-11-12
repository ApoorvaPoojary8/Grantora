package com.grantora.service;

import com.grantora.dto.VerificationDecisionRequest;
import com.grantora.entity.*;
import com.grantora.repository.ApplicationVerificationRepository;
import com.grantora.repository.ApplicationDocumentRepository;
import com.grantora.repository.GrantApplicationRepository;
import com.grantora.repository.UserRepository;
import com.grantora.repository.VerificationRoutingRuleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Service
@Transactional
public class VerificationWorkflowService {

    private static final List<GrantApplicationStatus> PENDING_REVIEW_STATUSES = List.of(
            GrantApplicationStatus.SUBMITTED,
            GrantApplicationStatus.UNDER_VERIFICATION,
            GrantApplicationStatus.FIELD_VERIFICATION,
            GrantApplicationStatus.DISTRICT_REVIEW,
            GrantApplicationStatus.STATE_REVIEW);

    private final GrantApplicationRepository applicationRepository;
    private final UserRepository userRepository;
    private final ApplicationVerificationRepository historyRepository;
    private final ApplicationDocumentRepository documentRepository;
    private final VerificationRoutingRuleRepository routingRuleRepository;

    public VerificationWorkflowService(
            GrantApplicationRepository applicationRepository,
            UserRepository userRepository,
            ApplicationVerificationRepository historyRepository,
            ApplicationDocumentRepository documentRepository,
            VerificationRoutingRuleRepository routingRuleRepository) {
        this.applicationRepository = applicationRepository;
        this.userRepository = userRepository;
        this.historyRepository = historyRepository;
        this.documentRepository = documentRepository;
        this.routingRuleRepository = routingRuleRepository;
    }

    public GrantApplication submit(GrantApplication application, String email) {
        User beneficiary = getUser(email);
        if (application.getStatus() == GrantApplicationStatus.DRAFT) {
            application.setWorkflowStage(VerificationStage.FIELD);
            application.setAssignedOfficer(selectOfficer(application, VerificationStage.FIELD, null));
            application.setRoutingPriority(resolvePriority(application));
            application.setEscalated(false);
            application.setStatus(GrantApplicationStatus.SUBMITTED);
            record(application, VerificationStage.FIELD, "SUBMITTED", beneficiary,
                    application.getAssignedOfficer(), "Application submitted for field verification.");
            record(application, VerificationStage.FIELD, "ASSIGNED", null,
                    application.getAssignedOfficer(), "Automatically assigned by beneficiary district.");
        } else if (application.getStatus() == GrantApplicationStatus.NEEDS_CORRECTION
                && application.getWorkflowStage() != null) {
            if (application.getAssignedOfficer() == null) {
                application.setAssignedOfficer(
                        selectOfficer(application, application.getWorkflowStage(), null));
            }
            application.setRoutingPriority(resolvePriority(application));
            application.setEscalated(false);
            application.setStatus(GrantApplicationStatus.SUBMITTED);
            record(application, application.getWorkflowStage(), "RESUBMITTED", beneficiary,
                    application.getAssignedOfficer(), "Beneficiary submitted requested corrections.");
        } else {
            throw conflict("Only a draft or returned application can be submitted.");
        }
        return applicationRepository.save(application);
    }

    @Transactional(readOnly = true)
    public List<GrantApplication> getQueue(String email, boolean admin) {
        if (admin) {
            return applicationRepository.findAllByOrderByIdDesc().stream()
                    .filter(this::isAwaitingReview)
                    .sorted(queueOrder())
                    .toList();
        }
        User officer = requireOfficer(getUser(email));
        return applicationRepository
                .findByAssignedOfficer_IdAndStatusInOrderByIdDesc(
                        officer.getId(), PENDING_REVIEW_STATUSES).stream()
                .sorted(queueOrder())
                .toList();
    }

    @Transactional(readOnly = true)
    public List<GrantApplication> getHistory(String email, boolean admin) {
        return applicationRepository.findAllByOrderByIdDesc().stream()
                .filter(application -> application.getWorkflowStage() != null)
                .filter(application -> canView(application, email, admin))
                .toList();
    }

    @Transactional(readOnly = true)
    public boolean canView(GrantApplication application, String email, boolean admin) {
        if (admin) return true;
        User user = getUser(email);
        if (user.getRole() != Role.OFFICER) return false;
        if (application.getAssignedOfficer() != null
                && Objects.equals(application.getAssignedOfficer().getId(), user.getId())) {
            return true;
        }
        if (user.getRole() != Role.OFFICER) return false;
        if (application.getWorkflowStage() != null
                && isWithinStageJurisdiction(user, application, application.getWorkflowStage())) {
            return true;
        }
        return historyRepository.findByApplication_IdOrderByCreatedAtAsc(application.getId())
                .stream()
                .anyMatch(item -> user.getOfficerLevel().equals(item.getStage().name())
                        && isWithinStageJurisdiction(user, application, item.getStage()));
    }

    public GrantApplication decide(
            Long applicationId,
            String email,
            boolean admin,
            VerificationDecisionRequest request) {
        GrantApplication application = findApplication(applicationId);
        User actor = getUser(email);
        requireDecisionAccess(application, actor, admin);
        VerificationStage stage = application.getWorkflowStage();
        VerificationDecision decision = request.decision();
        validateDecision(stage, decision, request.remarks());
        if (stage == VerificationStage.FIELD
                && decision == VerificationDecision.VERIFIED) {
            if (!request.identityVerified() || !request.addressVerified()
                    || !request.documentsVerified()
                    || !request.applicationDetailsVerified()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Confirm identity, address, documents, and application details before verification.");
            }
            if (documentRepository.countByApplication_Id(applicationId) == 0) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "At least one supporting document must be uploaded before field verification.");
            }
        }

        User currentAssignee = application.getAssignedOfficer();
        if (decision == VerificationDecision.NEEDS_CORRECTION) {
            application.setStatus(GrantApplicationStatus.NEEDS_CORRECTION);
        } else if (decision == VerificationDecision.REJECTED) {
            application.setStatus(GrantApplicationStatus.REJECTED);
            application.setAssignedOfficer(null);
        } else if (stage == VerificationStage.FIELD) {
            advance(application, VerificationStage.DISTRICT);
        } else if (stage == VerificationStage.DISTRICT) {
            advance(application, VerificationStage.STATE);
        } else {
            application.setStatus(GrantApplicationStatus.APPROVED);
            application.setAssignedOfficer(null);
        }

        recordChecklist(application, stage, decision, actor, currentAssignee, request);
        return applicationRepository.save(application);
    }

    public GrantApplication escalate(Long applicationId, String email, boolean admin) {
        GrantApplication application = findApplication(applicationId);
        User actor = getUser(email);
        if (!isAwaitingReview(application)) {
            throw conflict("Only an active verification application can be escalated.");
        }
        if (!admin) {
            requireDecisionAccess(application, actor, false);
        }
        User previous = application.getAssignedOfficer();
        User next = selectOfficer(application, application.getWorkflowStage(), previous);
        application.setAssignedOfficer(next);
        application.setEscalated(true);
        record(application, application.getWorkflowStage(), "ESCALATED", actor, next,
                "Application escalated and reassigned within the current verification level.");
        return applicationRepository.save(application);
    }

    private void advance(GrantApplication application, VerificationStage nextStage) {
        User nextOfficer = selectOfficer(application, nextStage, null);
        application.setWorkflowStage(nextStage);
        application.setAssignedOfficer(nextOfficer);
        application.setEscalated(false);
        application.setStatus(GrantApplicationStatus.UNDER_VERIFICATION);
        record(application, nextStage, "ASSIGNED", null, nextOfficer,
                "Automatically advanced to " + nextStage.name().toLowerCase() + " review.");
    }

    private void requireDecisionAccess(
            GrantApplication application, User actor, boolean admin) {
        if (!isAwaitingReview(application)) {
            throw conflict("This application is not awaiting verification.");
        }
        if (admin) {
            if (application.getWorkflowStage() != VerificationStage.STATE) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Admin can make a final decision only at the state review stage.");
            }
            return;
        }
        User officer = requireOfficer(actor);
        String expectedLevel = application.getWorkflowStage().name();
        if (!expectedLevel.equals(officer.getOfficerLevel())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "This officer is not authorized for this review level.");
        }
        if (!Objects.equals(application.getAssignedOfficer().getId(), officer.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "This application is assigned to another officer.");
        }
        if (!isWithinStageJurisdiction(officer, application, application.getWorkflowStage())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Application is outside the officer's jurisdiction.");
        }
    }

    private void validateDecision(
            VerificationStage stage, VerificationDecision decision, String remarks) {
        boolean allowed = switch (stage) {
            case FIELD -> decision == VerificationDecision.VERIFIED
                    || decision == VerificationDecision.REJECTED
                    || decision == VerificationDecision.NEEDS_CORRECTION;
            case DISTRICT -> decision == VerificationDecision.APPROVED
                    || decision == VerificationDecision.REJECTED
                    || decision == VerificationDecision.NEEDS_CORRECTION;
            case STATE -> decision == VerificationDecision.APPROVED
                    || decision == VerificationDecision.REJECTED;
        };
        if (!allowed) {
            throw conflict("Decision is not valid for the current verification level.");
        }
        if ((decision == VerificationDecision.REJECTED
                || decision == VerificationDecision.NEEDS_CORRECTION)
                && (remarks == null || remarks.isBlank())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Remarks are required for rejection or correction.");
        }
    }

    private User selectOfficer(
            GrantApplication application, VerificationStage stage, User exclude) {
        Beneficiary beneficiary = application.getBeneficiary();
        List<User> eligible = userRepository.findAll().stream()
                .filter(user -> user.getRole() == Role.OFFICER)
                .filter(user -> Boolean.TRUE.equals(user.getActive()))
                .filter(user -> stage.name().equals(user.getOfficerLevel()))
                .filter(user -> same(user.getJurisdictionState(), beneficiary.getState()))
                .filter(user -> stage == VerificationStage.STATE
                        || same(user.getJurisdictionDistrict(), beneficiary.getDistrict()))
                .filter(user -> exclude == null || !Objects.equals(user.getId(), exclude.getId()))
                .sorted(Comparator.comparing(User::getId))
                .toList();
        if (eligible.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "No active " + stage.name().toLowerCase()
                            + " officer is configured for the beneficiary's jurisdiction.");
        }
        if (exclude == null) {
            return eligible.get(Math.floorMod(application.getId().intValue(), eligible.size()));
        }
        List<User> allEligible = userRepository.findAll().stream()
                .filter(user -> user.getRole() == Role.OFFICER)
                .filter(user -> Boolean.TRUE.equals(user.getActive()))
                .filter(user -> stage.name().equals(user.getOfficerLevel()))
                .filter(user -> same(user.getJurisdictionState(), beneficiary.getState()))
                .filter(user -> stage == VerificationStage.STATE
                        || same(user.getJurisdictionDistrict(), beneficiary.getDistrict()))
                .sorted(Comparator.comparing(User::getId))
                .toList();
        if (allEligible.size() < 2) {
            throw conflict("No alternate officer is configured for escalation at this level.");
        }
        int currentIndex = allEligible.indexOf(exclude);
        return allEligible.get((currentIndex + 1 + allEligible.size()) % allEligible.size());
    }

    private boolean isWithinStageJurisdiction(
            User user, GrantApplication application, VerificationStage stage) {
        if (!stage.name().equals(user.getOfficerLevel())) return false;
        Beneficiary beneficiary = application.getBeneficiary();
        return same(user.getJurisdictionState(), beneficiary.getState())
                && (stage == VerificationStage.STATE
                || same(user.getJurisdictionDistrict(), beneficiary.getDistrict()));
    }

    private RoutingPriority resolvePriority(GrantApplication application) {
        BigDecimal configuredScore = application.getEligibilityEvaluation() == null
                ? BigDecimal.ZERO
                : application.getEligibilityEvaluation().scoreOutOf100();
        final BigDecimal score = configuredScore == null ? BigDecimal.ZERO : configuredScore;
        BigDecimal amount = application.getRequestedAmount();
        return routingRuleRepository.findAllByOrderByIdAsc().stream()
                .filter(rule -> score.compareTo(rule.getMinimumScore()) >= 0
                        && score.compareTo(rule.getMaximumScore()) <= 0)
                .filter(rule -> amount.compareTo(rule.getMinimumAmount()) >= 0
                        && (rule.getMaximumAmount() == null
                        || amount.compareTo(rule.getMaximumAmount()) <= 0))
                .map(VerificationRoutingRule::getPriority)
                .findFirst()
                .orElse(RoutingPriority.NORMAL);
    }

    private void record(
            GrantApplication application,
            VerificationStage stage,
            String action,
            User actor,
            User assignedOfficer,
            String remarks) {
        ApplicationVerification entry = new ApplicationVerification();
        entry.setApplication(application);
        entry.setStage(stage);
        entry.setAction(action);
        entry.setActor(actor);
        entry.setAssignedOfficer(assignedOfficer);
        entry.setRemarks(remarks == null || remarks.isBlank() ? null : remarks.trim());
        historyRepository.save(entry);
    }

    private void recordChecklist(
            GrantApplication application,
            VerificationStage stage,
            VerificationDecision decision,
            User actor,
            User assignedOfficer,
            VerificationDecisionRequest request) {
        ApplicationVerification entry = new ApplicationVerification();
        entry.setApplication(application);
        entry.setStage(stage);
        entry.setAction(decision.name());
        entry.setActor(actor);
        entry.setAssignedOfficer(assignedOfficer);
        entry.setRemarks(request.remarks() == null || request.remarks().isBlank()
                ? null : request.remarks().trim());
        entry.setIdentityVerified(request.identityVerified());
        entry.setAddressVerified(request.addressVerified());
        entry.setDocumentsVerified(request.documentsVerified());
        entry.setApplicationDetailsVerified(request.applicationDetailsVerified());
        historyRepository.save(entry);
    }

    private boolean isAwaitingReview(GrantApplication application) {
        if (application.getWorkflowStage() == null
                || !PENDING_REVIEW_STATUSES.contains(application.getStatus())) return false;
        return application.getStatus() == GrantApplicationStatus.SUBMITTED
                || application.getStatus() == GrantApplicationStatus.UNDER_VERIFICATION
                || application.getStatus() == statusFor(application.getWorkflowStage());
    }

    private GrantApplication findApplication(Long id) {
        return applicationRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Application not found"));
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found"));
    }

    private User requireOfficer(User user) {
        if (user.getRole() != Role.OFFICER || user.getOfficerLevel() == null) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "An assigned verification officer is required.");
        }
        return user;
    }

    private boolean same(String left, String right) {
        return left != null && right != null && left.trim().equalsIgnoreCase(right.trim());
    }

    private Comparator<GrantApplication> queueOrder() {
        return Comparator.comparing(GrantApplication::isEscalated).reversed()
                .thenComparing(
                        application -> application.getRoutingPriority() == null
                                ? RoutingPriority.NORMAL.ordinal()
                                : application.getRoutingPriority().ordinal(),
                        Comparator.reverseOrder())
                .thenComparing(GrantApplication::getId, Comparator.reverseOrder());
    }

    private GrantApplicationStatus statusFor(VerificationStage stage) {
        return switch (stage) {
            case FIELD -> GrantApplicationStatus.FIELD_VERIFICATION;
            case DISTRICT -> GrantApplicationStatus.DISTRICT_REVIEW;
            case STATE -> GrantApplicationStatus.STATE_REVIEW;
        };
    }

    private ResponseStatusException conflict(String message) {
        return new ResponseStatusException(HttpStatus.CONFLICT, message);
    }
}
