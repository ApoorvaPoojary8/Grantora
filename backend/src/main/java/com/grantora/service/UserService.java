package com.grantora.service;

import com.grantora.entity.User;
import com.grantora.entity.Role;
import com.grantora.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));
    }

    public User createUser(User user) {
        if (user.getEmail() == null || user.getEmail().isBlank()
                || user.getFullName() == null || user.getFullName().isBlank()
                || user.getPassword() == null || user.getPassword().length() < 8
                || user.getRole() == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Name, email, role, and a password of at least eight characters are required");
        }
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }
        validateOfficerJurisdiction(user);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        if (user.getActive() == null) user.setActive(true);
        return userRepository.save(user);
    }

    public User updateUser(Long id, User updatedUser) {
        User existingUser = getUserById(id);

        existingUser.setFullName(updatedUser.getFullName());
        existingUser.setEmail(updatedUser.getEmail());
        existingUser.setPhone(updatedUser.getPhone());
        existingUser.setRole(updatedUser.getRole());
        existingUser.setActive(updatedUser.getActive());
        existingUser.setOfficerLevel(updatedUser.getOfficerLevel());
        existingUser.setJurisdictionState(updatedUser.getJurisdictionState());
        existingUser.setJurisdictionDistrict(updatedUser.getJurisdictionDistrict());
        validateOfficerJurisdiction(existingUser);

        return userRepository.save(existingUser);
    }

    public void deleteUser(Long id) {
        userRepository.delete(getUserById(id));
    }

    private void validateOfficerJurisdiction(User user) {
        if (user.getRole() != Role.OFFICER) {
            user.setOfficerLevel(null);
            user.setJurisdictionState(null);
            user.setJurisdictionDistrict(null);
            return;
        }
        String level = user.getOfficerLevel();
        if (level == null || !List.of("FIELD", "DISTRICT", "STATE").contains(level)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Officer level must be FIELD, DISTRICT, or STATE");
        }
        if (user.getJurisdictionState() == null || user.getJurisdictionState().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Officer jurisdiction state is required");
        }
        if (!"STATE".equals(level)
                && (user.getJurisdictionDistrict() == null
                || user.getJurisdictionDistrict().isBlank())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Field and district officers require a district");
        }
        if ("STATE".equals(level)) {
            user.setJurisdictionDistrict(null);
        }
    }
}