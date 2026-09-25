# Lab 03 — Test Strategy & Automated Test Plan

This document details the complete automated test matrix for **Lab 03 — TokTickIT Users, Roles, IT Staff Ticketing, and Admin Screens**. Tests are divided into **Backend REST API Integration Test Suites** (`server/tests/lab-03/`) using Vitest & Supertest, **Frontend UI Component Test Suites** (`client/tests/lab-03/`) using Vitest & React Testing Library (RTL), and **End-to-End Visual Audit Suites** (`e2e/lab-03/`) using Playwright.

---

## 1. Backend REST API Integration Test Plan (`server/tests/lab-03/`)

Runs against Express API endpoints with an isolated PostgreSQL database instance.

### 1.1. Authentication & Password Management (`server/tests/lab-03/auth.api.test.ts`)

| Test ID | Endpoint | Scenario / Test Description | Expected Status & Result |
| :--- | :--- | :--- | :--- |
| **TC-API-AUTH-01** | `POST /api/auth/login` | Authenticate active user with valid credentials | `200 OK`, returns user profile, role, and bearer token. |
| **TC-API-AUTH-02** | `POST /api/auth/login` | Reject login with wrong password | `401 Unauthorized`, safe error message. |
| **TC-API-AUTH-03** | `POST /api/auth/login` | Reject login for inactive account (`isActive = false`) | `401 Unauthorized`, generic safe error message. |
| **TC-API-AUTH-04** | `GET /api/auth/me` | Fetch authenticated user profile with valid token | `200 OK`, returns user payload. |
| **TC-API-AUTH-05** | `POST /api/auth/change-password` | Update initial password when `mustChangePassword = true` | `200 OK`, updates password hash and sets `mustChangePassword = false`. |
| **TC-API-AUTH-06** | `POST /api/auth/change-password` | Reject password change if weak password or mismatch | `400 Bad Request`, validation error details. |
| **TC-API-AUTH-07** | `POST /api/auth/logout` | Perform session logout | `200 OK`, session invalidated. |

---

### 1.2. Role Authorization & Data Ownership (`server/tests/lab-03/authorization.api.test.ts`)

| Test ID | Endpoint | Scenario / Test Description | Expected Status & Result |
| :--- | :--- | :--- | :--- |
| **TC-API-AUTHZ-01** | `GET /api/tickets/my` | Requester retrieves owned tickets | `200 OK`, returns only tickets matching `requesterId === auth.user.id`. |
| **TC-API-AUTHZ-02** | `GET /api/tickets/:id` | Requester attempts to view another user's ticket | `403 Forbidden` or `404 Not Found`. |
| **TC-API-AUTHZ-03** | `GET /api/tickets/queue` | Requester attempts to access IT Staff queue | `403 Forbidden`. |
| **TC-API-AUTHZ-04** | `GET /api/admin/users` | IT Staff attempts to access Admin user management | `403 Forbidden`. |
| **TC-API-AUTHZ-05** | Any protected API | Call endpoint when `mustChangePassword = true` | `403 Password Change Required`. |

---

### 1.3. IT Staff Ticket Queue & Workflow (`server/tests/lab-03/staff-queue.api.test.ts`)

| Test ID | Endpoint | Scenario / Test Description | Expected Status & Result |
| :--- | :--- | :--- | :--- |
| **TC-API-QUEUE-01** | `GET /api/tickets/queue` | IT Staff fetches ticket queue with default pagination | `200 OK`, returns paginated tickets across all requesters. |
| **TC-API-QUEUE-02** | `GET /api/tickets/queue` | Filter queue by keyword search (`q=laptop`) and status (`Open`) | `200 OK`, items match search term and status. |
| **TC-API-QUEUE-03** | `GET /api/tickets/queue` | Filter queue by owner (`ownerId=unassigned`) and priority | `200 OK`, items match owner and priority filters. |

---

### 1.4. IT Staff Operational Workflow (`server/tests/lab-03/staff-ticket-detail.api.test.ts`)

