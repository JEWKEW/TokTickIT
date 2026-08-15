# 🎫 TokTickIT — IT Service Desk

**TokTickIT** is an enterprise-grade IT Service Desk ticketing platform built with Express TypeScript backend, PostgreSQL via Prisma ORM, and a React Vite frontend styled with Bootstrap 5.

---

## 📌 Table of Contents

- [Overview & Architecture](#-overview--architecture)
- [Tech Stack](#-tech-stack)
- [Lab 01 Features Implemented](#-lab-01-features-implemented)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [API Endpoints](#-api-endpoints)
- [Testing](#-testing)
- [Documentation & Lab Submission](#-documentation--lab-submission)

---

## 🏗 Overview & Architecture

TokTickIT is structured as a monorepo containing decoupled client and server packages:

```text
TokTickIT/
├── client/              # Frontend React application (Vite + TS)
│   ├── src/             # App component and API client
│   └── tests/lab-01/    # Component & integration test suites (Vitest + RTL)
├── server/              # Backend Express REST API (TypeScript)
│   ├── prisma/          # Prisma schema, migrations, and seed scripts
│   ├── src/             # Express app, server entrypoint, and DB handle
│   └── tests/lab-01/    # API integration test suites (Supertest + Vitest)
└── docs/                # Lab documentation & peer review records
    └── lab-01/          # Lab 01 deliverables (tests, reviewer log, AI reflection)
```

---

## 🛠 Tech Stack

### Backend (`server/`)
- **Runtime & Framework:** Node.js, Express.js (TypeScript)
- **Database & ORM:** PostgreSQL, Prisma ORM
- **Development Tooling:** `tsx` watcher
- **Testing:** Vitest, Supertest

### Frontend (`client/`)
- **Framework & Build Tool:** React 18, Vite (TypeScript)
- **UI & Styling:** Bootstrap 5
- **Testing:** Vitest, React Testing Library, jsdom

---

## 🚀 Lab 01 Features Implemented

1. **System Health Check Endpoint:** `GET /api/health` returning operational status.
2. **Category Database Seeding:** Seeded 4 default IT request categories:
   - Account and Access
   - Hardware
   - Software
   - Network
3. **Category List Endpoint:** `GET /api/categories` returning category records sorted predictably by ID.
4. **Interactive Dashboard UI:** React interface with state management for checking connection, loading state, online/offline status, and active category listings.
5. **Automated Test Coverage:** Comprehensive Supertest backend tests and Vitest/RTL frontend tests.

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
3. Configure environment variables:
   Copy `.env.example` to `.env` and set your `DATABASE_URL`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/toktickit_db?schema=public"
   PORT=3000
   ```
4. Run database migrations & seed categories:
   ```bash
   npm run prisma:migrate
   npm run prisma:seed
   ```
5. Start backend development server:
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
   Frontend application will be available at `http://localhost:5173`.

---

## 🔌 API Endpoints

| Method | Endpoint | Description | Expected Response |
|---|---|---|---|
| `GET` | `/api/health` | Health check endpoint | `{ "status": "ok", "service": "TokTickIT API" }` |
| `GET` | `/api/categories` | Retrieve all seeded categories | `[{ "id": 1, "name": "Account and Access" }, ...]` |

---

## 🧪 Testing

### Server Test Suite
Runs Supertest API integration tests against Express endpoints.
```bash
cd server
npm test
```

### Client Test Suite
Runs Vitest and React Testing Library tests for UI state rendering.
```bash
cd client
npm test
```

---

## 📄 Documentation & Lab Submission

Lab deliverables and peer review records are stored under `docs/lab-01/`:

- 📜 [**Test Plan & Evidence**](file:///d:/TokTickIT/docs/lab-01/tests.md)
- 🤝 [**Peer Review Record**](file:///d:/TokTickIT/docs/lab-01/reviewer.md)
- 🤖 [**AI Use & Reflection**](file:///d:/TokTickIT/docs/lab-01/ai_use.md)

---

**Author:** Yotsapoom Liupolvanish (`67070503493`) — GitHub: [@JEWKEW](https://github.com/JEWKEW)