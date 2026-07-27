# ResumeAI Hub

A full-stack career intelligence platform that analyzes resumes against job descriptions, scores ATS compatibility, generates cover letters, and provides AI-powered interview preparation. Built with a React/Next.js frontend, Python/FastAPI backend, and deployed across Vercel + AWS EC2.

**Live:** [resumeaihub.com](https://www.resumeaihub.com)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Client (Browser)                            │
└────────────────────────────────┬────────────────────────────────────┘
                                 │ HTTPS
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js 14 / React)                    │
│                         Hosted on Vercel                             │
│                                                                     │
│  ┌──────────┐ ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌─────────┐ │
│  │Dashboard │ │ATS Check │ │ Interview │ │  Builder │ │ Tracker │ │
│  └──────────┘ └──────────┘ └───────────┘ └──────────┘ └─────────┘ │
└────────────────────────────────┬────────────────────────────────────┘
                                 │ REST API (JWT Auth)
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   Backend (FastAPI / Python 3.11)                    │
│                  AWS EC2 + Docker + Nginx + SSL                      │
│                                                                     │
│  ┌────────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │  Auth Module   │  │ Rate Limiter │  │   Service Layer        │  │
│  │  (Supabase JWT)│  │  (slowapi)   │  │                        │  │
│  └────────────────┘  └──────────────┘  │  • Resume Analyzer     │  │
│                                         │  • ATS Simulator       │  │
│  ┌────────────────┐  ┌──────────────┐  │  • Cover Letter Gen    │  │
│  │ Stripe Billing │  │  2FA (TOTP)  │  │  • Interview Prep      │  │
│  │ (Subscriptions)│  │              │  │  • Salary Intel        │  │
│  └────────────────┘  └──────────────┘  │  • Ghost Job Detector  │  │
│                                         │  • LinkedIn Analyzer   │  │
│                                         │  • Job Matcher         │  │
│                                         │  • Resume Builder/PDF  │  │
│                                         └────────────────────────┘  │
└───────────┬──────────────────┬──────────────────┬───────────────────┘
            │                  │                  │
            ▼                  ▼                  ▼
┌───────────────────┐ ┌──────────────┐ ┌──────────────────┐
│   Supabase        │ │  OpenAI API  │ │  External APIs   │
│   (PostgreSQL +   │ │  (GPT-4o)    │ │                  │
│    Auth + RLS)    │ │              │ │  • Apify (jobs)  │
│                   │ │              │ │  • Stripe        │
│  • users          │ │              │ │  • QuantumTrust  │
│  • applications   │ │              │ │    (MFA/TOTP)    │
│  • resume_profiles│ │              │ │                  │
│  • usage_logs     │ │              │ │                  │
└───────────────────┘ └──────────────┘ └──────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React, CSS (custom dark theme) |
| Backend | Python 3.11, FastAPI, Uvicorn |
| Database | Supabase (PostgreSQL + Row Level Security) |
| Auth | Supabase Auth (Google OAuth + email/password) + TOTP 2FA |
| AI/ML | OpenAI GPT-4o, GPT-4o-mini |
| Payments | Stripe (subscriptions, webhooks, customer portal) |
| Infrastructure | AWS EC2, Docker, Nginx, Let's Encrypt SSL |
| Frontend Hosting | Vercel (auto-deploy from main) |
| CI/CD | GitHub Actions |
| Job Data | Apify web scraping actors |

## Features

### Free Tier
- **Resume Analysis** — Score your resume against any job description (3 analyses)
- **ATS Simulator** — See how applicant tracking systems parse your resume
- **Ghost Job Detector** — Identify potentially fake or stale job postings
- **Application Tracker** — Track applications with auto-scored match percentages
- **Resume Profile** — Store and manage your resume data

### Pro Tier ($15/mo)
- **Unlimited Resume Analysis** — No daily caps
- **AI Cover Letter Generator** — Tailored cover letters with tone selection
- **Interview Prep** — Role-specific questions with answer scoring
- **Salary Intelligence** — Market-rate estimates and negotiation scripts
- **LinkedIn vs Resume Audit** — Consistency and optimization checks
- **Job Matching Engine** — Resume-ranked job recommendations
- **PDF/LaTeX Resume Export** — Professional resume generation from profile
- **Outcome Insights** — AI analysis of application patterns and callback rates

## Project Structure

