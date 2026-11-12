package com.grantora.entity;
import jakarta.persistence.*; import java.time.LocalDateTime;
@Entity @Table(name="workflow_escalations", indexes={@Index(name="ix_escalation_open",columnList="resolved, application_id, stage")})
public class WorkflowEscalation {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(optional=false) @JoinColumn(name="application_id") private GrantApplication application;
 @Enumerated(EnumType.STRING) @Column(nullable=false) private VerificationStage stage;
 @ManyToOne @JoinColumn(name="assigned_officer_id") private User assignedOfficer;
 @Column(nullable=false) private int escalationLevel=1;
 @Column(nullable=false,length=500) private String reason;
 @Column(nullable=false) private LocalDateTime createdAt=LocalDateTime.now();
 @Column(nullable=false) private boolean resolved=false;
 private LocalDateTime resolvedAt; @ManyToOne @JoinColumn(name="resolved_by_id") private User resolvedBy;
 @Column(length=1000) private String resolutionRemarks;
 public Long getId(){return id;} public GrantApplication getApplication(){return application;} public void setApplication(GrantApplication v){application=v;}
 public VerificationStage getStage(){return stage;} public void setStage(VerificationStage v){stage=v;}
 public User getAssignedOfficer(){return assignedOfficer;} public void setAssignedOfficer(User v){assignedOfficer=v;}
 public int getEscalationLevel(){return escalationLevel;} public void setEscalationLevel(int v){escalationLevel=v;}
 public String getReason(){return reason;} public void setReason(String v){reason=v;}
 public LocalDateTime getCreatedAt(){return createdAt;} public boolean isResolved(){return resolved;}
 public LocalDateTime getResolvedAt(){return resolvedAt;} public User getResolvedBy(){return resolvedBy;}
 public String getResolutionRemarks(){return resolutionRemarks;}
 public void resolve(User actor,String remarks){resolved=true;resolvedAt=LocalDateTime.now();resolvedBy=actor;resolutionRemarks=remarks;}
}
