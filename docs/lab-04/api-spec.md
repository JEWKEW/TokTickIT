# Lab 04 — REST API Specification

## 1. Overview & Conventions

- **Base URL:** `/api`
- **Protocol:** HTTP / HTTPS
- **Content-Type:** `application/json` (for JSON payloads) or `multipart/form-data` (for ticket creation with attachments)
- **Authentication Header:** `Authorization: Bearer <jwt_token>`
- **Response Convention:** Match the existing application convention: `{ "success": true, "data": ... }` on success and `{ "success": false, "error": { "code", "message" } }` on failure. Do not expose stack traces, SQL, or secrets.

---

## 2. Standard Response Models

### Success Response Envelope
```json
{
  "success": true,
  "data": { ... }
}
```

### Paginated List Response Envelope
```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "meta": {
      "currentPage": 1,
      "totalPages": 5,
      "pageSize": 10,
      "totalItems": 47
    }
  }
}
```

### Standard Error Response Envelope
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT | STALE_UPDATE | INTERNAL_ERROR",
    "message": "Human-readable explanation of error",
    "details": []
  }
}
```

---

## 3. Actions Taken API Endpoints

### 3.1. Create Action Taken
- **Endpoint:** `POST /api/tickets/:id/actions-taken`
- **Auth Required:** Yes (`IT_STAFF`, `ADMINISTRATOR`)
- **Access Control:** Requesters calling this endpoint receive `403 Forbidden`.
- **Request Body:**
```json
{
  "actionDescription": "Replaced faulty RAM module in slot 2 and ran hardware diagnostic pass.",
  "actionDateTime": "2026-10-07T09:45:00.000Z",
  "result": "System passed 30-minute stress test with 0 memory errors.",
  "followUpRequired": true,
  "followUpNote": "Schedule follow-up check with user tomorrow morning to verify stability.",
  "attachmentNotes": "Diagnostic report saved as memtest_pass.log"
}
```
- **Validation Rules**:
  - `actionDescription`: String, 1–2000 characters, required.
  - `actionDateTime`: Valid ISO-8601 timestamp, required; records when work occurred, may be in the past, and must not be in the future. Persist as UTC.
  - `result`: String, 1–1000 characters, required.
  - `followUpRequired`: Boolean, required.
  - `followUpNote`: String, 1–1000 characters. **Mandatory** when `followUpRequired = true`. Must be non-empty.
  - `attachmentNotes`: String, optional, max 500 characters.
  - `performedById`: Automatically set from authenticated user token.
- **Response `201 Created`**:
```json
{
  "success": true,
  "data": {
    "id": 15,
    "ticketId": 12,
    "performedBy": {
      "id": 3,
      "name": "Michael Brown",
      "email": "mbrown@toktickit.com",
      "role": "IT_STAFF"
    },
    "actionDateTime": "2026-10-07T09:45:00.000Z",
    "actionDescription": "Replaced faulty RAM module in slot 2 and ran hardware diagnostic pass.",
    "result": "System passed 30-minute stress test with 0 memory errors.",
    "followUpRequired": true,
    "followUpNote": "Schedule follow-up check with user tomorrow morning to verify stability.",
    "attachmentNotes": "Diagnostic report saved as memtest_pass.log",
    "createdAt": "2026-10-07T10:15:00.000Z",
    "updatedAt": "2026-10-07T10:15:00.000Z"
  }
}
```
- **Response `400 Bad Request`**: Validation error (e.g., missing follow-up note when required).
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Follow-up note is required when follow-up is requested."
  }
}
```
- **Response `403 Forbidden`**: Requester role attempt.

---

