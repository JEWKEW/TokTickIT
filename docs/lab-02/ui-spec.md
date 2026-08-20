# Lab 02 — Responsive UI & Zen Green Theme Specification

## 1. Responsive Zen Green Design System Tokens

The TokTickIT interface is styled using Bootstrap 5 augmented with custom **Zen Green** theme CSS variable tokens. The palette balances calm, organic green tones (`Deep Forest`, `Zen Emerald`, `Soft Sage`) with crisp typography and clean card surfaces.

```css
:root {
  /* Color Palette — Zen Green Brand */
  --zg-primary-900: #1B3B2B;    /* Deep Forest Green - Navbar & Header */
  --zg-primary-800: #26533C;    /* Main Brand Primary Buttons */
  --zg-primary-700: #2E6F40;    /* Interactive Accent / Focus */
  --zg-emerald-500: #3E9B5F;    /* Soft Emerald - Success / Badges */
  --zg-sage-100: #EBF3ED;       /* Light Sage Background Tint */
  --zg-sage-50: #F4F8F5;        /* Card & Table Hover Surface */

  /* Neutral Surface & Typography Tokens */
  --zg-bg-main: #F8FAF9;        /* App Body Background */
  --zg-surface-card: #FFFFFF;   /* Elevate Card Background */
  --zg-border-color: #E2ECE5;   /* Soft Divider & Border */
  --zg-text-heading: #122119;   /* High Contrast Text */
  --zg-text-body: #3A4B40;      /* Secondary Body Text */
  --zg-text-muted: #738A7C;     /* Subtle Metadata Text */

  /* Ticket Status Pill Tokens */
  --zg-status-open-bg: #E3F2FD;
  --zg-status-open-fg: #1565C0;
  --zg-status-in-progress-bg: #FFF8E1;
  --zg-status-in-progress-fg: #F57F17;
  --zg-status-resolved-bg: #E8F5E9;
  --zg-status-resolved-fg: #2E7D32;
  --zg-status-closed-bg: #ECEFF1;
  --zg-status-closed-fg: #455A64;

  /* Ticket Priority Badges */
  --zg-priority-low-bg: #F1F8E9;
  --zg-priority-low-fg: #33691E;
  --zg-priority-med-bg: #E0F2F1;
  --zg-priority-med-fg: #004D40;
  --zg-priority-high-bg: #FFF3E0;
  --zg-priority-high-fg: #E65100;
  --zg-priority-urgent-bg: #FFEBEE;
  --zg-priority-urgent-fg: #C62828;

  /* Typography & Spacing Grid */
  --zg-font-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --zg-radius-sm: 6px;
  --zg-radius-md: 10px;
  --zg-radius-lg: 16px;
  --zg-shadow-card: 0 4px 12px rgba(27, 59, 43, 0.04);
}
```

---

## 2. Layout & Key View Specifications

### 2.1 Navigation Bar & Dev User Selector Component
- **Location:** Top Sticky Navbar across all pages.
- **Brand Identity:** TokTickIT Logo with Zen Green accent badge (`--zg-primary-900`).
- **Dev User Selector Dropdown:**
  - Placed prominently in the upper right.
  - Displays currently selected user's avatar icon, full name, and role tag.
  - Dropdown allows switching between seeded users instantly without re-logging in.
  - Updates context in state & `localStorage` (persisted as `x-user-id`).

```text
+-----------------------------------------------------------------------------------+
| 🎫 TokTickIT  |  Dashboard   My Tickets   + New Ticket   [ 👤 Alice Johnson (Dev) ▼ ]|
+-----------------------------------------------------------------------------------+
```

---

