# Lab 04 — TokTickIT Actions Taken, Dashboards, and Final Regression Specification

## 1. Sprint Goal

Evolve the **TokTickIT** IT Service Desk platform by introducing structured **Actions Taken** records under each Ticket to track operational work history, enforcing strict backend-governed **Ticket Lifecycle & Resolution Rules**, adding role-appropriate **Operational & Requester Dashboards** with concise backend-calculated metrics, and hardening the entire application across all roles (Requester, IT Staff, Administrator) with zero regression from Labs 1–3 under the **Zen Green** design language.

---

## 2. Stakeholder Request (Interpretation)

*"The service desk can now receive Tickets and IT Staff can communicate with Requesters, but we still need a reliable way to plan and track the actual work. Add Actions Taken under each Ticket. Each action should contain Action Date/Time, Action Description, Result, Performed by (auto), Follow-Up Required?, Follow-up Note (required when follow-up is needed), Attachment Notes (what file to look for images etc.).*

*The primary Ticket Owner remains responsible for coordinating the Ticket as a whole. Requesters may continue to indicate that the problem appears resolved, but IT Staff must review the work and formally update the Ticket.*

*Add useful dashboards for Requesters and IT Staff, but keep them concise and connected to the detailed screens. Finally, polish and harden the complete application so that all earlier features continue to work consistently under the Zen Green design language."*

---

## 3. System Scope & Exclusions

### In Scope for Lab 4:
- **Actions Taken Core Model & Workflow**: Parent-child relationship (One Ticket to Many Actions Taken). Tracking action date/time, action description, result summary, auto-bound performer, follow-up flag, mandatory follow-up note when required, and attachment notes.
- **Role-Based Work Execution**: Ticket Owner coordinates the ticket, but any active IT Staff member or Administrator can record an Action Taken. Requesters view Actions Taken on their owned tickets in read-only mode.
- **Ticket Lifecycle & Resolution Gate**: Backend-enforced status transition matrix (`New`, `Open`, `In Progress`, `Waiting for Requester`, `Resolved`, `Closed`, `Reopened`, `Cancelled`). Requester "Problem Appears Resolved" indication remains advisory and cannot alter ticket status directly.
- **Backend-Calculated Dashboards**:
  - **Requester Dashboard**: Total open tickets, tickets in progress, tickets waiting for requester, recently updated/resolved tickets owned by the authenticated requester.
  - **IT Staff Dashboard**: Unassigned tickets, tickets owned by current staff member, status breakdown, IT priority breakdown, recent tickets, and recent Actions Taken performed by current user.
  - **Administrator Dashboard**: Reuses IT Staff operational metrics with additional user account status counters.
- **Database Schema Evolution & Preservation**: Migration adding `ActionTaken` model and updating `Ticket` model with optimistic concurrency tracking (`updatedAt` / `version`), preserving all Lab 1–3 data (Users, Tickets, Attachments, Public Comments, Internal Notes).
- **Idempotent Seed Data**: Seed data with realistic tickets across all statuses, priorities, assigned/unassigned states, tickets with zero/one/many Actions Taken, and data generating non-zero and zero dashboard counts.
- **Application Hardening & Zen Green UI Polish**: Role navigation with active page indicators, accessible drill-downs, error/conflict/loading feedback, keyboard navigation, and full responsive layout (Desktop, Tablet, Mobile).

### Explicitly Excluded from Lab 4 [H§4.2]:
- Automatic SLA clocks, escalation engines, on-call scheduling, and breach notifications.
- Email, SMS, LINE, push, or other external notification services.
- Inventory consumption, spare-parts management, purchasing, or cost accounting for services.
- Time-sheet billing, payroll, or detailed labor-cost calculation.
- Multi-level approval workflows and electronic signatures.
- Advanced business-intelligence tools, custom report builders, or export warehouses.
- Multi-tenant organizations and production-scale cloud operations.
- Any feature not approved in the Sprint 4 engineering contract.

---

## 4. Numbered Functional Requirements (FRs)

