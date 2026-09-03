# Lab 02 — Requester Ticketing System Specification

## 1. Sprint Goal

Deliver the **Requester MVP Capabilities** for the **TokTickIT** IT Service Desk platform. This release enables end-users (Requesters) to switch simulated user contexts during development, submit IT service request tickets complete with multiple file attachments, browse their own tickets in a responsive paginated dashboard with robust search/filtering/sorting, inspect read-only ticket details, and manage uploaded attachments via soft-deletion.

---

## 2. Stakeholder Interpretation & User Stories

- **As a Requester (End User),** I want to switch between active development accounts ("Fake Login") so I can simulate creating and viewing tickets as different users without requiring complex OAuth authentication.
- **As a Requester,** I want to submit IT support request tickets with clear titles, categories, priorities, detailed descriptions, and file attachments so IT agents have full context to resolve my issue.
- **As a Requester,** I want to view a paginated list of my submitted tickets, filter by category/priority/status, and search by ticket code or title so I can track the progress of my requests.
- **As a Requester,** I want to view a read-only ticket detail page and safely remove obsolete or mistaken attachments without losing historical metadata.

---

## 3. System Scope & Exclusions

### In Scope for Lab 02:
- Development Requester Context Switching dropdown in the header navbar (`x-user-id` header).
- Live loading of active Requesters, Categories, and Related Systems from PostgreSQL via Prisma ORM.
- Ticket creation with client/server validation, unique code auto-generation (`TKT-YYYY-XXXXXX`), and file attachment uploads (JPG, PNG, WEBP, PDF up to 5MB).
- Paginated "My Tickets" list dashboard with debounced search, filtering, and sorting.
- Read-only Ticket Detail view with requester ownership enforcement (HTTP 403/404).
- Soft-removal of attachments (`isRemoved = true`, `removedAt = now()`, `removalReason`).
- Responsive layout across Desktop (≥992px), Tablet (768px–991px), and Mobile (<768px) styled with the **Zen Green** theme design tokens.

### Excluded / Out of Scope for Lab 02:
- Real authentication/OAuth/JWT login (scheduled for Lab 03).
- Public comments, internal notes, and agent action workflows (scheduled for subsequent labs).
- Ticket status updates by Requesters (tickets remain read-only post-creation).
- Hard deletion of attachments or ticket records.

---

## 4. Numbered Functional Requirements (FRs)

| FR ID | Feature Area | Description |
| :--- | :--- | :--- |
| **FR-01** | **Dev Context Selector** | System shall render an active-only Requester selector dropdown populated from `GET /api/requesters` / `GET /api/users/dev-list`. |
| **FR-02** | **Context Propagation** | Client application shall attach `x-user-id: <id>` HTTP header on all API requests after context selection. |
| **FR-03** | **Ticket Submission** | System shall accept ticket creation requests via `POST /api/tickets` with required fields (category, related system, summary, description, requested priority). |
| **FR-04** | **File Upload Handling** | System shall accept up to 3 initial file attachments per ticket creation, validating size (≤5MB) and MIME type. |
| **FR-05** | **Ticket Dashboard** | System shall provide `GET /api/tickets/my` returning paginated tickets owned by the requesting user, supporting search, category/priority/status filter, and sort parameters. |
| **FR-06** | **Ticket Detail View** | System shall provide `GET /api/tickets/:id` enforcing requester ownership and displaying read-only metadata. |
| **FR-07** | **Attachment Soft-Removal** | System shall provide `DELETE /api/tickets/:id/attachments/:attachmentId` and `DELETE /api/attachments/:id` to soft-remove attachments. |
| **FR-08** | **Secure Attachment Download** | System shall provide `GET /api/attachments/:id/download` allowing file downloads for active attachments while rejecting soft-removed attachments (HTTP 400/403/404). |

---

## 5. Numbered Business Rules (BRs)

