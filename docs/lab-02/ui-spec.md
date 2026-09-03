# Lab 02 — Responsive UI & Zen Green Theme Specification

## 1. Responsive Zen Green Design System Tokens

 The **TokTickIT** interface is styled using Bootstrap 5 augmented with custom **Zen Green** theme CSS variable tokens. The palette balances calm, organic green tones (`Deep Forest`, `Zen Emerald`, `Soft Sage`) with crisp typography and clean card surfaces.

```css
:root {
  /* Color Palette — Zen Green Brand Tokens */
  --zg-primary: #006B3C;          /* Deep Forest Green - Navbar & Header Brand */
  --zg-primary-hover: #00542F;    /* Primary Hover Accent */
  --zg-accent: #0B7A46;           /* Interactive Accent / Focus */
  --zg-surface-selected: #EAF6EF; /* Selected Surface Light Tint */
  --zg-bg-main: #F8FAF9;          /* App Body Background */
  --zg-surface-card: #FFFFFF;     /* Elevated Card Background */
  --zg-border-color: #E2ECE5;     /* Soft Divider & Border */

  /* Text Typography Tokens */
  --zg-text-heading: #122119;     /* High Contrast Headings */
  --zg-text-body: #3A4B40;        /* Body Text */
  --zg-text-muted: #738A7C;       /* Secondary/Metadata Text */

  /* Input Field Tokens */
  --zg-input-editable-bg: #FFFFFF;
  --zg-input-readonly-bg: #F4F8F5; /* Soft Gray-Green / Warm Ivory Read-Only Shading */
  --zg-input-border: #CED4DA;
  --zg-input-error-border: #DC3545;

  /* Ticket Status Pill Tokens */
  --zg-status-new-bg: #E3F2FD;
  --zg-status-new-fg: #1565C0;
  --zg-status-open-bg: #E8F5E9;
  --zg-status-open-fg: #2E7D32;
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
}
```

---

## 2. Layout & Key View Specifications

### 2.1 Navigation Bar & Dev User Selector Component
- **Location:** Top Sticky Navbar across all pages.
- **Brand Identity:** TokTickIT Logo with Zen Green background (`#006B3C`).
- **Dev User Selector Dropdown:**
  - Placed prominently in the upper right.
  - Displays currently selected user's name and role tag.
  - Dropdown allows switching between active seeded users instantly without re-logging in.
  - Includes explicit disclaimer text: *"Development Only — Authentication coming in Lab 3"*.
  - Updates context in state & `localStorage` (persisted as `x-user-id`).

---

### 2.2 Ticket Creation Form (`/tickets/new`)
- **Container:** Centered elevated card (`--zg-surface-card`), max-width 768px.
- **Form Controls & Validation Styling:**
  1. **Ticket Number:** Read-only input, blank/placeholder until submission, populated from server response.
  2. **Ticket Date:** Read-only input, system-generated timestamp.
  3. **Requester Name:** Read-only input, auto-filled from selected Dev Requester context.
  4. **Category Select:** Single-select dropdown populated from `GET /api/categories` (active only). Required.
  5. **Related System Select:** Single-select dropdown populated from `GET /api/related-systems` (active only). Required.
  6. **Requested Priority:** Selectable button/radio group (`Low`, `Medium`, `High`, `Urgent`). Required.
  7. **Summary Input:** Text input (1 to 100 characters). Required.
  8. **Description Area:** Textarea (1 to 1000 characters). Required.
  9. **File Attachment Zone:**
     - Supports file selection and drag-and-drop.
     - Live file chips with individual removal buttons before submission.
     - Type restriction: JPG, PNG, WEBP, PDF (max 5MB per file, max 3 files at creation).
  10. **Validation Indicators:** Required fields marked with a red asterisk (`*`). Validation failures display inline red text directly below the invalid input field.
  11. **Submit Button State:** Disables button and displays loading spinner during submit in flight to prevent duplicate submissions. Retains form values on API error.

---

### 2.3 Paginated "My Tickets" Dashboard (`/tickets`)
- **Header Toolbar:**
  - Search input with debounced lookup.
  - Category, Priority, and Status filter dropdowns + Sort direction selector.
  - `"Clear Filters"` button to reset parameters in one click.
  - `"+ New Ticket"` primary action button.
- **Data Display:**
  - **Desktop (≥992px):** Multi-column table (`Ticket Code`, `Summary`, `Category`, `Related System`, `Priority`, `Status`, `Created At`, `Actions`).
  - **Mobile (<768px):** Stacked card view ensuring no horizontal overflow (`scrollWidth <= innerWidth`).
- **Pagination Footer:** Displays item range, page numbers, and previous/next navigation buttons.
- **Empty & Filter States:** Distinct messages for zero total tickets vs zero filter results with a clear button.

---

### 2.4 Read-Only Ticket Detail View (`/tickets/:id`)
- **Header & Overview Card:** Displays read-only `Ticket Code`, `Summary`, `Current Status`, `Requested Priority`, `Category`, `Related System`, and `Created Date`.
- **Ownership Security:** Server checks `ticket.requesterId === userId`. Unauthorized attempts render a clean 403 Forbidden access denied view.
- **Body & Attachments Section:** Visually distinct card section listing active attachments with download links and soft-removed attachments marked with a "Soft Removed" badge.
- **Attachment Soft-Removal Modal:** Clicking "Remove Attachment" triggers a confirmation modal requiring user confirmation before calling soft-delete API.

---

## 3. Mobile Responsiveness & Breakpoint Rules

- **Desktop (`>= 992px`):** Multi-column layout with centered containers and table views.
- **Tablet (`768px - 991px`):** Two-column form layouts, collapsible table spacing.
- **Mobile (`< 768px`):** Single-column stacked fields, touch-friendly tap targets (minimum 44px height), stacked card list for tickets, zero horizontal page scrolling.

---

## 4. Responsive Screenshot Evidence Inventory

All visual audit screenshots captured via Playwright in `artifacts/lab-02/screenshots/`:

- `desktop-requester-select.png`, `tablet-requester-select.png`, `mobile-requester-select.png`
- `desktop-create-ticket.png`, `tablet-create-ticket.png`, `mobile-create-ticket.png`
- `desktop-dashboard.png`, `tablet-dashboard.png`, `mobile-dashboard.png`
- `desktop-ticket-detail.png`, `tablet-ticket-detail.png`, `mobile-ticket-detail.png`
- `desktop-soft-removed-attachment.png`
