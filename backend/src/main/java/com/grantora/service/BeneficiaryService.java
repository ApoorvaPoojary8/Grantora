package com.grantora.service;

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

    public List<Beneficiary> getAllBeneficiaries() {
        return beneficiaryRepository.findAll();
    }

    public Beneficiary getBeneficiaryById(Long id) {
        return beneficiaryRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Beneficiary not found: " + id));
    }

    public Beneficiary createBeneficiary(
            Beneficiary beneficiary, Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new RuntimeException("User not found: " + userId));

        if (beneficiaryRepository.existsByUser_Id(userId)) {
            throw new RuntimeException(
                    "Beneficiary already exists for user: " + userId);
        }

        beneficiary.setUser(user);

        return beneficiaryRepository.save(beneficiary);
    }

    public Beneficiary updateBeneficiary(
            Long id, Beneficiary updatedBeneficiary) {

        Beneficiary existing = getBeneficiaryById(id);

        existing.setDateOfBirth(updatedBeneficiary.getDateOfBirth());
        existing.setAnnualIncome(updatedBeneficiary.getAnnualIncome());
        existing.setAddress(updatedBeneficiary.getAddress());
        existing.setState(updatedBeneficiary.getState());
        existing.setDistrict(updatedBeneficiary.getDistrict());
        existing.setCategory(updatedBeneficiary.getCategory());

        return beneficiaryRepository.save(existing);
    }

    public void deleteBeneficiary(Long id) {
        Beneficiary existing = getBeneficiaryById(id);
        beneficiaryRepository.delete(existing);
    }
}