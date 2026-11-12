# Grantora – Government Grant Management System

Grantora is a web-based Government Grant Management System designed to simplify grant scheme management, beneficiary applications, eligibility assessment, and verification workflows.

The platform aims to provide a centralized and transparent system for managing government grant applications and approvals.

## 🚀 Features

- Government grant scheme management
- Beneficiary registration and management
- Grant application submission
- Eligibility scoring and assessment
- Multi-level application verification
- Application status tracking
- Role-based access for Admin, Beneficiary, and Officer
- Application history and audit tracking

## 🛠️ Technology Stack

### Frontend
- React.js
- Vite
- JavaScript
- CSS

### Backend
- Java 17
- Spring Boot
- Spring Web
- Spring Data JPA
- Maven

### Database
- MySQL 8.0

## 📁 Project Structure

```text
Grantora/
├── frontend/       # React frontend
├── backend/        # Spring Boot REST API
└── README.md
```

## ⚙️ Prerequisites

Ensure the following are installed:

- Java 17
- Node.js and npm
- MySQL 8.0
- Git

## ▶️ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/ApoorvaPoojary8/Grantora.git
cd Grantora
```

### 2. Start the Backend

```bash
cd backend
./mvnw spring-boot:run
```

Backend runs at:

```text
http://localhost:8080
```

### 3. Start the Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

## 🗄️ Database Configuration

Configure MySQL in:

```text
backend/src/main/resources/application.properties
```

Example configuration:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/grantora_db
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```

Set your database credentials using environment variables. Do not commit passwords or other secrets.

## 👥 User Roles

| Role | Responsibilities |
|---|---|
| Admin | Manage schemes, users, and system configuration |
| Beneficiary | Browse schemes and submit applications |
| Officer | Review applications in an assigned Field, District, or State jurisdiction |

### Three-level verification workflow

Submitted applications are assigned to an active Field Officer whose configured state and district match the beneficiary. Field and District review are mandatory. Admin-configured score/amount rules determine queue priority and whether State approval is additionally required; existing applications retain their routing decision.

- Field Officers review beneficiary identity, address, application details, and uploaded evidence; confirming a verification decision requires all four checklist items and at least one uploaded document.
- District Officers review the field report and may approve to State review when the matching rule requires it, otherwise final approval is recorded at District. They may also reject or return the application for beneficiary correction.
- State Officers or Admins make the final approval/rejection when State review is required. Admin decisions are limited to the State stage.
- Applications must pass persisted eligibility checks before submission; ineligible or incomplete applications cannot enter officer queues.
- Beneficiaries can view progress and remarks but cannot change verification decisions.
- Rejections and correction requests require remarks. Corrections return to the same level; direct status changes are disabled.
- An authorized officer or Admin can escalate a pending application by reassigning it to another officer at the same level and jurisdiction.
- Admins can manually assign or reassign a pending application only to an active officer at the current stage and matching jurisdiction. Assignment, decision, status transition, next stage, actor, remarks, and timestamp are retained in the verification history.
- Final approvals appear in the Admin Grant Disbursement queue; this queue marks eligibility for the disbursement workflow and does not itself execute a payment.
- Documents are stored in MySQL (PDF, PNG, or JPEG; max 10 MB per file and 20 per application). Only the application owner, Admin, or an officer authorized for the application may download them.

Admins configure officer accounts/jurisdictions in **Verification & Approvals**. Existing Officer accounts must be assigned a level (`FIELD`, `DISTRICT`, or `STATE`) and matching state/district before they can receive applications. Routing rules are also configured there; rule ranges cannot overlap, and existing application priorities are not retroactively changed. Existing `SUBMITTED` or `UNDER_REVIEW` applications from before this workflow have no stage or assignee and require a reviewed data backfill before deployment; they are not silently advanced.

Hibernate creates the workflow tables/columns with the configured `ddl-auto=update`; back up production data and review schema changes before deploying.

Verification API routes:

```text
GET    /api/applications/verification/assigned
GET    /api/applications/verification/history
POST   /api/applications/{id}/decision
POST   /api/applications/{id}/escalate
POST   /api/applications/{id}/assignment        (Admin only)
POST   /api/applications/{id}/documents
GET    /api/applications/{id}/documents/{documentId}
GET    /api/applications/disbursement/eligible  (Admin only)
GET/POST/PUT/DELETE /api/verification/routing-rules
```

Officer accounts and assignments use the existing Admin-only `/api/users` endpoints. Hibernate creates the workflow tables/columns with the configured `ddl-auto=update`; back up production data and review schema changes before deploying.

## 🧑‍💻 Development Status

Grantora is currently under active development.

Current focus:
- Role-based scheme and application management
- Configurable eligibility scoring
- Three-level application verification and approval
- Beneficiary progress tracking and audit history

## 🎯 Project Objective

To improve accessibility, transparency, and efficiency in government grant administration through a centralized digital platform.

## 📄 License

This project is developed for educational and academic purposes.
