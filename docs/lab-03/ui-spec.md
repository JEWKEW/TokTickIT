# Lab 03 — UI / UX Specification & Zen Green Design System

## 1. Design System Overview (Zen Green Extended)

Lab 3 retains and extends the **Zen Green** design language established in Lab 2. All new screens, forms, tables, modals, and navigation components adhere to the core color palette, typography hierarchy, button states, and form feedback conventions.

### Zen Green Color Palette & Design Tokens
- **Primary Brand Header (`--zg-primary`):** `#006B3C` (Deep Forest Green header bar)
- **Secondary Accent (`--zg-accent`):** `#0B7A46` (Primary action buttons & active navigation)
- **Selected Surface / Light Tint (`--zg-surface-selected`):** `#EAF6EF` (Active row highlights & badge tints)
- **Page Background (`--zg-bg-main`):** `#F8FAF9` (Main background)
- **Surface Cards (`--zg-surface-card`):** `#FFFFFF` (Content containers & modal cards)
- **Text Color Primary (`--zg-text-heading`):** `#122119` (Headings & dark text)
- **Text Color Secondary (`--zg-text-body`):** `#3A4B40` (Body text & secondary captions)
- **Internal Note Alert Theme (`--zg-internal-note-bg`):** `#FFF9E6` (Soft warm yellow-amber surface with gold border `#D97706` for private internal notes)
- **Public Comment Theme (`--zg-public-comment-bg`):** `#F4F8F5` (Soft mint tint for public communication)

---

## 2. App Shell & Role-Based Navigation

The application navigation replaces the Lab 2 simulated requester context dropdown with real user profile information.

### Header Navbar Rules:
- **Left**: **TokTickIT** logo + Brand Title.
- **Center Navigation**:
  - **Requester Role**: `My Tickets`, `Create Ticket`
  - **IT Staff Role**: `Ticket Queue`
  - **Administrator Role**: `User Management`
- **Right Profile Menu**: Displays user full name and role badge (e.g., `Jennifer Anderson` `[Requester]`, `Michael Brown` `[IT Staff]`, `John Smith` `[Admin]`).
- **Profile Dropdown Actions**: Includes `Change Password` action and `Logout` button.

---

## 3. Screen Specifications

### 3.1. Login Screen (`/login`)
- **Layout**: Centered Zen Green card container (400px width on desktop) against `--zg-bg-main`.
- **Form Controls**:
  - Email Address input (`type="email"`, auto-focused).
  - Password input (`type="password"`, with show/hide password eye icon).
  - Submit Button (`Sign In`).
- **Feedback & Validation States**:
  - Empty field validation: Red asterisk and red inline error message below input (`"Email is required"`).
  - Submitting state: Disables submit button, renders spinning indicator (`"Signing in..."`).
  - Authentication failure: Displays top banner alert (`"Invalid email or password. Please try again."`).
  - Inactive account failure: Displays safe alert without exposing details (`"Invalid credentials or inactive account."`).

---

### 3.2. Mandatory Change Password Screen (`/change-password`)
- **Layout**: Modal drawer or full-page Zen Green card presented immediately after login when `mustChangePassword === true`.
- **Header**: Banner warning: *"You must set a new password before entering the application."*
- **Form Controls**:
  - Current (Initial) Password.
  - New Password (with live validation rules checklist: 8+ chars, uppercase, lowercase, number, special char).
  - Confirm New Password.
  - Submit Button (`Update Password & Continue`).
- **Behavior**: User cannot close or navigate away from this screen until a valid new password is saved.

---

### 3.3. Requester Ticket Detail & Public Comments
- **Preserved Lab 2 Features**: Ticket metadata, status badge, requested priority badge, description, category, related system, active attachments list, and attachment soft-deletion confirmation.
- **Added Capabilities**:
  - **Problem Appears Resolved Button**: Rendered at top of detail screen (`"Indicate Problem Resolved"`). Clicking toggles `requesterResolvedIndicated` state, displaying a green checkmark badge: *"Requester indicated problem resolved"*.
  - **Public Comments Tab**: Chronological list of public messages with author initials, name badge (`Requester` / `IT Support`), timestamp, and content. Includes text area and `Post Comment` button.

---

### 3.4. IT Staff Ticket Queue (`/queue`)
- **Header**: Title `"IT Staff Ticket Queue"` with total ticket counter badge.
- **Filter & Search Bar**:
  - Keyword search input (`"Search by ticket number or summary..."`).
  - Status Filter dropdown (`All Statuses`, `New`, `Open`, `In Progress`, `Waiting for Requester`, `Resolved`, `Closed`, `Reopened`, `Cancelled`).
  - Priority Filter dropdown (`All Priorities`, `Low`, `Medium`, `High`, `Urgent`).
  - Owner Filter dropdown (`All Owners`, `Unassigned`, `Assigned to Me`, specific IT Staff).
