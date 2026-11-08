package com.grantora.controller;

import com.grantora.dto.GrantApplicationRequest;
import com.grantora.dto.GrantApplicationResponse;
import com.grantora.dto.GrantApplicationStatusRequest;
import com.grantora.dto.GrantApplicationUpdateRequest;
import com.grantora.service.GrantApplicationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/applications")
public class GrantApplicationController {

    private final GrantApplicationService applicationService;

    public GrantApplicationController(GrantApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @GetMapping
    public List<GrantApplicationResponse> getApplications() {
        return applicationService.getAllApplications();
    }

    @GetMapping("/me")
    public List<GrantApplicationResponse> getMyApplications(
            Authentication authentication) {
        return applicationService.getMyApplications(authentication.getName());
    }

    @GetMapping("/{id}")
    public GrantApplicationResponse getApplication(
            @PathVariable Long id,
            Authentication authentication) {
        if (hasRole(authentication, "ROLE_BENEFICIARY")) {
            return applicationService.getMyApplication(id, authentication.getName());
        }
        return applicationService.getApplication(id);
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

    @PatchMapping("/{id}/status")
    public GrantApplicationResponse updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody GrantApplicationStatusRequest request) {
        return applicationService.updateStatus(id, request);
    }

    private boolean hasRole(Authentication authentication, String role) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role::equals);
    }
}