### 3.2. List Actions Taken for a Ticket
- **Endpoint:** `GET /api/tickets/:id/actions-taken`
- **Auth Required:** Yes
- **Access Control:**
  - `IT_STAFF` & `ADMINISTRATOR`: Can view actions for any ticket.
  - `REQUESTER`: Can view actions ONLY for tickets where `requesterId === auth.user.id`. Querying actions for another user's ticket returns `403 Forbidden`.
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "id": 15,
      "ticketId": 12,
      "performedBy": {
        "id": 3,
        "name": "Michael Brown",
        "role": "IT_STAFF"
      },
      "actionDateTime": "2026-10-07T09:45:00.000Z",
      "actionDescription": "Replaced faulty RAM module in slot 2 and ran hardware diagnostic pass.",
      "result": "System passed 30-minute stress test with 0 memory errors.",
      "followUpRequired": true,
      "followUpNote": "Schedule follow-up check with user tomorrow morning to verify stability.",
      "attachmentNotes": "Diagnostic report saved as memtest_pass.log",
      "createdAt": "2026-10-07T10:15:00.000Z",
      "updatedAt": "2026-10-07T10:15:00.000Z"
    }
  ]
}
```

---

### 3.3. Update Action Taken
- **Endpoint:** `PATCH /api/tickets/:id/actions-taken/:actionId`
- **Auth Required:** Yes (`IT_STAFF`, `ADMINISTRATOR`)
- **Request Body:** `expectedUpdatedAt` is required for edits. Omit immutable identity fields (`ticketId`, `performedById`); the server does not allow reassignment or changing the original performer.
```json
{
  "actionDateTime": "2026-10-07T09:45:00.000Z",
  "actionDescription": "Replaced faulty RAM module and updated motherboard BIOS.",
  "result": "Stress test passed and BIOS updated to v2.4.",
  "followUpRequired": false,
  "followUpNote": null,
  "attachmentNotes": "memtest_pass.log and bios_update.log",
  "expectedUpdatedAt": "2026-10-07T10:15:00.000Z"
}
```
- **Response `200 OK`**: Returns updated Action Taken record.
- `actionDateTime`, description, result, follow-up state/note, and attachment notes are editable; `ticketId`, `performedById`, and `createdAt` are immutable.
- **Response `409 Conflict` (Stale Update Detection)**:
```json
{
  "success": false,
  "error": {
    "code": "STALE_UPDATE",
    "message": "This Action Taken record has been modified by another user. Please refresh and retry."
  }
}
```

---

## 4. Ticket Status Workflow API Endpoints

### 4.1. Update Ticket Status (Formal Transition)
- **Endpoint:** `PATCH /api/tickets/:id/status`
- **Auth Required:** Yes (`IT_STAFF`, `ADMINISTRATOR`)
- **Access Control:** Requesters receive `403 Forbidden`.
- **Request Body:**
```json
{
  "status": "In Progress",
  "expectedUpdatedAt": "2026-10-07T09:00:00.000Z"
}
```
- **Validation Rules**:
  - `status`: Must be a valid status string (`New`, `Open`, `In Progress`, `Waiting for Requester`, `Resolved`, `Closed`, `Reopened`, `Cancelled`).
  - `expectedUpdatedAt`: Required ISO-8601 timestamp matching the Ticket version the client last read.
  - Transition must be permitted by the BR-07 transition matrix.
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "id": 12,
    "ticketNumber": "TKT-2026-000012",
    "currentStatus": "In Progress",
    "updatedAt": "2026-10-07T10:30:00.000Z"
  }
}
```
- **Response `400 Bad Request`**: Invalid transition attempt (e.g., `New` ➔ `Resolved`).
```json
{
  "success": false,
  "error": {
    "code": "INVALID_TRANSITION",
    "message": "Cannot transition ticket status directly from 'New' to 'Resolved'."
  }
}
```
- **Response `409 Conflict`**: Stale update attempt.

---

