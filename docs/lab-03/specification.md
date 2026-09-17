# Lab 03 — TokTickIT Users, Roles, IT Staff Ticketing, and Admin Screens Specification

## 1. Sprint Goal

Evolve the **TokTickIT** IT Service Desk platform from a single-role prototype with a development identity switcher into a secure, multi-tenant role-based application. This sprint replaces temporary simulated authentication with real email/password authentication, mandatory first-login password resets, role-based navigation, operational IT Staff workflows (Queue management, ownership claiming/reassignment, IT Priority setting, permitted status transitions, public comments, and restricted internal notes), and minimalist Administrator user management—all while preserving Lab 2 Requester capabilities without regression.

---

## 2. Stakeholder Request (Interpretation)

*"Replace temporary Requester switching with real authentication and role-based authorization. Administrators need a simple User Management screen to manage accounts, roles, activation state, and initial passwords. Requesters must continue using Lab 2 ticket features under their authenticated identity, post Public Comments, and indicate when problems appear resolved. IT Staff need a Ticket Queue to claim or reassign tickets, set IT Priority, update ticket statuses through permitted workflows, communicate via Public Comments, and keep private Internal Notes. Protect all APIs and screens on the backend by role and ownership."*

---

## 3. System Scope & Exclusions

### In Scope for Lab 3:
- **Authentication & Security**: Email/password authentication, password hashing (`bcrypt`), JWT session handling, secure logout, and mandatory first-login password change (`mustChangePassword: true`).
- **Role-Based Access Control (RBAC)**: Server-side enforced authorization across three roles (`REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`).
- **Data Model Migration**: Evolving `RequesterUser` into unified `User` model, adding ticket ownership (`ownerId`), `itPriority`, extended statuses, append-only `PublicComment`, and append-only `InternalNote` models.
- **Requester Enhancement**: Requester identity derived from authenticated session, Public Comment posting, and "Problem Appears Resolved" indication flag (`requesterResolvedIndicated`).
- **IT Staff Workflows**: Paginated Ticket Queue (search, filter, sort), Ticket Detail view, claiming/reassigning ticket owner, modifying `itPriority`, executing permitted status transitions, posting Public Comments, and adding private Internal Notes.
- **Administrator User Management**: Minimalist user table (search name/email, role filter), account creation, basic profile editing, role assignment (single role per user), activation/deactivation (`isActive`), and setting new initial passwords.
- **Administrator Safety Rules**: Self-deactivation prevention, last active Administrator removal prevention, duplicate email rejection.
- **Zen Green UI Continuity**: Reuse design tokens, responsive layouts (Desktop, Tablet, Mobile), role-specific navigation, and visual separation of Public Comments vs. Internal Notes.

### Excluded / Out of Scope for Lab 3:
- Email invitations, password reset via email, multi-factor authentication (MFA), or social/SSO login.
- Self-registration / public user signup (only Admin creates users).
- Actions Taken by IT Staff (deferred to Lab 4).
- Formal SLA calculation, escalation rules, automated notifications, or KPI analytics.
- Multi-tenant organizations, departments, profile photos, or role assignment history.
- Multiple roles per user, user deletion, bulk user operations, import/export.
- Account unlocking workflows or advanced identity management.

---

## 4. Numbered Functional Requirements (FRs)

| FR ID | Feature Area | Description |
| :--- | :--- | :--- |
| **FR-01** | **User Authentication** | System shall authenticate users via `POST /api/auth/login` with email and password, returning user profile and session token. |
| **FR-02** | **First-Login Password Change** | System shall enforce password change upon login for users marked with `mustChangePassword = true`, restricting access to all other endpoints until updated. |
| **FR-03** | **Session & Logout** | System shall provide `GET /api/auth/me` to fetch current user profile and `POST /api/auth/logout` to terminate authenticated session. |
| **FR-04** | **RBAC App Shell & Nav** | System shall render role-appropriate navigation (Requester: My Tickets / Create Ticket; IT Staff: Ticket Queue; Admin: User Management) and display authenticated user name & role badge. |
| **FR-05** | **Requester Regression & Resolution** | Requesters shall create and view owned tickets using session identity, and indicate problem appears resolved via `PATCH /api/tickets/:id/indicate-resolved`. |
| **FR-06** | **IT Staff Ticket Queue** | IT Staff shall view a paginated queue (`GET /api/tickets/queue`) supporting keyword search, category, priority, status, and owner filters, plus sorting. |
| **FR-07** | **Ticket Ownership Management** | IT Staff and Admin shall claim or reassign ticket ownership via `PATCH /api/tickets/:id/assign`. |
| **FR-08** | **IT Priority & Status Updates** | IT Staff and Admin shall update IT Priority via `PATCH /api/tickets/:id/it-priority` and execute permitted status transitions via `PATCH /api/tickets/:id/status`. |
| **FR-09** | **Public Comments** | Requesters (ticket owners), IT Staff, and Admin shall view and post append-only Public Comments (`GET/POST /api/tickets/:id/comments`). |
| **FR-10** | **Internal Notes** | IT Staff and Admin shall view and post append-only Internal Notes (`GET/POST /api/tickets/:id/internal-notes`). Requesters shall be blocked with HTTP 403. |
| **FR-11** | **Admin User Management** | Admin shall list users (`GET /api/admin/users`), search by name/email, filter by role, create user accounts (`POST /api/admin/users`), and edit user profile (`PATCH /api/admin/users/:id`). |
| **FR-12** | **Admin Initial Password Reset** | Admin shall issue a new initial password for any user via `POST /api/admin/users/:id/reset-password`, flagging `mustChangePassword = true`. |

