# Lab 02 — REST API Specification

## 1. Overview & Conventions

- **Base URL:** `/api`
- **Protocol:** HTTP / HTTPS
- **Content-Type:** `application/json` (for standard payloads) or `multipart/form-data` (for ticket creation with attachments)
- **Simulated Dev Authentication Header:** `x-user-id: <number>`

---

## 2. Standard Response Models

### Success Response Envelope
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response Model (RFC 7807 Inspired)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | INTERNAL_ERROR",
    "message": "Human-readable explanation of error",
    "details": []
  }
}
```

---

## 3. Database & Prisma Schema Blueprint

```prisma
model RequesterUser {
  id        Int      @id @default(autoincrement())
  name      String
  email     String   @unique
  isActive  Boolean  @default(true)
  tickets   Ticket[]
}

model Category {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  tickets   Ticket[]
}

model RelatedSystem {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  isActive  Boolean  @default(true)
  tickets   Ticket[]
}

model Ticket {
  id                Int           @id @default(autoincrement())
  ticketNumber      String        @unique
  requesterId       Int
  requester         RequesterUser @relation(fields: [requesterId], references: [id])
  categoryId        Int
  category          Category      @relation(fields: [categoryId], references: [id])
  relatedSystemId   Int
  relatedSystem     RelatedSystem @relation(fields: [relatedSystemId], references: [id])
  summary           String
  description       String
  requestedPriority String
  itPriority        String?
  currentStatus     String        @default("New")
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  attachments       Attachment[]
}

model Attachment {
  id               Int       @id @default(autoincrement())
  ticketId         Int
  ticket           Ticket    @relation(fields: [ticketId], references: [id])
  originalFileName String
  storedFileName   String
  fileSize         Int
  mimeType         String
  isRemoved        Boolean   @default(false)
  removalReason    String?
  removedAt        DateTime?
  createdAt        DateTime  @default(now())
}
```

---

## 4. API Endpoint Contracts

### 4.1 Development User Context Selector
#### `GET /api/requesters` & `GET /api/users/dev-list`
Retrieves active seeded user accounts (`isActive = true`) for switching simulated user context in development mode.

- **Request Headers:** None
- **Response `200 OK`:**
```json
[
  { "id": 1, "name": "Alice Johnson", "email": "alice@toktickit.io", "isActive": true },
  { "id": 2, "name": "Bob Smith", "email": "bob@toktickit.io", "isActive": true },
  { "id": 3, "name": "Charlie Davis", "email": "charlie@toktickit.io", "isActive": true },
  { "id": 4, "name": "Diana Prince", "email": "diana@toktickit.io", "isActive": true }
]
```

---

### 4.2 Create Ticket with File Attachments
#### `POST /api/tickets`
Creates a new IT support ticket under the authenticated requester's account (`x-user-id`) with optional file attachments.

- **Request Headers:**
  - `x-user-id: 1` (Required)
  - `Content-Type: multipart/form-data`
- **Form Fields (`multipart/form-data`):**
  - `categoryId` (number, required)
  - `relatedSystemId` (number, required)
  - `requestedPriority` (string: `Low`, `Medium`, `High`, `Urgent`, required)
  - `summary` (string, required, 1-100 chars)
  - `description` (string, required, 1-1000 chars)
  - `files` (file array, optional, max 3 files at creation, max 5MB per file, type JPG/PNG/WEBP/PDF)
- **Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "id": 12,
    "ticketNumber": "TKT-2026-000012",
    "summary": "VPN Connection Error",
    "description": "Cannot connect to corporate VPN from home",
    "requestedPriority": "High",
    "currentStatus": "New",
    "categoryId": 4,
    "category": { "id": 4, "name": "Network" },
    "relatedSystemId": 3,
    "relatedSystem": { "id": 3, "name": "VPN" },
    "requesterId": 1,
    "requester": { "id": 1, "name": "Alice Johnson", "email": "alice@toktickit.io" },
    "attachments": [
      {
        "id": 101,
        "ticketId": 12,
        "originalFileName": "logs.txt",
        "storedFileName": "1724143460-logs.txt",
        "fileSize": 153600,
        "mimeType": "application/pdf",
        "isRemoved": false,
        "createdAt": "2026-08-20T14:45:00.000Z"
      }
    ],
    "createdAt": "2026-08-20T14:45:00.000Z",
    "updatedAt": "2026-08-20T14:45:00.000Z"
  }
}
```
- **Error Responses:**
  - `400 Bad Request` — Validation failed (e.g. summary missing, file > 5MB, illegal type).
  - `401 Unauthorized` — Missing or invalid `x-user-id` header.

---

### 4.3 Paginated "My Tickets" Listing
#### `GET /api/tickets` & `GET /api/tickets/my`
Retrieves a paginated, searchable, filterable, and sortable list of tickets created by the active requester.

- **Request Headers:**
  - `x-user-id: 1` (Required)