| Test ID | Endpoint | Scenario / Test Description | Expected Status & Result |
| :--- | :--- | :--- | :--- |
| **TC-API-WORKFLOW-01** | `PATCH /api/tickets/:id/assign` | IT Staff claims unassigned ticket ownership | `200 OK`, updates `ownerId` to authenticated IT Staff ID. |
| **TC-API-WORKFLOW-02** | `PATCH /api/tickets/:id/it-priority` | IT Staff updates IT Priority to `Urgent` | `200 OK`, updates `itPriority`. |
| **TC-API-WORKFLOW-03** | `PATCH /api/tickets/:id/status` | Execute valid status transition (`New` ➔ `In Progress`) | `200 OK`, updates `currentStatus`. |
| **TC-API-WORKFLOW-04** | `PATCH /api/tickets/:id/status` | Reject invalid status transition (`Closed` ➔ `In Progress`) | `400 Bad Request`, status transition error. |
| **TC-API-WORKFLOW-05** | `PATCH /api/tickets/:id/indicate-resolved` | Requester indicates problem appears resolved | `200 OK`, sets `requesterResolvedIndicated = true`. |

---

### 1.5. Public Comments & Internal Notes (`server/tests/lab-03/comments-notes.api.test.ts`)

| Test ID | Endpoint | Scenario / Test Description | Expected Status & Result |
| :--- | :--- | :--- | :--- |
| **TC-API-COMM-01** | `POST /api/tickets/:id/comments` | Requester posts Public Comment on owned ticket | `201 Created`, records author and timestamp. |
| **TC-API-COMM-02** | `GET /api/tickets/:id/comments` | IT Staff views Public Comments list | `200 OK`, returns chronological comments. |
| **TC-API-COMM-03** | `POST /api/tickets/:id/internal-notes` | IT Staff posts private Internal Note | `201 Created`, internal note saved. |
| **TC-API-COMM-04** | `GET /api/tickets/:id/internal-notes` | Requester attempts to fetch Internal Notes | `403 Forbidden`, no note content exposed. |
| **TC-API-COMM-05** | `POST /api/tickets/:id/comments` | Reject empty or whitespace-only comment | `400 Bad Request`. |

---

### 1.6. Administrator User Management (`server/tests/lab-03/users-admin.api.test.ts`)

| Test ID | Endpoint | Scenario / Test Description | Expected Status & Result |
| :--- | :--- | :--- | :--- |
| **TC-API-ADMIN-01** | `GET /api/admin/users` | Admin lists users with keyword search and role filter | `200 OK`, returns matching user list. |
| **TC-API-ADMIN-02** | `POST /api/admin/users` | Admin creates new IT Staff user account | `201 Created`, user created with `mustChangePassword = true`. |
| **TC-API-ADMIN-03** | `POST /api/admin/users` | Reject user creation with duplicate email address | `409 Conflict`, duplicate email error. |
| **TC-API-ADMIN-04** | `PATCH /api/admin/users/:id` | Admin updates user name, email, and role | `200 OK`, profile updated. |
| **TC-API-ADMIN-05** | `PATCH /api/admin/users/:id` | Reject Admin self-deactivation attempt | `400 Bad Request`, self-deactivation forbidden. |
| **TC-API-ADMIN-06** | `PATCH /api/admin/users/:id` | Reject deactivation of last active Administrator | `400 Bad Request`, last active admin protection error. |
| **TC-API-ADMIN-07** | `POST /api/admin/users/:id/reset-password` | Admin sets new initial password for user | `200 OK`, flags `mustChangePassword = true`. |

---

## 2. Frontend UI Component Test Plan (`client/tests/lab-03/`)

Tested under Vitest, React Testing Library, and jsdom.

| Test ID | Test File / Component | Scenario / Description | Expected UI Behavior |
| :--- | :--- | :--- | :--- |
| **TC-UI-01** | `Login.test.tsx` | Render login form and submit invalid credentials | Displays red validation feedback and alert banner. |
| **TC-UI-02** | `ChangePassword.test.tsx` | Render mandatory password change form | Password rules checklist updates dynamically; submit disabled until valid. |
| **TC-UI-03** | `StaffTicketQueue.test.tsx` | Render IT Queue with search, filter, and pagination | Table renders status pills, priority badges, and updates on filter selection. |
| **TC-UI-04** | `StaffTicketDetail.test.tsx` | Render IT Ticket Detail operational controls | Owner dropdown, IT Priority dropdown, status transition dropdown, and distinct Internal Notes visual alert. |
| **TC-UI-05** | `UserManagement.test.tsx` | Render User Management list & create drawer | User table displays status badges; create modal validates empty inputs and duplicate emails. |

---

## 3. End-to-End & Responsive Visual Audit Plan (`e2e/lab-03/`)

Full Playwright browser workflow suites tested across Desktop (1280px), Tablet (768px), and Mobile (375px).

