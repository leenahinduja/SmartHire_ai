# SmartHireAI — Angular Frontend

AI-powered recruitment platform frontend built with Angular 17.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Backend
Make sure your Spring Boot backend is running on `http://localhost:8080`

### 3. Run Development Server
```bash
npm start
# OR
ng serve --proxy-config proxy.conf.json
```

Open `http://localhost:4200`

---

## 📁 Project Structure

```
src/app/
├── auth/
│   ├── landing/          # Marketing landing page
│   ├── login/            # Login page
│   ├── register/         # Registration with role picker
│   └── forgot-password/  # Password reset
│
├── dashboard/
│   ├── applicant-dashboard/   # Applicant home
│   └── recruiter-dashboard/   # Recruiter home with job cards
│
├── jobs/
│   ├── job-list/         # Browse & search all jobs
│   ├── job-detail/       # Job detail + one-click apply
│   └── job-create/       # Recruiter: post new job
│
├── applicant/
│   ├── applicant-profile/  # Profile form + resume upload
│   └── my-applications/    # Application tracker with timeline
│
├── recruiter/
│   ├── recruiter-applicants/  # Pipeline view + ATS + Round 1 decisions
│   └── mcq-manage/            # Create & release MCQ tests
│
├── mcq/
│   └── mcq-test/         # Full MCQ test-taking interface with timer
│
└── shared/
    ├── services/
    │   ├── auth.service.ts   # Login, register, JWT/Basic auth
    │   └── api.service.ts    # All backend API calls
    ├── interceptors/
    │   └── auth.interceptor.ts  # Attaches Basic Auth header
    ├── guards/
    │   └── auth.guard.ts    # Route protection
    ├── navbar/
    └── sidebar/
```

---

## 🔑 Authentication

This app uses **HTTP Basic Auth** (matching your Spring Security setup).
Credentials are stored as base64 in localStorage and sent via `Authorization` header.

---

## 🔗 API Endpoints Used

| Method | Endpoint | Component |
|--------|----------|-----------|
| POST | /auth/register | Register |
| GET | /auth/users | Login (matches email) |
| POST | /auth/forget-password | ForgotPassword |
| GET | /job/all | JobList, Dashboards |
| GET | /job/:id | JobDetail |
| POST | /job/savejobdetails | JobCreate |
| GET | /job/search | JobList |
| POST | /applications/apply/:jobId | JobDetail |
| GET | /applications/my | MyApplications |
| GET | /applications/job/:jobId | RecruiterApplicants |
| GET | /applicant/profile | ApplicantProfile |
| POST | /applicant/profile | ApplicantProfile |
| PUT | /applicant/profile | ApplicantProfile |
| POST | /applicant/upload-resume | ApplicantProfile |
| POST | /ats/calculate | RecruiterApplicants |
| POST | /round1/select | RecruiterApplicants |
| POST | /round1/reject | RecruiterApplicants |
| POST | /round2/mcq/create | McqManage |
| POST | /round2/mcq/release/:jobId | McqManage |
| GET | /round2/mcq/start/:jobId | McqTest |

---

## 🎨 Design System

Dark industrial theme with electric teal accent:
- **Primary**: `#00e5c3` (teal)
- **Warning**: `#ffb347` (amber)  
- **Error**: `#ff4d6d` (red)
- **Background**: `#0a0c0f`
- **Font Display**: Syne (headings)
- **Font Body**: DM Sans

All design tokens are in `src/styles.css` as CSS custom properties.
