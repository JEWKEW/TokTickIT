# TokTickIT Lab 3 — Requirements Checklist

CPE 334 · Sections 1, 2, HS, 31, 32 · Semester 1/2026
Lab 3: Users, Roles, IT Staff Ticketing, and Admin Screens

---

## 1. Core Product Increment (What Must Work by End of Sprint)

- [x] Real authentication (email + password) replaces the Development Requester selector
- [x] Users with an initial password must change it at first login before entering the app
- [x] Each authenticated user sees only navigation/actions permitted for their role
- [x] Requester creates/manages own Tickets using their **authenticated identity** (not a selector)
- [x] IT Staff can: use shared Ticket Queue, open Ticket Detail, claim/reassign ownership, set IT Priority, update permitted status values, post Public Comments, write Internal Notes
- [x] Requester can post Public Comments and mark a problem as "appears resolved"
- [x] Administrator can: view users, create a user, update basic account info, assign one role, activate/deactivate accounts, set a new initial password
- [x] All Lab 2 Requester functions still work, with the Dev Requester selector fully removed

**Three roles supported:** Requester, IT Staff, Administrator

---

## 2. Learning Outcomes (design targets)

- Secure authentication + mandatory first-login password change
- Server-side role-based authorization and ownership checks (not hidden UI)
- Evolving data model/API without breaking Lab 2
- IT Staff list + Ticket Detail workflows using reusable Zen Green components
- Public Comments vs. role-restricted Internal Notes
- Ticket ownership, IT Priority, and status-transition rules
- Spec DD, Test DD, TDD applied to auth/authorization/workflow/admin
- GitHub Issues, feature branches, PRs, peer review, staged integration

---

## 3. Stakeholder Request (paraphrased)

- Replace temp selector with secure login
- Admins get a simple User Management screen: view, create, assign one role, edit, activate/deactivate, reset initial password
- Users with an initial password must set a new one before entering the app
- Requester functions continue, now tied to authenticated account
- IT Staff need a professional Queue: find work, open detail, claim/reassign, set IT Priority, Public Comments, Internal Notes, workflow updates
- Requesters can flag "appears resolved," but only IT Staff formally resolve/close
- Every API/screen protected by role + ownership — **hiding a button is not authorization**
- Continue the Zen Green design language from Lab 2

---

## 4. Engineering Contract Requirements

### 4.1 Contract Must Cover

- [x] Authentication, logout, current-user retrieval, mandatory first-login password change
- [x] Role-based navigation + server-side authorization (Requester/IT Staff/Admin)
- [x] Migration from Dev Requester identity → real User model
- [x] Continued ownership protection on all Lab 2 Ticket/Attachment functions
- [x] IT Staff Queue, Ticket Detail, ownership, IT Priority, Public Comments, Internal Notes, status workflow
- [x] Minimalist Admin user management (list, create, edit, one-role assignment, activate/deactivate, reset password)
- [x] Data model and REST API changes
- [x] Zen Green UI extensions + reusable component rules
- [x] Acceptance criteria, planned tests, migration/regression evidence, Product DoD

### 4.2 Explicitly Excluded from Lab 3

- Email invitations, password-reset emails, MFA, social login, SSO
- Self-registration / Requester-created accounts
- "Actions Taken" by IT Staff (deferred to Lab 4)
- Formal SLA calc, escalation rules, notification services
- Dashboards/KPI analytics beyond simple queue counts
- Multi-tenant orgs, departments, customer administration
- Production-grade deployment/cloud infra changes
- Multiple roles per user
- User deletion, bulk operations, import/export, account-history screens
- Department/org/profile-photo/extended profile management
- Email delivery of passwords or reset links
- Account unlocking, admin-approval workflows, advanced identity management
- Mandatory pagination, multi-column sorting, multiple simultaneous filters on user list

### 4.3 Authorization Matrix (minimum permitted behavior)

