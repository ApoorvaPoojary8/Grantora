package com.grantora.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "application_verification_history")
public class ApplicationVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false)
    private GrantApplication application;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private VerificationStage stage;

    @Enumerated(EnumType.STRING)
    @Column(name = "previous_status", length = 30)
    private GrantApplicationStatus previousStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "new_status", length = 30)
    private GrantApplicationStatus newStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "next_stage", length = 20)
    private VerificationStage nextStage;

    @Column(nullable = false, length = 30)
    private String action;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_user_id")
    private User actor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_officer_id")
    private User assignedOfficer;

    @Column(length = 2000)
    private String remarks;

    @Column(name = "identity_verified")
    private boolean identityVerified;

    @Column(name = "address_verified")
    private boolean addressVerified;

    @Column(name = "documents_verified")
    private boolean documentsVerified;

    @Column(name = "application_details_verified")
    private boolean applicationDetailsVerified;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void setCreatedAt() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public GrantApplication getApplication() { return application; }
    public void setApplication(GrantApplication application) { this.application = application; }
    public VerificationStage getStage() { return stage; }
    public void setStage(VerificationStage stage) { this.stage = stage; }
    public GrantApplicationStatus getPreviousStatus() { return previousStatus; }
    public void setPreviousStatus(GrantApplicationStatus previousStatus) {
        this.previousStatus = previousStatus;
    }
    public GrantApplicationStatus getNewStatus() { return newStatus; }
    public void setNewStatus(GrantApplicationStatus newStatus) {
        this.newStatus = newStatus;
    }
    public VerificationStage getNextStage() { return nextStage; }
    public void setNextStage(VerificationStage nextStage) { this.nextStage = nextStage; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public User getActor() { return actor; }
    public void setActor(User actor) { this.actor = actor; }
    public User getAssignedOfficer() { return assignedOfficer; }
    public void setAssignedOfficer(User assignedOfficer) { this.assignedOfficer = assignedOfficer; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public boolean isIdentityVerified() { return identityVerified; }
    public void setIdentityVerified(boolean identityVerified) { this.identityVerified = identityVerified; }
    public boolean isAddressVerified() { return addressVerified; }
    public void setAddressVerified(boolean addressVerified) { this.addressVerified = addressVerified; }
    public boolean isDocumentsVerified() { return documentsVerified; }
    public void setDocumentsVerified(boolean documentsVerified) { this.documentsVerified = documentsVerified; }
    public boolean isApplicationDetailsVerified() { return applicationDetailsVerified; }
    public void setApplicationDetailsVerified(boolean applicationDetailsVerified) { this.applicationDetailsVerified = applicationDetailsVerified; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
