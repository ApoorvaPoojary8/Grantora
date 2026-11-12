package com.grantora.service;

import com.grantora.dto.BeneficiaryRequest;
import com.grantora.dto.BeneficiaryResponse;
import com.grantora.entity.Beneficiary;
import com.grantora.entity.Role;
import com.grantora.entity.User;
import com.grantora.repository.BeneficiaryRepository;
import com.grantora.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.lang.reflect.Field;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class BeneficiaryServiceTest {

    private BeneficiaryRepository beneficiaryRepository;
    private UserRepository userRepository;
    private BeneficiaryService service;
    private User user;

    @BeforeEach
    void setUp() throws Exception {
        beneficiaryRepository = mock(BeneficiaryRepository.class);
        userRepository = mock(UserRepository.class);
        service = new BeneficiaryService(beneficiaryRepository, userRepository);

        user = new User();
        user.setFullName("New Beneficiary");
        user.setEmail("beneficiary@example.test");
        user.setPhone("9876543210");
        user.setRole(Role.BENEFICIARY);
        Field id = User.class.getDeclaredField("id");
        id.setAccessible(true);
        id.set(user, 42L);
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        when(userRepository.findByEmailForUpdate(user.getEmail()))
                .thenReturn(Optional.of(user));
        when(beneficiaryRepository.save(any(Beneficiary.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void uninitializedProfileReturnsRegistrationDetailsWithoutAnError() {
        when(beneficiaryRepository.findByUser_Id(user.getId())).thenReturn(Optional.empty());

        BeneficiaryResponse profile = service.getMyProfile(user.getEmail());

        assertNull(profile.id());
        assertEquals(user.getFullName(), profile.fullName());
        assertEquals(user.getEmail(), profile.email());
        assertEquals(user.getPhone(), profile.phone());
        assertNull(profile.dateOfBirth());
    }

    @Test
    void existingProfileLoadsSavedDetails() {
        Beneficiary saved = new Beneficiary();
        saved.setUser(user);
        saved.setDateOfBirth(LocalDate.of(1995, 4, 12));
        saved.setAnnualIncome(new BigDecimal("45000.00"));
        saved.setAddress("12 Main Street");
        saved.setState("Karnataka");
        saved.setDistrict("Udupi");
        saved.setCategory("OBC");
        when(beneficiaryRepository.findByUser_Id(user.getId()))
                .thenReturn(Optional.of(saved));

        BeneficiaryResponse profile = service.getMyProfile(user.getEmail());

        assertEquals(saved.getDateOfBirth(), profile.dateOfBirth());
        assertEquals(saved.getAnnualIncome(), profile.annualIncome());
        assertEquals(saved.getAddress(), profile.address());
        assertEquals(saved.getState(), profile.state());
        assertEquals(saved.getDistrict(), profile.district());
        assertEquals(saved.getCategory(), profile.category());
    }

    @Test
    void createEndpointUpdatesAnExistingProfileInsteadOfDuplicatingIt() {
        Beneficiary existing = new Beneficiary();
        existing.setUser(user);
        existing.setAddress("Old address");
        when(beneficiaryRepository.findByUser_Id(user.getId()))
                .thenReturn(Optional.of(existing));

        BeneficiaryResponse saved = service.createMyProfile(
                user.getEmail(), profileRequest("New address", "9988776655"));

        assertEquals("New address", saved.address());
        assertEquals("9988776655", saved.phone());
        verify(beneficiaryRepository).save(existing);
    }

    @Test
    void updateEndpointSavesExistingProfileAndContactInformation() {
        Beneficiary existing = new Beneficiary();
        existing.setUser(user);
        when(beneficiaryRepository.findByUser_Id(user.getId()))
                .thenReturn(Optional.of(existing));

        BeneficiaryResponse saved = service.updateMyProfile(
                user.getEmail(), profileRequest("Updated address", "9988776655"));

        assertEquals("Updated address", saved.address());
        assertEquals("9988776655", saved.phone());
        verify(beneficiaryRepository).save(existing);
    }

    @Test
    void createEndpointInitializesMissingProfile() {
        when(beneficiaryRepository.findByUser_Id(user.getId())).thenReturn(Optional.empty());

        BeneficiaryResponse saved = service.createMyProfile(
                user.getEmail(), profileRequest("New address", "9988776655"));

        assertEquals(user.getId(), saved.userId());
        assertEquals("New address", saved.address());
        assertEquals("9988776655", saved.phone());
        verify(beneficiaryRepository).save(any(Beneficiary.class));
    }

    @Test
    void missingAuthenticatedAccountIsReportedAsNotFound() {
        when(userRepository.findByEmail(user.getEmail())).thenReturn(Optional.empty());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.getMyProfile(user.getEmail()));

        assertEquals(404, exception.getStatusCode().value());
    }

    private BeneficiaryRequest profileRequest(String address, String phone) {
        return new BeneficiaryRequest(
                LocalDate.of(1995, 4, 12),
                new BigDecimal("45000.00"),
                address,
                "Karnataka",
                "Udupi",
                "OBC",
                phone);
    }
}
