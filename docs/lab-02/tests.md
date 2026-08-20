# Lab 02 — Test Strategy & Automated Test Plan

This document details the complete automated test matrix for **Lab 02 — Requester Ticketing System MVP**. Tests are divided into **Backend REST API Integration Suites** (`server/tests/lab-02/`) using Supertest & Vitest, and **Frontend Component & Integration Suites** (`client/tests/lab-02/`) using Vitest & React Testing Library.

---

## 1. Backend REST API Integration Test Plan (`server/tests/lab-02/`)

All server API tests run against Express endpoints using Supertest.

| Test ID | Endpoint | Scenario / Test Description | Expected Status & Result |
| :--- | :--- | :--- | :--- |
| **TC-API-01** | `GET /api/users/dev-list` | Fetch seeded development users list | `200 OK`, returns array containing seeded requesters with `id`, `name`, `role`. |
| **TC-API-02** | `POST /api/tickets` | Create valid ticket without attachments | `201 Created`, returns ticket object with generated `ticketCode` (`TCK-YYYYMMDD-XXXX`) and default status `OPEN`. |
| **TC-API-03** | `POST /api/tickets` | Create ticket with 2 valid file attachments (`.png`, `.pdf`) | `201 Created`, attachments array contains 2 records with `fileUrl` and `mimeType`. |
| **TC-API-04** | `POST /api/tickets` | Reject ticket creation missing required fields (title, category) | `400 Bad Request`, error code `VALIDATION_ERROR`. |
| **TC-API-05** | `POST /api/tickets` | Reject ticket with file attachment exceeding 5MB limit | `400 Bad Request`, error message indicates file size limit exceeded. |
| **TC-API-06** | `POST /api/tickets` | Reject ticket request missing `x-user-id` dev auth header | `401 Unauthorized`. |
| **TC-API-07** | `GET /api/tickets/my` | Retrieve paginated ticket list for active requester | `200 OK`, returns `items` array matching `x-user-id` and pagination `meta` (`currentPage`, `totalPages`, `totalItems`). |
| **TC-API-08** | `GET /api/tickets/my` | Search and filter ticket list by keyword and category | `200 OK`, filtered `items` only match query params `search` and `categoryId`. |
| **TC-API-09** | `GET /api/tickets/:id` | Attempt to view another user's ticket detail | `403 Forbidden` or `404 Not Found`. |
| **TC-API-10** | `DELETE /api/tickets/:id/attachments/:attachmentId` | Soft-delete an attachment owned by requester | `200 OK`, attachment record updated with `isDeleted: true` and `deletedAt` timestamp. |

---

## 2. Frontend Component & Integration Test Plan (`client/tests/lab-02/`)

All client UI tests run under Vitest with React Testing Library (RTL) and jsdom.

| Test ID | Component / Area | Scenario / Test Description | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-UI-01** | `DevUserSelector` | Render user context dropdown and switch active user | Selected user updates in context/localStorage, and `x-user-id` header is attached to API client requests. |
| **TC-UI-02** | `TicketForm` | Validate title minimum character length (5 chars) | Submitting title `< 5` characters renders inline validation warning. |
| **TC-UI-03** | `TicketForm` | Drag & Drop file attachment preview list | Dropping valid files adds file info chips with remove buttons before form submission. |
| **TC-UI-04** | `TicketForm` | Submit ticket creation form successfully | Submitting valid form triggers `POST /api/tickets`, shows success alert, and redirects to My Tickets. |
| **TC-UI-05** | `MyTicketsDashboard` | Render paginated ticket list table | Renders rows for tickets, status pills, category badges, and pagination controls. |
| **TC-UI-06** | `MyTicketsDashboard` | Filter tickets by search query input | Typing into search input debounces and filters rendered rows. |
| **TC-UI-07** | `MyTicketsDashboard` | Pagination page change interaction | Clicking page `"2"` fetches and displays page 2 tickets. |
| **TC-UI-08** | `TicketDetail` | Render read-only ticket detail view | Renders ticket metadata, status timeline pill, description, and active attachment list. |
| **TC-UI-09** | `TicketDetail` | Attachment soft-removal confirm modal | Clicking remove button opens confirmation modal; confirming triggers soft-delete API call. |
| **TC-UI-10** | `TicketDetail` | Soft-deleted attachment UI update | After soft-delete response, the deleted attachment chip vanishes from active view. |

---

## 3. Test Execution Commands & Environment Setup

### Backend API Tests (`server/`)
```bash
cd server
# Run Lab 02 backend integration test suite
npm test tests/lab-02/
```

### Frontend UI Tests (`client/`)
```bash
cd client
# Run Lab 02 frontend test suite
npm test tests/lab-02/
```

---

## 4. Test Evidence & Coverage Criteria

1. **Target API Test Coverage:** 100% endpoint pass rate across `TC-API-01` through `TC-API-10`.
2. **Target UI Test Coverage:** 100% component pass rate across `TC-UI-01` through `TC-UI-10`.
3. **Evidence Artifacts:** Detailed test summary table and test output logs will be recorded in `docs/lab-02/tests.md` upon implementation.
