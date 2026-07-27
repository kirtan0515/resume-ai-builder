# Architecture Overview

## System Design

ResumeAI Hub is designed as a decoupled client-server application with clear separation of concerns between the presentation layer, business logic, and data persistence.

### High-Level Architecture

```
                    ┌─────────────────┐
                    │   DNS (Route53)  │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              ▼              ▼
     ┌────────────┐  ┌────────────┐  ┌──────────┐
     │   Vercel   │  │  EC2 (API) │  │ Supabase │
     │  (Next.js) │  │  (FastAPI) │  │  (DB +   │
     │            │  │            │  │   Auth)  │
     └────────────┘  └────────────┘  └──────────┘
```

### Request Flow

```
User → Vercel CDN → Next.js SSR/CSR
                         │
                         │ fetch() w/ JWT
                         ▼
              Nginx (SSL termination)
                         │
                         ▼
              Docker Container (uvicorn)
                         │
                    ┌─────┼─────┐
                    │     │     │
                    ▼     ▼     ▼
               Supabase  OpenAI  Stripe
```

## Component Details

### Frontend (Next.js 14)

- **Framework:** Next.js 14 with App Router
- **Rendering:** Client-side rendering for all authenticated pages (real-time state)
- **Styling:** Custom CSS with CSS variables for theming (dark mode)
- **Auth:** Supabase Auth UI with Google OAuth provider
- **State:** React hooks (`useState`, `useEffect`) — no external state library needed

### Backend (FastAPI)

- **Framework:** FastAPI with async support
- **Server:** Uvicorn (ASGI)
- **Auth:** Custom middleware extracting Supabase JWT from Authorization header
- **Rate Limiting:** slowapi (per-IP, per-endpoint)
- **Services:** Modular service layer — each feature is an isolated module

### Database (Supabase)

- **Engine:** PostgreSQL 15
- **Auth:** Built-in Supabase Auth (handles JWT issuance, refresh, OAuth)
- **Access:** Service role key for backend (bypasses RLS for admin operations)
- **Tables:** `users`, `applications`, `resume_profiles`, `usage_logs`

### Infrastructure

- **Compute:** AWS EC2 t2.micro (Amazon Linux 2)
- **Container:** Docker single-container deployment
- **Reverse Proxy:** Nginx with Let's Encrypt SSL
- **CI/CD:** GitHub Actions for linting, Vercel for frontend deploys
- **Monitoring:** CloudWatch (optional)

## Security Model

```
┌─────────────────────────────────────────────────────┐
│                   Security Layers                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. HTTPS (Let's Encrypt / Vercel)                  │
│  2. CORS (restricted origins)                       │
│  3. JWT verification (Supabase RS256)               │
│  4. Role-based access control (free/paid/admin)     │
│  5. Rate limiting (per-IP, per-endpoint)            │
│  6. Optional TOTP 2FA                               │
│  7. Stripe webhook signature verification           │
│  8. Usage tracking + abuse detection                │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Billing Architecture

```
User clicks "Upgrade"
        │
        ▼
POST /create-checkout-session
        │
        ▼
Stripe Checkout (hosted page)
        │
        ▼
Stripe webhook → POST /stripe/webhook
        │
        ├─ checkout.session.completed → role = "paid"
        ├─ subscription.updated → sync status
        └─ subscription.deleted → role = "free"
```

## AI Pipeline

The core analysis flow uses structured prompting with JSON mode:

```
Input: resume_text + job_description
                │
                ▼
   ┌─────────────────────────┐
   │  Domain Detection       │
   │  (infer industry/level) │
   └────────────┬────────────┘
                │
                ▼
   ┌─────────────────────────┐
   │  GPT-4o Analysis        │
   │  (system + user prompt) │
   │  response_format: JSON  │
   └────────────┬────────────┘
                │
                ▼
   ┌─────────────────────────┐
   │  Structured Output      │
   │  • 6 dimension scores   │
   │  • Qualification gaps   │
   │  • Missing keywords     │
   │  • Actionable fixes     │
   │  • Improved bullets     │
   │  • Screening verdict    │
   └─────────────────────────┘
```

## Scaling Considerations

Current architecture handles the early-stage traffic well. Future scaling paths:

- **Backend:** Move to ECS/Fargate for auto-scaling containers
- **Database:** Supabase handles connection pooling; can add read replicas
- **Caching:** Redis for repeated analyses on same resume/JD pairs
- **Queue:** SQS/Celery for async processing of PDF generation
- **CDN:** Already handled by Vercel for static assets
