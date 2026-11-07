package com.grantora.controller;

import com.grantora.entity.Beneficiary;
import com.grantora.service.BeneficiaryService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/beneficiaries")
public class BeneficiaryController {

    private final BeneficiaryService beneficiaryService;

    public BeneficiaryController(BeneficiaryService beneficiaryService) {
        this.beneficiaryService = beneficiaryService;
    }

    @GetMapping
    public ResponseEntity<List<Beneficiary>> getAllBeneficiaries() {
        return ResponseEntity.ok(
                beneficiaryService.getAllBeneficiaries());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Beneficiary> getBeneficiaryById(
            @PathVariable Long id) {
        return ResponseEntity.ok(
                beneficiaryService.getBeneficiaryById(id));
    }

    @PostMapping
    public ResponseEntity<Beneficiary> createBeneficiary(
            @RequestParam Long userId,
            @RequestBody Beneficiary beneficiary) {

        Beneficiary created =
                beneficiaryService.createBeneficiary(beneficiary, userId);

        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Beneficiary> updateBeneficiary(
            @PathVariable Long id,
            @RequestBody Beneficiary beneficiary) {

        return ResponseEntity.ok(
                beneficiaryService.updateBeneficiary(id, beneficiary));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBeneficiary(
            @PathVariable Long id) {

        beneficiaryService.deleteBeneficiary(id);

        return ResponseEntity.noContent().build();
    }
}