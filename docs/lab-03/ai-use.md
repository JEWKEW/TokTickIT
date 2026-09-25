# TokTickIT Lab 3 — AI Use Documentation & Agent Reflection

## 1. Large Language Models (LLMs) Employed

| Task Phase | LLM Name & Model Version | Primary Use Case |
| :--- | :--- | :--- |
| **Specification & Test DD** | **Gemini 3.6 Flash** | Drafting `specification.md`, `api-spec.md`, `ui-spec.md`, authorization matrix, business rules, and Acceptance Criteria. |
| **Implementation & TDD** | **Gemini 3.6 Flash** | Generating Express REST API endpoints, Prisma migrations, React components, Vitest integration tests, and Playwright E2E spec files. |

---

## 2. Selected Key Prompts (8 Key Prompts)

### Prompt 1: Authentication & Password Change Specification
> *"Draft functional requirements and business rules for real email/password authentication replacing the Lab 2 requester selector. Include mandatory first-login password change rules (`mustChangePassword = true`), password complexity validation, and JWT session handling."*

### Prompt 2: Database Schema & Migration Strategy
> *"Design the Prisma database schema evolution for unified User models (with roles REQUESTER, IT_STAFF, ADMINISTRATOR), Ticket ownership (`ownerId`), IT Priority, append-only PublicComment, and InternalNote models while preserving all Lab 2 ticket/attachment data."*

### Prompt 3: Authorization Matrix & Middleware Enforcement
> *"Construct a strict backend Authorization Matrix mapping every REST API endpoint to permitted roles. Ensure server-side enforcement using Express middleware (`requireAuth`, `requireRole`, `requireOwnerOrStaff`) and return safe 401/403 HTTP error responses."*

### Prompt 4: IT Staff Ticket Queue & Query Standards
> *"Implement `GET /api/tickets/queue` supporting keyword search (`q`), status filters, priority filters, owner filters, category filters, column sorting, and pagination metadata. Ensure default ordering by `createdAt` descending."*

### Prompt 5: Public Comments vs. Internal Notes Differentiation
> *"Create API endpoints and React UI tabs for Public Comments and Internal Notes. Ensure Internal Notes are strictly forbidden for Requesters (HTTP 403) and styled with a distinct warm-amber visual theme (`--zg-internal-note-bg`)."*

### Prompt 6: Administrator User Management & Safety Constraints
> *"Implement Administrator User Management API and UI components (`UserManagement.tsx`) supporting user listing, search, role filtering, creation, editing, and password reset. Enforce safety rules preventing self-deactivation and preventing removal of the last active Administrator."*

### Prompt 7: Playwright End-to-End Suite & AC Traceability
> *"Write three Playwright E2E spec files under `e2e/lab-03/` (`authentication.spec.ts`, `staff-ticket-flow.spec.ts`, `user-administration.spec.ts`) covering all 12 Acceptance Criteria with traceable comment headers."*

### Prompt 8: Responsive Screenshot Automation & Audit Checklist
> *"Automate responsive screenshot capturing across Desktop (1280px), Tablet (768px), and Mobile (375px) for all required Lab 3 screens in `artifacts/lab-03/screenshots/` and produce a completed Visual Audit Checklist."*

---

## 3. My Reflection

### (a) Reflection on Using the AI Specification Agent
Using the AI specification agent during Sprint 3 was essential for establishing clear boundaries before writing code. Drafting `specification.md`, `api-spec.md`, and `ui-spec.md` with Gemini 3.6 Flash ensured that complex business rules—such as the permitted status transition matrix, requester resolution indication vs. formal IT staff resolution, and administrator safety rules—were explicitly documented upfront. The AI helped structure a complete Authorization Matrix mapping every endpoint to permitted roles, which prevented authorization oversights during backend implementation. Having a rigorous specification reduced ambiguity and provided a clear roadmap for Acceptance Criteria (AC-01 to AC-12) and TDD test design.

### (b) Reflection on Using the AI Coding Agent
Working with the AI coding agent accelerated development while maintaining architectural discipline. The AI agent generated backend Express routes, Prisma queries, React components, and Playwright E2E tests efficiently. The main learning outcome was the importance of rigorous human-in-the-loop verification: while the AI agent wrote clean, modular TypeScript code, I had to ensure that database migrations preserved existing Lab 2 ticket/attachment data, backend middleware strictly enforced server-side authorization rather than relying on UI hidden buttons, and Playwright tests cleanly captured responsive evidence across all three viewports. Overall, combining specification-driven prompt engineering with automated test verification resulted in a robust, zero-regression software increment.
