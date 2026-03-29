# IGTP — I Got The Power

> Peer-to-peer GPU compute sharing for people who trust each other. No cloud markup, no middlemen — just you and your network.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the App](#running-the-app)
- [Running the Daemon](#running-the-daemon)
- [Project Structure](#project-structure)
- [API Reference](#api-reference)
- [Available Scripts](#available-scripts)
- [Deployment](#deployment)
- [Development Conventions](#development-conventions)
- [Contributing](#contributing)

---

## Overview

IGTP lets you share GPU compute resources directly with people in your trust network. If you have a powerful machine sitting idle, register it and let your trusted friends borrow it. If you need GPU time, browse what's available from people you trust and request access — no cloud provider accounts or credit card markups required.

The platform is built around a **trust graph**: you explicitly decide who can see and request your machines, and access only propagates through relationships you've intentionally created. New members join via invite links, and upon joining they automatically inherit visibility into their inviter's resource pool.

---

## Features

| Feature | Description |
|---------|-------------|
| **Machine Registry** | Register GPU machines with full hardware specs (GPU model, VRAM, CPU, RAM) |
| **Browse & Request** | Browse available machines from your trust network and submit time requests |
| **Trust Network** | Explicitly trust users to grant them visibility and access to your machines |
| **Invite System** | Invite new users via email; invitees join your trust circle automatically |
| **GPU Jobs** | Submit, monitor, and cancel GPU workloads tied to access requests |
| **Real-time Notifications** | Server-Sent Events (SSE) push live status updates for requests and jobs |
| **Usage Reports** | Track machine usage across the network |
| **Machine Heartbeats** | Machines report live availability via a daemon heartbeat API |
| **Access Request Workflow** | Owners approve/deny requests with optional notes; status flows through the UI |

---

## Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | [Next.js](https://nextjs.org) | 16.x | Full-stack React framework (App Router) |
| UI | [React](https://react.dev) | 19.x | Component model |
| Language | [TypeScript](https://www.typescriptlang.org) | 5.x | End-to-end type safety |
| Styling | [Tailwind CSS](https://tailwindcss.com) | 4.x | Utility-first CSS |
| Components | [shadcn/ui](https://ui.shadcn.com) + [Base UI](https://base-ui.com) | latest | Accessible UI primitives |
| Icons | [Lucide React](https://lucide.dev) | latest | SVG icon library |
| Database | [Neon Serverless Postgres](https://neon.tech) | latest | Relational database |
| File Storage | [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) | latest | Job artifact storage |
| Email | [Resend](https://resend.com) | latest | Transactional email (invites) |
| Observability | [Sentry](https://sentry.io) | 10.x | Error tracking & performance |
| Analytics | [Vercel Analytics](https://vercel.com/analytics) + Speed Insights | latest | Real-user metrics |
| Linting | [ESLint](https://eslint.org) | 9.x | Code quality |
| Daemon | Node.js / [tsx](https://github.com/privatenumber/tsx) | — | Machine-side GPU workload runner |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Next.js 16 App                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  App Router  │  │ Route Handlers│  │  Server Actions  │  │
│  │  (pages/UI)  │  │   (REST API)  │  │  (mutations)     │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│         └─────────────────┼──────────────────-┘            │
│                           │                                 │
│              ┌────────────▼──────────────┐                  │
│              │       lib/ (shared)       │                  │
│              │  auth.ts · db.ts · types  │                  │
│              └────────────┬──────────────┘                  │
└───────────────────────────┼─────────────────────────────────┘
                            │
              ┌─────────────▼──────────────┐
              │      Neon Postgres          │
              │  users, machines, requests  │
              │  jobs, trust, invites, etc. │
              └────────────────────────────┘

┌───────────────────────────────────────────────────┐
│              igtp-daemon (per machine)            │
│  Polls /api/machines/:id/requests                 │
│  Executes GPU workloads                           │
│  Posts heartbeats → /api/machines/:id/heartbeat  │
│  Uploads artifacts → Vercel Blob                 │
└───────────────────────────────────────────────────┘
```

The web app and daemon communicate entirely through the REST API. The daemon runs locally on each registered machine and handles job execution independently of the web server.

---

## Prerequisites

- **Node.js** 20+ (recommended: latest LTS — Node 24 for production)
- **npm** 10+
- **Neon Postgres** database (free tier works for development)
- **Vercel account** (for Blob storage and deployment — optional for local dev)
- **Resend account** (for email invites — optional for local dev)
- **Sentry project** (optional — errors are silently dropped if not configured)

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/rrico321/IGTP.git
cd IGTP
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example below into a `.env.local` file at the project root and fill in your values:

```bash
cp .env.example .env.local   # if .env.example exists, otherwise create manually
```

See the [Environment Variables](#environment-variables) section for the full list.

### 4. Initialize the database

Start the dev server first (step 5), then hit the migration endpoint once:

```bash
curl -X POST http://localhost:3000/api/migrate
```

This runs `lib/schema.sql` against your Neon database and creates all required tables.

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll see the landing page.

### 6. Create your first account

The login page (`/login`) handles both sign-up and sign-in. Enter any email + password on first use to create an account.

---

## Environment Variables

Create a `.env.local` file in the project root. **Never commit this file.**

```env
# ── Database ────────────────────────────────────────────────
# Neon Serverless Postgres connection string
# Get it from: https://console.neon.tech → your project → Connection Details
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# ── Authentication ───────────────────────────────────────────
# Arbitrary secret used to sign session tokens — generate with:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
AUTH_SECRET="your-random-secret-here"

# ── File Storage (Vercel Blob) ───────────────────────────────
# Auto-provisioned if you run `vercel env pull` after linking a Vercel project.
# Or create a Blob store in the Vercel dashboard and copy the token.
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."

# ── Email (Resend) ───────────────────────────────────────────
# Get your API key at: https://resend.com/api-keys
RESEND_API_KEY="re_..."
# The "From" address for invite emails (must be a verified domain in Resend)
EMAIL_FROM="noreply@yourdomain.com"

# ── App URL ──────────────────────────────────────────────────
# Used to build absolute URLs in emails and invite links
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# ── Sentry (optional) ────────────────────────────────────────
# Get from: https://sentry.io → Project Settings → Client Keys (DSN)
NEXT_PUBLIC_SENTRY_DSN="https://...@sentry.io/..."
SENTRY_AUTH_TOKEN="sntryu_..."
SENTRY_ORG="your-org"
SENTRY_PROJECT="igtp"
```

> **Tip:** If you're deploying to Vercel, run `vercel env pull` to automatically download all production/preview/development variables into `.env.local`.

---

## Database Setup

IGTP uses Neon's serverless Postgres driver (`@neondatabase/serverless`). The schema lives in `lib/schema.sql`.

### Local / first-time setup

1. Create a free Neon project at [neon.tech](https://neon.tech).
2. Copy the connection string into `DATABASE_URL` in `.env.local`.
3. Start the dev server and run:
   ```bash
   curl -X POST http://localhost:3000/api/migrate
   ```

### Schema overview

| Table | Description |
|-------|-------------|
| `users` | Registered users (id, name, email) |
| `machines` | GPU machines (specs, status, owner) |
| `access_requests` | Requests from users to borrow a machine |
| `trust_connections` | Directed trust edges between users |
| `invites` | Invite tokens tied to a sending user |
| `jobs` | GPU workload jobs linked to access requests |
| `notifications` | In-app notification records |

---

## Running the App

```bash
# Development (hot reload via Turbopack)
npm run dev

# Production build
npm run build

# Start production server (requires a build)
npm run start

# Lint
npm run lint
```

The dev server runs on [http://localhost:3000](http://localhost:3000) by default.

---

## Running the Daemon

The `igtp-daemon` is a lightweight Node.js process that runs **on the machine you want to share**. It polls the IGTP API for pending jobs, executes them, and reports heartbeats so the platform knows the machine is online.

### Setup

```bash
cd igtp-daemon
npm install
```

Create a `.env` file inside `igtp-daemon/`:

```env
# The API base URL for your IGTP deployment
IGTP_API_URL="https://your-igtp-app.vercel.app"

# Machine ID — obtained from the web app after registering your machine
# (Settings → Your Machines → copy the ID shown)
MACHINE_ID="your-machine-id-here"

# Vercel Blob token — same as the web app, used to upload job artifacts
BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
```

### Start

```bash
# Development (TypeScript, no compile step)
npm run dev

# Production (compile first, then run)
npm run build
npm start
```

The daemon will:
1. Send a heartbeat every 30 seconds to mark the machine as online.
2. Poll for access requests approved by the machine owner.
3. Execute approved GPU workloads.
4. Upload job output artifacts to Vercel Blob and update job status.

---

## Project Structure

```
IGTP/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout (NavBar, fonts, global styles)
│   ├── page.tsx                  # Home — landing (guests) or dashboard (auth)
│   ├── globals.css               # Global CSS + Tailwind base
│   ├── error.tsx                 # Root error boundary
│   ├── not-found.tsx             # 404 page
│   ├── loading.tsx               # Root loading state
│   │
│   ├── api/                      # REST API route handlers
│   │   ├── machines/             # CRUD + heartbeat + requests
│   │   ├── jobs/                 # Job dispatch, status, snapshots
│   │   ├── requests/             # Access request management
│   │   ├── invites/              # Invite creation & token acceptance
│   │   ├── trust/                # Trust connection management
│   │   ├── notifications/        # Notification read/dismiss
│   │   ├── sse/                  # Server-Sent Events stream
│   │   ├── usage/report/         # Usage reporting
│   │   └── migrate/              # One-shot schema migration (dev)
│   │
│   ├── browse/                   # Browse machines from trust network
│   │   └── [id]/                 # Individual machine detail + request form
│   ├── machines/                 # Your registered machines
│   │   ├── new/                  # Register a new machine
│   │   └── [id]/                 # Machine detail + incoming requests
│   ├── jobs/                     # GPU job list and detail
│   │   ├── new/                  # Submit a new job
│   │   └── [id]/                 # Job detail + cancel
│   ├── requests/                 # Incoming access requests (owner view)
│   ├── notifications/            # Notification centre
│   ├── network/                  # Trust network visualisation
│   ├── login/                    # Sign in / sign up
│   ├── invite/[token]/           # Accept an invite
│   ├── settings/
│   │   ├── invites/              # Send invite emails
│   │   └── trust/                # Manage trusted users
│   └── components/               # Shared UI components
│       ├── NavBar.tsx
│       ├── MobileNav.tsx
│       ├── NotificationBell.tsx
│       ├── StatusBadge.tsx
│       └── LogoutButton.tsx
│
├── components/                   # shadcn/ui generated components
├── lib/                          # Shared server-side utilities
│   ├── auth.ts                   # Session helpers (get/set/clear)
│   ├── db.ts                     # Database query functions
│   ├── email.ts                  # Resend email helpers
│   ├── types.ts                  # Shared TypeScript types
│   ├── utils.ts                  # General utilities (cn, etc.)
│   └── schema.sql                # Database schema
│
├── igtp-daemon/                  # Machine-side daemon
│   ├── index.ts                  # Main daemon loop
│   └── package.json
│
├── data/                         # Static / seed data
├── public/                       # Static assets
├── proxy.ts                      # Next.js 16 proxy (replaces middleware.ts)
├── instrumentation.ts            # Sentry server instrumentation
├── next.config.ts                # Next.js configuration
├── vercel.json                   # Vercel deployment config (crons, etc.)
├── tsconfig.json                 # TypeScript configuration
├── eslint.config.mjs             # ESLint configuration
└── postcss.config.mjs            # PostCSS (Tailwind) configuration
```

---

## API Reference

All API routes live under `/api/`. They accept and return JSON.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/machines` | List all machines |
| `POST` | `/api/machines` | Register a new machine |
| `GET` | `/api/machines/:id` | Get machine details |
| `PATCH` | `/api/machines/:id` | Update machine (owner only) |
| `DELETE` | `/api/machines/:id` | Remove machine (owner only) |
| `POST` | `/api/machines/:id/heartbeat` | Daemon heartbeat — marks machine online |
| `GET` | `/api/machines/:id/requests` | List access requests for a machine |
| `GET` | `/api/requests` | List your own access requests |
| `POST` | `/api/requests` | Submit an access request |
| `GET` | `/api/requests/:id` | Get request details |
| `PATCH` | `/api/requests/:id` | Approve / deny a request (owner only) |
| `GET` | `/api/jobs` | List jobs |
| `POST` | `/api/jobs/dispatch` | Dispatch a new GPU job |
| `GET` | `/api/jobs/:id` | Get job details |
| `PATCH` | `/api/jobs/:id` | Update job status |
| `GET` | `/api/jobs/:id/snapshot` | Get job output snapshot |
| `GET` | `/api/invites` | List your sent invites |
| `POST` | `/api/invites` | Create and send an invite |
| `GET` | `/api/invites/:token` | Validate an invite token |
| `POST` | `/api/invites/:token` | Accept an invite |
| `GET` | `/api/trust` | List your trusted users |
| `POST` | `/api/trust` | Add a trust connection |
| `DELETE` | `/api/trust/:id` | Remove a trust connection |
| `GET` | `/api/notifications` | List your notifications |
| `PATCH` | `/api/notifications/:id` | Mark a notification as read |
| `GET` | `/api/sse` | SSE stream for real-time events |
| `GET` | `/api/usage/report` | Usage report for your machines |
| `POST` | `/api/migrate` | Run schema migration (dev only) |

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server with Turbopack hot reload |
| `npm run build` | Compile and build for production |
| `npm run start` | Start the production server (requires a prior build) |
| `npm run lint` | Run ESLint across the project |

---

## Deployment

IGTP is designed for zero-config deployment on [Vercel](https://vercel.com).

### Steps

1. **Push to GitHub** — Vercel auto-deploys on every push to `main`.
2. **Connect your repo** in the Vercel dashboard (or run `vercel link`).
3. **Add environment variables** in the Vercel dashboard (Settings → Environment Variables), or use the CLI:
   ```bash
   vercel env add DATABASE_URL
   vercel env add AUTH_SECRET
   vercel env add BLOB_READ_WRITE_TOKEN
   vercel env add RESEND_API_KEY
   vercel env add EMAIL_FROM
   vercel env add NEXT_PUBLIC_APP_URL
   ```
4. **Run the migration** once after first deploy:
   ```bash
   curl -X POST https://your-app.vercel.app/api/migrate
   ```
5. **Deploy the daemon** on each GPU machine you want to share (see [Running the Daemon](#running-the-daemon)).

The `vercel.json` file configures any cron jobs (e.g., nightly cleanup via `/api/cron/cleanup`).

---

## Development Conventions

### Next.js 16

- **Server Components by default** — only add `'use client'` when you need browser APIs or interactivity.
- **Async request APIs** — `await cookies()`, `await headers()`, `await params`, `await searchParams` (all async in Next.js 16).
- **`proxy.ts` not `middleware.ts`** — place at project root alongside `app/`. Runs on Node.js (full runtime, not edge).
- **Server Actions for mutations** — forms and data mutations use `'use server'` actions, not fetch calls.
- **Path alias** — use `@/` for all imports from the project root (e.g., `@/lib/auth`, `@/components/Button`).

### Database

- All database logic lives in `lib/db.ts`. Do not write raw SQL in route handlers or components.
- Use `@neondatabase/serverless` — **not** the deprecated `@vercel/postgres`.

### Styling

- Use Tailwind utility classes directly; avoid inline styles.
- Use `cn()` from `lib/utils.ts` (wraps `clsx` + `tailwind-merge`) for conditional class names.
- Dark mode is the default for this project.

### Secrets

- Never commit `.env.local` or any file containing secrets.
- `.env.local` is already in `.gitignore` — keep it that way.

---

## Contributing

1. Fork the repository and create a feature branch:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Make your changes, following the [Development Conventions](#development-conventions).
3. Run lint before committing:
   ```bash
   npm run lint
   ```
4. Push your branch and open a Pull Request against `main`.

For bugs or feature requests, open an issue on GitHub.
