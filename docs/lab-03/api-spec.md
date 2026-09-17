# Lab 03 — REST API Specification

## 1. Overview & Conventions

- **Base URL:** `/api`
- **Protocol:** HTTP / HTTPS
- **Content-Type:** `application/json` (for JSON payloads) or `multipart/form-data` (for ticket creation with attachments)
- **Authentication Header:** `Authorization: Bearer <jwt_token>` (or HTTP-only session cookie)

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

### Error Response Model (RFC 7807 Inspired)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR | UNAUTHORIZED | FORBIDDEN | NOT_FOUND | CONFLICT | PASSWORD_CHANGE_REQUIRED | INTERNAL_ERROR",
    "message": "Human-readable explanation of error",
    "details": []
  }
}
```

---

## 3. Authentication & User Profile Endpoints

### 3.1. User Login
- **Endpoint:** `POST /api/auth/login`
- **Auth Required:** No (Public)
- **Request Body:**
```json
{
  "email": "jandersson@toktickit.com",
  "password": "Password123!"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "user": {
      "id": 1,
      "name": "Jennifer Anderson",
      "email": "jandersson@toktickit.com",
      "role": "REQUESTER",
      "mustChangePassword": false,
      "isActive": true
    }
  }
}
```
- **Response `401 Unauthorized`**: Bad credentials or inactive account (`isActive = false`).
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid email or password"
  }
}
```

---

### 3.2. Get Current Authenticated User Profile
- **Endpoint:** `GET /api/auth/me`
- **Auth Required:** Yes
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Jennifer Anderson",
    "email": "jandersson@toktickit.com",
    "role": "REQUESTER",
    "mustChangePassword": false,
    "isActive": true
  }
}
```

---

### 3.3. Mandatory First-Login Password Change
- **Endpoint:** `POST /api/auth/change-password`
- **Auth Required:** Yes
- **Request Body:**
```json
{
  "currentPassword": "InitialPassword123!",
  "newPassword": "NewSecurePassword456!",
  "confirmNewPassword": "NewSecurePassword456!"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "message": "Password updated successfully. You may now access all features.",
    "mustChangePassword": false
  }
}
```
- **Response `400 Bad Request`**: Weak password or mismatch confirmation.

---

### 3.4. Logout
- **Endpoint:** `POST /api/auth/logout`
- **Auth Required:** Yes
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

## 4. Requester Ticket Endpoints

### 4.1. List My Submitted Tickets
- **Endpoint:** `GET /api/tickets/my`
- **Auth Required:** Yes (`REQUESTER`)
- **Query Parameters:** `page`, `limit`, `q`, `category`, `status`, `sortBy`, `sortOrder`
- **Response `200 OK`**: Returns paginated list of tickets where `requesterId === auth.user.id`.

---

### 4.2. Create Ticket
- **Endpoint:** `POST /api/tickets`
- **Auth Required:** Yes (`REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`)
- **Content-Type:** `multipart/form-data`
- **Form Fields:** `categoryId`, `relatedSystemId`, `summary`, `description`, `requestedPriority`, `files` (up to 3 files)
- **Response `201 Created`**: Returns created ticket with generated `ticketNumber` (`TKT-YYYY-XXXXXX`), `itPriority` set to `requestedPriority`, and `currentStatus = "New"`.

---

### 4.3. Get Ticket Detail
- **Endpoint:** `GET /api/tickets/:id`
- **Auth Required:** Yes
- **Access Rule:** Requesters can only view tickets where `requesterId === auth.user.id`. IT Staff and Admin can view any ticket.
- **Response `200 OK`**: Returns full ticket metadata, attachments, categories, owner profile, and resolution indication status.

---

### 4.4. Indicate Problem Appears Resolved (Requester Action)
- **Endpoint:** `PATCH /api/tickets/:id/indicate-resolved`
- **Auth Required:** Yes (`REQUESTER` - owned tickets only)
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": {
    "id": 12,
    "requesterResolvedIndicated": true,
    "requesterResolvedAt": "2026-09-17T22:00:00Z"
  }
}
```

---

## 5. IT Staff Ticket Queue & Workflow Endpoints

### 5.1. Retrieve IT Staff Ticket Queue
- **Endpoint:** `GET /api/tickets/queue`
- **Auth Required:** Yes (`IT_STAFF`, `ADMINISTRATOR`)
- **Query Parameters:**
  - `q`: Search string (matches ticket number or summary ILIKE)
  - `status`: Filter by current status (`New`, `Open`, `In Progress`, etc.)
  - `requestedPriority` / `itPriority`: Filter by priority
  - `ownerId`: Filter by ticket owner ID, or `"unassigned"`
  - `page`: Page number (default 1)
  - `limit`: Items per page (default 10, max 50)
  - `sortBy`: `createdAt`, `ticketNumber`, `itPriority`, `currentStatus` (default `createdAt`)
  - `sortOrder`: `asc` or `desc` (default `desc`)
- **Response `200 OK`**: Paginated array of tickets matching queue filters.

