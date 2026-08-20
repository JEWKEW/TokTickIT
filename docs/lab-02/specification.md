# Lab 02 — Requester Ticketing System Specification

## 1. System Overview & Scope

**TokTickIT** Lab 02 expands the IT Service Desk platform by introducing the **Requester MVP Capabilities**. This release enables end-users (Requesters) to switch simulated user contexts during development, submit IT service request tickets complete with multiple file attachments, browse their own tickets in a responsive paginated dashboard with robust search/filtering/sorting, inspect read-only ticket details, and manage uploaded attachments via soft-deletion.

---

## 2. Numbered Business Rules (BRs)

| Rule ID | Name | Description |
| :--- | :--- | :--- |
| **BR-01** | **Development User Switching (Simulated Login)** | In development mode, authentication is simulated via an active user selector in the client UI. The client sends the selected user's ID in the custom HTTP header `x-user-id`. Server requests missing `x-user-id` default to a seeded fallback user or return HTTP `401 Unauthorized`. |
| **BR-02** | **Ticket Field Requirements & Validations** | A ticket must contain: <br>• **Title**: Required string, 5 to 150 characters. <br>• **Category**: Required valid foreign key reference (`categoryId`). <br>• **Priority**: Required enum (`LOW`, `MEDIUM`, `HIGH`, `URGENT`). <br>• **Description**: Required string, 10 to 2000 characters. <br>Default ticket status on creation is `OPEN`. |
| **BR-03** | **Attachment Restrictions** | A ticket creation payload can include up to **3 files**. Each file must not exceed **5MB** in size. Allowed MIME types are restricted to `image/jpeg`, `image/png`, `image/webp`, `application/pdf`, and `text/plain`. |
| **BR-04** | **Ticket Code Auto-Generation** | Every ticket is assigned a unique, human-readable identifier upon creation formatted as `TCK-YYYYMMDD-XXXX` (e.g., `TCK-20260820-0001`), where `XXXX` is a zero-padded sequential integer or random unique hex identifier. |
| **BR-05** | **Requester Data Ownership Scoping** | Requesters can **only** query, view, or modify tickets and attachments that belong to their own `requesterId` (derived from `x-user-id`). Attempts to access another user's ticket return HTTP `403 Forbidden` or `404 Not Found`. |
| **BR-06** | **Pagination & Sorting Standards** | "My Tickets" listing defaults to `page=1` and `limit=10` (maximum limit is `50`). Results are sorted by `createdAt` descending (`desc`) by default. Supported sort fields: `createdAt`, `updatedAt`, `priority`. |
| **BR-07** | **Read-Only Ticket Detail** | The Ticket Detail view is read-only for Requesters in Lab 02. Requesters cannot modify title, description, category, priority, or status directly once created. |
| **BR-08** | **Attachment Soft-Removal** | Deleting an attachment performs a **soft removal**. The database record updates `isDeleted = true` and populates `deletedAt = timestamp`. The physical file remains on disk/storage for audit, but soft-deleted attachments are excluded from standard API responses and UI views. |

---

## 3. Given-When-Then Acceptance Criteria (ACs)

### AC-01: Development User Selector (Simulated Authentication)
- **Given** the application is running in development mode,
- **When** the requester selects a user (e.g., "Alice Johnson (Requester)") from the dev context dropdown in the navbar,
- **Then** all subsequent client API requests include the `x-user-id: <user_id>` HTTP header, and the dashboard updates to reflect data owned by Alice Johnson.

### AC-02: Valid Ticket Creation with Attachments
- **Given** a requester has selected a valid user context and opened the Ticket Creation form,
- **When** they provide a valid title ("VPN Connection Error"), category ("Network"), priority ("HIGH"), description ("Cannot connect to corporate VPN from home"), attach 2 valid files (`logs.txt` 150KB, `screenshot.png` 1.2MB), and submit,
- **Then** the server creates the ticket with status `OPEN`, generates a ticket code `TCK-YYYYMMDD-XXXX`, attaches the 2 files, and returns HTTP `201 Created` with the complete ticket object.

### AC-03: Invalid File Attachment Rejection
- **Given** a requester is attaching files to a new ticket,
- **When** they attach a file exceeding 5MB (e.g., `video.mp4` 12MB) or an unapproved file type (e.g., `script.exe`),
- **Then** client validation blocks submission with an immediate inline error message, and if submitted to server, the server responds with HTTP `400 Bad Request` and message `"File size exceeds 5MB limit or invalid MIME type"`.

### AC-04: Paginated My Tickets Retrieval
- **Given** a requester has 25 created tickets,
- **When** they navigate to "My Tickets" (`page=1`, `limit=10`),
- **Then** the API returns HTTP `200 OK` with 10 ticket items, and pagination metadata showing `currentPage: 1`, `totalPages: 3`, `totalItems: 25`, `hasNextPage: true`.

### AC-05: Searching, Filtering & Sorting My Tickets
- **Given** a requester is viewing their ticket list,
- **When** they type `"VPN"` in search, filter by Category `"Network"` and Priority `"HIGH"`, and select Sort By `"Priority (Desc)"`,
- **Then** the table displays only tickets matching title/code `"VPN"`, category `"Network"`, priority `"HIGH"`, ordered from `URGENT` to `LOW`.

### AC-06: Ticket Detail View Access Control
- **Given** Requester A (User ID 1) attempts to view ticket `TCK-20260820-0042` created by Requester B (User ID 2),
- **When** Requester A requests `/api/tickets/:id` with `x-user-id: 1`,
- **Then** the server responds with HTTP `403 Forbidden` (`"You do not have permission to view this ticket"`), and the client displays an access denied error page.

### AC-07: Attachment Soft-Deletion by Owner
- **Given** a requester viewing their own ticket detail containing active attachment `doc.pdf` (ID `att_123`),
- **When** the requester clicks "Remove Attachment" and confirms the prompt,
- **Then** a `DELETE /api/tickets/:id/attachments/att_123` request is issued, the server sets `isDeleted = true` and `deletedAt = now()`, returns HTTP `200 OK`, and the attachment is immediately removed from the active ticket detail view.

---

## 4. Definition of Done (DoD)

To consider Lab 02 complete, the team must satisfy all of the following requirements:

1. **Specification & Contracts:**
   - [x] Complete specifications (`specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md`) finalized and placed in `docs/lab-02/`.
2. **Database & Backend:**
   - [ ] Prisma schema updated with `User`, `Ticket`, and `Attachment` models with proper relations and soft-delete fields.
   - [ ] Database migration executed cleanly; initial seed script populated with dev users and category records.
   - [ ] Express endpoints implemented: dev user list, ticket creation with file uploads (Multer/storage handling), paginated search/filter/sort list, read-only detail, soft-delete attachment.
3. **Frontend & Styling:**
   - [ ] Bootstrap 5 themed with **Zen Green** CSS variable design tokens (`--zg-primary`, `--zg-accent`, `--zg-surface`, etc.).
   - [ ] Dev Requester selector functional in header navbar.
   - [ ] Form validation implemented with file size/type drag-and-drop feedback.
   - [ ] Paginated ticket table with active filters, search, and sorting controls.
   - [ ] Read-only detail view with soft-remove modal/button for attachments.
4. **Testing & Quality Assurance:**
   - [ ] Backend API integration test suite (Supertest) passing 100% for all happy paths and error cases (400, 401, 403, 404).
   - [ ] Frontend component & integration test suite (Vitest + RTL) passing 100% for user switching, ticket listing, creation, and detail view.