---

## 5. Numbered Business Rules (BRs)

| Rule ID | Rule Name | Description |
| :--- | :--- | :--- |
| **BR-01** | **Authentication Credentials & Active Check** | Only active accounts (`isActive = true`) with matching email and hashed password may authenticate. Inactive account attempts return `401 Unauthorized` without revealing account existence details. |
| **BR-02** | **Mandatory First-Login Password Enforcement** | A user with `mustChangePassword = true` cannot access normal application screens or protected operational APIs. All requests except `/api/auth/change-password`, `/api/auth/logout`, and `/api/auth/me` return `403 Password Change Required`. |
| **BR-03** | **Password Strength Rules** | New passwords must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character. New password cannot match current initial password. |
| **BR-04** | **Session Ownership Integrity** | The backend determines requester identity exclusively from the authenticated session context. Any client-supplied `requesterId` in request bodies or query parameters is ignored. |
| **BR-05** | **Requester Status Indication vs Formal Resolution** | Requesters can set `requesterResolvedIndicated = true` on owned tickets to signal problem resolution. Requesters CANNOT directly set `currentStatus` to `Resolved` or `Closed` (reserved for IT Staff / Admin). |
| **BR-06** | **IT Priority Synchronization** | When a ticket is created, `itPriority` defaults to equal `requestedPriority`. IT Staff or Admin may subsequently update `itPriority` independently. |
| **BR-07** | **Permitted Status Transition Matrix** | Valid status transitions: <br>• `New` ➔ `Open`, `In Progress`, `Cancelled` <br>• `Open` ➔ `In Progress`, `Waiting for Requester`, `Resolved`, `Cancelled` <br>• `In Progress` ➔ `Waiting for Requester`, `Resolved`, `Cancelled` <br>• `Waiting for Requester` ➔ `In Progress`, `Resolved`, `Cancelled` <br>• `Resolved` ➔ `Closed`, `Reopened` <br>• `Reopened` ➔ `In Progress`, `Resolved`, `Cancelled` <br>• `Closed` ➔ (Terminal state) <br>• `Cancelled` ➔ (Terminal state) |
| **BR-08** | **Ticket Ownership Assignment** | Ticket owner (`ownerId`) must refer to an active user with role `IT_STAFF` or `ADMINISTRATOR`. Ownership may be `null` (Unassigned). |
| **BR-09** | **Public Comment Rules** | Public Comments are visible to ticket Requester, IT Staff, and Administrators. Authorship and timestamp are recorded automatically by the backend. Content must be 1 to 2000 characters; empty or whitespace-only content is rejected (`400 Bad Request`). Comments are append-only (no edit/delete). |
| **BR-10** | **Internal Note Confidentiality & Rules** | Internal Notes are visible ONLY to IT Staff and Administrators. Attempts by Requesters to query or post internal notes return `403 Forbidden` without exposing note content. Content rules match Public Comments (1-2000 chars, non-whitespace, append-only). |
| **BR-11** | **Single Role Assignment** | Each user account possesses exactly one role: `REQUESTER`, `IT_STAFF`, or `ADMINISTRATOR`. |
| **BR-12** | **Unique Email Enforcement** | User email addresses must be unique (case-insensitive). Creating or updating a user with an existing email returns `409 Conflict`. |
| **BR-13** | **Self-Deactivation Prevention** | An Administrator cannot deactivate their own active account (`isActive = false`) or change their own role away from `ADMINISTRATOR` via user management (`400 Bad Request`). |
| **BR-14** | **Last Active Administrator Protection** | The system must prevent deactivating or demoting the last active `ADMINISTRATOR` account (`400 Bad Request: Cannot deactivate the last active Administrator`). |
| **BR-15** | **User Account Deactivation** | User accounts are never deleted from the database. Disabling access is achieved exclusively by setting `isActive = false`. Inactive users cannot log in. |
| **BR-16** | **Lab 2 Requester Scope Isolation** | Requesters can query and view ONLY tickets where `requesterId === auth.user.id`. Querying another user's ticket returns `403 Forbidden` or `404 Not Found`. |
| **BR-17** | **Attachment Soft-Removal Integrity** | Lab 2 soft-removal rules for attachments (`isRemoved = true`, `removedAt`, `removalReason`) remain intact under authenticated session authorization. |
| **BR-18** | **Queue Search & Pagination Standards** | Queue API defaults to `page=1`, `limit=10` (max 50). Keywords match `ticketNumber` or `summary` (case-insensitive ILIKE). Default sort is `createdAt` descending. |

