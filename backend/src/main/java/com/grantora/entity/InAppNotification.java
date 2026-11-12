package com.grantora.entity;
import jakarta.persistence.*; import java.time.LocalDateTime;
@Entity @Table(name="in_app_notifications", indexes={@Index(name="ix_notification_user_read",columnList="user_id, read_at")}, uniqueConstraints=@UniqueConstraint(name="uk_notification_event_user",columnNames={"event_key","user_id"}))
public class InAppNotification {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @ManyToOne(optional=false) @JoinColumn(name="user_id") private User user;
 @Column(name="event_key",nullable=false,length=180) private String eventKey;
 @Column(nullable=false,length=300) private String message;
 @Column(name="application_id") private Long applicationId;
 @Column(nullable=false) private LocalDateTime createdAt=LocalDateTime.now();
 @Column(name="read_at") private LocalDateTime readAt;
 public Long getId(){return id;} public User getUser(){return user;} public void setUser(User v){user=v;}
 public String getEventKey(){return eventKey;} public void setEventKey(String v){eventKey=v;}
 public String getMessage(){return message;} public void setMessage(String v){message=v;}
 public Long getApplicationId(){return applicationId;} public void setApplicationId(Long v){applicationId=v;}
 public LocalDateTime getCreatedAt(){return createdAt;} public LocalDateTime getReadAt(){return readAt;}
 public boolean isRead(){return readAt!=null;} public void markRead(){if(readAt==null)readAt=LocalDateTime.now();}
}