| Rule ID | Name | Description |
| :--- | :--- | :--- |
| **BR-01** | **Development User Switching (Simulated Login)** | In development mode, authentication is simulated via an active user selector in the client UI. The client sends the selected user's ID in the custom HTTP header `x-user-id`. Server requests missing `x-user-id` return HTTP `401 Unauthorized`. Inactive users (`isActive = false`) are excluded. |
| **BR-02** | **Ticket Field Requirements & Validations** | A ticket must contain: <br>• **Summary**: Required string, 1 to 100 characters. <br>• **Category**: Required valid foreign key reference (`categoryId`). <br>• **Related System**: Required valid foreign key reference (`relatedSystemId`). <br>• **Requested Priority**: Required enum (`Low`, `Medium`, `High`, `Urgent`). <br>• **Description**: Required string, 1 to 1000 characters. <br>Default ticket status on creation is `New`. |
| **BR-03** | **Attachment Restrictions** | Ticket creation payload can include up to **3 files**. Detail view allows adding up to **5 active attachments total** per ticket. Each file must not exceed **5MB** in size. Allowed MIME types are `image/jpeg`, `image/png`, `image/webp`, `application/pdf`. |
| **BR-04** | **Ticket Code Auto-Generation** | Every ticket is assigned a unique, human-readable identifier upon creation formatted as `TKT-YYYY-XXXXXX` (e.g., `TKT-2026-000001`), where `XXXXXX` is a zero-padded sequential integer. |
| **BR-05** | **Requester Data Ownership Scoping** | Requesters can **only** query, view, or modify tickets and attachments that belong to their own `requesterId` (derived from `x-user-id`). Attempts to access another user's ticket return HTTP `403 Forbidden` or `404 Not Found`. |
| **BR-06** | **Pagination & Sorting Standards** | "My Tickets" listing defaults to `page=1` and `limit=10` (maximum limit is `50`). Results are sorted by `createdAt` descending (`desc`) by default. Supported sort fields: `createdAt`, `updatedAt`, `ticketNumber`, `summary`, `priority`, `status`. |
| **BR-07** | **Read-Only Ticket Detail** | The Ticket Detail view is read-only for Requesters in Lab 02. Requesters cannot modify summary, description, category, priority, or status directly once created. |
| **BR-08** | **Attachment Soft-Removal** | Deleting an attachment performs a **soft removal**. The database record updates `isRemoved = true`, populates `removedAt = timestamp`, and records `removalReason`. The physical file remains on disk for audit, but soft-removed attachments are marked as "Soft Removed" in UI and blocked from download. |

---

## 6. UI / UX Design System Summary (Zen Green)

The interface is styled with Bootstrap 5 and customized using **Zen Green** design tokens:
- **Primary Brand Header:** `#006B3C` (`--zg-primary`)
- **Secondary Accent & Focus:** `#0B7A46` (`--zg-accent`)
- **Selected Surface & Light Tint:** `#EAF6EF` (`--zg-surface-selected`)
- **Main Page Background:** `#F8FAF9` (`--zg-bg-main`)
- **Surface Cards:** `#FFFFFF` (`--zg-surface-card`)
- **Text Headings & Body:** `#122119` (`--zg-text-heading`), `#3A4B40` (`--zg-text-body`)
- **Field Styling:** Read-only inputs visually distinguished with soft gray-green background (`#F4F8F5`); editable fields clear white with neutral borders. Validation errors display red asterisks and inline messages below invalid fields.

---

## 7. Data Model Changes & Schema

### Prisma Schema (`server/prisma/schema.prisma`)
- `RequesterUser`: `id`, `name`, `email` (unique), `isActive`, relation to `Ticket[]`.
- `Category`: `id`, `name` (unique), `isActive`, `createdAt`, relation to `Ticket[]`.
- `RelatedSystem`: `id`, `name` (unique), `isActive`, relation to `Ticket[]`.
- `Ticket`: `id`, `ticketNumber` (unique), `requesterId`, `categoryId`, `relatedSystemId`, `summary`, `description`, `requestedPriority`, `itPriority`, `currentStatus` (default `"New"`), `createdAt`, `updatedAt`, relation to `Attachment[]`.
- `Attachment`: `id`, `ticketId`, `originalFileName`, `storedFileName`, `fileSize`, `mimeType`, `isRemoved` (default `false`), `removalReason`, `removedAt`, `createdAt`.

---

## 8. REST API Contract Summary

- `GET /api/requesters` / `GET /api/users/dev-list`: Returns active requester accounts.
- `GET /api/categories`: Returns active categories.
- `GET /api/related-systems`: Returns active related systems.
- `POST /api/tickets`: Creates ticket with multipart file attachments (returns `201 Created`).
- `GET /api/tickets` / `GET /api/tickets/my`: Returns paginated requester-scoped ticket list (returns `200 OK`).
- `GET /api/tickets/:id`: Returns ticket details owned by requester (returns `200 OK`, `403 Forbidden`, `404 Not Found`).
- `POST /api/tickets/:id/attachments`: Uploads attachment to existing ticket (returns `201 Created`).
- `GET /api/attachments/:id/download`: Secure download for active attachment (returns file or `400/403/404`).
- `DELETE /api/tickets/:id/attachments/:attachmentId`: Soft-removes attachment (returns `200 OK`).

---