| Test ID | Test File / Flow | Scenario / Description | Expected Result | Automated Test File | Final |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-E2E-01** | `authentication.spec.ts` | Login ➔ Mandatory Password Change ➔ Logout ➔ Direct URL Protection | Successful first-login password change flow, navbar profile update, logout cleanup, and route blocking. | `e2e/lab-03/authentication.spec.ts` | Pass |
| **TC-E2E-02** | `staff-ticket-flow.spec.ts` | IT Staff Queue ➔ Claim Ticket ➔ Change IT Priority ➔ Post Public Comment & Internal Note ➔ Transition Status | Complete IT Staff operational lifecycle across desktop, tablet, and mobile viewports. | `e2e/lab-03/staff-ticket-flow.spec.ts` | Pass |
| **TC-E2E-03** | `user-administration.spec.ts` | Admin User Management ➔ Create User ➔ Edit Profile ➔ Reset Initial Password ➔ Verify Safety Rules | Admin creates account, attempts self-deactivation (blocked), resets password, and verifies new user initial login. | `e2e/lab-03/user-administration.spec.ts` | Pass |

---

## 4. Acceptance Criteria (AC) Traceability Matrix

| AC ID | Acceptance Criteria Summary | Mapped Test Cases | Planned Status | Final Status |
| :--- | :--- | :--- | :---: | :---: |
| **AC-01** | Login returns user profile, role, & token | `TC-API-AUTH-01`, `TC-UI-01`, `TC-E2E-01` | ✅ Planned | Pass |
| **AC-02** | Mandatory password change enforcement | `TC-API-AUTH-05`, `TC-API-AUTHZ-05`, `TC-UI-02`, `TC-E2E-01` | ✅ Planned | Pass |
| **AC-03** | Invalid credential / inactive account handling | `TC-API-AUTH-02`, `TC-API-AUTH-03`, `TC-UI-01` | ✅ Planned | Pass |
| **AC-04** | Requester ticket ownership isolation | `TC-API-AUTHZ-01`, `TC-API-AUTHZ-02` | ✅ Planned | Pass |
| **AC-05** | Public comment & indicate resolved | `TC-API-WORKFLOW-05`, `TC-API-COMM-01`, `TC-E2E-02` | ✅ Planned | Pass |
| **AC-06** | Internal Note forbidden for Requester | `TC-API-COMM-04` | ✅ Planned | Pass |
| **AC-07** | IT Queue search, filter, sort, & pagination | `TC-API-QUEUE-01`, `TC-API-QUEUE-02`, `TC-UI-03`, `TC-E2E-02` | ✅ Planned | Pass |
| **AC-08** | IT Staff claim ownership, priority, & status transition | `TC-API-WORKFLOW-01`, `TC-API-WORKFLOW-02`, `TC-API-WORKFLOW-03`, `TC-UI-04`, `TC-E2E-02` | ✅ Planned | Pass |
| **AC-09** | Public comments & internal notes operational use | `TC-API-COMM-02`, `TC-API-COMM-03`, `TC-UI-04`, `TC-E2E-02` | ✅ Planned | Pass |
| **AC-10** | Admin User Management listing & creation | `TC-API-ADMIN-01`, `TC-API-ADMIN-02`, `TC-UI-05`, `TC-E2E-03` | ✅ Planned | Pass |
| **AC-11** | Admin safety rules (self-deactivation & last admin) | `TC-API-ADMIN-05`, `TC-API-ADMIN-06`, `TC-E2E-03` | ✅ Planned | Pass |
| **AC-12** | Duplicate email rejection | `TC-API-ADMIN-03`, `TC-UI-05` | ✅ Planned | Pass |

---

## 5. Automated Test Execution Evidence Log

### 5.1 Backend Integration Test Suite Output (`server/`)
```
> toktickit-server@1.0.0 test
> vitest run

 RUN  v2.1.9 D:/TokTickIT/server

 ✓ tests/lab-01/health.test.ts (1 test) 44ms
 ✓ tests/lab-02/my-tickets.test.ts (5 tests) 149ms
 ✓ tests/lab-03/staff-queue.api.test.ts (6 tests) 161ms
 ✓ tests/lab-02/ticket-detail.test.ts (6 tests) 156ms
 ✓ tests/lab-02/requesters.test.ts (3 tests) 189ms
 ✓ tests/lab-01/categories.test.ts (1 test) 189ms
 ✓ tests/lab-03/requester-workflow.api.test.ts (8 tests) 227ms
 ✓ tests/lab-03/comments-notes.api.test.ts (9 tests) 206ms
 ✓ tests/lab-03/staff-ticket-detail.api.test.ts (12 tests) 235ms
 ✓ tests/lab-02/attachments.test.ts (15 tests) 321ms
 ✓ tests/lab-02/tickets.test.ts (5 tests) 354ms
 ✓ tests/lab-03/users-admin.api.test.ts (8 tests) 571ms
 ✓ tests/lab-03/auth.api.test.ts (9 tests) 968ms

 Test Files  13 passed (13)
      Tests  88 passed (88)
```