### 4.2. Indicate Problem Appears Resolved (Requester Action)
- **Endpoint:** `PATCH /api/tickets/:id/indicate-resolved`
- **Auth Required:** Yes (`REQUESTER` - owned tickets only)
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "id": 12,
    "requesterResolvedIndicated": true,
    "requesterResolvedAt": "2026-10-07T10:45:00.000Z",
    "currentStatus": "In Progress"
  }
}
```
*(Note: `currentStatus` is NOT altered by this request, adhering to BR-08).*

---

## 5. Operational & Requester Dashboard Endpoints

### 5.1. Retrieve Requester Dashboard Data
- **Endpoint:** `GET /api/dashboards/requester`
- **Auth Required:** Yes (`REQUESTER`)
- **Access Control:** Calculates concise metrics ONLY for `requesterId === auth.user.id`.
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "metrics": {
      "openCount": 5,
      "inProgressCount": 2,
      "waitingForRequesterCount": 1
    },
    "recentlyUpdated": [
      {
        "id": 12,
        "ticketNumber": "TKT-2026-000012",
        "summary": "Laptop screen flickers when on battery",
        "category": "Hardware",
        "currentStatus": "In Progress",
        "requesterResolvedIndicated": false,
        "createdAt": "2026-10-06T14:20:00.000Z",
        "updatedAt": "2026-10-07T10:30:00.000Z"
      }
    ],
    "recentlyResolved": []
  }
}
```

---

