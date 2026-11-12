package com.grantora.entity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
@Entity @Table(name="workflow_deadline_config")
public class WorkflowDeadlineConfig {
 @Id private Long id=1L;
 @Column(nullable=false) private int fieldDays=5;
 @Column(nullable=false) private int districtDays=5;
 @Column(nullable=false) private int stateDays=5;
 @Column(nullable=false) private int scanMinutes=60;
 private LocalDateTime updatedAt=LocalDateTime.now();
 public Long getId(){return id;} public int getFieldDays(){return fieldDays;} public void setFieldDays(int v){fieldDays=v;}
 public int getDistrictDays(){return districtDays;} public void setDistrictDays(int v){districtDays=v;}
 public int getStateDays(){return stateDays;} public void setStateDays(int v){stateDays=v;}
 public int getScanMinutes(){return scanMinutes;} public void setScanMinutes(int v){scanMinutes=v;}
 public LocalDateTime getUpdatedAt(){return updatedAt;} public void touch(){updatedAt=LocalDateTime.now();}
 public int days(VerificationStage s){return switch(s){case FIELD->fieldDays;case DISTRICT->districtDays;case STATE->stateDays;};}
}
