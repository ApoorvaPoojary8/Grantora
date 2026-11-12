package com.grantora.service;

import com.grantora.dto.GrantApplicationRequest;
import com.grantora.dto.GrantApplicationResponse;
import com.grantora.dto.GrantApplicationStatusRequest;
import com.grantora.dto.GrantApplicationUpdateRequest;
import com.grantora.dto.EligibilityAnswer;
import com.grantora.dto.ApplicationDocumentResponse;
import com.grantora.dto.BeneficiaryVerificationDetails;
import com.grantora.dto.VerificationDecisionRequest;
import com.grantora.dto.VerificationHistoryResponse;
import com.grantora.dto.GrantApplicationStatusHistoryResponse;
import com.grantora.entity.ApplicationDocument;
import com.grantora.entity.ApplicationVerification;
import com.grantora.entity.Beneficiary;
import com.grantora.entity.GrantApplication;
import com.grantora.entity.GrantApplicationStatus;
import com.grantora.entity.GrantApplicationStatusHistory;
import com.grantora.entity.Role;
import com.grantora.entity.Scheme;
import com.grantora.entity.SchemeEligibilityQuestion;
import com.grantora.entity.User;
import com.grantora.repository.ApplicationDocumentRepository;
import com.grantora.repository.ApplicationVerificationRepository;
import com.grantora.repository.BeneficiaryRepository;
import com.grantora.repository.GrantApplicationRepository;
import com.grantora.repository.GrantApplicationStatusHistoryRepository;
import com.grantora.repository.SchemeRepository;
import com.grantora.repository.UserRepository;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.List;

@Service
@Transactional
public class GrantApplicationService {

    private final GrantApplicationRepository applicationRepository;
    private final GrantApplicationStatusHistoryRepository statusHistoryRepository;
    private final BeneficiaryRepository beneficiaryRepository;
    private final SchemeRepository schemeRepository;
    private final EligibilityScoringService eligibilityScoringService;
    private final VerificationWorkflowService verificationWorkflowService;
    private final ApplicationVerificationRepository verificationRepository;
    private final ApplicationDocumentRepository documentRepository;
    private final UserRepository userRepository;

    private static final long MAX_DOCUMENT_SIZE = 10L * 1024 * 1024;
    private static final long MAX_DOCUMENTS_PER_APPLICATION = 20;

    public GrantApplicationService(
            GrantApplicationRepository applicationRepository,
            GrantApplicationStatusHistoryRepository statusHistoryRepository,
            BeneficiaryRepository beneficiaryRepository,
            SchemeRepository schemeRepository,
            EligibilityScoringService eligibilityScoringService,
            VerificationWorkflowService verificationWorkflowService,
            ApplicationVerificationRepository verificationRepository,
            ApplicationDocumentRepository documentRepository,
            UserRepository userRepository) {
        this.applicationRepository = applicationRepository;
        this.statusHistoryRepository = statusHistoryRepository;
        this.beneficiaryRepository = beneficiaryRepository;
        this.schemeRepository = schemeRepository;
        this.eligibilityScoringService = eligibilityScoringService;
        this.verificationWorkflowService = verificationWorkflowService;
        this.verificationRepository = verificationRepository;
        this.documentRepository = documentRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<GrantApplicationResponse> getAllApplications(String email, boolean admin) {
        List<GrantApplication> applications;
        if (admin) {
            applications = applicationRepository.findAllByOrderByIdDesc();
        } else {
            User user = getUser(email);
            if (user.getRole() != Role.OFFICER) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN, "Only reviewers can view the review queue.");
            }
            applications = applicationRepository.findAllByOrderByIdDesc().stream()
                    .filter(application ->
                            verificationWorkflowService.canView(application, email, false))
                    .toList();
        }
        return applications.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public Page<GrantApplicationResponse> getAdminApplications(
            GrantApplicationStatus status, Pageable pageable) {
        Page<GrantApplication> applications = status == null
                ? applicationRepository.findAllByOrderByIdDesc(pageable)
                : applicationRepository.findAllByStatusOrderByIdDesc(status, pageable);
        return applications.map(this::toResponse);
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
    public GrantApplicationResponse getApplication(
            Long id, String email, boolean admin) {
        GrantApplication application = findApplication(id);
        if (!admin) {
            User user = getUser(email);
            if (user.getRole() == Role.BENEFICIARY) {
                requireOwner(application, email);
            } else if (!verificationWorkflowService.canView(application, email, false)) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Application is outside your assignment or jurisdiction.");
            }
        }
        return toResponse(application);
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
        List<EligibilityAnswer> answers = request.eligibilityAnswers() == null
                ? List.of()
                : request.eligibilityAnswers();
        validateAnswers(scheme, answers);
        application.setEligibilityAnswers(answers);

        GrantApplication saved = persistApplication(application);
        saved.setEligibilityEvaluation(eligibilityScoringService.evaluate(
                saved.getId(), scheme, beneficiary, saved.getEligibilityAnswers()));
        saved = persistApplication(saved);
        recordStatusHistory(saved.getId(), null, saved.getStatus(), "CREATED",
                getUser(email), "Application draft created.");
        return toResponse(saved);
    }

