
package com.grantora.service;

import com.grantora.dto.BeneficiaryRequest;
import com.grantora.dto.BeneficiaryResponse;
import com.grantora.entity.Beneficiary;
import com.grantora.entity.User;
import com.grantora.repository.BeneficiaryRepository;
import com.grantora.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class BeneficiaryService {

    private final BeneficiaryRepository beneficiaryRepository;
    private final UserRepository userRepository;

    public BeneficiaryService(
            BeneficiaryRepository beneficiaryRepository,
            UserRepository userRepository) {
        this.beneficiaryRepository = beneficiaryRepository;
        this.userRepository = userRepository;
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private BeneficiaryResponse toResponse(Beneficiary beneficiary) {
        User user = beneficiary.getUser();

        return new BeneficiaryResponse(
                beneficiary.getId(),
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                beneficiary.getDateOfBirth(),
                beneficiary.getAnnualIncome(),
                beneficiary.getAddress(),
                beneficiary.getState(),
                beneficiary.getDistrict(),
                beneficiary.getCategory()
        );
    }

    public List<BeneficiaryResponse> getAllBeneficiaries() {
        return beneficiaryRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public BeneficiaryResponse getMyProfile(String email) {
        User user = getUserByEmail(email);

        Beneficiary beneficiary = beneficiaryRepository
                .findByUser_Id(user.getId())
                .orElseThrow(() ->
                        new RuntimeException("Beneficiary profile not found"));

        return toResponse(beneficiary);
    }

    public BeneficiaryResponse createMyProfile(
            String email,
            BeneficiaryRequest request) {

        User user = getUserByEmail(email);

        if (beneficiaryRepository.existsByUser_Id(user.getId())) {
            throw new RuntimeException(
                    "Beneficiary profile already exists");
        }

        Beneficiary beneficiary = new Beneficiary();
        beneficiary.setUser(user);
        applyRequest(beneficiary, request);

        return toResponse(beneficiaryRepository.save(beneficiary));
    }

    public BeneficiaryResponse updateMyProfile(
            String email,
            BeneficiaryRequest request) {

        User user = getUserByEmail(email);

        Beneficiary beneficiary = beneficiaryRepository
                .findByUser_Id(user.getId())
                .orElseThrow(() ->
                        new RuntimeException("Beneficiary profile not found"));

        applyRequest(beneficiary, request);

        return toResponse(beneficiaryRepository.save(beneficiary));
    }

    private void applyRequest(
            Beneficiary beneficiary,
            BeneficiaryRequest request) {

        beneficiary.setDateOfBirth(request.dateOfBirth());
        beneficiary.setAnnualIncome(request.annualIncome());
        beneficiary.setAddress(request.address());
        beneficiary.setState(request.state());
        beneficiary.setDistrict(request.district());
        beneficiary.setCategory(request.category());
    }

    public BeneficiaryResponse getBeneficiaryById(Long id) {
        Beneficiary beneficiary = beneficiaryRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Beneficiary not found: " + id));

        return toResponse(beneficiary);
    }

    public void deleteBeneficiary(Long id) {
        Beneficiary beneficiary = beneficiaryRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Beneficiary not found: " + id));

        beneficiaryRepository.delete(beneficiary);
    }
}