## 9. Given-When-Then Acceptance Criteria (ACs)

### AC-01: Development User Selector (Simulated Authentication)
- **Given** the application is running in development mode,
- **When** the requester selects an active user (e.g., "Alice Johnson") from the dev context dropdown,
- **Then** all subsequent client API requests include `x-user-id: <id>`, and the dashboard updates to reflect data owned by Alice Johnson.

### AC-02: Valid Ticket Creation with Attachments
- **Given** a requester has selected a valid user context and opened the Ticket Creation form,
- **When** they provide valid inputs (Category, Related System, Summary, Description, Priority) and attach valid files (≤5MB, JPG/PNG/WEBP/PDF), and submit,
- **Then** the server creates the ticket with status `"New"`, generates code `TKT-YYYY-XXXXXX`, saves attachments, and returns HTTP `201 Created`.

### AC-03: Invalid File Attachment Rejection
- **Given** a requester is attaching files to a new ticket,
- **When** they attach a file exceeding 5MB or an unapproved file type (e.g. `.exe`),
- **Then** client validation blocks submission with an inline error message, and if submitted to server, the server responds with HTTP `400 Bad Request`.

### AC-04: Paginated My Tickets Retrieval
- **Given** a requester has multiple tickets,
- **When** they navigate to "My Tickets" (`page=1`, `limit=10`),
- **Then** the API returns HTTP `200 OK` with 10 items and pagination metadata (`currentPage`, `totalPages`, `totalItems`, `hasNextPage`, `hasPrevPage`).

### AC-05: Searching, Filtering & Sorting My Tickets
- **Given** a requester is viewing their ticket list,
- **When** they enter a search keyword, filter by Category or Priority, or change sort order,
- **Then** the table displays only matching tickets belonging to the requester, sorted accordingly.

### AC-06: Ticket Detail View Access Control
- **Given** Requester A attempts to view a ticket created by Requester B,
- **When** Requester A requests `/api/tickets/:id` with Requester A's `x-user-id`,
- **Then** the server responds with HTTP `403 Forbidden` (`"You do not have permission to view this ticket"`), and the client displays an access denied error message.

### AC-07: Attachment Soft-Deletion by Owner
- **Given** a requester viewing their own ticket detail containing an active attachment,
- **When** the requester clicks "Remove Attachment" and confirms the modal prompt,
- **Then** a `DELETE /api/tickets/:id/attachments/:attachmentId` request is issued, the server sets `isRemoved = true` and `deletedAt = now()`, returns HTTP `200 OK`, and the attachment state updates to "Soft Removed".

---

## 10. Definition of Done (DoD)

To consider Lab 02 complete, the team must satisfy all of the following requirements:

1. **Specification & Contracts:**
   - [x] Complete specifications (`specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md`) finalized and placed in `docs/lab-02/`.
2. **Database & Backend:**
   - [x] Prisma schema updated with `RequesterUser`, `Category`, `RelatedSystem`, `Ticket`, and `Attachment` models with proper relations and soft-delete fields.
   - [x] Database migration executed cleanly; initial seed script populated with active/inactive dev requesters, categories, and related systems.
   - [x] Express endpoints implemented: dev user list, ticket creation with file uploads (Multer/storage handling), paginated search/filter/sort list, read-only detail, attachment upload, download, and soft-delete.
3. **Frontend & Styling:**
   - [x] Bootstrap 5 themed with **Zen Green** CSS variable design tokens (`--zg-primary`, `--zg-accent`, `--zg-surface`, etc.).
   - [x] Dev Requester selector functional in header navbar.
   - [x] Form validation implemented with file size/type drag-and-drop feedback.
   - [x] Paginated ticket table with active filters, search, and sorting controls.
   - [x] Read-only detail view with soft-remove modal/button for attachments.
4. **Testing & Quality Assurance:**
   - [x] Backend API integration test suite (Supertest) passing 100% (36/36 tests).
   - [x] Frontend component & integration test suite (Vitest + RTL) passing 100% (32/32 tests).
   - [x] Playwright E2E test suite passing 100% (1/1 test) with responsive screenshots captured.

---

## 11. Technical Assumptions & Constraints

1. **Development Authentication:** Development mode utilizes simulated header-based authentication via `x-user-id`. Production auth (OAuth 2.0 / JWT) is deferred to Lab 3.
2. **File Storage:** Uploaded attachments are saved to local filesystem under `server/uploads/` with sanitized, timestamped unique filenames.
3. **Database Engine:** PostgreSQL database running locally or via container.
4. **Supported Browsers:** Modern Chromium, Firefox, and WebKit browsers supporting ES2022+ features.