| FR ID | Feature Area | Description |
| :--- | :--- | :--- |
| **FR-01** | **Actions Taken Recording** | Permitted IT Staff and Administrators shall record an Action Taken on any accessible ticket via `POST /api/tickets/:id/actions-taken`, including its action date/time, description, result, follow-up fields, and attachment notes. |
| **FR-02** | **Actions Taken Auto-Performer Binding** | System shall automatically bind the authenticated user's ID as `performedById`, ignoring any client-provided performer field. |
| **FR-03** | **Conditional Follow-up Note Validation** | System shall enforce that `followUpNote` is non-empty whenever `followUpRequired` is `true`. |
| **FR-04** | **Actions Taken Retrieval** | System shall provide `GET /api/tickets/:id/actions-taken` returning all action records for a ticket. Requesters can view actions ONLY for tickets they own (read-only). |
| **FR-05** | **Actions Taken Modification** | IT Staff and Administrators shall update existing Actions Taken entries via `PATCH /api/tickets/:id/actions-taken/:actionId`. |
| **FR-06** | **Ticket Status Transition Enforcement** | Backend shall enforce permitted ticket status transitions via `PATCH /api/tickets/:id/status` per the defined transition matrix, rejecting disallowed transitions with HTTP 400. |
| **FR-07** | **Formal Resolution Gate** | System shall restrict formal resolution (`currentStatus = "Resolved"` or `"Closed"`) strictly to IT Staff and Administrators. |
| **FR-08** | **Advisory Requester Resolution** | Requester signaling that a problem appears resolved (`PATCH /api/tickets/:id/indicate-resolved`) shall remain strictly advisory (`requesterResolvedIndicated = true`) and shall not change `currentStatus`. |
| **FR-09** | **Requester Operational Dashboard** | Backend shall calculate concise metrics for the authenticated Requester (`GET /api/dashboards/requester`): open and in-progress counts, waiting-for-requester count, recently updated and recently resolved lists, with drill-downs. |
| **FR-10** | **IT Staff Operational Dashboard** | Backend shall calculate concise metrics for IT Staff (`GET /api/dashboards/staff`), including unassigned tickets, tickets owned by current user, counts across all statuses and non-null IT priorities, recently updated tickets, and Actions Taken by the current user. |
| **FR-11** | **Administrator Operational Dashboard** | An Administrator accessing `/api/dashboards/staff` shall receive IT Staff operational metrics and may receive optional concise active-user counts by role. |
| **FR-12** | **Optimistic Concurrency & Stale Update Handling** | Backend shall detect concurrent/stale updates on Tickets and Actions Taken using timestamp/version validation, returning HTTP 409 Conflict when a stale payload is submitted. |
| **FR-13** | **Labs 1–3 Feature Hardening & Preservation** | System shall preserve all existing user authentication, password change enforcement, ticket submission, attachments, public comments, internal notes, and admin user management without regression. |
| **FR-14** | **Action Date/Time** | Each Action Taken shall store the date/time the work occurred separately from the record's creation and update timestamps. |

---

