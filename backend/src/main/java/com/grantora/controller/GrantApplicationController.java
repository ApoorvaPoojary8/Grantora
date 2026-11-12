package com.grantora.controller;

import com.grantora.dto.GrantApplicationRequest;
import com.grantora.dto.GrantApplicationResponse;
import com.grantora.dto.GrantApplicationStatusRequest;
import com.grantora.dto.GrantApplicationUpdateRequest;
import com.grantora.dto.ApplicationDocumentResponse;
import com.grantora.dto.OfficerAssignmentRequest;
import com.grantora.dto.VerificationDecisionRequest;
import com.grantora.entity.ApplicationDocument;
import com.grantora.entity.GrantApplicationStatus;
import com.grantora.service.GrantApplicationService;
import jakarta.validation.Valid;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.domain.Sort;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/applications")
public class GrantApplicationController {

    private final GrantApplicationService applicationService;

    public GrantApplicationController(GrantApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @GetMapping
    public List<GrantApplicationResponse> getApplications(Authentication authentication) {
        return applicationService.getAllApplications(
                authentication.getName(), hasRole(authentication, "ROLE_ADMIN"));
    }

    @GetMapping("/admin")
    public Page<GrantApplicationResponse> getAdminApplications(
            Authentication authentication,
            @RequestParam(required = false) GrantApplicationStatus status,
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC)
            Pageable pageable) {
        if (!hasRole(authentication, "ROLE_ADMIN")) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Admin access required.");
        }
        return applicationService.getAdminApplications(status, pageable);
    }

    @GetMapping("/me")
    public List<GrantApplicationResponse> getMyApplications(
            Authentication authentication) {
        return applicationService.getMyApplications(authentication.getName());
    }

    @GetMapping("/verification/assigned")
    public List<GrantApplicationResponse> getVerificationQueue(
            Authentication authentication) {
        return applicationService.getVerificationQueue(
                authentication.getName(), hasRole(authentication, "ROLE_ADMIN"));
    }

    @GetMapping("/verification/history")
    public List<GrantApplicationResponse> getVerificationHistory(
            Authentication authentication) {
        return applicationService.getVerificationHistory(
                authentication.getName(), hasRole(authentication, "ROLE_ADMIN"));
    }

    @GetMapping("/{id}")
    public GrantApplicationResponse getApplication(
            @PathVariable Long id,
            Authentication authentication) {
        return applicationService.getApplication(
                id, authentication.getName(), hasRole(authentication, "ROLE_ADMIN"));
    }

    @PostMapping
    public ResponseEntity<GrantApplicationResponse> createApplication(
            Authentication authentication,
            @Valid @RequestBody GrantApplicationRequest request) {
        GrantApplicationResponse created =
                applicationService.createApplication(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public GrantApplicationResponse updateDraft(
            @PathVariable Long id,
            Authentication authentication,
            @Valid @RequestBody GrantApplicationUpdateRequest request) {
        return applicationService.updateDraft(id, authentication.getName(), request);
    }

    @PostMapping("/{id}/submit")
    public GrantApplicationResponse submitDraft(
            @PathVariable Long id,
            Authentication authentication) {
        return applicationService.submitDraft(id, authentication.getName());
    }

    @PostMapping("/{id}/withdraw")
    public GrantApplicationResponse withdrawApplication(
            @PathVariable Long id,
            Authentication authentication) {
        return applicationService.withdraw(id, authentication.getName());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDraft(
            @PathVariable Long id,
            Authentication authentication) {
        applicationService.deleteDraft(id, authentication.getName());
    }

    @PatchMapping("/{id}/status")
    public GrantApplicationResponse updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody GrantApplicationStatusRequest request) {
        return applicationService.updateStatus(id, request);
    }

    @PostMapping("/{id}/decision")
    public GrantApplicationResponse decide(
            @PathVariable Long id,
            Authentication authentication,
            @Valid @RequestBody VerificationDecisionRequest request) {
        return applicationService.decide(
                id, authentication.getName(), hasRole(authentication, "ROLE_ADMIN"), request);
    }

    @PostMapping("/{id}/escalate")
    public GrantApplicationResponse escalate(
            @PathVariable Long id,
            Authentication authentication) {
        return applicationService.escalate(
                id, authentication.getName(), hasRole(authentication, "ROLE_ADMIN"));
    }

    @PostMapping("/{id}/assignment")
    public GrantApplicationResponse assignOfficer(
            @PathVariable Long id,
            Authentication authentication,
            @Valid @RequestBody OfficerAssignmentRequest request) {
        return applicationService.assign(
                id, request.officerId(), authentication.getName(),
                hasRole(authentication, "ROLE_ADMIN"));
    }

    @GetMapping("/disbursement/eligible")
    public Page<GrantApplicationResponse> getDisbursementEligibleApplications(
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC)
            Pageable pageable) {
        return applicationService.getDisbursementEligibleApplications(pageable);
    }

    @PostMapping(value = "/{id}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ApplicationDocumentResponse addDocument(
            @PathVariable Long id,
            Authentication authentication,
            @RequestPart("file") MultipartFile file) {
        return applicationService.addDocument(id, authentication.getName(), file);
    }

    @GetMapping("/{id}/documents/{documentId}")
    public ResponseEntity<byte[]> getDocument(
            @PathVariable Long id,
            @PathVariable Long documentId,
            Authentication authentication) {
        ApplicationDocument document = applicationService.getDocument(
                id, documentId, authentication.getName(),
                hasRole(authentication, "ROLE_ADMIN"));
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(document.getContentType()))
                .contentLength(document.getFileSize())
                .header("X-Content-Type-Options", "nosniff")
                .header("Content-Disposition", ContentDisposition.attachment()
                        .filename(document.getFileName(), StandardCharsets.UTF_8).build().toString())
                .body(document.getContent());
    }

    private boolean hasRole(Authentication authentication, String role) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role::equals);
    }
}