---

### 5.2. Claim / Reassign Ticket Ownership
- **Endpoint:** `PATCH /api/tickets/:id/assign`
- **Auth Required:** Yes (`IT_STAFF`, `ADMINISTRATOR`)
- **Request Body:**
```json
{
  "ownerId": 5  // User ID of active IT Staff/Admin, or null to unassign
}
```
- **Response `200 OK`**: Returns updated ticket with new `owner` object.

---

### 5.3. Update IT Priority
- **Endpoint:** `PATCH /api/tickets/:id/it-priority`
- **Auth Required:** Yes (`IT_STAFF`, `ADMINISTRATOR`)
- **Request Body:**
```json
{
  "itPriority": "High"  // Enum: "Low" | "Medium" | "High" | "Urgent"
}
```
- **Response `200 OK`**: Returns updated ticket with modified `itPriority`.

---

### 5.4. Update Ticket Status (Formal Transition)
- **Endpoint:** `PATCH /api/tickets/:id/status`
- **Auth Required:** Yes (`IT_STAFF`, `ADMINISTRATOR`)
- **Request Body:**
```json
{
  "status": "In Progress"
}
```
- **Response `200 OK`**: Returns updated ticket with modified `currentStatus`.
- **Response `400 Bad Request`**: Invalid status transition attempt (violating BR-07).

---

## 6. Public Comments & Internal Notes Endpoints

### 6.1. Get Public Comments
- **Endpoint:** `GET /api/tickets/:id/comments`
- **Auth Required:** Yes (Requester owned ticket, IT Staff, Admin)
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "id": 101,
      "ticketId": 12,
      "author": { "id": 1, "name": "Jennifer Anderson", "role": "REQUESTER" },
      "content": "Thank you for looking into this issue!",
      "createdAt": "2026-09-17T21:30:00Z"
    }
  ]
}
```

---

### 6.2. Post Public Comment
- **Endpoint:** `POST /api/tickets/:id/comments`
- **Auth Required:** Yes (Requester owned ticket, IT Staff, Admin)
- **Request Body:**
```json
{
  "content": "We have dispatched a replacement laptop dock for testing."
}
```
- **Response `201 Created`**: Returns created comment record.

---

### 6.3. Get Internal Notes (Restricted)
- **Endpoint:** `GET /api/tickets/:id/internal-notes`
- **Auth Required:** Yes (`IT_STAFF`, `ADMINISTRATOR` only)
- **Response `200 OK`**: Returns list of internal operational notes.
- **Response `403 Forbidden`**: Returned when requested by a `REQUESTER` account without exposing note data.

---

### 6.4. Post Internal Note (Restricted)
- **Endpoint:** `POST /api/tickets/:id/internal-notes`
- **Auth Required:** Yes (`IT_STAFF`, `ADMINISTRATOR` only)
- **Request Body:**
```json
{
  "content": "User reported VPN issue. Verified RADIUS server log shows stale session key."
}
```
- **Response `201 Created`**: Returns created internal note record.

---

## 7. Administrator User Management Endpoints

### 7.1. List Users
- **Endpoint:** `GET /api/admin/users`
- **Auth Required:** Yes (`ADMINISTRATOR` only)
- **Query Parameters:** `q` (search name/email), `role` (`REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`)
- **Response `200 OK`**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Jennifer Anderson",
      "email": "jandersson@toktickit.com",
      "role": "REQUESTER",
      "mustChangePassword": false,
      "isActive": true,
      "createdAt": "2026-09-01T08:00:00Z"
    }
  ]
}
```

---

### 7.2. Create User Account
- **Endpoint:** `POST /api/admin/users`
- **Auth Required:** Yes (`ADMINISTRATOR` only)
- **Request Body:**
```json
{
  "name": "Alex Thompson",
  "email": "alex.thompson@toktickit.com",
  "role": "IT_STAFF",
  "isActive": true,
  "initialPassword": "InitialPassword123!"
}
```
- **Response `201 Created`**: Returns created user object with `mustChangePassword = true`.
- **Response `409 Conflict`**: Duplicate email address.

---

### 7.3. Edit User Profile & Status
- **Endpoint:** `PATCH /api/admin/users/:id`
- **Auth Required:** Yes (`ADMINISTRATOR` only)
- **Request Body:**
```json
{
  "name": "Alex Thompson Jr.",
  "email": "alex.t@toktickit.com",
  "role": "IT_STAFF",
  "isActive": true
}
```
- **Response `200 OK`**: Returns updated user object.
- **Response `400 Bad Request`**: Self-deactivation attempt or deactivating last active Administrator.

---

### 7.4. Set New Initial Password
- **Endpoint:** `POST /api/admin/users/:id/reset-password`
- **Auth Required:** Yes (`ADMINISTRATOR` only)
- **Request Body:**
```json
{
  "initialPassword": "NewInitialPass123!"
}
```
- **Response `200 OK`**: Sets user's `mustChangePassword = true` and updates password hash.