## 5. Numbered Business Rules (BRs)

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| **BR-01** | **Action Taken Ticket Attachment** | Action Taken belongs to exactly one Ticket (`ticketId` required). An Action Taken cannot exist independently or be transferred between tickets. |
| **BR-02** | **Coordinating Owner vs. Action Performer** | The Ticket Owner (`ownerId`) coordinates the Ticket as a whole, but any active IT Staff member or Administrator may record an Action Taken. `performedById` is recorded independently of `ownerId`. |
| **BR-03** | **Automatic Performer Assignment** | The system automatically populates `performedById` from the authenticated session context. Client requests attempting to override `performedById` are ignored or rejected. |
| **BR-04** | **Conditional Follow-up Note Rule** | When `followUpRequired = true`, `followUpNote` must contain between 1 and 1000 non-whitespace characters. If `followUpRequired = false`, `followUpNote` is optional and may be null or empty. |
| **BR-05** | **Action Taken Character Limits** | `actionDescription` must be 1 to 2000 characters. `result` must be 1 to 1000 characters. `attachmentNotes` (if provided) must not exceed 500 characters. |
| **BR-06** | **Requester Read-Only Action Visibility** | Requesters can view Actions Taken ONLY on tickets where `requesterId === auth.user.id`. Requesters are strictly forbidden from creating, updating, or deleting Actions Taken (`HTTP 403 Forbidden`). |
| **BR-07** | **Permitted Status Transition Matrix** | Permitted ticket status transitions: <br>• `New` ➔ `Open`, `In Progress`, `Cancelled` <br>• `Open` ➔ `In Progress`, `Waiting for Requester`, `Resolved`, `Cancelled` <br>• `In Progress` ➔ `Waiting for Requester`, `Resolved`, `Cancelled` <br>• `Waiting for Requester` ➔ `In Progress`, `Resolved`, `Cancelled` <br>• `Resolved` ➔ `Closed`, `Reopened` <br>• `Reopened` ➔ `In Progress`, `Resolved`, `Cancelled` <br>• `Closed` ➔ (Terminal state) <br>• `Cancelled` ➔ (Terminal state) |
| **BR-08** | **Resolution Authorization & Advisory Indication** | Only IT Staff and Administrators may transition a ticket status to `Resolved` or `Closed`. A Requester's "Problem Appears Resolved" indication (`requesterResolvedIndicated = true`) is purely advisory for IT Staff review and does not update `currentStatus`. |
| **BR-09** | **Requester Dashboard Scope Isolation** | `GET /api/dashboards/requester` calculates metrics strictly for tickets where `requesterId === auth.user.id`. Accessing another user's dashboard data is impossible. |
| **BR-10** | **IT Staff Dashboard Scope Isolation** | `GET /api/dashboards/staff` is restricted to `IT_STAFF` and `ADMINISTRATOR` roles. Requesters attempting to call staff dashboard endpoints receive `403 Forbidden`. |
| **BR-11** | **Backend Metric Calculation Authority** | Dashboard counters and metric totals must be computed by database aggregate queries on the backend. Frontend applications must not download raw ticket tables to compute metrics client-side. |
| **BR-12** | **Stale Update Prevention (Concurrency)** | Ticket status and Action Taken update requests must include the timestamp last read by the client. The server conditionally updates only when it matches the stored `updatedAt`; otherwise it leaves the record unchanged and returns `409 Conflict`. |
| **BR-13** | **Legacy Ticket Compatibility** | Tickets created prior to Lab 4 without Actions Taken remain fully valid. Dashboards count legacy tickets accurately based on status and dates. |
| **BR-14** | **Idempotent Database Seeding** | Seed script execution (`prisma db seed`) must produce predictable records and be re-runnable without causing unique key conflicts or duplicate records. |
| **BR-15** | **Action Date/Time Semantics** | `actionDateTime` is required and records when the work occurred; it is distinct from `createdAt` and `updatedAt`. Staff may enter a past time but not a future time. Store timestamps in UTC and display them in the user's local time zone. |
| **BR-16** | **Assignment Validity** | Ticket ownership may be null; otherwise `ownerId` must refer to an active IT Staff or Administrator, preserving the Lab 3 assignment rule. |
| **BR-17** | **Dashboard Definitions** | Requester `open` means status is not Resolved, Closed, or Cancelled; Waiting for Requester is also shown as a separate subset. Recent lists are ordered by `updatedAt` descending and limited to five. `recently resolved` means status Resolved or Closed and `updatedAt` is within the preceding 30 days. Use UTC boundaries; drill-down applies the matching status filter to the existing list/queue. Empty collections return count zero and an empty list. |

---

## 6. Role-Based Access Control (RBAC) Authorization Matrix