### 2.2 Ticket Creation Form (`/tickets/new`)
- **Container:** Centered elevated card (`--zg-surface-card`), max-width 768px.
- **Form Controls:**
  1. **Title Input:** Text input, placeholder `"Brief summary of your issue..."` (Min 5, Max 150 chars). Real-time char counter.
  2. **Category Select:** Single-select dropdown populated from `GET /api/categories`.
  3. **Priority Selector:** Segmented radio button group (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) with priority color badges.
  4. **Description Area:** Textarea with rich plain text support (Min 10, Max 2000 chars).
  5. **File Attachment Drag & Drop Zone:**
     - Interactive dashed boundary zone (`--zg-border-color`).
     - Supports click-to-browse or drag-and-drop.
     - Live validation showing uploaded file chips (Name, File Size, Type Icon).
     - Individual "Remove File" chip button before submission.
     - Error banner if file size > 5MB or > 3 files selected.
  6. **Action Buttons:** `"Submit Ticket"` (`.btn-primary` Zen Emerald) and `"Cancel"` (`.btn-light`).

---

### 2.3 Paginated "My Tickets" Dashboard (`/tickets`)
- **Header & Filter Toolbar:**
  - Title: `"My Tickets"` with total ticket count counter.
  - Quick Search input with debounced lookup.
  - Filter dropdowns: Category Filter, Status Filter, Priority Filter.
  - Sort selector (`Created Date Desc/Asc`, `Priority Desc`).
- **Data Display:** Responsive Table on Desktop, Collapsible Cards on Mobile (`< 768px`).
  - Columns: `Ticket Code`, `Title`, `Category`, `Priority`, `Status`, `Attachments`, `Created At`, `Actions`.
- **Pagination Footer:**
  - Displays `"Showing X-Y of Z tickets"`.
  - Page navigation controls (`Prev`, Page numbers `1, 2, 3`, `Next`).
  - Items per page dropdown selector (`10`, `25`, `50`).

```text
+-----------------------------------------------------------------------------------+
| My Tickets (25)                                                  [ + New Ticket ] |
|-----------------------------------------------------------------------------------|
| 🔍 [ Search tickets... ] | Category: [ All ▼ ] | Status: [ All ▼ ] | Sort: [ Newest ▼ ]|
|-----------------------------------------------------------------------------------|
| CODE           TITLE                 CATEGORY   PRIORITY   STATUS    CREATED  ACT |
| TCK-2026..012  VPN Connection Error  Network    HIGH       OPEN      10m ago  [👁] |
| TCK-2026..009  Monitor flickering    Hardware   MEDIUM     RESOLVED  2d ago   [👁] |
|-----------------------------------------------------------------------------------|
| Showing 1 - 10 of 25 tickets                          [<]  [ 1 ]  2   3  [>]  |
+-----------------------------------------------------------------------------------+
```

---

### 2.4 Read-Only Ticket Detail View (`/tickets/:id`)
- **Header Card:** Displays `Ticket Code`, `Title`, `Status Pill`, `Priority Badge`, and `Created Timestamp`.
- **Sidebar Info Card:**
  - Requester Details (Name, Email).
  - Category Badge.
  - Last Updated Timestamp.
- **Main Body Content:**
  - Formatted Description block.
  - Read-Only Banner notice (`"This ticket is in read-only mode for requesters"`).
- **Attachments Gallery:**
  - List of attached active files with File Icon, File Name, File Size, and `"Download"` link.
  - **Soft-Remove Button (`🗑 Trash Icon`):**
    - Clicking displays a Bootstrap Confirmation Modal: `"Are you sure you want to remove this attachment?"`.
    - Upon confirmation, soft-deletes file via API, triggers toast notification, and updates view without page reload.

---

## 3. Mobile Responsiveness & Breakpoints

- **Desktop (`>= 992px`):** Full multi-column dashboard tables, sidebar cards, drag-and-drop attachment upload.
- **Tablet (`768px - 991px`):** Collapsible filters, stacked layout for ticket detail header.
- **Mobile (`< 768px`):** Single-column layout. Ticket table converts into card-stack cards. Touch-friendly file selector buttons. Navbar dropdown collapses into hamburger menu.