### 5.2. Retrieve IT Staff & Administrator Dashboard Data
- **Endpoint:** `GET /api/dashboards/staff`
- **Auth Required:** Yes (`IT_STAFF`, `ADMINISTRATOR`)
- **Access Control:** Requesters calling this endpoint receive `403 Forbidden`.
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "metrics": {
      "statusCounts": {
        "New": 14,
        "Open": 23,
        "In Progress": 18,
        "Waiting for Requester": 7,
        "Resolved": 5,
        "Closed": 3,
        "Reopened": 1,
        "Cancelled": 2
      },
      "myAssignedCount": 16,
      "unassignedCount": 5,
      "priorityCounts": {
        "Low": 10,
        "Medium": 25,
        "High": 18,
        "Urgent": 9
      }
    },
    "recentTickets": [
      {
        "id": 14,
        "ticketNumber": "TKT-2026-000014",
        "summary": "Core router offline in East Wing",
        "itPriority": "Urgent",
        "currentStatus": "New",
        "owner": null,
        "createdAt": "2026-10-07T08:00:00.000Z"
      }
    ],
    "myRecentActions": [
      {
        "id": 15,
        "ticketId": 12,
        "ticketNumber": "TKT-2026-000012",
        "actionDescription": "Replaced faulty RAM module...",
        "result": "System passed stress test...",
        "followUpRequired": true,
        "actionDateTime": "2026-10-07T09:45:00.000Z"
      }
    ],
    "adminUserCounts": {
      "activeRequesters": 42,
      "activeStaff": 8,
      "activeAdmins": 2
    }
  }
}
```
*(Note: `adminUserCounts` is present only when requested by an `ADMINISTRATOR` token).*

---

## 6. Preserved Health & System Endpoints

Lab 4 extends the existing API and does not replace the Labs 1–3 contracts. The following endpoint families keep their existing request/response, validation, and role/ownership rules documented in `docs/lab-03/api-spec.md` and `docs/lab-02/api-spec.md`; regression checks must cover them (AC-17):

| Endpoint family | Methods and paths | Existing access / behavior to preserve |
|---|---|---|
| Authentication | `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/change-password`, `POST /api/auth/logout` | Active-account authentication, session identity, and required password-change enforcement |
| Ticket lists and details | `GET /api/tickets`, `GET /api/tickets/my`, `GET /api/tickets/queue`, `GET /api/tickets/:id`, `POST /api/tickets` | Requester ownership; staff queue access; existing pagination, filtering, validation, and attachment upload behavior |
| Ticket operations | `PATCH /api/tickets/:id/assign`, `PATCH /api/tickets/:id/it-priority`, `PATCH /api/tickets/:id/status`, `PATCH /api/tickets/:id/indicate-resolved` | Existing Lab 3 assignment and status rules; Lab 4 adds required stale-update protection to status writes |
| Attachments | `POST /api/tickets/:id/attachments`, `GET /api/attachments/:id/download`, `DELETE /api/attachments/:id`, `DELETE /api/tickets/:id/attachments/:attachmentId` | Existing ticket access, file validation, download, and soft-removal rules |
| Comments and notes | `GET/POST /api/tickets/:id/comments`, `GET/POST /api/tickets/:id/internal-notes` | Public comments follow ticket visibility; internal notes remain staff/admin only and append-only |
| User administration | `GET/POST /api/admin/users`, `PATCH /api/admin/users/:id`, `POST /api/admin/users/:id/reset-password` | Administrator-only operations and existing account safety checks |

Any changes to these contracts must be separately identified, justified, and covered by regression tests; this Spec DD does not silently redefine Lab 1–3 behavior.

### 6.1. System Health Check
- **Endpoint:** `GET /api/health`
- **Auth Required:** No (Public)
- **Response `200 OK`**:
```json
{
  "status": "ok",
  "service": "TokTickIT API"
}
```

---

## 7. Stale Update & Conflict Handling Protocol

To prevent concurrent users from silently overwriting each other's changes [H§6.1]:
1. Any state-modifying request (`PATCH /api/tickets/:id/status`, `PATCH /api/tickets/:id/actions-taken/:actionId`) MUST supply `expectedUpdatedAt`.
2. The server performs a conditional update against the stored `updatedAt` timestamp, so comparison and write cannot race.
3. If timestamps do not match, the server leaves the record unchanged and returns `409 Conflict` with error code `"STALE_UPDATE"`.
4. The client UI displays an alert: `"This record was modified by another user. Refreshing..."` and automatically reloads the fresh record.

Action updates must also verify that the Action Taken belongs to the Ticket identified by `:id`; otherwise return `404 Not Found`. Create requests are protected from duplicate form submission in the UI; the API does not claim retry idempotency unless an idempotency key is added to this contract.

## 8. Dashboard Calculation and Drill-Down Rules

- Requester scope is always the authenticated user's `requesterId`; the client cannot supply another identity.
- Requester `open` counts statuses other than Resolved, Closed, or Cancelled. `waitingForRequester` is a separate subset. Include `inProgress`, a five-item `recentlyUpdated` list, and a five-item `recentlyResolved` list.
- `recentlyUpdated` sorts by `updatedAt` descending. `recentlyResolved` includes Resolved and Closed tickets whose `updatedAt` is within the prior 30 days, sorted newest first.
- Staff metrics include counts for all eight statuses, unassigned tickets, tickets whose `ownerId` is the current user, counts by non-null IT Priority, five recently updated tickets, and five latest Actions Taken by the current user ordered by `actionDateTime` descending.
- All date boundaries use UTC. Recent lists return `[]` and zero-count metrics return `0` when no records match. Dashboard endpoints return summaries only, never complete ticket collections.
- Metric cards drill down to `/queue` or `/my-tickets` with the corresponding supported status/owner filter. Ticket rows link to `/tickets/:id`.
- Administrators receive staff metrics. Account counts are optional; if included, return them only for Administrators and count active users by role.

## 9. Requirement Coverage

| Contract requirement | API coverage |
|---|---|
| FR-01–FR-05, FR-14, BR-01–BR-06, BR-15 | Actions Taken create/list/update, validation, performer binding, ownership checks, action time and immutable fields (§3) |
| FR-06–FR-08, BR-07–BR-08, BR-12 | Ticket transition, advisory indication, role checks, and stale update handling (§4, §7) |
| FR-09–FR-11, BR-09–BR-11, BR-17 | Dashboard isolation, metric definitions, summaries, empty behavior, and drill-downs (§5, §8) |
| FR-12, BR-12 | Conditional update and conflict response (§7) |
| FR-13, BR-13–BR-14, BR-16 | Existing authenticated APIs and data behavior remain in force; assignment eligibility follows Lab 3 contract and seed idempotency is defined in Issue 3 |