| Resource / Endpoint | Operational Action | Requester | IT Staff | Administrator |
| :--- | :--- | :---: | :---: | :---: |
| `GET /api/dashboards/requester` | View Requester Dashboard metrics & recent tickets | ✅ Owned metrics | ❌ Forbidden (403) | ❌ Forbidden (403) |
| `GET /api/dashboards/staff` | View Staff / Admin Dashboard metrics | ❌ Forbidden (403) | ✅ Operational metrics | ✅ Operational + Admin metrics |
| `GET /api/tickets/:id/actions-taken` | View Actions Taken list | ✅ Owned ticket only (Read-only) | ✅ All tickets | ✅ All tickets |
| `POST /api/tickets/:id/actions-taken` | Create Action Taken entry | ❌ Forbidden (403) | ✅ Permitted | ✅ Permitted |
| `PATCH /api/tickets/:id/actions-taken/:actionId` | Update Action Taken entry | ❌ Forbidden (403) | ✅ Permitted | ✅ Permitted |
| `PATCH /api/tickets/:id/status` | Execute Ticket Status Transition | ❌ Forbidden (403) | ✅ Per BR-07 Matrix | ✅ Per BR-07 Matrix |
| `PATCH /api/tickets/:id/indicate-resolved` | Signal Problem Appears Resolved | ✅ Owned ticket only | ❌ Forbidden (403) | ❌ Forbidden (403) |
| `GET /api/tickets/queue` | Search & list ticket queue | ❌ Forbidden (403) | ✅ All tickets | ✅ All tickets |
| `GET /api/tickets/my` | List submitted tickets | ✅ Owned tickets | ❌ Forbidden (403) | ❌ Forbidden (403) |
| `GET/POST /api/tickets/:id/comments` | View / Post Public Comments | ✅ Owned ticket only | ✅ All tickets | ✅ All tickets |
| `GET/POST /api/tickets/:id/internal-notes` | View / Post Internal Notes | ❌ Forbidden (403) | ✅ All tickets | ✅ All tickets |
| `GET/POST/PATCH /api/admin/users/*` | Manage User Accounts & Passwords | ❌ Forbidden (403) | ❌ Forbidden (403) | ✅ All Admin APIs |

---

## 7. Data Model Changes & Schema Specifications

### Extended Prisma Schema (`server/prisma/schema.prisma`)

```prisma
model ActionTaken {
  id                Int      @id @default(autoincrement())
  ticketId          Int
  ticket            Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  performedById     Int
  performedBy       User     @relation(fields: [performedById], references: [id])
  actionDateTime    DateTime
  actionDescription String   @db.Text
  result            String   @db.Text
  followUpRequired  Boolean  @default(false)
  followUpNote      String?  @db.Text
  attachmentNotes   String?  @db.Text
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([ticketId, actionDateTime])
  @@index([performedById, actionDateTime])
}

model Ticket {
  id                         Int           @id @default(autoincrement())
  ticketNumber               String        @unique
  requesterId                Int
  requester                  User          @relation("SubmittedTickets", fields: [requesterId], references: [id])
  ownerId                    Int?
  owner                      User?         @relation("AssignedTickets", fields: [ownerId], references: [id])
  categoryId                 Int
  category                   Category      @relation(fields: [categoryId], references: [id])
  relatedSystemId            Int
  relatedSystem              RelatedSystem @relation(fields: [relatedSystemId], references: [id])
  summary                    String
  description                String        @db.Text
  requestedPriority          String
  itPriority                 String?
  currentStatus              String        @default("New")
  requesterResolvedIndicated Boolean       @default(false)
  requesterResolvedAt        DateTime?
  createdAt                  DateTime      @default(now())
  updatedAt                  DateTime      @updatedAt

  attachments                Attachment[]
  publicComments             PublicComment[]
  internalNotes              InternalNote[]
  actionsTaken               ActionTaken[]

  @@index([requesterId, updatedAt])
  @@index([ownerId])
  @@index([currentStatus, updatedAt])
  @@index([itPriority])
  @@index([createdAt])
}
```

Add the inverse relation `actionsPerformed ActionTaken[]` to the existing `User` model.

### Database Design Decisions & Justification [H§5.1]:
1. **Dedicated `ActionTaken` Child Table with `performedById` FK**:
   - *Justification*: Storing actions as a distinct relational model (`One Ticket -> Many ActionTaken`) with an explicit foreign key to `User` preserves full audit integrity. This decouples action execution from ticket ownership (`ownerId`), directly supporting BR-02 (where any staff member can perform work while a single owner coordinates).
2. **Query-Supporting Indexes**:
   - *Justification*: Add indexes for predicates and sort orders used by the approved dashboard queries, such as `(requesterId, updatedAt)`, `(currentStatus, updatedAt)`, and `(performedById, actionDateTime)`, after checking existing indexes and migration cost. Indexes improve filtering and sorting but do not guarantee a particular query time.

