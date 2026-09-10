# Recruitment & Applicant Tracking System (ATS)

An end-to-end, production-ready recruitment and applicant tracking platform built with Python (Flask), PostgreSQL / SQLAlchemy ORM, and a responsive Material Design 3 frontend. The platform connects candidates, recruiters, and administrators through an explainable ATS resume match scoring engine, Ashby-style drag-and-drop hiring pipelines, digital job offer letters, and robust JWT role-based access control.

---

## 📑 Table of Contents
1. [Demo](#1-demo)
2. [Key Features](#2-key-features)
3. [Tech Stack](#3-tech-stack)
4. [Architecture & Project Structure](#4-architecture--project-structure)
5. [Prerequisites](#5-prerequisites)
6. [Environment Variables](#6-environment-variables)
7. [Installation & Quickstart](#7-installation--quickstart)
8. [API Documentation](#8-api-documentation)
9. [Running Tests](#9-running-tests)
10. [Contributing](#10-contributing)
11. [License](#11-license)

---

## 1. Demo

🌐 **Live Demo Website**: [https://ats-recruitment-portal.onrender.com](https://ats-recruitment-portal.onrender.com)  
📑 **Live API Documentation (Swagger UI)**: [https://ats-recruitment-portal.onrender.com/api/docs](https://ats-recruitment-portal.onrender.com/api/docs)  

> 🚀 **1-Click Free Cloud Deployment (Render)**:  
> This repository is pre-configured with `render.yaml` and `Procfile`. You can deploy your own instance to Render's free tier in 1 click:  
> [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/harshithcheripally16-ui/ATS_Project)

### Default Pre-Configured Demo Accounts

| Role | Email | Password | Primary Capabilities |
|---|---|---|---|
| **Admin** | `admin@ats.com` | `AdminPass123!` | System analytics, user activation/deactivation, category management |
| **Recruiter** | `recruiter@ats.com` | `RecruiterPass123!` | Job posting, applicant pipeline management, interview scheduling, offer letters |
| **Candidate** | `candidate@ats.com` | `CandidatePass123!` | Job search, resume upload, application tracking, offer letter review & acceptance |

> Candidates and recruiters can also self-register at `/pages/register.html` with automated OTP/email verification.

### Local Development Demo

When running locally (`python run.py`), access the application at:
- **Application Portal**: `http://127.0.0.1:5000/`
- **Interactive Swagger Docs**: `http://127.0.0.1:5000/api/docs`
- **Recruiter Applicants Review**: `http://127.0.0.1:5000/pages/recruiter/applicants.html`
- **Candidate Job Openings**: `http://127.0.0.1:5000/pages/jobs.html`

---

## 2. Key Features

### 🎯 Automated ATS Resume Match Scoring
- **Multi-Factor Algorithm**: Evaluates required job skills (60%), experience duration (25%), and role alignment (15%) to generate a transparent 0–100% compatibility score.
- **Color-Coded Match Badges**: Strong Match ($\ge 80\%$), Good Match ($60\% - 79\%$), Moderate Match ($40\% - 59\%$), and Low Match ($< 40\%$).
- **Candidate Dossier Breakdown**: Detailed view displaying matched skill chips vs. missing job requirements.
- **Candidate Pre-Apply Indicator**: Live ATS score estimation shown directly on job detail pages prior to application.
- **Recruiter Sorting**: Filter and sort applicant pools by *Highest ATS Match Score*.

### 📊 Dual-View Pipeline Management
- **Table View**: Comprehensive tabular candidate view with pagination, search, status filters, and one-click actions.
- **Smart View (Ashby-Style Kanban)**: Drag-and-drop visual pipeline columns (`Applied` &rarr; `Shortlisted` &rarr; `Interview Scheduled` &rarr; `Selected` / `Rejected`).
- **Pipeline Metrics Ribbon**: Live counters for each hiring stage with quick status filtering.

### 📜 Formal Digital Job Offer Letter Workflow
- **Recruiter Offer Generation**: Issue formal job offers upon selection, configuring position title, department, salary, joining date, manager, benefits, terms, and document attachments (`.pdf`, `.docx`).
- **Candidate Digital Review**: Dedicated letterhead review modal where candidates can review compensation, terms, download attachments, and digitally accept or decline with custom notes.
- **Automated Email Notifications**: Transactional emails dispatched on offer issuance and candidate decision.

### 🔒 Enforced State Machine & Security
- Strict server-side state transitions preventing illegal status modifications or mutating terminal records.
- Role-Based Access Control (RBAC) enforced via `@token_required` and `@roles_allowed` decorators.
- Password hashing with `bcrypt` and stateless JWT authorization.

---

## 3. Tech Stack

- **Backend Framework**: Python 3.12, Flask 3.0.3, Flask-CORS
- **Database & ORM**: PostgreSQL / SQLAlchemy ORM (automatic local SQLite fallback for dev/testing)
- **Authentication**: JWT (JSON Web Tokens) with role claims & bcrypt password hashing
- **Email Service**: SMTP with asynchronous dispatch and local dev console fallback
- **API Documentation**: Flasgger (OpenAPI / Swagger 2.0 specification)
- **Frontend**: Vanilla JavaScript (ES6+ Modules), HTML5, CSS3 with Material Design 3 design tokens
- **Test Suite**: Pytest with 36 comprehensive integration & unit tests

---

## 4. Architecture & Project Structure

```
ATS_Project/
├── backend/
│   ├── app/
│   │   ├── models/            # SQLAlchemy database models (User, Job, Application, OfferLetter, etc.)
│   │   ├── routes/            # REST API route blueprints (auth, jobs, applications, admin, candidates)
│   │   ├── services/          # Business logic (ATS Matcher, State Machine, Email, File Storage)
│   │   └── utils/             # JWT handlers, decorators, pagination, response helpers
│   ├── tests/                 # 36 automated pytest suites
│   ├── uploads/               # Local resume and offer letter document storage
│   ├── config.py              # Environment configuration classes
│   └── requirements.txt       # Backend Python dependencies
├── frontend/
│   ├── css/                   # Material Design 3 variables and global stylesheets
│   ├── js/
│   │   ├── api/               # API client modules for REST communication
│   │   ├── components/        # Reusable UI components (modals, navbar, toast, offer-modal)
│   │   └── utils/             # Date formatting and theme initialization
│   └── pages/
│       ├── admin/             # Administrator management interfaces
│       ├── candidate/         # Candidate profile & application tracker
│       └── recruiter/         # Job posting, pipeline management & applicant review
├── .env.example               # Environment variable templates
├── .gitignore                 # Excludes caches, databases, and uploaded PDFs
├── README.md                  # Project documentation
└── run.py                     # Application entry point
```

### Application Lifecycle State Machine
```
[applied] ───────────► [shortlisted] ───────────► [interview_scheduled] ───────────► [selected]
    │                        │                               │                            │
    ▼                        ▼                               ▼                            ▼
[rejected]               [rejected]                      [rejected]                  (Terminal)
```

---

## 5. Prerequisites

Before installing, ensure your environment meets the following requirements:
- **Python**: Version 3.10 or higher (Python 3.12 recommended)
- **Git**: Version 2.30 or higher
- **Database (Optional for Production)**: PostgreSQL 14+ (SQLite is used automatically if PostgreSQL is not configured)
- **Modern Web Browser**: Chrome, Edge, Firefox, or Safari

---

## 6. Environment Variables

Create a `.env` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env
```

| Variable | Description | Default / Example Value |
|---|---|---|
| `FLASK_ENV` | Application environment mode | `development` |
| `FLASK_DEBUG` | Enable debug mode and hot reloading | `True` |
| `SECRET_KEY` | Flask session cryptographic secret | `dev-secret-key-change-in-production` |
| `JWT_SECRET_KEY` | JWT signing secret key | `jwt-secret-key-change-in-production` |
| `JWT_ACCESS_TOKEN_EXPIRES_HOURS` | Access token lifespan | `24` |
| `DATABASE_URL` | SQLAlchemy connection string | `sqlite:///ats_dev.db` or `postgresql://user:pass@localhost:5432/ats_db` |
| `SMTP_HOST` | Outgoing SMTP mail server | `smtp.example.com` *(optional in dev)* |
| `SMTP_PORT` | SMTP port (typically 587 for TLS) | `587` |
| `SMTP_USER` | SMTP username | `no-reply@example.com` |
| `SMTP_PASSWORD` | SMTP password / app key | `your-smtp-password` |
| `FRONTEND_URL` | Base URL used for email links | `http://127.0.0.1:5000` |
| `MAX_CONTENT_LENGTH` | Max file upload size (bytes) | `10485760` (10MB) |

---

## 7. Installation & Quickstart

### Step 1: Clone the Repository
```bash
git clone https://github.com/harshithcheripally16-ui/ATS_Project.git
cd ATS_Project
```

### Step 2: Create and Activate a Virtual Environment
```bash
# On Windows (PowerShell):
python -m venv venv
.\venv\Scripts\Activate.ps1

# On Linux / macOS:
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Dependencies
```bash
pip install -r backend/requirements.txt
```

### Step 4: Run the Application
```bash
python run.py
```

Open your browser and navigate to:
- **Application**: [http://127.0.0.1:5000/](http://127.0.0.1:5000/)
- **Swagger Documentation**: [http://127.0.0.1:5000/api/docs](http://127.0.0.1:5000/api/docs)

---

## 8. API Documentation

The backend includes live, interactive OpenAPI / Swagger 2.0 specifications accessible at:
```
http://127.0.0.1:5000/api/docs
```

### Primary REST Endpoints Summary

- **Authentication (`/api/v1/auth`)**:
  - `POST /register`: Register a new candidate or recruiter account.
  - `POST /login`: Authenticate and receive JWT access token.
  - `POST /verify-otp`: Complete account email verification.
  - `POST /forgot-password` & `POST /reset-password`: Account recovery.
- **Job Management (`/api/v1/jobs`)**:
  - `GET /jobs`: Browse open job listings with category, location, and keyword filtering.
  - `POST /jobs`: Create a new job requisition (recruiter/admin).
  - `PATCH /jobs/<id>`: Update job details, requirements, or status.
- **Applications & Pipeline (`/api/v1/applications`)**:
  - `POST /applications`: Submit job application with optional resume upload.
  - `GET /applications`: Retrieve all applicant submissions across jobs (supports `sort=match`).
  - `PATCH /applications/<id>/status`: Advance candidate in pipeline (state machine enforced).
  - `POST /applications/<id>/offer`: Generate and issue official job offer letter.
  - `PATCH /applications/<id>/offer/respond`: Accept or decline offer (candidate only).
- **Interviews (`/api/v1/interviews`)**:
  - `POST /applications/<id>/interviews`: Schedule an interview session.
- **Candidate Profiles (`/api/v1/candidates`)**:
  - `GET /candidates/profile` & `PUT /candidates/profile`: Manage candidate skills, education, and resume.

---

## 9. Running Tests

The automated test suite utilizes Pytest and covers all authentication flows, role-based authorization, state machine rules, email notifications, offer letters, and ATS matching calculations.

Run the entire test suite:
```bash
python -m pytest backend/tests -v
```

### Test Suite Execution Output:
```text
============================= test session starts =============================
collected 36 items

backend/tests/test_admin.py (4 tests) .................................. PASSED
backend/tests/test_ats_matcher.py (5 tests) ............................ PASSED
backend/tests/test_auth.py (7 tests) ................................... PASSED
backend/tests/test_candidate_and_application.py (5 tests) .............. PASSED
backend/tests/test_interviews.py (1 test) .............................. PASSED
backend/tests/test_jobs.py (4 tests) ................................... PASSED
backend/tests/test_notifications.py (4 tests) .......................... PASSED
backend/tests/test_offer_letter.py (2 tests) ........................... PASSED
backend/tests/test_seed_accounts.py (1 test) ........................... PASSED
backend/tests/test_state_machine.py (3 tests) .......................... PASSED

============================= 36 passed in 28.41s =============================
```

---

## 10. Contributing

Contributions are welcome! To contribute:

1. Fork the repository.
2. Create your feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes with clear, descriptive messages:
   ```bash
   git commit -m "feat: describe your addition"
   ```
4. Ensure all automated tests pass:
   ```bash
   python -m pytest backend/tests -v
   ```
5. Push to your branch and open a Pull Request.

---

## 11. License

This project is licensed under the **MIT License**. You are free to use, modify, and distribute this software in personal and commercial projects.

