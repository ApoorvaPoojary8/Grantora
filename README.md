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
| Officer | Review applications and perform verification |

## 🧑‍💻 Development Status

Grantora is currently under active development.

Current focus:
- Backend initialization
- Database integration
- Scheme management APIs
- Beneficiary management
- Application workflow implementation

## 🎯 Project Objective

To improve accessibility, transparency, and efficiency in government grant administration through a centralized digital platform.

## 📄 License

This project is developed for educational and academic purposes.