| Role | Minimum Permitted Behavior |
|---|---|
| **Requester** | Authenticated identity; create Tickets; view/manage only owned Tickets & Attachments; post Public Comments; mark "appears resolved" |
| **IT Staff** | View Ticket Queue; open Tickets; claim/reassign ownership; set IT Priority; permitted status changes; post Public Comments; create Internal Notes |
| **Administrator** | Manage user accounts only — view, create, edit basic info, assign one role, activate/deactivate, set initial password |

- [x] Admin and IT Staff responsibilities stay conceptually separate (Admin doesn't get Ticket ops unless matrix explicitly permits)
- [x] Every protected operation enforced **server-side** — frontend hiding/disabling is not sufficient
- [x] Complete authorization matrix produced with AI specification agent

### 4.4 Business Rules

**Given (must include, numbered BR-01+):**

- BR-01: Only active user with valid credentials may authenticate
- BR-02: User requiring password change can't enter normal app until new valid password saved
- BR-03: Authenticated identity (not client-supplied `requesterId`) determines Requester ownership
- BR-04: Public Comments visible to Requester/IT Staff/Admin; Internal Notes visible only to IT Staff/Admin
- BR-05: Requester can mark "appears resolved" but cannot set Resolved/Closed formally

**You must additionally author rules for:**

- [x] Login attempts
- [x] Password handling
- [x] Logout
- [x] Inactive users
- [x] Duplicate email addresses
- [x] Current-user behavior
- [x] Ticket ownership
- [x] IT Staff assignment
- [x] IT Priority
- [x] Public Comments
- [x] Internal Notes
- [x] Status transitions
- [x] Validation
- [x] Failures
- [x] Regression behavior

**Administrator rules must remain limited to:**

- [x] Create user with one permitted role
- [x] Update name/email/role/activation state
- [x] Prevent duplicate emails
- [x] Set new initial password requiring change at next login
- [x] Prevent Admin from deactivating their own account
- [x] Prevent removal/deactivation of the last active Administrator
- [x] Use deactivation instead of deletion

### 4.5 Ticket Ownership, Priority, Status

- [x] One primary Ticket Owner (active IT Staff or Admin); Ticket may start unassigned
- [x] Requested Priority = value from Requester (fixed); IT Priority initially copies it, editable only by IT Staff/Admin
- [x] Required statuses: **New, Open, In Progress, Waiting for Requester, Resolved, Closed, Reopened, Cancelled**
- [x] Define transition matrix: permitted roles, required confirmations, validation
- [x] "Actions Taken" blocking rule deferred to Lab 4 (not in scope now)

### 4.6 Public Comments & Internal Notes

- [x] Public Comments visible to Requester + IT Staff + Admin
- [x] Internal Notes visible only to IT Staff + Admin
- [x] Both append-only (no edit/delete in Lab 3)
- [x] Each entry records author + creation time (backend-generated)
- [x] Reject empty/whitespace-only content; define length limits + safe rendering

---

## 5. Database Requirements

### 5.1 Concepts/Relationships

- [x] One User → one role (Requester / IT Staff / Administrator)
- [x] One Requester → many Tickets
- [x] One Ticket → zero or one primary Owner
- [x] One Ticket → many Public Comments
- [x] One Ticket → many Internal Notes
- [x] Each Comment/Note → one author
- [x] Existing Categories, Related Systems, Tickets, Attachments remain valid post-migration
- [x] Define fields, types, FKs, indexes, enums/reference tables, timestamps, activation state, password-change state, migration strategy
- [x] **Passwords never stored in plaintext**
- [x] No departments, multi-role, profile images, role history, or audit history needed

### 5.2 Migration from Lab 2

- [x] Migrate/evolve Dev Requester records into real User model
- [x] Preserve existing Ticket ownership correctness
- [x] Document/test how existing Requesters get initial passwords
- [x] Remove temp selector + its client-side state

### 5.3 Seed Data

- [x] Idempotent (safe to re-run)
- [x] ≥4 active Requesters + 1 inactive Requester
- [x] ≥3 active IT Staff + 1 inactive IT Staff
- [x] ≥1 active Administrator
- [x] Realistic Tickets across Requesters/statuses/priorities/ownership (incl. unassigned)
- [x] Example Public Comments + Internal Notes (no sensitive info)
- [x] Document seeded credentials clearly; no real secrets in repo

---

## 6. REST API Contract

**Must support (document in `docs/lab-03/api-spec.md`):**

- [x] Login, logout, current user, mandatory password change
- [x] Continued authenticated Lab 2 Ticket/Attachment APIs
- [x] IT Staff Queue retrieval (search, filters, sorting, pagination)
- [x] Retrieve one Ticket (IT Staff ops)
- [x] Claim/assign/reassign Ticket ownership
- [x] Update IT Priority + permitted status
- [x] Create/retrieve Public Comments
- [x] Create/retrieve Internal Notes (permitted roles only)
- [x] Retrieve user list (Admin) — search by name/email, optional role filter
- [x] Create user with one permitted role
- [x] Update user (name/email/role/activation)
- [x] Set new initial password (must change at next login)
- [x] Issue/reset initial password using approved local-lab approach

**Explicitly not needed:** user deletion, bulk ops, import/export, role history, multi-role assignment, email delivery, advanced account workflows.

### 6.1 Auth/Session Decisions (justify with spec agent)

- [x] Password hashing approach
- [x] Credential validation
- [x] Session/token storage + expiration
- [x] Logout invalidation
- [x] CSRF considerations (where applicable)
- [x] Safe error messages
- [x] Secrets never exposed to client or committed to source control

### 6.2 Authorization & Safe Errors

- [x] Distinguish: unauthenticated / authenticated-forbidden / invalid input / missing resource / conflict / server error
- [x] Never leak existence of another user's protected Ticket/Attachment/Internal Note

### 6.3 Queue Query Behavior

- [x] Support search, filters, sorting, pagination
- [x] Document: searchable fields, filterable fields, sortable fields, default order, page size, pagination metadata, invalid-param handling

---

## 7. Zen Green Theme / App Shell

- [x] Replace Dev Requester display with authenticated user's name + role
- [x] Logout + permitted profile/password actions
- [x] Role-specific nav (no unauthorized destinations shown)
- [x] Consistent badges: Ticket status, Requested Priority, IT Priority, role
- [x] Clear editable vs. read-only field styling
- [x] Loading / saving / success / validation / empty / no-results / forbidden / safe-failure feedback
- [x] Usable on desktop, tablet, mobile

---

## 8. Required Screens

### 8.1 Login & Password Change

- [x] Login: email, password, validation, busy state, safe failure feedback
- [x] Clear (non-leaky) response for inactive accounts
- [x] Mandatory Change Password screen for initial-password users
- [x] Password rules, confirmation, validation, success → app entry
- [x] Authenticated shell shows current user + role
- [x] Logout removes authenticated access

### 8.2 Requester Regression + Public Comments

- [x] Lab 2 Requester screens work via authenticated identity
- [x] Dev Requester selector and "Change Requester" action fully removed
- [x] Ticket Detail adds Public Comments + "Problem Appears Resolved" action
- [x] Ticket/Attachment ownership protection preserved

### 8.3 IT Staff Ticket Queue

- [x] Search, filters, sorting, pagination
- [x] Clear ownership + status info
- [x] Open Ticket Detail action
- [x] Loading / empty / no-results / forbidden / failure feedback
- [x] Desktop table + smaller-screen layout designed in `ui-spec.md`
- [x] Example fields (justify final set, avoid mega-grid): Ticket No., Created Date, Summary, Category, Requested Priority, IT Priority, Current Status, Ticket Owner, Last Updated

### 8.4 IT Staff Ticket Detail

- [x] Extends Lab 2 Ticket screen; clearly grouped, only permitted fields editable
- [x] Ticket ownership, IT Priority, permitted status changes
- [x] Public Comments + Internal Notes, **visually distinct**
- [x] Existing Attachments preserved
- [x] Clear role-specific actions

### 8.5 Administrator User Management

**Required:**

- [x] User list: Name, Email, Role, Status, Edit action
- [x] Search by name/email
- [x] Optional role filter
- [x] Create user: name, email, one role, activation state, initial password
- [x] Edit: name, email, role, activation state
- [x] Set new initial password (must change at next login)
- [x] Prevent duplicate emails / invalid roles
- [x] Prevent Admin self-deactivation
- [x] Prevent removing last active Admin
- [x] Validation / success / forbidden / safe API-failure feedback

**Not required:** deletion, pagination, multi-column sort, multiple simultaneous filters, multi-role, departments, bulk ops, import/export, role/audit history, email invitations, advanced recovery flows.

### 8.6 Screen Modes & Feedback

- [x] Identify create/view/edit modes per screen
- [x] Cover: processing, validation, success, empty/no-results, forbidden, not-found, conflict, safe API-failure — with tests

### 8.7 Responsive/Accessibility

- Same standard as Lab 2

---

## 9. Spec DD Deliverable

**Files:** `docs/lab-03/specification.md`, `ui-spec.md`, `api-spec.md`

Must include (not copied verbatim from handout):

1. Sprint Goal
2. Stakeholder Request (own words)
3. Scope (included/excluded)
4. Numbered Functional Requirements (FR)
5. Numbered Business Rules (BR)
6. UI Spec Summary
7. Data Changes
8. API Contract
9. Acceptance Criteria (AC-xx)
10. Definition of Done
11. Assumptions and Decisions

Example ACs given: AC-01 (login success), AC-02 (mandatory password change gates app), AC-03 (server ignores client-supplied requesterId), AC-04 (Requester blocked from Internal Notes without leaking data).

---

## 10. Test DD / TDD Deliverable

**File:** `docs/lab-03/tests.md` — written **before/alongside** implementation, not reconstructed after.

Coverage required: unit, API/integration, UI component, UI style, responsive, security/authorization, migration/regression.

**Must define tests for:** valid/invalid login, inactive accounts, password boundaries, logout, role navigation, direct API authorization, Requester regression, queue queries, ownership, IT Priority, status transitions, comments, notes, minimalist user admin, migration, responsive behavior, accessibility, safe failures.

**Admin-specific tests:** listing, search, role filter, creation, duplicate-email rejection, basic editing, one-role assignment, activation/deactivation, new-password behavior, self-deactivation prevention, last-Admin protection, forbidden access for non-Admins.

---

## 11. GitHub Workflow

- [x] Decompose into Issues: specification, tests, migration, authentication, authorization, Requester regression, IT Staff interfaces, user administration
- [x] Branch flow similar to Lab 2 (feature branches → `lab3-staging` → `main`)
- [x] AI spec/coding agent rules same as Lab 2

---

## 12. Required Repository Structure

```
docs/lab-03/
├── specification.md
├── tests.md
├── ui-spec.md
├── api-spec.md
├── reviewer.md
└── ai-use.md

server/tests/lab-03/
├── auth.api.test.ts
├── authorization.api.test.ts
├── staff-queue.api.test.ts
├── staff-ticket-detail.api.test.ts
├── comments-notes.api.test.ts
└── users-admin.api.test.ts

client/.../lab-03 tests/
├── Login.test.tsx
├── ChangePassword.test.tsx
├── StaffTicketQueue.test.tsx
├── StaffTicketDetail.test.tsx
└── UserManagement.test.tsx
```

---

## 13. Definition of Done

- Similar to Lab 2; finalize with LLM assistance for product-completion checklist.
