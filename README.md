# 🎫 TokTickIT — IT Service Desk Platform

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Build Status](https://img.shields.io/badge/tests-69%20passed%20(100%25)-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?logo=node.js)
![React](https://img.shields.io/badge/React-18.x-61dafb?logo=react)
![Vite](https://img.shields.io/badge/Vite-5.x-646cff?logo=vite)
![Express](https://img.shields.io/badge/Express-4.x-lightgrey?logo=express)
![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-336791?logo=postgresql)
![Playwright](https://img.shields.io/badge/Playwright-E2E-2EAD33?logo=playwright)
![Design System](https://img.shields.io/badge/Design%20System-Zen%20Green%20%23006B3C-006B3C)

**TokTickIT** is an enterprise-grade IT Service Desk ticketing platform. Lab 02 delivers complete **Requester MVP Capabilities**, allowing end-users to simulate user identity switching ("Fake Login"), submit IT service request tickets with file attachments, view their submitted tickets in a paginated dashboard with search, filtering, and sorting, access read-only ticket details, and soft-remove file attachments while preserving historical audit metadata.

---

## 📌 Table of Contents

- [Overview & Architecture](#-overview--architecture)
- [Tech Stack](#-tech-stack)
- [Database ERD & Schema](#-database-erd--schema)
- [Lab 02 Features Implemented](#-lab-02-features-implemented)
- [Zen Green Design System](#-zen-green-design-system)
- [Getting Started & Setup](#-getting-started--setup)
  - [Prerequisites](#prerequisites)
  - [Environment Configuration](#environment-configuration)
  - [Database Setup & Seeding](#database-setup--seeding)
  - [Running Backend & Frontend](#running-backend--frontend)
- [REST API Contract Reference](#-rest-api-contract-reference)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Project Directory Structure](#-project-directory-structure)
- [Documentation & Lab Deliverables](#-documentation--lab-deliverables)
- [Peer Review & AI Reflection](#-peer-review--ai-reflection)

---

## 🏗 Overview & Architecture

TokTickIT is structured as a full-stack monorepo featuring a decoupled Node.js Express TypeScript backend, a React Vite frontend styled with Bootstrap 5 and custom **Zen Green** CSS design tokens, a PostgreSQL database managed via Prisma ORM, and automated Playwright E2E visual audit testing.

### System Architecture Diagram

```mermaid
flowchart TD
    subgraph Client ["Client Application (React + Vite)"]
        UI["Zen Green UI / Bootstrap 5"]
        Context["Requester Context Selector (x-user-id Header)"]
        Forms["Create Ticket & Attachment Form"]
        Dashboard["Paginated My Tickets Dashboard"]
        Detail["Read-Only Ticket Detail & Soft-Delete Modal"]
    end

    subgraph Server ["Server Application (Express + Node.js)"]
        AuthMiddleware["x-user-id Context Middleware"]
        UploadMiddleware["Multer Storage & Validation Middleware (Max 5MB)"]
        TicketRouter["/api/tickets Route Handlers"]
        AttachmentRouter["/api/attachments Route Handlers"]
        PrismaORM["Prisma Client"]
    end

    subgraph Database ["Database Layer"]
        PostgreSQL[("PostgreSQL Database")]
    end

    UI --> Context
    Context -->|HTTP x-user-id| AuthMiddleware
    Forms -->|POST /api/tickets| UploadMiddleware
    UploadMiddleware --> TicketRouter
    Dashboard -->|GET /api/tickets| TicketRouter
    Detail -->|GET /api/tickets/:id| TicketRouter
    Detail -->|DELETE /api/attachments/:id| AttachmentRouter
    TicketRouter --> PrismaORM
    AttachmentRouter --> PrismaORM
    PrismaORM --> PostgreSQL
```

---

## 🛠 Tech Stack

### Backend (`server/`)
- **Runtime & Framework:** Node.js (v18+), Express.js with TypeScript
- **Database & ORM:** PostgreSQL, Prisma ORM (v5.x)
- **File Storage:** Multer middleware with disk storage & file type/size sanitization
- **Validation & Parsing:** Custom TypeScript schemas & body sanitizers
- **Testing:** Vitest, Supertest for integration and API endpoint verification

### Frontend (`client/`)
- **Framework & Build Tool:** React 18, Vite 5, TypeScript
- **UI Framework & Styling:** Bootstrap 5, custom **Zen Green** CSS Design System Tokens
- **Icons & Visuals:** Bootstrap Icons
- **Testing:** Vitest, React Testing Library, jsdom

### End-to-End (`e2e/`)
- **Testing Framework:** Playwright (Chromium) testing across Desktop (1280px), Tablet (768px), and Mobile (375px) viewports with automated responsive screenshot generation.

---

## 🗄 Database ERD & Schema

The PostgreSQL database schema is defined in `server/prisma/schema.prisma` and managed via Prisma ORM:

```mermaid
erDiagram
    RequesterUser ||--o{ Ticket : "submits"
    Category ||--o{ Ticket : "classifies"
    RelatedSystem ||--o{ Ticket : "links"
    Ticket ||--o{ Attachment : "contains"

    RequesterUser {
        String id PK
        String name
        String email UK
        Boolean isActive
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
    }

    Ticket {
        String id PK
        String ticketNumber UK
        String requesterId FK
        String categoryId FK
        String relatedSystemId FK
        String summary
        String description
        String requestedPriority
        String itPriority
        String currentStatus
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
```

### Models Summary

- **`RequesterUser`**: Stores development user accounts (`id`, `name`, `email`, `isActive`).
- **`Category`**: Pre-defined ticket categories (`Account and Access`, `Hardware`, `Software`, `Network`).
- **`RelatedSystem`**: Pre-defined systems (`Email`, `Campus Wi-Fi`, `VPN`, `LEB2 App`, `Grade Submission App`, `Corporate Laptop`).
- **`Ticket`**: Core ticket record containing unique code (`TKT-YYYY-XXXXXX`), requester reference, priorities, summary, description, and status (default `"New"`).
- **`Attachment`**: File attachments linked to tickets with metadata (`originalFileName`, `storedFileName`, `fileSize`, `mimeType`) and soft-removal attributes (`isRemoved`, `removalReason`, `removedAt`).

---

## 🚀 Lab 02 Features Implemented

### ISSUE-01: Sprint Specification & Test Plan
- Authored [specification.md](file:///d:/TokTickIT/docs/lab-02/specification.md), [api-spec.md](file:///d:/TokTickIT/docs/lab-02/api-spec.md), [ui-spec.md](file:///d:/TokTickIT/docs/lab-02/ui-spec.md), and [tests.md](file:///d:/TokTickIT/docs/lab-02/tests.md).
- Defined business rules **BR-01 through BR-08**, Given-When-Then acceptance criteria, and REST API shapes.

### ISSUE-02: Database Schema & Seed Data
- Created PostgreSQL Prisma schema models for `RequesterUser`, `Category`, `RelatedSystem`, `Ticket`, and `Attachment`.
- Created idempotent seed script (`server/prisma/seed.ts`) populating 4 categories, 6 related systems, 4 active requesters, and 1 inactive requester.

### ISSUE-03: Development Requester User Context
- Implemented `GET /api/requesters` returning active users (`isActive = true`).
- Built header navbar dropdown context selector propagating `x-user-id` on all HTTP client requests.

### ISSUE-04: Ticket Creation Flow
- Implemented `POST /api/tickets` creating tickets linked to active requester with auto-generated ticket codes (`TKT-YYYY-XXXXXX`).
- Built Create Ticket form with client and server validation for summary (1–100 chars), description (1–1000 chars), priority, category, related system, and file attachments (max 5MB, JPG/PNG/WEBP/PDF).

### ISSUE-05: My Tickets Screen & Search/Filters
- Implemented `GET /api/tickets/my` (or `GET /api/tickets`) with strictly enforced requester data isolation.
- Built dashboard table/card view with debounced search, category/priority/status filters, column sorting, clear filters, and pagination controls (`page`, `limit`).

### ISSUE-06: Ticket Detail View & Access Control
- Implemented `GET /api/tickets/:id` enforcing requester ownership (HTTP `403 Forbidden` if owned by another requester, `404 Not Found` if missing).
- Built read-only Ticket Detail view with classification, description, status/priority badges, and "Back to My Tickets" navigation.

### ISSUE-07: Attachment Lifecycle Management
- Implemented file attachment upload (`POST /api/tickets/:id/attachments`), secure download (`GET /api/attachments/:id/download`), and soft-removal (`DELETE /api/tickets/:id/attachments/:attachmentId`).
- Enforced active attachment limits (max 5 total per ticket, max 3 at creation), file type/size validation, soft-deletion modal (`isRemoved = true`, removal reason prompt), and download blockage for removed items.

### ISSUE-08: E2E Testing & Visual Polish
- Developed Playwright end-to-end test suite (`e2e/requester-ticket-flow.spec.ts`) covering the full end-to-end user journey.
- Generated responsive visual audit screenshots across Desktop (1280px), Tablet (768px), and Mobile (375px) saved under `artifacts/lab-02/screenshots/`.

### ISSUE-09: Release Integration & Review Prep
- Merged feature PRs into `lab2-staging` and opened release PR to `main`.
- Documented peer review logs ([reviewer.md](file:///d:/TokTickIT/docs/lab-02/reviewer.md)) and AI reflection log ([ai-use.md](file:///d:/TokTickIT/docs/lab-02/ai-use.md)).

---

## 🎨 Zen Green Design System

TokTickIT utilizes a custom **Zen Green** design token system built on top of Bootstrap 5:

```css
:root {
  --zg-primary: #006B3C;          /* Deep Zen Green Header & Brand */
  --zg-primary-hover: #00542F;    /* Hover State Primary */
  --zg-accent: #0B7A46;           /* Buttons & Interactive Elements */
  --zg-accent-hover: #096339;     /* Accent Hover */
  --zg-surface-selected: #EAF6EF; /* Selected Row / Active Surface Light Tint */
  --zg-surface-card: #FFFFFF;     /* Pure White Card Surfaces */
  --zg-bg-main: #F8FAF9;          /* Subtle Off-White Page Background */
  --zg-border: #D1E5D9;          /* Soft Greenish Border */
  --zg-text-heading: #122119;     /* Dark High-Contrast Text */
  --zg-text-body: #3A4B40;        /* Muted Body Text */
  --zg-badge-new: #EBF5F0;        /* Status Pill - New */
}
```

### Key UI Features
- **Header Navbar:** Styled in Zen Green (`#006B3C`) with active user badge and simulated login selector modal.
- **Read-Only Fields:** Styled with soft gray-green background (`#F4F8F5`) to clearly distinguish read-only metadata from editable inputs.
- **Responsive Layout:** Automatically transforms table views on desktop (≥992px) to stacked cards on tablet/mobile (<768px).

---

## 💻 Getting Started & Setup

### Prerequisites
- **Node.js:** `v18.x` or later
- **npm:** `v9.x` or later
- **PostgreSQL:** `v15+` (local service or Docker container)

---

### Environment Configuration

#### Backend Environment (`server/.env`)
Create `server/.env` with the following variables:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/toktickit_db?schema=public"
PORT=3000
NODE_ENV=development
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

4. Execute idempotent database seeding:
   ```bash
   npm run prisma:seed
   ```
   *Seeding output populates 4 categories, 6 related systems, 4 active requesters, and 1 inactive requester.*

---

### Running Backend & Frontend

#### Start Backend Server (`server/`)
```bash
cd server
npm run dev
```
- Backend REST API will start at **`http://localhost:3000`**.

#### Start Frontend Client (`client/`)
```bash
cd client
npm install
npm run dev
```
- Frontend application will start at **`http://localhost:5173`**.

---

## 🔌 REST API Contract Reference

All secured endpoints require the `x-user-id` header representing the active requester ID.

| Method | Endpoint | Query / Body Params | Headers | Expected Status | Description |
|---|---|---|---|---|---|
| `GET` | `/api/health` | None | None | `200 OK` | System health check |
| `GET` | `/api/requesters` | None | None | `200 OK` | List active development requesters (`isActive = true`) |
| `GET` | `/api/categories` | None | None | `200 OK` | List active ticket categories |
| `GET` | `/api/related-systems` | None | None | `200 OK` | List active related systems |
| `POST` | `/api/tickets` | `summary`, `description`, `categoryId`, `relatedSystemId`, `requestedPriority`, `files` | `x-user-id` | `201 Created` | Create new ticket with file attachments |
| `GET` | `/api/tickets/my` | `search`, `categoryId`, `priority`, `status`, `sort`, `order`, `page`, `limit` | `x-user-id` | `200 OK` | Paginated ticket list strictly filtered by requester ID |
| `GET` | `/api/tickets/:id` | None | `x-user-id` | `200 OK` / `403` / `404` | Get single ticket detail (enforces requester ownership) |
| `POST` | `/api/tickets/:id/attachments` | `file` (multipart) | `x-user-id` | `201 Created` / `400` | Add attachment to existing ticket (max 5 active total) |
| `GET` | `/api/attachments/:id/download` | None | `x-user-id` | `200 OK` / `400` / `403` | Secure file download (blocked if soft-removed) |
| `DELETE` | `/api/tickets/:id/attachments/:attachmentId` | `removalReason` (JSON body) | `x-user-id` | `200 OK` / `403` / `404` | Soft-remove attachment (`isRemoved = true`) |

---

## 🧪 Testing & Quality Assurance

### 1. Server Integration Test Suite (`server/`)
Tests API endpoint contracts, Multer file upload validation, Prisma database transactions, requester data isolation, and security headers.

```bash
cd server
npm test
```
- **Result:** **7 test files, 36 passing tests (100% pass rate)**.

---

### 2. Client Component Test Suite (`client/`)
Tests Requester Context Selector, Ticket Form validation, My Tickets search/filters/pagination, Ticket Detail view, and attachment soft-deletion modal.

```bash
cd client
npm test
```
- **Result:** **6 test files, 32 passing tests (100% pass rate)**.

---

### 3. Playwright E2E & Responsive Visual Audit (`root/`)
Automated end-to-end test verifying the complete user flow from requester selection to ticket creation, dashboard lookup, ticket detail view, attachment soft-removal, and cross-requester isolation.

```bash
# Run E2E test suite headless
npx playwright test

# Run E2E test suite with UI runner
npx playwright test --ui
```
- **Result:** **1 test suite passing (100% pass rate)**.
- **Responsive Artifacts Generated:**
  - `artifacts/lab-02/screenshots/desktop-1280px.png`
  - `artifacts/lab-02/screenshots/tablet-768px.png`
  - `artifacts/lab-02/screenshots/mobile-375px.png`

---

## 📁 Project Directory Structure

```text
TokTickIT/
├── artifacts/                     # Generated visual audit screenshots
│   └── lab-02/
│       └── screenshots/           # Desktop, Tablet, & Mobile screenshots
├── client/                        # Frontend React Application
│   ├── public/                    # Static assets
│   ├── src/
│   │   ├── api.ts                 # API client wrapper with x-user-id header
│   │   ├── App.tsx                # Main App router & header navbar
│   │   ├── index.css              # Zen Green design system tokens & custom CSS
│   │   ├── components/            # UI components (Navbar, Modal, Forms)
│   │   └── pages/                 # Pages (ContextSelection, TicketCreate, MyTickets, TicketDetail)
│   └── tests/lab-02/              # React component test suites (Vitest + RTL)
├── server/                        # Backend Express REST API
│   ├── prisma/
│   │   ├── schema.prisma          # PostgreSQL Prisma database schema
│   │   ├── migrations/            # SQL migration history
│   │   └── seed.ts                # Idempotent database seed script
│   ├── src/
│   │   ├── app.ts                 # Express application setup & middleware
│   │   ├── index.ts               # Server startup entrypoint
│   │   ├── db.ts                  # Prisma database client instance
│   │   ├── middleware/            # Header auth & file upload middleware
│   │   └── routes/                # Express REST API route handlers
│   ├── uploads/                   # Sanitized file attachment storage
│   └── tests/lab-02/              # Supertest API endpoint integration tests
├── docs/                          # Project documentation
│   ├── lab-01/                    # Lab 01 deliverables
│   └── lab-02/                    # Lab 02 deliverables
│       ├── specification.md       # Complete Lab 02 specification & BRs
│       ├── api-spec.md            # REST API contract specification
│       ├── ui-spec.md             # Zen Green design system UI specification
│       ├── tests.md               # Test plan & Given-When-Then AC matrix
│       ├── reviewer.md            # Peer review record & approvals
│       └── ai-use.md              # AI pair programming log & reflection
└── e2e/                           # Playwright end-to-end test suite
    └── requester-ticket-flow.spec.ts
```

---

## 📄 Documentation & Lab Deliverables

All required Lab 02 deliverables are documented in `docs/lab-02/`:

- 📜 [**System Specification (`specification.md`)**](file:///d:/TokTickIT/docs/lab-02/specification.md): Complete sprint goal, functional requirements, and business rules (BR-01 to BR-08).
- 🔌 [**REST API Specification (`api-spec.md`)**](file:///d:/TokTickIT/docs/lab-02/api-spec.md): Endpoint routes, headers, body contracts, and status codes.
- 🎨 [**UI Specification (`ui-spec.md`)**](file:///d:/TokTickIT/docs/lab-02/ui-spec.md): Zen Green theme tokens, responsive breakpoints, and accessibility.
- 🧪 [**Test Strategy & AC Matrix (`tests.md`)**](file:///d:/TokTickIT/docs/lab-02/tests.md): Acceptance criteria traceability and test plan.
- 🤝 [**Peer Review Record (`reviewer.md`)**](file:///d:/TokTickIT/docs/lab-02/reviewer.md): Pull request review logs, comments, and approvals.
- 🤖 [**AI Use & Reflection (`ai-use.md`)**](file:///d:/TokTickIT/docs/lab-02/ai-use.md): AI pair programming prompt logs and reflection.

---

## 🤝 Peer Review & AI Reflection

- **Author:** Yotsapoom Liupolvanish (`67070503493`) — GitHub: [@JEWKEW](https://github.com/JEWKEW)
- **Peer Reviewer:** Chaiyaphoom Chenchirotphiphat (`67070503410`) — GitHub: [@maneejames](https://github.com/maneejames)
- **AI Pair Assistant:** Gemini 3.6 Flash (Antigravity AI Assistant)