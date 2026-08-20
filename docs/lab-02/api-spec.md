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
    "code": "VALIDATION_ERROR | FORBIDDEN | NOT_FOUND | INTERNAL_ERROR",
    "message": "Human-readable explanation of error",
    "details": []
  }
}
```

---

## 3. Database & Prisma Schema Blueprint

```prisma
enum Role {
  REQUESTER
  AGENT
  ADMIN
}

enum TicketStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
  CLOSED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String
  role      Role     @default(REQUESTER)
  createdAt DateTime @default(now())
  tickets   Ticket[] @relation("RequesterTickets")
}

model Category {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  createdAt DateTime @default(now())
  tickets   Ticket[]
}

model Ticket {
  id          Int          @id @default(autoincrement())
  ticketCode  String       @unique
  title       String
  description String
  status      TicketStatus @default(OPEN)
  priority    Priority     @default(MEDIUM)
  categoryId  Int
  category    Category     @relation(fields: [categoryId], references: [id])
  requesterId Int
  requester   User         @relation("RequesterTickets", fields: [requesterId], references: [id])
  attachments Attachment[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model Attachment {
  id        Int       @id @default(autoincrement())
  ticketId  Int
  ticket    Ticket    @relation(fields: [ticketId], references: [id])
  fileName  String
  fileUrl   String
  fileSize  Int
  mimeType  String
  isDeleted Boolean   @default(false)
  deletedAt DateTime?
  createdAt DateTime  @default(now())
}
```

---

## 4. API Endpoint Contracts

### 4.1 Development User Context Selector
#### `GET /api/users/dev-list`
Retrieves seeded user accounts for switching simulated user context in development mode.

- **Request Headers:** None
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Alice Johnson", "email": "alice@toktickit.io", "role": "REQUESTER" },
    { "id": 2, "name": "Bob Smith", "email": "bob@toktickit.io", "role": "REQUESTER" },
    { "id": 3, "name": "Charlie Support", "email": "charlie@toktickit.io", "role": "AGENT" }
  ]
}
```

---

### 4.2 Create Ticket with File Attachments
#### `POST /api/tickets`
Creates a new IT support ticket under the authenticated requester's account with optional multi-file attachments.

- **Request Headers:**
  - `x-user-id: 1` (Required)
  - `Content-Type: multipart/form-data`
- **Form Fields (`multipart/form-data`):**
  - `title` (string, required, 5-150 chars)
  - `categoryId` (number, required)
  - `priority` (string enum: `LOW`, `MEDIUM`, `HIGH`, `URGENT`, required)
  - `description` (string, required, 10-2000 chars)
  - `files` (file array, optional, max 3 files, max 5MB per file)
- **Response `201 Created`:**
```json
{
  "success": true,
  "data": {
    "id": 12,
    "ticketCode": "TCK-20260820-0012",
    "title": "VPN Connection Error",
    "description": "Cannot connect to corporate VPN from home",
    "status": "OPEN",
    "priority": "HIGH",
    "categoryId": 4,
    "category": { "id": 4, "name": "Network" },
    "requesterId": 1,
    "requester": { "id": 1, "name": "Alice Johnson", "email": "alice@toktickit.io" },
    "attachments": [
      {
        "id": 101,
        "fileName": "logs.txt",
        "fileUrl": "/uploads/1724143460-logs.txt",
        "fileSize": 153600,
        "mimeType": "text/plain",
        "createdAt": "2026-08-20T14:45:00.000Z"
      }
    ],
    "createdAt": "2026-08-20T14:45:00.000Z",
    "updatedAt": "2026-08-20T14:45:00.000Z"
  }
}
```
- **Error Responses:**
  - `400 Bad Request` — Validation failed (e.g., title too short, file size > 5MB, illegal MIME type).
  - `401 Unauthorized` — Missing or invalid `x-user-id` header.

---

### 4.3 Paginated "My Tickets" Listing
#### `GET /api/tickets/my`
Retrieves a paginated, searchable, filterable, and sortable list of tickets created by the active requester.

- **Request Headers:**
  - `x-user-id: 1` (Required)
- **Query Parameters:**
  - `page` (number, optional, default: `1`)
  - `limit` (number, optional, default: `10`, max: `50`)
  - `search` (string, optional, matches `title` or `ticketCode`)
  - `categoryId` (number, optional)
  - `status` (string enum, optional: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`)
  - `priority` (string enum, optional: `LOW`, `MEDIUM`, `HIGH`, `URGENT`)
  - `sortBy` (string, optional: `createdAt`, `updatedAt`, `priority`, default: `createdAt`)
  - `sortOrder` (string, optional: `asc`, `desc`, default: `desc`)
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 12,
        "ticketCode": "TCK-20260820-0012",
        "title": "VPN Connection Error",
        "status": "OPEN",
        "priority": "HIGH",
        "category": { "id": 4, "name": "Network" },
        "attachmentCount": 1,
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
Retrieves detailed information for a single ticket owned by the requesting user. Excludes soft-deleted attachments.

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
    "ticketCode": "TCK-20260820-0012",
    "title": "VPN Connection Error",
    "description": "Cannot connect to corporate VPN from home",
    "status": "OPEN",
    "priority": "HIGH",
    "category": { "id": 4, "name": "Network" },
    "requester": { "id": 1, "name": "Alice Johnson", "email": "alice@toktickit.io" },
    "attachments": [
      {
        "id": 101,
        "fileName": "logs.txt",
        "fileUrl": "/uploads/1724143460-logs.txt",
        "fileSize": 153600,
        "mimeType": "text/plain",
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

### 4.5 Soft-Delete Ticket Attachment
#### `DELETE /api/tickets/:id/attachments/:attachmentId`
Marks an attachment as soft-deleted (`isDeleted = true`, `deletedAt = timestamp`).

- **Request Headers:**
  - `x-user-id: 1` (Required)
- **Path Parameters:**
  - `id` (integer, ticket ID)
  - `attachmentId` (integer, attachment ID)
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Attachment removed successfully",
  "data": {
    "id": 101,
    "ticketId": 12,
    "fileName": "logs.txt",
    "isDeleted": true,
    "deletedAt": "2026-08-20T14:50:00.000Z"
  }
}
```
- **Error Responses:**
  - `403 Forbidden` — Ticket/Attachment does not belong to active requester.
  - `404 Not Found` — Ticket or Attachment not found.