### Migration, Legacy Records, and Recovery [H§5.2]
- Add `ActionTaken` and its foreign keys/indexes in a forward-only additive Prisma migration; do not rewrite or drop existing User, Ticket, Attachment, PublicComment, or InternalNote rows.
- Existing Tickets receive no synthetic Action Taken. They remain valid with an empty actions list, and dashboard status/priority counts include them normally.
- Deploy by taking a database backup, applying the migration, checking row counts and existing relations, then running the idempotent seed in the development/test environment. Record the migration command and verification evidence in the implementation PR.
- Before any Actions Taken data is collected, a failed migration may be rolled back using the documented Prisma migration procedure and backup. After actions exist, do not drop the table as routine rollback because that destroys work history; restore from a verified backup or ship a forward corrective migration. Test the chosen recovery path in a disposable database in Issue 3.
- Seed records use stable unique keys and upsert behavior; rerunning the seed updates or preserves the same fixtures rather than duplicating them.

---

## 8. REST API Specifications Summary

New endpoints use the existing API's `{success, data}` / `{success, error}` response convention. Complete endpoint definitions, request/response bodies, and HTTP status codes are detailed in `docs/lab-04/api-spec.md`.

- **Actions Taken APIs**:
  - `POST /api/tickets/:id/actions-taken`: Creates Action Taken record. Authenticated user set as `performedById`. Validation enforces `followUpNote` when `followUpRequired = true`.
  - `GET /api/tickets/:id/actions-taken`: Fetches Actions Taken list for a ticket. Requesters restricted to owned tickets.
  - `PATCH /api/tickets/:id/actions-taken/:actionId`: Modifies existing Action Taken. Detects stale updates via timestamp matching.
- **Workflow & Status APIs**:
  - `PATCH /api/tickets/:id/status`: Updates ticket status. Validates transition against BR-07 matrix and enforces IT Staff / Admin role requirement for `Resolved` / `Closed`.
- **Dashboard APIs**:
  - `GET /api/dashboards/requester`: Returns backend-calculated metrics for authenticated Requester.
  - `GET /api/dashboards/staff`: Returns operational metrics for IT Staff and Administrator accounts.

---

## 9. Acceptance Criteria (ACs)

- **AC-01**: Given a permitted IT Staff user and valid data, when an Action Taken is created, then it is saved under the correct Ticket with `performedById` automatically set to the authenticated creator.
- **AC-02**: Given an authenticated Requester, when dashboard data is retrieved via `GET /api/dashboards/requester`, then only metrics and recent Tickets owned by that Requester are returned.
- **AC-03**: Given an IT Staff user submitting an Action Taken with `followUpRequired = true` and an empty `followUpNote`, when submitted, then the backend rejects the request with `400 Bad Request`.
- **AC-04**: Given a Requester user, when attempting to call `POST /api/tickets/:id/actions-taken` or `PATCH /api/tickets/:id/status`, then the request is denied with `403 Forbidden`.
- **AC-05**: Given an IT Staff user attempting a disallowed status transition (e.g., `New` ➔ `Resolved`), when submitted, then the backend rejects the request with `400 Bad Request`.
- **AC-06**: Given a Requester who clicks "Problem Appears Resolved", when saved, then `requesterResolvedIndicated` becomes `true` while `currentStatus` remains unchanged.
- **AC-07**: Given an IT Staff user accessing `GET /api/dashboards/staff`, when loaded, then counts for unassigned tickets, my assigned tickets, status breakdowns, IT priority breakdowns, and recent actions performed by the user match database queries.
- **AC-08**: Given two users editing the same ticket concurrently, when a user submits a stale status transition or action update, then the backend returns `409 Conflict`.
- **AC-09**: Given legacy tickets created in Labs 1–3 without Actions Taken, when migrated and seeded, then they display correctly with zero actions taken and calculate properly in dashboards.
- **AC-10**: Given the application running across desktop (1280px), tablet (768px), and mobile (375px), all dashboard cards, action tables, and workflow controls adjust without horizontal page scrolling or overlapping text.
- **AC-11**: Given work performed earlier, when its Action Taken is retrieved, then `actionDateTime` remains distinct from `createdAt` and is displayed in the user's local time zone.
- **AC-12**: Given an inactive or non-staff user selected as Ticket owner, when assignment is attempted, then the backend rejects it and leaves the owner unchanged.
- **AC-13**: Given dashboard data at the 30-day boundary or with no matching records, when requested, then UTC boundaries are applied and empty lists/counts are returned as defined by BR-17.
- **AC-14**: Given a Requester viewing an owned Ticket, when Actions Taken load, then every action is visible read-only; attempts to create or update an action are rejected by the backend.
- **AC-15**: Given an Administrator opening the staff dashboard, when the endpoint responds, then staff operational metrics are returned and any optional account counts are restricted to active accounts and shown only to Administrators.
- **AC-16**: Given a requested Ticket or Action Taken ID that does not exist (or an action belonging to a different Ticket), when the API is called, then a safe `404 NOT_FOUND` response is returned without exposing internal details.
- **AC-17**: Given the Lab 4 release on `main`, when the Lab 1–3 regression suite is run, then authentication/password change, requester ticket creation and ownership, attachment lifecycle, public comments, internal-note confidentiality, and Administrator user management continue to pass for their permitted roles.
- **AC-18**: Given an Action Taken update by permitted staff, when editable fields are changed, then the original Ticket and performer remain unchanged, the updated timestamp advances, and a stale `expectedUpdatedAt` is rejected with `409 Conflict`.

