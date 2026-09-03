# Lab 02 — Test Strategy & Automated Test Plan

This document details the complete automated test matrix for **Lab 02 — Requester Ticketing System MVP**. Tests are divided into **Backend REST API Integration Suites** (`server/tests/lab-02/`) using Supertest & Vitest, **Frontend Component & Integration Suites** (`client/tests/lab-02/`) using Vitest & React Testing Library, and **End-to-End Visual Audit Suites** (`e2e/requester-ticket-flow.spec.ts`) using Playwright.

---

## 1. Backend REST API Integration Test Plan (`server/tests/lab-02/`)

All server API tests run against Express endpoints using Supertest and an isolated PostgreSQL test context.

| Test ID | Endpoint / Subject | Scenario / Test Description | Expected Status & Result |
| :--- | :--- | :--- | :--- |
| **TC-API-01** | `GET /api/requesters` | Fetch active development requesters (`isActive = true`) | `200 OK`, returns array of active requesters excluding inactive user (Evan Wright). |
| **TC-API-02** | `POST /api/tickets` | Create valid ticket without attachments | `201 Created`, returns ticket object with generated `ticketNumber` (`TKT-YYYY-XXXXXX`) and status `"New"`. |
| **TC-API-03** | `POST /api/tickets` | Create ticket with valid file attachments (`.png`, `.pdf`) | `201 Created`, attachments array contains uploaded file records. |
| **TC-API-04** | `POST /api/tickets` | Reject ticket missing required fields (summary, category, description) | `400 Bad Request`, error code `VALIDATION_ERROR`. |
| **TC-API-05** | `POST /api/tickets` | Reject ticket with file attachment exceeding 5MB limit | `400 Bad Request`, error message indicates 5MB limit exceeded. |
| **TC-API-06** | `POST /api/tickets` | Reject ticket request missing `x-user-id` dev auth header | `401 Unauthorized`. |
| **TC-API-07** | `GET /api/tickets/my` | Retrieve paginated ticket list for active requester | `200 OK`, returns `items` array matching requester ID and pagination `meta` (`currentPage`, `totalPages`, `totalItems`). |
| **TC-API-08** | `GET /api/tickets/my` | Search and filter ticket list by keyword, category, and priority | `200 OK`, filtered `items` match query params. |
| **TC-API-09** | `GET /api/tickets/:id` | Attempt to view another requester's ticket detail | `403 Forbidden` (`"You do not have permission to view this ticket"`). |
| **TC-API-10** | `DELETE /api/tickets/:id/attachments/:attachmentId` | Soft-delete an attachment owned by requester | `200 OK`, attachment record updated with `isRemoved: true`, `removedAt`, and `removalReason`. |

---

## 2. Frontend Component & Integration Test Plan (`client/tests/lab-02/`)

All client UI tests run under Vitest with React Testing Library (RTL) and jsdom.

| Test ID | Component / Area | Scenario / Test Description | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-UI-01** | `RequesterSelection` | Render user context dropdown and switch active user | Selected user updates in context/localStorage, and `x-user-id` header is attached to API requests. |
| **TC-UI-02** | `CreateTicketForm` | Validate empty required fields and summary character overrun | Submitting empty form renders red asterisks and field-level inline error messages below inputs. |
| **TC-UI-03** | `CreateTicketForm` | Drag & Drop / file selector attachment preview list | Dropping valid files adds file info chips with remove buttons before form submission. |
| **TC-UI-04** | `CreateTicketForm` | Submit ticket creation form successfully | Submitting valid form triggers `POST /api/tickets`, disables submit button, shows success screen with generated Ticket Number. |
| **TC-UI-05** | `MyTicketsList` | Render paginated ticket list table | Renders rows for tickets, status pills, category badges, and pagination controls. |
| **TC-UI-06** | `MyTicketsList` | Filter tickets by search query input | Typing into search input debounces and filters rendered rows. |
| **TC-UI-07** | `MyTicketsList` | Pagination page change interaction | Clicking page numbers fetches and displays the selected page of tickets. |
| **TC-UI-08** | `TicketDetail` | Render read-only ticket detail view | Renders ticket metadata, status pill, priority badge, description, and active attachment list. |
| **TC-UI-09** | `TicketDetail` | Attachment soft-removal confirmation modal | Clicking remove button opens modal; confirming triggers soft-delete API call. |
| **TC-UI-10** | `TicketDetail` | Soft-deleted attachment UI update | After soft-delete response, the attachment status changes to "Soft Removed" badge and download is disabled. |

---

## 3. End-to-End & Responsive Visual Audit Plan (`e2e/`)

Runs full user workflows and layout audits across 3 viewports using Playwright.

| Test ID | Flow / Audit Area | Viewports Tested | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-E2E-01** | Full Requester Lifecycle | Desktop (1280px), Tablet (768px), Mobile (375px) | Complete E2E flow: Dev user selection → Ticket Creation with attachment → My Tickets list lookup → Ticket Detail inspection → Attachment soft-removal → Cross-requester security switch verification. Zero horizontal page overflow (`scrollWidth <= innerWidth`). |

---

## 4. Acceptance Criteria (AC) Traceability Matrix