- **Query Parameters:**
  - `page` (number, optional, default: `1`)
  - `limit` (number, optional, default: `10`, max: `50`)
  - `search` (string, optional, matches `ticketNumber` or `summary`)
  - `categoryId` (number, optional)
  - `status` (string, optional: `New`, `In Progress`, `Resolved`, `Closed`)
  - `priority` (string, optional: `Low`, `Medium`, `High`, `Urgent`)
  - `sort` / `sortBy` (string, optional: `createdAt`, `updatedAt`, `ticketNumber`, `summary`, `priority`, `status`, default: `createdAt`)
  - `order` / `sortOrder` (string, optional: `asc`, `desc`, default: `desc`)
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 12,
        "ticketNumber": "TKT-2026-000012",
        "summary": "VPN Connection Error",
        "currentStatus": "New",
        "requestedPriority": "High",
        "category": { "id": 4, "name": "Network" },
        "relatedSystem": { "id": 3, "name": "VPN" },
        "attachments": [ ... ],
        "createdAt": "2026-08-20T14:45:00.000Z",
        "updatedAt": "2026-08-20T14:45:00.000Z"
      }
    ],
    "meta": {
      "currentPage": 1,
      "limit": 10,
      "totalItems": 1,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```
- **Error Responses:**
  - `401 Unauthorized` — Missing `x-user-id`.

---

### 4.4 Read-Only Ticket Detail
#### `GET /api/tickets/:id`
Retrieves detailed information for a single ticket owned by the requesting user.

- **Request Headers:**
  - `x-user-id: 1` (Required)
- **Path Parameters:**
  - `id` (integer, required)
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": 12,
    "ticketNumber": "TKT-2026-000012",
    "summary": "VPN Connection Error",
    "description": "Cannot connect to corporate VPN from home",
    "currentStatus": "New",
    "requestedPriority": "High",
    "category": { "id": 4, "name": "Network" },
    "relatedSystem": { "id": 3, "name": "VPN" },
    "requester": { "id": 1, "name": "Alice Johnson", "email": "alice@toktickit.io" },
    "attachments": [
      {
        "id": 101,
        "originalFileName": "logs.pdf",
        "storedFileName": "1724143460-logs.pdf",
        "fileSize": 153600,
        "mimeType": "application/pdf",
        "isRemoved": false,
        "removalReason": null,
        "removedAt": null,
        "createdAt": "2026-08-20T14:45:00.000Z"
      }
    ],
    "createdAt": "2026-08-20T14:45:00.000Z",
    "updatedAt": "2026-08-20T14:45:00.000Z"
  }
}
```
- **Error Responses:**
  - `403 Forbidden` — Ticket belongs to another user.
  - `404 Not Found` — Ticket ID does not exist.

---

### 4.5 Upload Attachment to Existing Ticket
#### `POST /api/tickets/:id/attachments`
Uploads a file attachment to an existing ticket owned by the requesting user (max 5 active total per ticket).

- **Request Headers:**
  - `x-user-id: 1` (Required)
  - `Content-Type: multipart/form-data`
- **Response `201 Created`:**
```json
{
  "success": true,
  "data": [
    {
      "id": 102,
      "ticketId": 12,
      "originalFileName": "screenshot.png",
      "storedFileName": "1724143500-screenshot.png",
      "fileSize": 204800,
      "mimeType": "image/png",
      "isRemoved": false,
      "createdAt": "2026-08-20T14:46:00.000Z"
    }
  ]
}
```

---

### 4.6 Secure File Download
#### `GET /api/attachments/:id/download`
Downloads an active file attachment owned by the requesting user.

- **Request Headers:**
  - `x-user-id: 1` (Required)
- **Response `200 OK`:** Binary file payload with `Content-Disposition: attachment`.
- **Error Responses:**
  - `400 Bad Request` — Attachment has been soft-removed.
  - `403 Forbidden` — Ticket/Attachment does not belong to active requester.
  - `404 Not Found` — Attachment or file on disk not found.

---

### 4.7 Soft-Remove Ticket Attachment
#### `DELETE /api/tickets/:id/attachments/:attachmentId` & `DELETE /api/attachments/:id`
Marks an attachment as soft-removed (`isRemoved = true`, `removedAt = timestamp`, `removalReason`).

- **Request Headers:**
  - `x-user-id: 1` (Required)
- **Request Body (optional):**
  - `removalReason` (string, optional)
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Attachment removed successfully",
  "data": {
    "id": 101,
    "ticketId": 12,
    "originalFileName": "logs.pdf",
    "isRemoved": true,
    "removalReason": "Obsolete log file",
    "removedAt": "2026-08-20T14:50:00.000Z"
  }
}
```
- **Error Responses:**
  - `403 Forbidden` — Ticket/Attachment does not belong to active requester.
  - `404 Not Found` — Ticket or Attachment not found.