    public GrantApplicationResponse updateDraft(
            Long id,
            String email,
            GrantApplicationUpdateRequest request) {
        GrantApplication application = findApplicationForUpdate(id);
        requireOwner(application, email);
        requireEditable(application);

        application.setApplicationDetails(request.applicationDetails().trim());
        application.setRequestedAmount(request.requestedAmount());
        if (request.eligibilityAnswers() != null) {
            validateAnswers(application.getScheme(), request.eligibilityAnswers());
            application.setEligibilityAnswers(request.eligibilityAnswers());
        }
        application.setEligibilityEvaluation(eligibilityScoringService.evaluate(
                application.getId(),
                application.getScheme(),
                application.getBeneficiary(),
                application.getEligibilityAnswers()));

        GrantApplication saved = persistApplication(application);
        recordStatusHistory(saved.getId(), saved.getStatus(), saved.getStatus(),
                "DRAFT_UPDATED", getUser(email), "Application details updated.");
        return toResponse(saved);
    }

    public GrantApplicationResponse submitDraft(Long id, String email) {
        GrantApplication application = findApplicationForUpdate(id);
        requireOwner(application, email);
        if (application.getStatus() != GrantApplicationStatus.DRAFT
                && application.getStatus() != GrantApplicationStatus.NEEDS_CORRECTION) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only drafts or returned applications can be submitted.");
        }