```
resume-ai-builder/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI routes (25+ endpoints)
│   │   ├── auth.py              # JWT verification, RBAC, usage limits
│   │   ├── schemas.py           # Pydantic request models
│   │   ├── services/
│   │   │   ├── ai_service.py    # Core GPT-4o resume analysis
│   │   │   ├── ats_simulator.py # ATS parsing simulation
│   │   │   ├── cover_letter_service.py
│   │   │   ├── interview_service.py
│   │   │   ├── job_service.py   # Apify job scraping + scoring
│   │   │   ├── salary_service.py
│   │   │   ├── ghost_job_service.py
│   │   │   ├── linkedin_service.py
│   │   │   ├── resume_builder_service.py
│   │   │   ├── latex_generator.py
│   │   │   └── stripe_service.py
│   │   └── utils/
│   │       └── prompts.py       # Prompt engineering templates
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── app/                     # Next.js App Router pages
│   │   ├── dashboard/           # Main authenticated view
│   │   ├── builder/             # Resume builder UI
│   │   ├── interview/           # Interview prep interface
│   │   ├── cover-letter/        # Cover letter generator
│   │   ├── ats-check/           # ATS simulation results
│   │   ├── ghost-check/         # Ghost job analyzer
│   │   ├── pricing/             # Stripe checkout integration
│   │   └── ...
│   ├── components/
│   │   ├── ResumeForm.js        # Core analysis form
│   │   ├── ResultCard.js        # Analysis results display
│   │   ├── ResumeBuilder.js     # Profile-based builder
│   │   ├── TwoFactorModal.js    # TOTP 2FA verification
│   │   ├── AuthModal.js         # Supabase Auth UI
│   │   ├── BillingPanel.js      # Subscription management
│   │   └── Navbar.js
│   └── lib/
│       └── supabase.js          # Supabase client init
├── docker-compose.yml           # Local development environment
├── deploy.sh                    # EC2 deployment script
└── .github/workflows/ci.yml     # CI pipeline
```

## Data Flow

```
┌──────────┐     ┌──────────┐     ┌──────────────┐     ┌───────────┐
│  Upload  │────▶│  Extract │────▶│  Analyze w/  │────▶│  Return   │
│  Resume  │     │  Text    │     │  GPT-4o      │     │  Scores + │
│  (PDF)   │     │  (pypdf) │     │  + Job Desc  │     │  Feedback │
└──────────┘     └──────────┘     └──────────────┘     └───────────┘
                                         │
                                         ▼
                                  ┌──────────────┐
                                  │  Structured  │
                                  │  JSON Output │
                                  │              │
                                  │ • Scores     │
                                  │ • Keywords   │
                                  │ • Fixes      │
                                  │ • Bullets    │
                                  │ • Verdict    │
                                  └──────────────┘
```

## Authentication & Security

- JWT-based auth via Supabase (RS256 token verification)
- Role-based access control: `free`, `paid`, `admin`, `blocked`
- Optional TOTP-based 2FA via external MFA provider
- Rate limiting per endpoint (slowapi)
- CORS restricted to known origins
- IP logging for abuse detection
- Stripe webhook signature verification

## Local Development

```bash
# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001

# Frontend
cd frontend
npm install
npm run dev
```

Requires:
- Python 3.11+
- Node.js 18+
- Supabase project (for auth + database)
- OpenAI API key

## Deployment

**Frontend:** Auto-deploys to Vercel on push to `main`.

**Backend:** Deployed via `deploy.sh` which:
1. Bundles the backend app
2. SCPs to EC2
3. Builds a Docker image
4. Runs the container with env vars on port 8001

Nginx handles SSL termination and proxies to the Docker container.

## Database Schema

```sql
-- Core tables (Supabase/PostgreSQL)
users (id, email, role, lifetime_analyses, daily_analyses, stripe_customer_id, ...)
applications (id, user_id, title, company, status, match_score, ...)
resume_profiles (id, user_id, name, skills[], experience[], education[], ...)
usage_logs (id, user_id, email, ip, user_agent, created_at)
```

## API Endpoints (25+)

| Method | Path | Description | Access |
|--------|------|-------------|--------|
| POST | `/analyze` | Resume vs job description scoring | Auth |
| POST | `/analyze-resume-only` | General resume quality check | Auth |
| POST | `/upload-resume` | PDF text extraction | Public |
| POST | `/ats-simulate` | ATS parsing simulation | Auth |
| POST | `/ghost-job-check` | Ghost job detection | Auth |
| POST | `/generate-cover-letter` | AI cover letter | Pro |
| POST | `/interview-prep` | Interview questions | Pro |
| POST | `/score-answer` | Answer evaluation | Pro |
| POST | `/salary-analysis` | Market rate + negotiation | Pro |
| POST | `/linkedin-analyze` | LinkedIn vs resume audit | Pro |
| POST | `/find-jobs` | Job matching + scoring | Pro |
| POST | `/generate-resume-pdf` | PDF export from profile | Pro |
| POST | `/generate-resume-latex` | LaTeX export | Pro |
| GET | `/me` | Current user info | Auth |
| GET/POST | `/applications` | Application tracker CRUD | Auth |
| GET | `/applications/stats` | Application analytics | Auth |
| GET | `/applications/insights` | AI outcome insights | Auth |
| POST | `/auth/verify-2fa` | TOTP verification | Auth |
| POST | `/create-checkout-session` | Stripe checkout | Auth |
| POST | `/stripe/webhook` | Payment events | Stripe |

---

Built by [Kirtan Patel](https://github.com/kirtan0515)