---

## 10. Product Definition of Done (DoD)

1. **Specification & Documentation**: The three Spec DD documents (`specification.md`, `ui-spec.md`, `api-spec.md`) and the separate Test DD document (`tests.md`, Issue 2) are drafted, reviewed, and committed under `docs/lab-04/`.
2. **Database Migration & Preservation**: Prisma migration created and tested. All Lab 1–3 data (users, tickets, attachments, public comments, internal notes) preserved without loss.
3. **Idempotent Seed Data**: Seed script populates realistic tickets across all statuses, priorities, assigned/unassigned states, zero/one/many Actions Taken, and zero/non-zero dashboard counts.
4. **Backend Implementation**: REST API endpoints for Actions Taken, status workflow, and dashboards implemented with server-side validation, authorization, and optimistic concurrency checks.
5. **Frontend Application & Polish**: React frontend implementing Actions Taken UI on Ticket Detail, Requester Dashboard, IT Staff Dashboard, permitted status controls, role navigation, and Zen Green design rules.
6. **Automated Testing & Traceability**: 100% test pass rate across unit, API, UI, authorization, workflow, regression, and E2E Playwright test suites on `main` branch. Every AC traced to test IDs.
7. **Zero Regression**: Full regression suite passes for Lab 1–3 features (authentication, password change, ticket submission, attachments, public comments, internal notes, and Admin user management) on `main`.

---

## 11. Assumptions and Key Design Decisions

1. **Automatic Performer Binding**: `performedById` is strictly extracted from the decoded JWT token payload on the server, guaranteeing audit trail integrity.
2. **Advisory Requester Signal**: `requesterResolvedIndicated` flag provides clear feedback to IT Staff without prematurely altering formal ticket lifecycle states.
3. **Optimistic Concurrency Strategy**: A required `expectedUpdatedAt` timestamp and conditional update prevent stale status/action edits from silently overwriting newer changes.
4. **Backend Aggregate Computation**: All dashboard cards and counts execute optimized SQL aggregations, maintaining performance and data isolation.
5. **Action Time vs. Record Time**: Store `actionDateTime` separately from `createdAt` because staff may document work after it happened; rejecting future work times avoids recording actions that have not occurred. UTC storage keeps comparisons stable across clients.
6. **Dashboard Windows and Result Size**: Show five most recently updated rows and use a 30-day window for recently resolved tickets. This gives a useful summary while keeping dashboard responses small; UTC boundaries make the window consistent across users.
7. **Action Text Limits**: The 2,000-character description, 1,000-character result/follow-up note, and 500-character attachment note limits keep entries readable and payloads bounded. They are application validation decisions, not limits mandated by the handout.
8. **Workflow and Admin Counts**: Reuse the Lab 3 status-transition matrix to preserve existing workflow behavior. Admin user counts are optional because the handout makes them optional and they are not needed for ticket operations.