- **Desktop Table View (≥992px)**:
  - Columns: `Ticket No.`, `Created Date`, `Summary`, `Category`, `Req. Priority`, `IT Priority`, `Status`, `Owner`, `Actions`.
  - Badges: Visual color pills for status (`New` = Blue, `In Progress` = Yellow-Orange, `Resolved` = Green, `Closed` = Gray) and priority (`High`/`Urgent` = Red tint).
  - Actions column: `View Ticket` button.
- **Mobile Card View (<768px)**: Responsive stacked card layouts showing ticket summary, status badge, IT priority badge, owner avatar, and `Open Ticket` button.

---

### 3.5. IT Staff Ticket Detail (`/tickets/:id`)
- **Operational Controls Header**:
  - **Ticket Owner Selector**: Dropdown listing active IT Staff / Admin users + `Unassigned`. Changing triggers instant save via API.
  - **IT Priority Selector**: Dropdown (`Low`, `Medium`, `High`, `Urgent`).
  - **Current Status Dropdown**: Dropdown showing ONLY permitted next statuses based on transition rules matrix (BR-07).
  - **Requester Resolution Indication**: Prominent banner alert when `requesterResolvedIndicated === true`: *"Requester indicated problem appears resolved on 2026-09-17"*.
- **Tabs Component**:
  - **Tab 1: Public Comments**: Shared communication visible to Requester and IT Staff. Styled with `--zg-public-comment-bg`.
  - **Tab 2: Internal Notes**: Operational notes visible ONLY to IT Staff and Admin. Prominently styled with `--zg-internal-note-bg` (Yellow/Amber tint) and clear warning badge: `🔒 Private Internal Note — Visible to IT Staff Only`.

---

### 3.6. Minimalist Admin User Management (`/admin/users`)
- **Header**: Title `"User Management"` + `+ Create User` primary button.
- **Toolbar**: Search input (`Search by name or email...`) and Role Filter dropdown (`All Roles`, `Requester`, `IT Staff`, `Administrator`).
- **User Table**:
  - Columns: `Name`, `Email`, `Role`, `Status`, `Actions`.
  - Status Pills: `Active` (Green badge) vs `Inactive` (Gray badge).
  - Action Buttons: `Edit Account` and `Reset Initial Password`.
- **Create User Drawer / Modal**:
  - Inputs: Full Name, Email Address, Role selection (`Requester`, `IT Staff`, `Administrator`), Active State toggle (default `Active`), Initial Password input (`Send password reset email` simulation check).
- **Edit User Drawer / Modal**:
  - Inputs: Full Name, Email Address, Role selection, Active State toggle (`Active` / `Inactive`).
  - Safety Rules: Disables deactivating own account or deactivating the last active Administrator with clear tooltip explanation.
- **Reset Initial Password Modal**:
  - Input: New Initial Password. Warning text: *"User will be forced to change this password on their next login."*

---

## 4. Responsive & Accessibility Checklist

| Criteria | Desktop (≥992px) | Tablet (768px - 991px) | Mobile (<768px) |
| :--- | :--- | :--- | :--- |
| **Navigation** | Full horizontal navbar | Collapsible hamburger navbar | Collapsible hamburger navbar |
| **Ticket Queue** | Multi-column data grid | Scrollable data grid | Stacked responsive cards |
| **User Table** | Multi-column data grid | Horizontal scroll grid | Stacked user cards |
| **Forms & Modals** | Centered modal (600px) | Centered modal (80%) | Full-width slide-over modal |
| **Overflow & Scroll** | `scrollWidth <= innerWidth` | `scrollWidth <= innerWidth` | `scrollWidth <= innerWidth` |

---

## 5. Responsive Visual Checklist & Screenshots Audit

Verification audit of captured responsive screenshots (`artifacts/lab-03/screenshots/`) across Desktop (1280px), Tablet (768px), and Mobile (375px) viewports:

| Screen / Feature Area | Zen Green Token Consistency | Permitted Role Navigation | Badge Consistency | Editable vs Read-Only Fields | Validation Placement | Visible Focus States | No Content Clipping | No Overlapping Elements | No Horizontal Overflow | Audit Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Authentication (Login)** | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | ✅ Verified |
| **Change Password** | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | ✅ Verified |
| **IT Staff Ticket Queue** | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | ✅ Verified |
| **IT Staff Ticket Detail** | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | ✅ Verified |
| **User Management** | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | ✅ Verified |
| **Requester View & Feedback** | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | [x] Pass | ✅ Verified |

