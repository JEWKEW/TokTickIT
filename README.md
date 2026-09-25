# 🎫 TokTickIT — IT Service Desk Platform

![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)
![Build Status](https://img.shields.io/badge/tests-215%20passed%20(100%25)-brightgreen.svg)
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

**TokTickIT** is an enterprise-grade IT Service Desk ticketing platform. Lab 03 evolves the application into a secure, multi-tenant role-based system featuring JWT authentication, role-based authorization across three distinct roles (`REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`), mandatory initial password resets (`mustChangePassword`), operational IT Staff Ticket Queue and ticket detail workflows (claiming/reassignment, IT Priority setting, permitted status transitions, append-only Public Comments, and restricted Internal Notes), and Administrator user management with safety guardrails (self-deactivation prevention, last active Administrator protection, and initial password resets).

---

## 📌 Table of Contents

- [Overview & Architecture](#-overview--architecture)
- [Tech Stack](#-tech-stack)
- [Database ERD & Schema](#-database-erd--schema)
- [Lab 03 Features Implemented](#-lab-03-features-implemented)
- [Design System & Visual Tokens](#-design-system--visual-tokens)
- [Getting Started & Setup](#-getting-started--setup)
  - [Prerequisites](#prerequisites)
  - [Environment Configuration](#environment-configuration)
  - [Database Setup & Seeding](#database-setup--seeding)
  - [Default Development Accounts](#default-development-accounts)
  - [Running Backend & Frontend](#running-backend--frontend)
- [REST API Contract Reference](#-rest-api-contract-reference)
- [Testing & Quality Assurance](#-testing--quality-assurance)
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

## 🚀 Lab 03 Features Implemented

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
- Completed feature PR reviews and release integration.
- Documented peer review logs ([reviewer.md](file:///d:/TokTickIT/docs/lab-03/reviewer.md)) and AI reflection log ([ai-use.md](file:///d:/TokTickIT/docs/lab-03/ai-use.md)).

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
Create `server/.env` with the following configuration:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/toktickit_db?schema=public"
PORT=3000
NODE_ENV=development
JWT_SECRET="toktickit_super_secret_jwt_key_2026"
```

---

### Database Setup & Seeding

1. Navigate to the `server` directory:
   ```bash
   cd server
   ```

2. Install backend dependencies:
   ```bash
   npm install
   ```

3. Run Prisma database migrations:
   ```bash
   npm run prisma:migrate
   ```

4. Execute database seeding:
   ```bash
   npm run prisma:seed
   ```
   *Populates seed categories, related systems, active/inactive users across all 3 roles, and ticket threads.*

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

### 1. Server Integration Test Suite (`server/`)
Tests JWT authentication, RBAC middleware authorization, status transition enforcement, public comments, internal note confidentiality, and admin safety rules.

```bash
cd server
npm test
```
- **Result:** **13 test files, 88 passing tests (100% pass rate)**.

---

### 2. Client Component Test Suite (`client/`)
Tests Login, Mandatory Change Password, Staff Ticket Queue, Staff Ticket Detail (IT Priority, Status, Claiming), User Management, and Requester workflows.

```bash
cd client
npm test
```
- **Result:** **24 test files, 120 passing tests (100% pass rate)**.

---

### 3. Playwright E2E & Responsive Visual Audit (`root/`)
Automated Playwright end-to-end tests verifying multi-role authentication, staff queue workflows, public comments, internal notes, and administrator user management.

```bash
# Run Lab 03 Playwright E2E test suite
npx playwright test e2e/lab-03/
```
- **Result:** **3 test suites, 7 tests passing (100% pass rate)**.
- **Responsive Artifacts Generated:**
  - Screenshots saved under `artifacts/lab-03/screenshots/` across Desktop (1280px), Tablet (768px), and Mobile (375px).

---

## 📁 Project Directory Structure

```text
TokTickIT/
├── artifacts/                     # Visual audit screenshots
│   └── lab-03/
│       └── screenshots/           # Authentication, Staff Queue, Staff Detail, User Admin screenshots
├── client/                        # Frontend React Application
│   ├── public/                    # Static assets
│   ├── src/
│   │   ├── api.ts                 # API client wrapper with Bearer token header
│   │   ├── App.tsx                # Main App router & navigation header
│   │   ├── index.css              # Zen Green design system & warm amber notes styles
│   │   ├── components/            # UI components (Login, ChangePassword, StaffQueue, UserMgmt, etc.)
│   │   └── pages/                 # Page components
│   └── tests/lab-03/              # React component test suites (Vitest + RTL)
├── server/                        # Backend Express REST API
│   ├── prisma/
│   │   ├── schema.prisma          # PostgreSQL Prisma schema (User, Ticket, Comment, Note, etc.)
│   │   ├── migrations/            # SQL migration history
│   │   └── seed.ts                # Database seed script
│   ├── src/
│   │   ├── app.ts                 # Express app, routes, & RBAC middleware
│   │   ├── auth.ts                # JWT authentication utility & password hashing
│   │   └── index.ts               # Server entrypoint
│   └── tests/lab-03/              # Supertest integration API test suites
├── docs/                          # Project documentation
│   ├── lab-01/                    # Lab 01 deliverables
│   ├── lab-02/                    # Lab 02 deliverables
│   └── lab-03/                    # Lab 03 deliverables
│       ├── specification.md       # Full Lab 03 specification & BRs
│       ├── api-spec.md            # REST API contract specification
│       ├── ui-spec.md             # Zen Green design system & UI specification
│       ├── tests.md               # Test plan & Given-When-Then AC matrix
│       ├── reviewer.md            # Peer review record & approvals
│       ├── ai-use.md              # AI pair programming log & reflection
│       └── Lab3_Requirements_Checklist.md # Sprint checklist & coverage tracking
└── e2e/                           # Playwright end-to-end test suite
    └── lab-03/
        ├── authentication.spec.ts
        ├── staff-ticket-flow.spec.ts
        └── user-administration.spec.ts
```

---

## 📄 Documentation & Lab Deliverables

All required Lab 03 deliverables are documented under `docs/lab-03/`:

- 📜 [**System Specification (`specification.md`)**](file:///d:/TokTickIT/docs/lab-03/specification.md): System scope, functional requirements (FR-01 to FR-12), business rules (BR-01 to BR-18), and RBAC matrix.
- 🔌 [**REST API Specification (`api-spec.md`)**](file:///d:/TokTickIT/docs/lab-03/api-spec.md): Full REST API endpoint contracts, request/response JSON schemas, and authorization rules.
- 🎨 [**UI Specification (`ui-spec.md`)**](file:///d:/TokTickIT/docs/lab-03/ui-spec.md): Zen Green theme tokens, warm amber internal note styles, responsive layouts, and accessibility standards.
- 🧪 [**Test Strategy & AC Matrix (`tests.md`)**](file:///d:/TokTickIT/docs/lab-03/tests.md): Acceptance criteria traceability, integration test cases, component test plan, and E2E visual audit strategy.
- 🤝 [**Peer Review Record (`reviewer.md`)**](file:///d:/TokTickIT/docs/lab-03/reviewer.md): Pull request review logs, comments, responses, and reviewer approvals.
- 🤖 [**AI Use & Reflection (`ai-use.md`)**](file:///d:/TokTickIT/docs/lab-03/ai-use.md): AI pair programming log, prompt history, and reflection on AI assistance.
- ✅ [**Requirements Checklist (`Lab3_Requirements_Checklist.md`)**](file:///d:/TokTickIT/docs/lab-03/Lab3_Requirements_Checklist.md): Step-by-step checklist verifying completion of all Lab 03 features and deliverables.

---

## 🤝 Peer Review & AI Reflection

- **Author:** Yotsapoom Liupolvanish (`67070503493`) — GitHub: [@JEWKEW](https://github.com/JEWKEW)
- **Peer Reviewer:** Chaiyaphoom Chenchirotphiphat (`67070503410`) — GitHub: [@maneejames](https://github.com/maneejames)
- **AI Pair Assistant:** Gemini 3.6 Flash (Antigravity AI Assistant)