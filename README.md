# 🎫 TokTickIT — IT Service Desk Platform

![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)
![Lab](https://img.shields.io/badge/coursework-Lab%2004-006039.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?logo=node.js)
![React](https://img.shields.io/badge/React-18.x-61dafb?logo=react)
![Vite](https://img.shields.io/badge/Vite-5.x-646cff?logo=vite)
![Express](https://img.shields.io/badge/Express-4.x-lightgrey?logo=express)
![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-336791?logo=postgresql)
![JWT](https://img.shields.io/badge/JWT-Authentication-black?logo=jsonwebtokens)
![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33?logo=playwright)
![Design System](https://img.shields.io/badge/Design%20System-Zen%20Green%20%23006B3C-006B3C)

**TokTickIT** is an IT Service Desk ticketing platform. Labs 1–3 provide authenticated, role-based Requester, IT Staff, and Administrator workflows. Lab 4 adds Actions Taken work history, Ticket resolution signals and transitions, role-specific dashboards, dashboard APIs, and regression coverage while preserving ownership and access controls. See [`docs/lab-04/`](docs/lab-04/) for the Lab 4 contract and evidence; test-plan Final statuses remain pending until verified on integrated `main`.

---

## 📌 Table of Contents

- [Overview & Architecture](#-overview--architecture)
- [Tech Stack](#-tech-stack)
- [Database ERD & Schema](#-database-erd--schema)
- [Lab 03 & 04 Features Implemented](#-lab-03--04-features-implemented)
- [Design System & Visual Tokens](#-design-system--visual-tokens)
- [Getting Started & Setup](#-getting-started--setup)
  - [Prerequisites](#prerequisites)
  - [Environment Configuration](#environment-configuration)
  - [Database Setup & Seeding](#database-setup--seeding)
  - [Default Development Accounts](#default-development-accounts)
  - [Running Backend & Frontend](#running-backend--frontend)
- [REST API Contract Reference](#-rest-api-contract-reference)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Demonstrating Lab 4](#demonstrating-lab-4)
- [Project Directory Structure](#-project-directory-structure)
- [Documentation & Lab Deliverables](#-documentation--lab-deliverables)
- [Peer Review & AI Reflection](#-peer-review--ai-reflection)

---

## 🏗 Overview & Architecture

TokTickIT is structured as a full-stack monorepo featuring a decoupled Node.js Express TypeScript backend, a React Vite frontend styled with Bootstrap 5, custom **Zen Green** design tokens, and warm amber accents for restricted internal notes. The database layer uses PostgreSQL managed via Prisma ORM, secured with bcrypt password hashing and JWT token handling. Playwright E2E visual audit testing covers cross-role workflows across Desktop, Tablet, and Mobile viewports.

### System Architecture Diagram

```mermaid
flowchart TD
    subgraph Client ["Client Application (React + Vite)"]
        UI["Zen Green UI / Bootstrap 5"]
        AuthContext["Auth Context & JWT Token Storage"]
        RoleRouter["Role-Based Navigation & Page Router"]
        RequesterViews["Requester Screens (Create Ticket, My Tickets, Ticket Detail)"]
        StaffViews["IT Staff Screens (Ticket Queue, Operational Detail)"]
        AdminViews["Admin Screens (User Management Table & Modals)"]
    end

    subgraph Server ["Server Application (Express + Node.js)"]
        AuthMiddleware["JWT Authentication Middleware (Bearer Header)"]
        RoleMiddleware["RBAC Role Authorization Guard (REQUESTER / IT_STAFF / ADMIN)"]
        AuthRouter["/api/auth Route Handlers"]
        TicketRouter["/api/tickets Route Handlers"]
        CommentsRouter["/api/tickets/:id/comments Handlers"]
        NotesRouter["/api/tickets/:id/internal-notes Handlers"]
        AdminRouter["/api/admin/users Route Handlers"]
        PrismaORM["Prisma Client ORM"]
    end

    subgraph Database ["Database Layer"]
        PostgreSQL[("PostgreSQL Database")]
    end

    UI --> AuthContext
    AuthContext -->|Bearer JWT Header| AuthMiddleware
    AuthMiddleware --> RoleMiddleware
    RoleMiddleware --> AuthRouter
    RoleMiddleware --> TicketRouter
    RoleMiddleware --> CommentsRouter
    RoleMiddleware --> NotesRouter
    RoleMiddleware --> AdminRouter
    AuthRouter --> PrismaORM
    TicketRouter --> PrismaORM
    CommentsRouter --> PrismaORM
    NotesRouter --> PrismaORM
    AdminRouter --> PrismaORM
    PrismaORM --> PostgreSQL
```

---

## 🛠 Tech Stack

### Backend (`server/`)
- **Runtime & Framework:** Node.js (v18+), Express.js with TypeScript
- **Database & ORM:** PostgreSQL, Prisma ORM (v5.x)
- **Security & Auth:** JSON Web Tokens (`jsonwebtoken`), `bcrypt` password hashing (salt rounds = 10)
- **File Storage:** Multer middleware with disk storage & file type/size sanitization
- **Testing:** Vitest, Supertest for integration and API endpoint verification

### Frontend (`client/`)
- **Framework & Build Tool:** React 18, Vite 5, TypeScript
- **UI Framework & Styling:** Bootstrap 5, custom **Zen Green** CSS Design System Tokens, warm amber internal notes tokens
- **Icons & Visuals:** Bootstrap Icons
- **Testing:** Vitest, React Testing Library, jsdom

### End-to-End (`e2e/`)
- **Testing Framework:** Playwright (Chromium) testing across Desktop (1280px), Tablet (768px), and Mobile (375px) viewports with automated responsive screenshot generation.

---

## 🗄 Database ERD & Schema

The PostgreSQL database schema is defined in `server/prisma/schema.prisma` and managed via Prisma ORM:

```mermaid
erDiagram
    User ||--o{ Ticket : "submits (requester)"
    User ||--o{ Ticket : "assigned (owner)"
    User ||--o{ PublicComment : "authors"
    User ||--o{ InternalNote : "authors"
    Category ||--o{ Ticket : "classifies"
    RelatedSystem ||--o{ Ticket : "links"
    Ticket ||--o{ Attachment : "contains"
    Ticket ||--o{ PublicComment : "contains"
    Ticket ||--o{ InternalNote : "contains"

    User {
        String id PK
        String name
        String email UK
        String passwordHash
        String role "REQUESTER | IT_STAFF | ADMINISTRATOR"
        Boolean mustChangePassword
        Boolean isActive
        DateTime createdAt
        DateTime updatedAt
    }

    Category {
        String id PK
        String name UK
        Boolean isActive
        DateTime createdAt
    }

    RelatedSystem {
        String id PK
        String name UK
        Boolean isActive
        DateTime createdAt
    }

    Ticket {
        String id PK
        String ticketNumber UK
        String requesterId FK
        String ownerId FK "Nullable"
        String categoryId FK
        String relatedSystemId FK
        String summary
        String description
        String requestedPriority
        String itPriority
        String currentStatus
        Boolean requesterResolvedIndicated
        DateTime createdAt
        DateTime updatedAt
    }

    Attachment {
        String id PK
        String ticketId FK
        String originalFileName
        String storedFileName
        Int fileSize
        String mimeType
        Boolean isRemoved
        String removalReason
        DateTime removedAt
        DateTime createdAt
    }

    PublicComment {
        String id PK
        String ticketId FK
        String authorId FK
        String content
        DateTime createdAt
    }

    InternalNote {
        String id PK
        String ticketId FK
        String authorId FK
        String content
        DateTime createdAt
    }
```

### Models Summary

- **`User`**: Unified user account entity storing credentials (`email`, `passwordHash`), system role (`REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`), activation status (`isActive`), and password reset indicator (`mustChangePassword`).
- **`Category`**: Pre-defined ticket categories (`Account and Access`, `Hardware`, `Software`, `Network`).
- **`RelatedSystem`**: Pre-defined systems (`Email`, `Campus Wi-Fi`, `VPN`, `LEB2 App`, `Grade Submission App`, `Corporate Laptop`).
- **`Ticket`**: Core ticket entity storing ticket number (`TKT-YYYY-XXXXXX`), requester reference, IT Staff owner reference (`ownerId`), priorities (`requestedPriority`, `itPriority`), current status, and requester resolution signal (`requesterResolvedIndicated`).
- **`Attachment`**: Uploaded files with soft-removal metadata (`isRemoved`, `removalReason`, `removedAt`).
- **`PublicComment`**: Append-only public communication log accessible to Requesters, IT Staff, and Administrators.
- **`InternalNote`**: Append-only confidential operational notes accessible ONLY to IT Staff and Administrators.

---

## 🚀 Lab 03 & 04 Features Implemented

### ISSUE-01: Specification & Test Strategy
- Authored [specification.md](file:///d:/TokTickIT/docs/lab-03/specification.md), [api-spec.md](file:///d:/TokTickIT/docs/lab-03/api-spec.md), [ui-spec.md](file:///d:/TokTickIT/docs/lab-03/ui-spec.md), and [tests.md](file:///d:/TokTickIT/docs/lab-03/tests.md).
- Defined business rules **BR-01 through BR-18**, Given-When-Then acceptance criteria, Given-When-Then test cases, and RBAC matrix.

### ISSUE-02: Database Schema & Migration
- Migrated `RequesterUser` model into unified `User` model with roles, password hash, and `mustChangePassword` flag.
- Created `PublicComment` and `InternalNote` tables, added `ownerId`, `itPriority`, and `requesterResolvedIndicated` fields to `Ticket`.
- Created idempotent seed script (`server/prisma/seed.ts`) populating seed users across all three roles and realistic ticket thread history.

### ISSUE-03: Authentication Foundation & Security
- Implemented JWT authentication (`POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/change-password`, `POST /api/auth/logout`).
- Enforced mandatory initial password change (`mustChangePassword = true`) blocking access to all operational APIs until changed.
- Enforced password strength validation (8+ characters, uppercase, lowercase, number, special char).

### ISSUE-04: Requester Identity Integration & Resolution Signal
- Integrated session-authenticated user identity into all Requester ticket creation and dashboard views.
- Implemented `PATCH /api/tickets/:id/indicate-resolved` allowing Requesters to signal problem resolution without altering formal IT status.
- Enabled append-only Public Comments for Requesters on owned tickets.

### ISSUE-05: IT Staff Ticket Queue Management
- Built paginated IT Staff Ticket Queue (`GET /api/tickets/queue`) supporting keyword search (`ticketNumber`, `summary`), category, priority, status, and owner filters, plus sorting.
- Designed responsive table view with quick status badges and direct navigation to ticket details.

### ISSUE-06: IT Staff Operational Detail & Workflows
- Implemented ticket ownership claiming and reassignment (`PATCH /api/tickets/:id/assign`).
- Implemented IT Priority updates (`PATCH /api/tickets/:id/it-priority`).
- Implemented strict status transition validation matrix (`PATCH /api/tickets/:id/status`) enforcing permitted workflow steps (`New` ➔ `Open` ➔ `In Progress` ➔ `Resolved` ➔ `Closed`, etc.).
- Implemented warm amber styled Internal Notes (`GET/POST /api/tickets/:id/internal-notes`) with strict HTTP 403 access control against Requesters.

### ISSUE-07: Administrator User Management
- Built Administrator User Management table (`GET /api/admin/users`) with search (name/email), role filter, user creation (`POST /api/admin/users`), user profile editing (`PATCH /api/admin/users/:id`), and password resets (`POST /api/admin/users/:id/reset-password`).
- Implemented critical safety guardrails: self-deactivation prevention, last active Administrator protection, and duplicate email rejection (`409 Conflict`).

### ISSUE-08: Playwright E2E Testing & Visual Audit
- Developed Playwright end-to-end test suites (`e2e/lab-03/`) covering authentication, mandatory password reset, staff queue/detail operational flows, and administrator safety rules.
- Generated responsive visual audit screenshots across Desktop (1280px), Tablet (768px), and Mobile (375px) saved under `artifacts/lab-03/screenshots/`.

### ISSUE-09: Integration & Peer Review
- Lab 3 regression coverage exercises authentication, Ticket ownership and details, attachments, comments, staff workflows, internal notes, and Administrator user management.

### LAB 4: Actions Taken, workflow, and operational dashboards
- Adds per-Ticket Actions Taken with automatic performer attribution, follow-up validation, editable notes, and stale-update conflict handling.
- Adds documented Ticket workflow rules, Requester advisory resolution, and role-scoped Requester and Staff/Admin dashboard metrics with drill-downs.
- Preserves the existing Labs 1–3 features and authorization rules; Lab 4 requirements and API/UI contracts are in [`docs/lab-04/`](docs/lab-04/).
- The release test plan keeps Final statuses pending until the full suite is verified on integrated `main`.

---

## 🎨 Design System & Visual Tokens

TokTickIT uses a custom **Zen Green** design system paired with warm amber accents for confidential internal notes:

```css
:root {
  /* Zen Green Brand Palette */
  --zg-primary: #006B3C;          /* Deep Zen Green Header & Brand */
  --zg-primary-hover: #00542F;    /* Hover State Primary */
  --zg-accent: #0B7A46;           /* Buttons & Interactive Elements */
  --zg-accent-hover: #096339;     /* Accent Hover */
  --zg-surface-selected: #EAF6EF; /* Selected Row / Active Surface Light Tint */
  --zg-surface-card: #FFFFFF;     /* Pure White Card Surfaces */
  --zg-bg-main: #F8FAF9;          /* Muted Off-White Page Background */
  --zg-border: #D1E5D9;           /* Soft Greenish Border */
  --zg-text-heading: #122119;     /* Dark High-Contrast Text */
  --zg-text-body: #3A4B40;        /* Muted Body Text */

  /* Warm Amber Palette (Restricted Internal Notes) */
  --amber-bg: #FFF8E1;            /* Soft Amber Container Background */
  --amber-border: #FFE082;        /* Amber Border Highlight */
  --amber-header: #856404;        /* Dark Amber Header Text */
  --amber-badge: #FFC107;         /* Amber Role & Lock Badge */
}
```

### Key UI Features
- **Role-Based Navigation Header:** Renders appropriate menus according to user role (`REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`) along with user name and role badge.
- **Visually Separated Notes:** Public Comments display in clean Zen Green cards, while Internal Notes feature warm amber containers with lock icons (`bi-lock-fill`) to visually reinforce privacy.
- **Responsive Layout:** Adapts seamlessly between Desktop (≥992px), Tablet (768px), and Mobile (<768px) views.

---

## 💻 Getting Started & Setup

### Prerequisites
- **Node.js:** `v18.x` or later
- **npm:** `v9.x` or later
- **PostgreSQL:** `v15+` (local installation or Docker container)

---

### Environment Configuration

#### Backend Environment (`server/.env`)
Copy `server/.env.example` to `server/.env`. Adjust the local PostgreSQL credentials if needed:

```env
DATABASE_URL="postgresql://toktickit:toktickit@localhost:5432/toktickit?schema=public"
PORT=3000
```

The checked-in example is for local development only. Keep real environment values in the ignored `.env` file.

---

### Database Setup & Seeding

1. From the repository root, install the three dependency sets:
   ```bash
   npm install
   npm --prefix server install
   npm --prefix client install
   ```

2. Start the local PostgreSQL service using Docker Compose, or use a local PostgreSQL 15+ instance. The Compose file uses the same credentials as `.env.example`:
   ```bash
   docker compose -f server/docker-compose.yml up -d postgres
   ```

3. Copy the environment template, then apply committed migrations and seed development data:
   ```powershell
   Copy-Item server/.env.example server/.env
   ```
   On macOS/Linux, use `cp server/.env.example server/.env`. Then run:
   ```bash
   cd server
   npx prisma migrate deploy
   npm run prisma:seed
   ```

   Use `npm run prisma:migrate` only when creating or editing a migration during development. The seed is repeatable. For the isolated migration test, set `LAB4_MIGRATION_TEST_DATABASE_URL` to a disposable local database whose name contains `test` or `lab4`.

4. Start the server and client in separate terminals:
   ```bash
   # terminal 1
   cd server && npm run dev
   # terminal 2
   cd client && npm run dev
   ```
   The API is at `http://localhost:3000`; Vite serves the UI at `http://localhost:5173`.

5. For browser tests, install Chromium once from the repository root:
   ```bash
   npx playwright install chromium
   ```

---

### Default Development Accounts

All development seed accounts use the default password: **`Password123!`**

| Email | Role | Status | Description / Purpose |
|---|---|---|---|
| `admin@toktickit.com` | `ADMINISTRATOR` | Active | Primary Administrator account for user management |
| `michael.brown@toktickit.com` | `IT_STAFF` | Active | Senior IT Staff member (Ticket Queue & Operations) |
| `sarah.johnson@toktickit.com` | `IT_STAFF` | Active | IT Staff member (Ownership & Priority management) |
| `david.lee@toktickit.com` | `IT_STAFF` | Active | IT Staff member |
| `kevin.patel@toktickit.com` | `IT_STAFF` | Inactive | Inactive staff account (login rejection testing) |
| `alice@toktickit.io` | `REQUESTER` | Active | Requester with active tickets and public comments |
| `bob@toktickit.io` | `REQUESTER` | Active | Requester with open tickets |
| `charlie@toktickit.io` | `REQUESTER` | Active | Requester with unassigned tickets |
| `diana@toktickit.io` | `REQUESTER` | Active (`mustChangePassword: true`) | User for testing mandatory password change workflow |
| `evan@toktickit.io` | `REQUESTER` | Inactive | Inactive requester account |

---

### Running Backend & Frontend

#### Start Backend Server (`server/`)
```bash
cd server
npm run dev
```
- REST API runs at **`http://localhost:3000`**.

#### Start Frontend Client (`client/`)
```bash
cd client
npm install
npm run dev
```
- Client runs at **`http://localhost:5173`**.

---

## 🔌 REST API Contract Reference

All protected endpoints require the `Authorization: Bearer <token>` HTTP header.

### 🔑 Authentication (`/api/auth`)

| Method | Endpoint | Description | Expected Status |
|---|---|---|---|
| `POST` | `/api/auth/login` | Authenticate user with email and password | `200 OK` / `401` |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | `200 OK` / `401` |
| `POST` | `/api/auth/change-password` | Change password (required if `mustChangePassword = true`) | `200 OK` / `400` / `401` |
| `POST` | `/api/auth/logout` | Terminate active user session | `200 OK` |

### 🎫 Requester Operations (`/api/tickets`)

| Method | Endpoint | Description | Roles Allowed | Expected Status |
|---|---|---|---|---|
| `GET` | `/api/tickets/my` | List tickets owned by authenticated requester | `REQUESTER` | `200 OK` |
| `POST` | `/api/tickets` | Create new IT service ticket | All Roles | `201 Created` |
| `GET` | `/api/tickets/:id` | Get single ticket detail | Ticket Owner, IT Staff, Admin | `200 OK` / `403` / `404` |
| `PATCH` | `/api/tickets/:id/indicate-resolved` | Signal problem appears resolved | Ticket Owner | `200 OK` / `403` |

### 🛠 IT Staff Operations (`/api/tickets`)

| Method | Endpoint | Description | Roles Allowed | Expected Status |
|---|---|---|---|---|
| `GET` | `/api/tickets/queue` | Paginated ticket queue with search & filters | `IT_STAFF`, `ADMINISTRATOR` | `200 OK` / `403` |
| `PATCH` | `/api/tickets/:id/assign` | Claim or reassign ticket ownership | `IT_STAFF`, `ADMINISTRATOR` | `200 OK` / `400` / `403` |
| `PATCH` | `/api/tickets/:id/it-priority` | Update IT Priority (`Low`, `Medium`, `High`, `Urgent`) | `IT_STAFF`, `ADMINISTRATOR` | `200 OK` / `400` / `403` |
| `PATCH` | `/api/tickets/:id/status` | Formal status transition (verifies status matrix) | `IT_STAFF`, `ADMINISTRATOR` | `200 OK` / `400` / `403` |

### 💬 Comments & Notes (`/api/tickets/:id`)

| Method | Endpoint | Description | Roles Allowed | Expected Status |
|---|---|---|---|---|
| `GET` | `/api/tickets/:id/comments` | List public comments on ticket | Ticket Owner, IT Staff, Admin | `200 OK` / `403` |
| `POST` | `/api/tickets/:id/comments` | Post append-only public comment | Ticket Owner, IT Staff, Admin | `201 Created` / `400` |
| `GET` | `/api/tickets/:id/internal-notes` | List confidential internal notes | `IT_STAFF`, `ADMINISTRATOR` | `200 OK` / `403` |
| `POST` | `/api/tickets/:id/internal-notes` | Post confidential internal note | `IT_STAFF`, `ADMINISTRATOR` | `201 Created` / `400` / `403` |

### 👥 Administrator User Management (`/api/admin/users`)

| Method | Endpoint | Description | Roles Allowed | Expected Status |
|---|---|---|---|---|
| `GET` | `/api/admin/users` | List users with search & role filters | `ADMINISTRATOR` | `200 OK` / `403` |
| `POST` | `/api/admin/users` | Create new user account | `ADMINISTRATOR` | `201 Created` / `409` |
| `PATCH` | `/api/admin/users/:id` | Update user profile, role, or active status | `ADMINISTRATOR` | `200 OK` / `400` / `409` |
| `POST` | `/api/admin/users/:id/reset-password` | Set initial password (`mustChangePassword: true`) | `ADMINISTRATOR` | `200 OK` / `400` / `404` |

---

## 🧪 Testing & Quality Assurance

Run tests from their respective directories. API and UI tests use fixtures/mocks; browser tests need the running app and a seeded local database.

### Server tests and build

```bash
cd server
npm test
npm run build
```

The server suite covers earlier Labs 1–3 behavior and Lab 4 Actions Taken, Ticket workflow, dashboards, and migration checks. The database migration integration test runs only when `LAB4_MIGRATION_TEST_DATABASE_URL` points to a local disposable database with `test` or `lab4` in its name; otherwise that integration case is skipped. The dashboard performance smoke is documented in [`docs/lab-04/tests.md`](docs/lab-04/tests.md) and should only use a disposable local database.

Run the required dashboard performance smoke against a disposable local test database (it creates and removes a temporary schema and requires Prisma migrations to deploy):

```powershell
$env:LAB4_MIGRATION_TEST_DATABASE_URL = "postgresql://USER:PASSWORD@localhost:5432/toktickit_lab4_test?schema=public"
node scripts/lab4-dashboard-performance-smoke.mjs
```

The smoke creates 500 Tickets and 2,000 Actions Taken in an isolated schema, makes one warm-up and five measured requests to each dashboard endpoint, reports the local runtime and timings, and removes the temporary schema. Each measured request must finish within 1,000 ms. Use only a local disposable database with `test` or `lab4` in its database name.

### Client tests and build

```bash
cd client
npm test -- --maxWorkers=1 --minWorkers=1
npm run build
```

The client suite covers authentication, Requester and staff Ticket workflows, dashboards, Actions Taken, attachments, comments, notes, and administrator user management.

### Playwright end-to-end tests

Start the server and client in separate terminals, then run from the repository root:

```bash
npx playwright test
```

Playwright uses `http://localhost:5173` and the server at `http://localhost:3000`. Use a seeded local database. Run the Lab 4 browser tests with `npx playwright test e2e/lab-04`; run the complete browser regression suite with `npx playwright test`. Responsive checks cover 1280px desktop, 768px tablet, and 375px mobile. Screenshots and other Lab 4 visual evidence belong under `artifacts/lab-04/`.

### Demonstrating Lab 4

1. Sign in as `michael.brown@toktickit.com` or `alice@toktickit.io` using the local seed password `Password123!`.
2. Show the role-appropriate dashboard. Staff/Admin metrics open filtered Ticket views; Requester metrics and recent Tickets are scoped to the signed-in Requester.
3. Open a Ticket and select **Actions Taken**. Demonstrate the staff record/edit form or the Requester read-only history. The seed includes examples with and without follow-up notes.
4. As IT Staff, demonstrate permitted Ticket status transitions and the Requester advisory resolution signal without using it as a formal status change.
5. Review screenshots under [`artifacts/lab-04/screenshots/`](artifacts/lab-04/screenshots/) and test traceability in [`docs/lab-04/tests.md`](docs/lab-04/tests.md).

These are development seed credentials. Do not reuse them outside a local demo environment.

### Health check

```bash
curl http://localhost:3000/api/health
```

Expected response: `{"status":"ok","service":"TokTickIT API"}`.

---

## 📁 Project Directory Structure

```text
TokTickIT/
├── artifacts/
│   ├── lab-03/screenshots/         # Lab 3 visual evidence
│   └── lab-04/
│       ├── screenshots/           # Lab 4 dashboards, Actions Taken, regression evidence
│       └── submission.pdf         # Concise nine-part submission
├── client/                        # Frontend React Application
│   ├── public/                    # Static assets
│   ├── src/
│   │   ├── api.ts                 # API client wrapper with Bearer token header
│   │   ├── App.tsx                # Main App router & navigation header
│   │   ├── index.css              # Zen Green design system & warm amber notes styles
│   │   ├── components/            # UI components (Login, ChangePassword, StaffQueue, UserMgmt, etc.)
│   │   └── pages/                 # Page components
│   └── tests/lab-04/              # React dashboard, Actions Taken, workflow tests
├── server/                        # Backend Express REST API
│   ├── prisma/
│   │   ├── schema.prisma          # PostgreSQL Prisma schema (User, Ticket, Comment, Note, etc.)
│   │   ├── migrations/            # SQL migration history
│   │   └── seed.ts                # Database seed script
│   ├── src/
│   │   ├── app.ts                 # Express app, routes, & RBAC middleware
│   │   ├── auth.ts                # JWT authentication utility & password hashing
│   │   └── index.ts               # Server entrypoint
│   └── tests/lab-04/              # API, workflow, dashboard, and migration tests
├── docs/                          # Project documentation
│   ├── lab-01/                    # Lab 01 deliverables
│   ├── lab-02/                    # Lab 02 deliverables
│   ├── lab-03/                    # Lab 3 deliverables
│   └── lab-04/
│       ├── specification.md       # Lab 4 scope, rules, ACs, and DoD
│       ├── api-spec.md             # Lab 4 REST API contracts
│       ├── ui-spec.md              # Lab 4 screen and visual rules
│       ├── tests.md                # Test plan and AC traceability
│       ├── reviewer.md             # Lab 4 peer-review record
│       └── ai-use.md               # Lab 4 prompt selections and reflection
└── e2e/                           # Playwright end-to-end test suite
    ├── lab-03/                    # Lab 3 regression scenarios
    └── lab-04/                    # Dashboards, Actions Taken, Ticket workflow
```

---

## 📄 Documentation & Lab Deliverables

Lab 3 deliverables are documented under `docs/lab-03/`. Lab 4 deliverables are documented under `docs/lab-04/`:

- 📜 [**System Specification (`specification.md`)**](file:///d:/TokTickIT/docs/lab-03/specification.md): System scope, functional requirements (FR-01 to FR-12), business rules (BR-01 to BR-18), and RBAC matrix.
- 🔌 [**REST API Specification (`api-spec.md`)**](file:///d:/TokTickIT/docs/lab-03/api-spec.md): Full REST API endpoint contracts, request/response JSON schemas, and authorization rules.
- 🎨 [**UI Specification (`ui-spec.md`)**](file:///d:/TokTickIT/docs/lab-03/ui-spec.md): Zen Green theme tokens, warm amber internal note styles, responsive layouts, and accessibility standards.
- 🧪 [**Test Strategy & AC Matrix (`tests.md`)**](file:///d:/TokTickIT/docs/lab-03/tests.md): Acceptance criteria traceability, integration test cases, component test plan, and E2E visual audit strategy.
- 🤝 [**Peer Review Record (`reviewer.md`)**](file:///d:/TokTickIT/docs/lab-03/reviewer.md): Pull request review logs, comments, responses, and reviewer approvals.
- 🤖 [**AI Use & Reflection (`ai-use.md`)**](file:///d:/TokTickIT/docs/lab-03/ai-use.md): AI pair programming log, prompt history, and reflection on AI assistance.
- ✅ [**Requirements Checklist (`Lab3_Requirements_Checklist.md`)**](file:///d:/TokTickIT/docs/lab-03/Lab3_Requirements_Checklist.md): Step-by-step checklist verifying completion of all Lab 03 features and deliverables.

Lab 4 documentation:

- [Specification](docs/lab-04/specification.md), [API specification](docs/lab-04/api-spec.md), and [UI specification](docs/lab-04/ui-spec.md)
- [Test plan and acceptance-criterion traceability](docs/lab-04/tests.md)
- [Peer review record](docs/lab-04/reviewer.md) and [AI use with reflection](docs/lab-04/ai-use.md)
- [Accessibility and responsive checklist](docs/lab-04/accessibility-responsive-checklist.md)
- [Submission PDF](artifacts/lab-04/submission.pdf)

Visual evidence is stored in `artifacts/lab-04/screenshots/`, organized by role/screen and regression lab. See the reviewer record for release evidence status; earlier-lab approvals do not establish Lab 4 approval.

---

## 🤝 Peer Review & AI Reflection

- **Author:** Yotsapoom Liupolvanish (`67070503493`) — GitHub: [@JEWKEW](https://github.com/JEWKEW)
- **Peer Reviewer:** See the Lab 4 peer-review record; do not infer Lab 4 approval from earlier labs.
- **AI Pair Assistant:** Gemini 3.6 Flash (Antigravity AI Assistant)
Lab 4 AI prompt selections and reflection are in [`docs/lab-04/ai-use.md`](docs/lab-04/ai-use.md).
