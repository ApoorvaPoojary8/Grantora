package com.grantora.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "verification_routing_rules")
public class VerificationRoutingRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "minimum_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal minimumScore;

    @Column(name = "maximum_score", nullable = false, precision = 5, scale = 2)
    private BigDecimal maximumScore;

    @Column(name = "minimum_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal minimumAmount;

    @Column(name = "maximum_amount", precision = 12, scale = 2)
    private BigDecimal maximumAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RoutingPriority priority;

    @Column(name = "state_approval_required")
    private Boolean stateApprovalRequired = true;

    public Long getId() { return id; }
    public BigDecimal getMinimumScore() { return minimumScore; }
    public void setMinimumScore(BigDecimal minimumScore) { this.minimumScore = minimumScore; }
    public BigDecimal getMaximumScore() { return maximumScore; }
    public void setMaximumScore(BigDecimal maximumScore) { this.maximumScore = maximumScore; }
    public BigDecimal getMinimumAmount() { return minimumAmount; }
    public void setMinimumAmount(BigDecimal minimumAmount) { this.minimumAmount = minimumAmount; }
    public BigDecimal getMaximumAmount() { return maximumAmount; }
    public void setMaximumAmount(BigDecimal maximumAmount) { this.maximumAmount = maximumAmount; }
    public RoutingPriority getPriority() { return priority; }
    public void setPriority(RoutingPriority priority) { this.priority = priority; }
    public boolean isStateApprovalRequired() {
        return !Boolean.FALSE.equals(stateApprovalRequired);
    }
    public void setStateApprovalRequired(Boolean stateApprovalRequired) {
        this.stateApprovalRequired = stateApprovalRequired;
    }
}