### 5.2 Frontend UI Component Test Suite Output (`client/`)
```
> toktickit-client@1.0.0 test
> vitest run

 RUN  v2.1.9 D:/TokTickIT/client

 ✓ tests/lab-02/CreateTicketForm.test.tsx (5 tests)
 ✓ tests/lab-02/TicketDetail.test.js (5 tests)
 ✓ tests/lab-03/ChangePassword.test.js (4 tests)
 ✓ tests/lab-03/ChangePassword.test.tsx (4 tests)
 ✓ tests/lab-02/CreateTicketForm.test.js (5 tests)
 ✓ tests/lab-02/TicketDetail.test.tsx (5 tests)
 ✓ tests/lab-02/MyTicketsList.test.js (9 tests)
 ✓ tests/lab-03/StaffTicketQueue.test.js (6 tests)
 ✓ tests/lab-03/StaffTicketDetail.test.js (5 tests)
 ✓ tests/lab-03/UserManagement.test.tsx (7 tests)
 ✓ tests/lab-02/MyTicketsList.test.tsx (9 tests)
 ✓ tests/lab-03/StaffTicketDetail.test.tsx (5 tests)
 ✓ tests/lab-03/UserManagement.test.js (7 tests)
 ✓ tests/lab-03/RequesterWorkflow.test.js (2 tests)
 ✓ tests/lab-03/StaffTicketQueue.test.tsx (6 tests)
 ✓ tests/lab-02/AttachmentLifecycle.test.js (5 tests)
 ✓ tests/lab-02/AttachmentLifecycle.test.tsx (5 tests)
 ✓ tests/lab-03/Login.test.js (4 tests)
 ✓ tests/lab-03/Login.test.tsx (4 tests)
 ✓ tests/lab-03/RequesterWorkflow.test.tsx (2 tests)
 ✓ tests/lab-01/App.test.js (4 tests)
 ✓ tests/lab-01/App.test.tsx (4 tests)

 Test Files  24 passed (24)
      Tests  120 passed (120)
```

### 5.3 Playwright End-to-End Suite Output (`e2e/lab-03/`)
```
> toktickit-root@1.0.0 test:e2e
> playwright test e2e/lab-03/

Running 7 tests using 1 worker

  ok 1 [chromium] › e2e\lab-03\authentication.spec.ts › E2E Authentication, Password Management & Role Access (Lab 3) › Invalid credentials & Inactive account login handling with safe errors (1.9s)
  ok 2 [chromium] › e2e\lab-03\authentication.spec.ts › E2E Authentication, Password Management & Role Access (Lab 3) › Valid login, Role-based Navigation, and Session Logout across roles (923ms)
  ok 3 [chromium] › e2e\lab-03\authentication.spec.ts › E2E Authentication, Password Management & Role Access (Lab 3) › Initial-password login and Mandatory Change Password workflow (1.8s)
  ok 4 [chromium] › e2e\lab-03\staff-ticket-flow.spec.ts › E2E Staff Ticket Flow & Operational Lifecycle (Lab 3) › IT Staff Queue: search, filter, sort, empty state, and ticket detail workflows (7.4s)
  ok 5 [chromium] › e2e\lab-03\staff-ticket-flow.spec.ts › E2E Staff Ticket Flow & Operational Lifecycle (Lab 3) › Requester flow: Public Comments, Problem Appears Resolved indication, and Internal Notes restriction (2.7s)
  ok 6 [chromium] › e2e\lab-03\user-administration.spec.ts › E2E User Administration & Safety Rules (Lab 3) › Admin user listing, search, filter, creation, duplicate email rejection, and editing (5.2s)
  ok 7 [chromium] › e2e\lab-03\user-administration.spec.ts › E2E User Administration & Safety Rules (Lab 3) › Non-Administrator direct access restriction (386ms)

  7 passed (21.1s)
```

