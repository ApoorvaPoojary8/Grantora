
package com.grantora.controller;

import com.grantora.dto.BeneficiaryRequest;
import com.grantora.dto.BeneficiaryResponse;
import com.grantora.service.BeneficiaryService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/beneficiaries")
public class BeneficiaryController {

    private final BeneficiaryService beneficiaryService;

    public BeneficiaryController(BeneficiaryService beneficiaryService) {
        this.beneficiaryService = beneficiaryService;
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("ROLE_ADMIN"::equals);
    }

    private void requireAdmin(Authentication authentication) {
        if (!isAdmin(authentication)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Admin access required");
        }
    }

    // Admin: view all beneficiaries
    @GetMapping
    public ResponseEntity<List<BeneficiaryResponse>> getAllBeneficiaries(
            Authentication authentication) {

        requireAdmin(authentication);

        return ResponseEntity.ok(
                beneficiaryService.getAllBeneficiaries());
    }

    // Beneficiary: view own profile
    @GetMapping("/me")
    public ResponseEntity<BeneficiaryResponse> getMyProfile(
            Authentication authentication) {

        return ResponseEntity.ok(
                beneficiaryService.getMyProfile(authentication.getName()));
    }

    // Beneficiary: create own profile
    @PostMapping
    public ResponseEntity<BeneficiaryResponse> createMyProfile(
            Authentication authentication,
            @RequestBody BeneficiaryRequest request) {

        BeneficiaryResponse created =
                beneficiaryService.createMyProfile(
                        authentication.getName(), request);

        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // Beneficiary: update own profile
    @PutMapping("/me")
    public ResponseEntity<BeneficiaryResponse> updateMyProfile(
            Authentication authentication,
            @RequestBody BeneficiaryRequest request) {

        return ResponseEntity.ok(
                beneficiaryService.updateMyProfile(
                        authentication.getName(), request));
    }

    // Admin: view beneficiary by ID
    @GetMapping("/{id}")
    public ResponseEntity<BeneficiaryResponse> getBeneficiaryById(
            @PathVariable Long id,
            Authentication authentication) {

        requireAdmin(authentication);

        return ResponseEntity.ok(
                beneficiaryService.getBeneficiaryById(id));
    }

    // Admin: delete beneficiary by ID
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBeneficiary(
            @PathVariable Long id,
            Authentication authentication) {

        requireAdmin(authentication);

        beneficiaryService.deleteBeneficiary(id);

        return ResponseEntity.noContent().build();
    }
}
