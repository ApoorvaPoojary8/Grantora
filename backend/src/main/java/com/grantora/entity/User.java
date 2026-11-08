package com.grantora.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(length = 15)
    private String phone;

    @Column(name = "officer_level", length = 20)
    private String officerLevel;

    @Column(name = "jurisdiction_state", length = 100)
    private String jurisdictionState;

    @Column(name = "jurisdiction_district", length = 100)
    private String jurisdictionDistrict;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    private Boolean active = true;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    public User() {}

    public Long getId() {
        return id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getOfficerLevel() {
        return officerLevel;
    }

    public void setOfficerLevel(String officerLevel) {
        this.officerLevel = officerLevel;
    }

    public String getJurisdictionState() {
        return jurisdictionState;
    }

    public void setJurisdictionState(String jurisdictionState) {
        this.jurisdictionState = jurisdictionState;
    }

    public String getJurisdictionDistrict() {
        return jurisdictionDistrict;
    }

    public void setJurisdictionDistrict(String jurisdictionDistrict) {
        this.jurisdictionDistrict = jurisdictionDistrict;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}