---

## 6. Role-Based Access Control (RBAC) Matrix

| Resource / Endpoint | Operational Action | Requester | IT Staff | Admin |
| :--- | :--- | :---: | :---: | :---: |
| `POST /api/auth/login` | Authenticate credentials | Anyone | Anyone | Anyone |
| `POST /api/auth/change-password` | Update initial password | Self | Self | Self |
| `GET /api/tickets/my` | View owned tickets | ✅ Owned | ❌ Forbidden | ❌ Forbidden |
| `POST /api/tickets` | Create ticket | ✅ Self | ✅ Self | ✅ Self |
| `GET /api/tickets/:id` | View ticket detail | ✅ Owned only | ✅ All | ✅ All |
| `PATCH /api/tickets/:id/indicate-resolved` | Signal problem resolved | ✅ Owned only | ❌ Forbidden | ❌ Forbidden |
| `GET /api/tickets/queue` | View ticket queue | ❌ Forbidden | ✅ All | ✅ All |
| `PATCH /api/tickets/:id/assign` | Claim / reassign owner | ❌ Forbidden | ✅ All | ✅ All |
| `PATCH /api/tickets/:id/it-priority` | Update IT Priority | ❌ Forbidden | ✅ All | ✅ All |
| `PATCH /api/tickets/:id/status` | Formal status transition | ❌ Forbidden | ✅ All | ✅ All |
| `GET /api/tickets/:id/comments` | List public comments | ✅ Owned only | ✅ All | ✅ All |
| `POST /api/tickets/:id/comments` | Add public comment | ✅ Owned only | ✅ All | ✅ All |
| `GET /api/tickets/:id/internal-notes` | List internal notes | ❌ Forbidden (403) | ✅ All | ✅ All |
| `POST /api/tickets/:id/internal-notes` | Add internal note | ❌ Forbidden (403) | ✅ All | ✅ All |
| `GET /api/admin/users` | List & filter users | ❌ Forbidden | ❌ Forbidden | ✅ All |
| `POST /api/admin/users` | Create user account | ❌ Forbidden | ❌ Forbidden | ✅ All |
| `PATCH /api/admin/users/:id` | Edit user profile & status | ❌ Forbidden | ❌ Forbidden | ✅ All |
| `POST /api/admin/users/:id/reset-password` | Reset initial password | ❌ Forbidden | ❌ Forbidden | ✅ All |

---

## 7. Data Model Changes & Prisma Schema

### Extended Database Models (`server/prisma/schema.prisma`)

