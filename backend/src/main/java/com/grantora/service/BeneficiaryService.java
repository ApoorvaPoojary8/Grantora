
package com.grantora.service;

import com.grantora.dto.BeneficiaryRequest;
import com.grantora.dto.BeneficiaryResponse;
import com.grantora.entity.Beneficiary;
import com.grantora.entity.Role;
import com.grantora.entity.User;
import com.grantora.repository.BeneficiaryRepository;
import com.grantora.repository.UserRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

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
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Authenticated user account not found."));
    }

    private User getBeneficiaryUser(String email) {
        User user = getUserByEmail(email);
        if (user.getRole() != Role.BENEFICIARY) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Only beneficiary accounts can manage beneficiary profiles.");
        }
        return user;
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
        User user = getBeneficiaryUser(email);
        return beneficiaryRepository.findByUser_Id(user.getId())
                .map(this::toResponse)
                .orElseGet(() -> new BeneficiaryResponse(
                        null,
                        user.getId(),
                        user.getFullName(),
                        user.getEmail(),
                        user.getPhone(),
                        null,
                        null,
                        null,
                        null,
                        null,
                        null));
    }

    public BeneficiaryResponse createMyProfile(
            String email,
            BeneficiaryRequest request) {

        User user = userRepository.findByEmailForUpdate(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Authenticated user account not found."));
        if (user.getRole() != Role.BENEFICIARY) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Only beneficiary accounts can manage beneficiary profiles.");
        }

        Beneficiary existing = beneficiaryRepository.findByUser_Id(user.getId()).orElse(null);
        if (existing != null) {
            applyRequest(existing, request);
            return toResponse(beneficiaryRepository.save(existing));
        }

        Beneficiary beneficiary = new Beneficiary();
        beneficiary.setUser(user);
        applyRequest(beneficiary, request);

        return toResponse(beneficiaryRepository.save(beneficiary));
    }

    public BeneficiaryResponse updateMyProfile(
            String email,
            BeneficiaryRequest request) {

        User user = getBeneficiaryUser(email);

        Beneficiary beneficiary = beneficiaryRepository
                .findByUser_Id(user.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Beneficiary profile is not initialized."));

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
        if (request.phone() != null) {
            beneficiary.getUser().setPhone(request.phone().trim());
        }
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
