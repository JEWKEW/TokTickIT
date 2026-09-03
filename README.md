# 🎫 TokTickIT — IT Service Desk Platform

**TokTickIT** is an enterprise-grade IT Service Desk ticketing platform built with an Express TypeScript backend, PostgreSQL via Prisma ORM, and a React Vite frontend styled with Bootstrap 5 and the **Zen Green** design system.

---

## 📌 Table of Contents

- [Overview & Architecture](#-overview--architecture)
- [Tech Stack](#-tech-stack)
- [Lab 02 Features Implemented](#-lab-02-features-implemented)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [API Endpoints Overview](#-api-endpoints-overview)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Documentation & Lab Deliverables](#-documentation--lab-deliverables)

---

## 🏗 Overview & Architecture

TokTickIT is structured as a monorepo containing decoupled client and server packages:

```text
TokTickIT/
├── client/              # Frontend React application (Vite + TypeScript)
│   ├── src/             # App components, API client, and Zen Green styling
│   └── tests/lab-02/    # Component & integration test suites (Vitest + RTL)
├── server/              # Backend Express REST API (TypeScript)
│   ├── prisma/          # Prisma schema, migrations, and seed scripts
│   ├── src/             # Express app handlers, routes, and DB handle
│   └── tests/lab-02/    # API integration test suites (Supertest + Vitest)
├── e2e/                 # Playwright E2E & responsive visual audit test suite
├── artifacts/           # Responsive screenshot evidence artifacts
└── docs/                # Lab documentation & peer review records
    ├── lab-01/          # Lab 01 deliverables
    └── lab-02/          # Lab 02 deliverables (specification, tests, ui-spec, api-spec, reviewer, ai-use)
```

---

## 🛠 Tech Stack

### Backend (`server/`)
- **Runtime & Framework:** Node.js, Express.js (TypeScript)
- **Database & ORM:** PostgreSQL, Prisma ORM
- **File Storage:** Multer middleware with local sanitized uploads
- **Testing:** Vitest, Supertest

### Frontend (`client/`)
- **Framework & Build Tool:** React 18, Vite (TypeScript)
- **UI & Styling:** Bootstrap 5, Zen Green CSS design tokens
- **Testing:** Vitest, React Testing Library, jsdom

### End-to-End (`e2e/`)
- **Testing Framework:** Playwright (Chromium) across Desktop (1280px), Tablet (768px), and Mobile (375px) viewports.

---

## 🚀 Lab 02 Features Implemented

1. **Development Requester Selection ("Fake Login"):**
   - Active-only requester selector dropdown in navbar (`isActive = true`).
   - Persisted identity display in app header with `x-user-id` HTTP header propagation.
   - Live data fetching from PostgreSQL with loading, empty, and failure state handling.

2. **Ticket Creation with File Attachments:**
   - Client and server-side validation for required fields (Category, Related System, Summary, Description, Requested Priority).
   - Auto-generation of unique ticket numbers (`TKT-YYYY-XXXXXX`).
   - File attachment support (JPG, PNG, WEBP, PDF up to 5MB, max 3 files at creation).
   - Read-only field styling, inline validation messages, and submit busy/duplicate-prevention states.

3. **Paginated "My Tickets" Dashboard:**
   - Requester-scoped query isolation.
   - Debounced search (ticket number & summary) and multi-field filters (Category, Priority, Status).
   - Sort controls (date, priority, status) and pagination controls (`page`, `limit`).
   - Responsive multi-column table on desktop and stacked card view on mobile.

4. **Read-Only Ticket Detail & Attachment Soft-Removal:**
   - Server-enforced ownership checks (HTTP 403 Forbidden for unauthorized users).
   - Read-only display of ticket metadata, status, and description.
   - Attachment soft-deletion (`isRemoved = true`, `removedAt`, `removalReason`) with confirmation modal.
   - Download restriction for soft-removed files.

---

## 💻 Getting Started

### Prerequisites
- **Node.js**: `v18.x` or later
- **npm**: `v9.x` or later
- **PostgreSQL**: Running instance or Docker container

### Backend Setup (`server/`)

1. Change directory to `server`:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/toktickit_db?schema=public"
   PORT=3000
   ```
4. Run database migrations & seed data:
   ```bash
   npm run prisma:migrate
   npm run prisma:seed
   ```
5. Start backend dev server:
   ```bash
   npm run dev
   ```
   Server runs at `http://localhost:3000`.

### Frontend Setup (`client/`)

1. Change directory to `client`:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start Vite dev server:
   ```bash
   npm run dev
   ```
   Frontend app runs at `http://localhost:5173`.

---

## 🔌 API Endpoints Overview

| Method | Endpoint | Description | Auth / Scope |
|---|---|---|---|
| `GET` | `/api/health` | Health check endpoint | Public |
| `GET` | `/api/requesters` | List active development requesters | Public |
| `GET` | `/api/categories` | List active categories | Public |
| `GET` | `/api/related-systems` | List active related systems | Public |
| `POST` | `/api/tickets` | Create new ticket with file attachments | `x-user-id` |
| `GET` | `/api/tickets/my` | Paginated ticket list for active requester | `x-user-id` |
| `GET` | `/api/tickets/:id` | Single ticket detail view | `x-user-id` (Owner) |
| `POST` | `/api/tickets/:id/attachments` | Upload attachment to existing ticket | `x-user-id` (Owner) |
| `GET` | `/api/attachments/:id/download` | Download active file attachment | `x-user-id` (Owner) |
| `DELETE` | `/api/tickets/:id/attachments/:attachmentId` | Soft-remove attachment | `x-user-id` (Owner) |

---

## 🧪 Testing & Quality Assurance

### Server Integration Test Suite (`server/`)
```bash
cd server
npm test
```
*Result:* 7 test files, 36 tests passing (100% pass rate).

### Client Component Test Suite (`client/`)
```bash
cd client
npm test
```
*Result:* 6 test files, 32 tests passing (100% pass rate).

### Playwright E2E & Responsive Visual Audit (`root`)
```bash
npx playwright test
```
*Result:* 1 test suite passing (100% pass rate), generating responsive screenshot artifacts under `artifacts/lab-02/screenshots/`.

---

## 📄 Documentation & Lab Deliverables

Lab 02 documentation files are located under `docs/lab-02/`:

- 📜 [**System Specification**](file:///d:/TokTickIT/docs/lab-02/specification.md) (All 11 required sections)
- 🔌 [**REST API Specification**](file:///d:/TokTickIT/docs/lab-02/api-spec.md)
- 🎨 [**Responsive UI & Zen Green Spec**](file:///d:/TokTickIT/docs/lab-02/ui-spec.md)
- 🧪 [**Test Strategy & AC Traceability**](file:///d:/TokTickIT/docs/lab-02/tests.md)
- 🤝 [**Peer Review Record**](file:///d:/TokTickIT/docs/lab-02/reviewer.md)
- 🤖 [**AI Use & Reflection**](file:///d:/TokTickIT/docs/lab-02/ai-use.md)

---

**Author:** Yotsapoom Liupolvanish (`67070503493`) — GitHub: [@JEWKEW](https://github.com/JEWKEW)