```prisma
enum Role {
  REQUESTER
  IT_STAFF
  ADMINISTRATOR
}

model User {
  id                 Int             @id @default(autoincrement())
  name               String
  email              String          @unique
  passwordHash       String
  role               Role            @default(REQUESTER)
  mustChangePassword Boolean         @default(true)
  isActive           Boolean         @default(true)
  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt

  ticketsSubmitted   Ticket[]        @relation("SubmittedTickets")
  ticketsAssigned    Ticket[]        @relation("AssignedTickets")
  publicComments     PublicComment[]
  internalNotes      InternalNote[]
}

model Ticket {
  id                         Int             @id @default(autoincrement())
  ticketNumber               String          @unique
  requesterId                Int
  requester                  User            @relation("SubmittedTickets", fields: [requesterId], references: [id])
  ownerId                    Int?
  owner                      User?           @relation("AssignedTickets", fields: [ownerId], references: [id])
  categoryId                 Int
  category                   Category        @relation(fields: [categoryId], references: [id])
  relatedSystemId            Int
  relatedSystem              RelatedSystem   @relation(fields: [relatedSystemId], references: [id])
  summary                    String
  description                String
  requestedPriority          String
  itPriority                 String
  currentStatus              String          @default("New")
  requesterResolvedIndicated Boolean         @default(false)
  requesterResolvedAt        DateTime?
  createdAt                  DateTime        @default(now())
  updatedAt                  DateTime        @updatedAt

  attachments                Attachment[]
  publicComments             PublicComment[]
  internalNotes              InternalNote[]
}

model PublicComment {
  id        Int      @id @default(autoincrement())
  ticketId  Int
  ticket    Ticket   @relation(fields: [ticketId], references: [id])
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
  content   String
  createdAt DateTime @default(now())
}

model InternalNote {
  id        Int      @id @default(autoincrement())
  ticketId  Int
  ticket    Ticket   @relation(fields: [ticketId], references: [id])
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
  content   String
  createdAt DateTime @default(now())
}
```

---

## 8. Acceptance Criteria (ACs)

- **AC-01**: Given an active user with valid credentials, when login succeeds, backend returns user profile, role, and authentication token.
- **AC-02**: Given a user with `mustChangePassword = true`, when login succeeds, application forces redirection to Change Password screen, blocking main features until password updated.
- **AC-03**: Given an unauthenticated or invalid credential request, login API returns `401 Unauthorized` with generic safe error message.
- **AC-04**: Given an authenticated Requester, ticket list (`GET /api/tickets/my`) returns only tickets where `requesterId === user.id`.
- **AC-05**: Given an authenticated Requester viewing an owned ticket, they can post a Public Comment and click "Problem Appears Resolved", setting `requesterResolvedIndicated = true`.
- **AC-06**: Given an authenticated Requester, attempting to access `GET /api/tickets/:id/internal-notes` returns `403 Forbidden` without revealing note content.
- **AC-07**: Given an authenticated IT Staff user, `GET /api/tickets/queue` returns paginated tickets across all requesters, supporting search, filters, and sorting.
- **AC-08**: Given an IT Staff user on Ticket Detail, they can claim or reassign ownership, update IT Priority, and transition ticket status through permitted status rules.
- **AC-09**: Given an IT Staff or Admin user, they can post and view both Public Comments and private Internal Notes on any ticket.
- **AC-10**: Given an Administrator user, User Management lists all users with name/email search, role filter, create user form, basic detail edit form, and initial password reset.
- **AC-11**: Given an Administrator attempting to deactivate their own account or the last active Administrator account, the backend rejects the operation with `400 Bad Request`.
- **AC-12**: Given an existing user email, creating or updating another user with the same email returns `409 Conflict`.

---

## 9. Product Definition of Done (DoD)

1. **Specification & Documentation**: All 4 required Sprint 3 contract documents (`specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md`) drafted, reviewed, and stored in `docs/lab-03/`.
2. **Database Schema & Migration**: Prisma schema updated with `User`, `Ticket` extended fields, `PublicComment`, and `InternalNote`. Migration script executed and existing Lab 2 ticket/attachment data preserved.
3. **Idempotent Seed Data**: Seed script populates 4 active Requesters, 1 inactive Requester, 3 active IT Staff, 1 inactive IT Staff, and 1 active Administrator account.
4. **Backend Implementation & RBAC**: Express server endpoints implemented with password hashing, JWT/session authorization, role middleware, and safety rules.
5. **Frontend Application**: React frontend styled with Zen Green tokens featuring Login, Password Change, Role Navbar, IT Queue, IT Ticket Detail, Public Comments, Internal Notes, and User Management.
6. **Automated Testing**: 100% pass rate across backend API integration tests (`server/tests/lab-03/`), frontend component tests (`client/.../lab-03 tests/`), and E2E Playwright tests (`e2e/lab-03/`).
7. **Zero Regression**: All Lab 2 Requester capabilities continue to function properly.

---

## 10. Assumptions and Key Design Decisions

1. **Password Hashing**: `bcrypt` (10 salt rounds) used for securing user passwords.
2. **Session Model**: Bearer token (JWT) passed in `Authorization` header (`Authorization: Bearer <token>`) for seamless REST API consumption and testing.
3. **Requester Resolution Indication**: Modeled as `requesterResolvedIndicated` boolean field on `Ticket` rather than overloading status enums, ensuring clear distinction between requester feedback and formal IT Staff resolution.
