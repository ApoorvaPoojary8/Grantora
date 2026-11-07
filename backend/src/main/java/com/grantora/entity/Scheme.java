package com.grantora.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "schemes")
public class Scheme {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "scheme_name", nullable = false, length = 200)
    private String schemeName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 150)
    private String department;

    @Column(name = "minimum_age")
    private Integer minimumAge;

    @Column(name = "maximum_age")
    private Integer maximumAge;

    @Column(name = "maximum_annual_income", precision = 12, scale = 2)
    private BigDecimal maximumAnnualIncome;

    @Column(name = "maximum_grant_amount", precision = 12, scale = 2)
    private BigDecimal maximumGrantAmount;

    @Column(name = "eligibility_threshold", precision = 5, scale = 2)
    private BigDecimal eligibilityThreshold = BigDecimal.valueOf(70);

    @Column(name = "application_start_date")
    private LocalDate applicationStartDate;

    @Column(name = "application_end_date")
    private LocalDate applicationEndDate;

    @Column(length = 20)
    private String status = "DRAFT";

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    public Scheme() {
    }

    public Long getId() {
        return id;
    }

    public String getSchemeName() {
        return schemeName;
    }

    public void setSchemeName(String schemeName) {
        this.schemeName = schemeName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public Integer getMinimumAge() {
        return minimumAge;
    }

    public void setMinimumAge(Integer minimumAge) {
        this.minimumAge = minimumAge;
    }

    public Integer getMaximumAge() {
        return maximumAge;
    }

    public void setMaximumAge(Integer maximumAge) {
        this.maximumAge = maximumAge;
    }

    public BigDecimal getMaximumAnnualIncome() {
        return maximumAnnualIncome;
    }

    public void setMaximumAnnualIncome(BigDecimal maximumAnnualIncome) {
        this.maximumAnnualIncome = maximumAnnualIncome;
    }

    public BigDecimal getMaximumGrantAmount() {
        return maximumGrantAmount;
    }

    public void setMaximumGrantAmount(BigDecimal maximumGrantAmount) {
        this.maximumGrantAmount = maximumGrantAmount;
    }

    public BigDecimal getEligibilityThreshold() {
        return eligibilityThreshold;
    }

    public void setEligibilityThreshold(BigDecimal eligibilityThreshold) {
        this.eligibilityThreshold = eligibilityThreshold;
    }

    public LocalDate getApplicationStartDate() {
        return applicationStartDate;
    }

    public void setApplicationStartDate(LocalDate applicationStartDate) {
        this.applicationStartDate = applicationStartDate;
    }

    public LocalDate getApplicationEndDate() {
        return applicationEndDate;
    }

    public void setApplicationEndDate(LocalDate applicationEndDate) {
        this.applicationEndDate = applicationEndDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}