        validateForSubmission(application);
        GrantApplicationStatus previousStatus = application.getStatus();
        var evaluation = eligibilityScoringService.evaluate(
                application.getId(),
                application.getScheme(),
                application.getBeneficiary(),
                application.getEligibilityAnswers());
        application.setEligibilityEvaluation(evaluation);
        if (!"ELIGIBLE".equals(evaluation.eligibilityStatus())) {
            String message = "NEEDS_MORE_INFORMATION".equals(evaluation.eligibilityStatus())
                    ? "Complete the missing eligibility information before submitting."
                    : "This application does not meet the mandatory eligibility criteria.";
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, message);
        }
        if (application.getSubmittedAt() == null) {
            application.setSubmittedAt(LocalDateTime.now());
        }
        GrantApplication submitted = verificationWorkflowService.submit(application, email);
        String action = previousStatus == GrantApplicationStatus.NEEDS_CORRECTION
                ? "RESUBMITTED" : "SUBMITTED";
        recordStatusHistory(submitted.getId(), previousStatus, submitted.getStatus(),
                action, getUser(email), action.equals("RESUBMITTED")
                        ? "Beneficiary resubmitted the corrected application."
                        : "Beneficiary submitted the application.");
        return toResponse(submitted);
    }

    public void deleteDraft(Long id, String email) {
        GrantApplication application = findApplicationForUpdate(id);
        requireOwner(application, email);
        if (application.getStatus() != GrantApplicationStatus.DRAFT) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "Only draft applications can be deleted.");
        }
        recordStatusHistory(application.getId(), application.getStatus(), application.getStatus(),
                "DRAFT_DELETED", getUser(email), "Beneficiary deleted the draft.");
        documentRepository.deleteAllByApplication_Id(id);
        applicationRepository.delete(application);
    }

    public GrantApplicationResponse withdraw(Long id, String email) {
        GrantApplication application = findApplicationForUpdate(id);
        requireOwner(application, email);
        if (!isWithdrawalAllowed(application)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This application can no longer be withdrawn because verification has started.");
        }
        GrantApplicationStatus previousStatus = application.getStatus();
        application.setStatus(GrantApplicationStatus.WITHDRAWN);
        application.setAssignedOfficer(null);
        GrantApplication withdrawn = persistApplication(application);
        recordStatusHistory(withdrawn.getId(), previousStatus, withdrawn.getStatus(),
                "WITHDRAWN", getUser(email), "Beneficiary withdrew the application.");
        return toResponse(withdrawn);
    }

    public GrantApplicationResponse updateStatus(
            Long id,
            GrantApplicationStatusRequest request) {
        throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Direct status changes are disabled. Use staged verification decisions.");
    }

    public GrantApplicationResponse decide(
            Long id,
            String email,
            boolean admin,
            VerificationDecisionRequest request) {
        GrantApplication application = findApplicationForUpdate(id);
        GrantApplicationStatus previousStatus = application.getStatus();
        GrantApplication decided = verificationWorkflowService.decide(id, email, admin, request);
        if (previousStatus != decided.getStatus()) {
            recordStatusHistory(id, previousStatus, decided.getStatus(),
                    decided.getStatus().name(), getUser(email), request.remarks());
        }
        return toResponse(decided);
    }

    public GrantApplicationResponse escalate(Long id, String email, boolean admin) {
        return toResponse(verificationWorkflowService.escalate(id, email, admin));
    }

    public GrantApplicationResponse assign(
            Long id, Long officerId, String email, boolean admin) {
        return toResponse(verificationWorkflowService.assign(id, officerId, email, admin));
    }

    @Transactional(readOnly = true)
    public List<GrantApplicationResponse> getVerificationQueue(String email, boolean admin) {
        return verificationWorkflowService.getQueue(email, admin).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<GrantApplicationResponse> getDisbursementEligibleApplications(
            Pageable pageable) {
        return applicationRepository
                .findAllByStatusOrderByIdDesc(GrantApplicationStatus.APPROVED, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public List<GrantApplicationResponse> getVerificationHistory(String email, boolean admin) {
        return verificationWorkflowService.getHistory(email, admin).stream()
                .map(this::toResponse)
                .toList();
    }

    public ApplicationDocumentResponse addDocument(
            Long applicationId, String email, MultipartFile file) {
        GrantApplication application = findApplicationForUpdate(applicationId);
        requireOwner(application, email);
        if (application.getStatus() != GrantApplicationStatus.DRAFT
                && application.getStatus() != GrantApplicationStatus.NEEDS_CORRECTION) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Documents can only be uploaded to a draft or returned application.");
        }
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Choose a non-empty document.");
        }
        if (file.getSize() > MAX_DOCUMENT_SIZE) {
            throw new ResponseStatusException(
                    HttpStatus.PAYLOAD_TOO_LARGE, "Documents must not exceed 10 MB.");
        }
        if (documentRepository.countByApplication_Id(applicationId)
                >= MAX_DOCUMENTS_PER_APPLICATION) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "An application can include at most 20 documents.");
        }
        String contentType = validateDocument(file);
        try {
            ApplicationDocument document = new ApplicationDocument();
            document.setApplication(application);
            document.setUploadedBy(getUser(email));
            document.setFileName(safeFileName(file.getOriginalFilename()));
            document.setContentType(contentType);
            document.setFileSize(file.getSize());
            document.setContent(file.getBytes());
            return toDocumentResponse(documentRepository.save(document));
        } catch (IOException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Unable to read the uploaded document.", exception);
        }
    }

    @Transactional(readOnly = true)
    public ApplicationDocument getDocument(
            Long applicationId, Long documentId, String email, boolean admin) {
        GrantApplication application = findApplication(applicationId);
        authorizeRead(application, email, admin);
        return documentRepository.findByIdAndApplication_Id(documentId, applicationId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Application document not found."));
    }

    private void authorizeRead(GrantApplication application, String email, boolean admin) {
        if (admin) return;
        User user = getUser(email);
        if (user.getRole() == Role.BENEFICIARY) {
            requireOwner(application, email);
        } else if (!verificationWorkflowService.canView(application, email, false)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Application document is outside your assignment or jurisdiction.");
        }
    }

    private GrantApplication persistApplication(GrantApplication application) {
        try {
            return applicationRepository.saveAndFlush(application);
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

    private GrantApplication findApplicationForUpdate(Long id) {
        return applicationRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Application not found"));
    }

    private void requireOwner(GrantApplication application, String email) {
        if (!application.getBeneficiary().getUser().getEmail().equals(email)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "You cannot access this application");
        }
    }

    private void requireEditable(GrantApplication application) {
        if (application.getStatus() != GrantApplicationStatus.DRAFT
                && application.getStatus() != GrantApplicationStatus.NEEDS_CORRECTION) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Only a draft or returned application can be changed.");
        }
    }

    private void validateForSubmission(GrantApplication application) {
        if (application.getApplicationDetails() == null
                || application.getApplicationDetails().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Application details are required before submission.");
        }
        if (application.getRequestedAmount() == null
                || application.getRequestedAmount().signum() <= 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Requested amount must be greater than zero.");
        }
        if (!"ACTIVE".equalsIgnoreCase(application.getScheme().getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT, "This scheme is no longer accepting applications.");
        }
        validateAnswers(application.getScheme(), application.getEligibilityAnswers());
        java.util.Set<Long> answeredQuestionIds = application.getEligibilityAnswers().stream()
                .map(EligibilityAnswer::questionId)
                .collect(java.util.stream.Collectors.toSet());
        boolean hasMissingRequiredAnswer = application.getScheme().getEligibilityQuestions()
                .stream()
                .anyMatch(question -> question.isRequired()
                        && !answeredQuestionIds.contains(question.getId()));
        if (hasMissingRequiredAnswer) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Answer all required eligibility questions before submitting.");
        }
    }

    private boolean isWithdrawalAllowed(GrantApplication application) {
        if (application.getStatus() != GrantApplicationStatus.SUBMITTED) return false;
        List<ApplicationVerification> history =
                verificationRepository.findByApplication_IdOrderByCreatedAtAsc(application.getId());
        int lastSubmissionIndex = -1;
        for (int index = 0; index < history.size(); index++) {
            String action = history.get(index).getAction();
            if ("SUBMITTED".equals(action) || "RESUBMITTED".equals(action)) {
                lastSubmissionIndex = index;
            }
        }
        return history.subList(lastSubmissionIndex + 1, history.size()).stream()
                .noneMatch(item -> List.of(
                                "VERIFIED", "APPROVED", "REJECTED", "NEEDS_CORRECTION", "ESCALATED")
                        .contains(item.getAction()));
    }

    private void recordStatusHistory(
            Long applicationId,
            GrantApplicationStatus fromStatus,
            GrantApplicationStatus toStatus,
            String action,
            User actor,
            String remarks) {
        GrantApplicationStatusHistory entry = new GrantApplicationStatusHistory();
        entry.setApplicationId(applicationId);
        entry.setFromStatus(fromStatus);
        entry.setToStatus(toStatus);
        entry.setAction(action);
        entry.setActor(actor);
        entry.setRemarks(remarks == null || remarks.isBlank() ? null : remarks.trim());
        statusHistoryRepository.save(entry);
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User not found."));
    }

    private void validateAnswers(Scheme scheme, List<EligibilityAnswer> answers) {
        if (answers.size() > 5) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "At most five eligibility answers are allowed");
        }
        java.util.Set<Long> answeredQuestionIds = new java.util.HashSet<>();
        for (EligibilityAnswer answer : answers) {
            if (answer == null || answer.questionId() == null
                    || answer.answer() == null || answer.answer().isBlank()) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Eligibility answers need a question and answer");
            }
            if (!answeredQuestionIds.add(answer.questionId())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "A question may only be answered once");
            }
            SchemeEligibilityQuestion question = scheme.getEligibilityQuestions().stream()
                    .filter(item -> item.getId().equals(answer.questionId()))
                    .findFirst()
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.BAD_REQUEST,
                            "An eligibility answer does not belong to this scheme"));
            boolean answerIsConfigured = question.getAnswerOptions().stream()
                    .anyMatch(option -> option.value().equals(answer.answer()));
            if (!answerIsConfigured) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "An eligibility answer is not one of the configured options");
            }
        }
    }

    private GrantApplicationResponse toResponse(GrantApplication application) {
        List<VerificationHistoryResponse> history =
                verificationRepository.findByApplication_IdOrderByCreatedAtAsc(application.getId())
                        .stream()
                        .map(this::toHistoryResponse)
                        .toList();
        List<ApplicationDocumentResponse> documents =
                documentRepository.findMetadataByApplicationId(application.getId());
        List<GrantApplicationStatusHistoryResponse> statusHistory =
                statusHistoryRepository
                        .findByApplicationIdOrderByCreatedAtAscIdAsc(application.getId())
                        .stream()
                        .map(item -> new GrantApplicationStatusHistoryResponse(
                                item.getId(),
                                item.getFromStatus() == null ? null : item.getFromStatus().name(),
                                item.getToStatus() == null ? null : item.getToStatus().name(),
                                item.getAction(),
                                item.getActor() == null ? "System" : item.getActor().getFullName(),
                                item.getRemarks(),
                                item.getCreatedAt()))
                        .toList();
        return new GrantApplicationResponse(
                application.getId(),
                application.getBeneficiary().getId(),
                application.getBeneficiary().getUser().getFullName(),
                application.getScheme().getId(),
                application.getScheme().getSchemeName(),
                application.getApplicationDetails(),
                application.getRequestedAmount(),
                application.getStatus(),
                application.getSubmittedAt(),
                application.getEligibilityEvaluation(),
                application.getWorkflowStage() == null
                        ? null : application.getWorkflowStage().name(),
                application.getAssignedOfficer() == null
                        ? null : application.getAssignedOfficer().getId(),
                application.getAssignedOfficer() == null
                        ? null : application.getAssignedOfficer().getFullName(),
                application.getRoutingPriority() == null
                        ? "NORMAL" : application.getRoutingPriority().name(),
                application.isEscalated(),
                history,
                statusHistory,
                isWithdrawalAllowed(application),
                documents,
                new BeneficiaryVerificationDetails(
                        application.getBeneficiary().getUser().getEmail(),
                        application.getBeneficiary().getUser().getPhone(),
                        application.getBeneficiary().getDateOfBirth(),
                        application.getBeneficiary().getAnnualIncome(),
                        application.getBeneficiary().getAddress(),
                        application.getBeneficiary().getState(),
                        application.getBeneficiary().getDistrict(),
                        application.getBeneficiary().getCategory()),
                application.getEligibilityEvaluation() == null
                        ? null
                        : application.getEligibilityEvaluation().eligibilityThreshold(),
                application.requiresStateApproval());
    }

    private VerificationHistoryResponse toHistoryResponse(ApplicationVerification item) {
        return new VerificationHistoryResponse(
                item.getId(),
                item.getStage().name(),
                item.getPreviousStatus() == null ? null : item.getPreviousStatus().name(),
                item.getNewStatus() == null ? null : item.getNewStatus().name(),
                item.getNextStage() == null ? null : item.getNextStage().name(),
                item.getAction(),
                item.getActor() == null ? null : item.getActor().getId(),
                item.getActor() == null ? "System" : item.getActor().getFullName(),
                item.getAssignedOfficer() == null ? null : item.getAssignedOfficer().getId(),
                item.getAssignedOfficer() == null
                        ? null : item.getAssignedOfficer().getFullName(),
                item.getRemarks(),
                item.getCreatedAt(),
                item.isIdentityVerified(),
                item.isAddressVerified(),
                item.isDocumentsVerified(),
                item.isApplicationDetailsVerified());
    }

    private ApplicationDocumentResponse toDocumentResponse(ApplicationDocument document) {
        return new ApplicationDocumentResponse(
                document.getId(),
                document.getFileName(),
                document.getContentType(),
                document.getFileSize(),
                document.getUploadedBy().getFullName(),
                document.getUploadedAt());
    }

    private String validateDocument(MultipartFile file) {
        String fileName = safeFileName(file.getOriginalFilename());
        String extension = fileName.contains(".")
                ? fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT)
                : "";
        String contentType = file.getContentType() == null
                ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        try {
            byte[] header = file.getBytes();
            boolean pdf = extension.equals("pdf")
                    && contentType.equals("application/pdf")
                    && new String(header, 0, Math.min(5, header.length),
                    StandardCharsets.US_ASCII).startsWith("%PDF-");
            boolean png = extension.equals("png") && contentType.equals("image/png")
                    && header.length >= 8 && (header[0] & 0xff) == 0x89
                    && header[1] == 0x50 && header[2] == 0x4e && header[3] == 0x47;
            boolean jpeg = (extension.equals("jpg") || extension.equals("jpeg"))
                    && contentType.equals("image/jpeg") && header.length >= 3
                    && (header[0] & 0xff) == 0xff && (header[1] & 0xff) == 0xd8
                    && (header[2] & 0xff) == 0xff;
            if (pdf || png || jpeg) return contentType;
        } catch (IOException exception) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Unable to inspect uploaded document.", exception);
        }
        throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST, "Only valid PDF, PNG, and JPEG documents are allowed.");
    }

    private String safeFileName(String originalName) {
        if (originalName == null || originalName.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Document file name is required.");
        }
        String fileName = originalName.replace('\\', '/');
        fileName = fileName.substring(fileName.lastIndexOf('/') + 1)
                .replaceAll("[\\p{Cntrl}]", "").trim();
        if (fileName.isBlank() || fileName.length() > 255) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Document file name is invalid or too long.");
        }
        return fileName;
    }
}
