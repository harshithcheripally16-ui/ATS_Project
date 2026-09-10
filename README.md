# Recruitment & Applicant Tracking System (ATS) v1.1

A recruitment platform connecting recruiters, candidates, and administrators built with Flask (Python), PostgreSQL / SQLAlchemy ORM, JWT Authentication, and a vanilla JavaScript frontend styled with Material Design principles.

---

## 🛠 Tech Stack

- **Backend**: Python 3.12, Flask 3.0.3, Flask-SQLAlchemy, Flask-CORS
- **Frontend**: Vanilla HTML5, CSS3 (Material Design 3 design system), JavaScript (Fetch API, modular components)
- **Database**: PostgreSQL (with automatic local SQLite fallback for dev/testing)
- **Authentication**: JWT (JSON Web Tokens) with role claims and bcrypt password hashing
- **Email & Notifications**: SMTP with asynchronous dispatch and fallback dev console logger
- **API Documentation**: Interactive Swagger / OpenAPI UI via Flasgger at `/api/docs`
- **Testing**: Pytest automated test suite

---

## 🚀 Getting Started

### 1. Prerequisites
- Python 3.10+
- (Optional) PostgreSQL 14+

### 2. Install Dependencies
```bash
pip install -r backend/requirements.txt
```

### 3. Configure Environment
Copy `.env.example` to `.env` (optional, default fallback values are provided):
```bash
cp .env.example .env
```

### 4. Run the Application
```bash
python run.py
```
The server will start at:
- **Application Portal**: `http://127.0.0.1:5000/`
- **Interactive Swagger Docs**: `http://127.0.0.1:5000/api/docs`

---

## 🔑 Default Credentials

On initial startup, a default administrator is seeded:
- **Admin**: `admin@ats.com` / `AdminPass123!`

Candidates and Recruiters can register immediately from `/pages/register.html`.

---

## 🧪 Automated Tests

Run the full automated pytest suite:
```bash
python -m pytest backend/tests -v
```

---

## 🏛 Architecture & State Machine

### Role Permissions
- **Candidate**: Create profile, upload PDF/Word resume, search and filter jobs, apply to jobs, track applications and interview schedules.
- **Recruiter**: Post, edit, and delete own jobs, review applicants, inspect resumes, transition candidate application status, schedule interviews.
- **Admin**: View system analytics, manage all user accounts (activate/deactivate), manage job categories.

### Application Lifecycle State Machine (Section 6)
```
[applied] ───────────► [shortlisted] ───────────► [interview_scheduled] ───────────► [selected]
    │                        │                               │                            │
    ▼                        ▼                               ▼                            ▼
[rejected]               [rejected]                      [rejected]                  (Terminal)
```
Invalid transitions or mutating terminal states are strictly rejected with HTTP 400 by the server-side state machine.

---

## ⭐ Key Highlights & Features

1. **Automated ATS Compatibility & Match Scoring**:
   - Multi-factor algorithm evaluating skill keywords (60%), experience duration (25%), and role alignment (15%).
   - Color-coded match badges (`Strong Match >= 80%`, `Good Match >= 60%`, `Moderate Match >= 40%`).
   - Detailed candidate dossier breakdown showing matched skills vs. missing job requirements.
   - Ability for recruiters to sort applicant pools by highest ATS match score.
   - Real-time compatibility preview for candidates prior to applying.

2. **Ashby-Style Dual Pipeline View**:
   - Seamless toggle between **Table View** (detailed tabular overview) and **Smart View** (interactive Drag-and-Drop Kanban Board).
   - Real-time stage metric ribbon with quick status filtering.

3. **Formal Digital Job Offer Letter Workflow**:
   - Recruiters can generate, customize, and issue formal offer letters upon candidate selection, including salary, start date, benefits, terms, and document attachments.
   - Candidates can review offer letters in a dedicated digital experience and formally accept or decline with response notes.
   - Automated email notifications dispatched to both parties on issuance and response.

4. **Robust Automated Test Suite**:
   - 36 comprehensive unit and integration tests covering authentication, RBAC, state machine transitions, job management, interview scheduling, offer letters, and ATS matching algorithms.