| AC ID | Acceptance Criteria Summary | Mapped Test Cases | Pass Status |
| :--- | :--- | :--- | :---: |
| **AC-01** | Dev User Selector & Context Header | `TC-API-01`, `TC-UI-01`, `TC-E2E-01` | ✅ PASS |
| **AC-02** | Valid Ticket Creation with Attachments | `TC-API-02`, `TC-API-03`, `TC-UI-04`, `TC-E2E-01` | ✅ PASS |
| **AC-03** | Invalid File Attachment Rejection | `TC-API-04`, `TC-API-05`, `TC-UI-02`, `TC-UI-03` | ✅ PASS |
| **AC-04** | Paginated My Tickets Retrieval | `TC-API-07`, `TC-UI-05`, `TC-UI-07`, `TC-E2E-01` | ✅ PASS |
| **AC-05** | Search, Filter & Sort My Tickets | `TC-API-08`, `TC-UI-06`, `TC-E2E-01` | ✅ PASS |
| **AC-06** | Ticket Detail Access Control (403 Forbidden) | `TC-API-09`, `TC-UI-08`, `TC-E2E-01` | ✅ PASS |
| **AC-07** | Attachment Soft-Deletion by Owner | `TC-API-10`, `TC-UI-09`, `TC-UI-10`, `TC-E2E-01` | ✅ PASS |

---

## 5. Test Execution Commands & Environment Setup

### Backend API Integration Tests (`server/`)
```bash
cd server
npm test tests/lab-02/
```

### Frontend UI Component Tests (`client/`)
```bash
cd client
npm test tests/lab-02/
```

### Playwright End-to-End & Responsive Visual Audit (`root`)
```bash
npx playwright test
```

---

## 6. Full Passing Test Execution Log Output

### 6.1 Server Vitest Integration Test Suite Output (36/36 Passed)
```text
 RUN  v2.1.9 D:/TokTickIT/server

 ✓ tests/lab-01/health.test.ts (1 test) 24ms
 ✓ tests/lab-02/ticket-detail.test.ts (6 tests) 57ms
 ✓ tests/lab-02/my-tickets.test.ts (5 tests) 62ms
 ✓ tests/lab-01/categories.test.ts (1 test) 68ms
 ✓ tests/lab-02/requesters.test.ts (3 tests) 85ms
 ✓ tests/lab-02/tickets.test.ts (5 tests) 161ms
 ✓ tests/lab-02/attachments.test.ts (15 tests) 182ms

 Test Files  7 passed (7)
      Tests  36 passed (36)
   Start at  11:16:09
   Duration  1.59s
```

### 6.2 Client Vitest Component Test Suite Output (32/32 Passed)
```text
 RUN  v2.1.9 D:/TokTickIT/client

 ✓ tests/lab-02/TicketDetail.test.tsx (5 tests) 200ms
 ✓ tests/lab-02/CreateTicketForm.test.tsx (5 tests) 255ms
 ✓ tests/lab-02/RequesterSelection.test.tsx (4 tests) 233ms
 ✓ tests/lab-02/MyTicketsList.test.tsx (9 tests) 398ms
 ✓ tests/lab-01/App.test.tsx (4 tests) 367ms
 ✓ tests/lab-02/AttachmentLifecycle.test.tsx (5 tests) 544ms

 Test Files  6 passed (6)
      Tests  32 passed (32)
   Start at  11:16:24
   Duration  3.28s
```

### 6.3 Playwright E2E Test Output (1/1 Passed)
```text
Running 1 test using 1 worker

  ok 1 [chromium] › e2e\requester-ticket-flow.spec.ts:35:3 › Requester Ticket Flow & Comprehensive Visual Audit (Lab 02 - ISSUE-08) › Complete End-to-End Requester Flow & Full Responsive Screenshots (5.1s)

  1 passed (6.0s)
```

---

## 7. Responsive Visual Audit Screenshot Inventory

All responsive audit screenshots are saved in `artifacts/lab-02/screenshots/`:

| Screen / View | Desktop (1280px) | Tablet (768px) | Mobile (375px) |
| :--- | :--- | :--- | :--- |
| **Dev Requester Selection** | `desktop-requester-select.png` | `tablet-requester-select.png` | `mobile-requester-select.png` |
| **Create Ticket Form** | `desktop-create-ticket.png` | `tablet-create-ticket.png` | `mobile-create-ticket.png` |
| **My Tickets Dashboard** | `desktop-dashboard.png` | `tablet-dashboard.png` | `mobile-dashboard.png` |
| **Ticket Detail View** | `desktop-ticket-detail.png` | `tablet-ticket-detail.png` | `mobile-ticket-detail.png` |
| **Soft-Removed Attachment** | `desktop-soft-removed-attachment.png` | `tablet-soft-removed-attachment.png` | `mobile-ticket-detail.png` |

---

## 8. Known Limitations & Assumptions

1. **Simulated Auth Header:** Tests rely on `x-user-id` header injection. Real authentication tokens (JWT) will replace this header in Lab 03.
2. **File System Cleanup:** E2E and integration tests generate mock files in `server/uploads/`, which are retained for inspection and cleaned up between migration resets.
