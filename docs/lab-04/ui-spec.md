# Lab 04 — UI / UX Specification & Zen Green Design System Extensions

## 1. Design System Overview (Zen Green Extended)

Lab 4 preserves and extends the **Zen Green** design language established in Labs 2 and 3. All new dashboard views, Actions Taken tables, creation forms, status transition dropdowns, and responsive layouts strictly conform to the established color tokens, typography, component states, and accessibility standards.

### Zen Green Color Palette & Design Tokens
Use the tokens already defined in `client/src/index.css`; do not create competing token names or claim colors that differ from the running application.
- **Primary (`--zg-primary`):** `#006039`; hover `--zg-primary-hover`: `#004d2c`.
- **Primary light (`--zg-primary-light`):** `#e6f4ea`; sage surfaces `--zg-sage-100`: `#ebf5ee`, `--zg-sage-50`: `#f4f8f5`.
- **Page and card surfaces:** `--zg-bg-main`: `#f8fafc`; `--zg-surface-card`: `#ffffff`.
- **Text:** `--zg-text-heading`: `#0f172a`; `--zg-text-body`: `#334155`; `--zg-text-muted`: `#64748b`.
- **Borders:** `--zg-border-color`: `#e2e8f0`.
- Use existing status and priority badges and add only missing tokens after verifying contrast and consistency. Internal notes remain visually distinct from public comments using the existing Lab 3 conventions.

---

## 2. Role-Based Navigation & App Shell

Navigation headers adapt dynamically to the authenticated user's role while preserving explicit active-page indications (`aria-current="page"` and the existing primary color underline styling).

### Dynamic Header Navbar Matrix:
- **Left Brand Section**: **TokTickIT** logo + System Title + Role Badge.
- **Center Navigation Options**:
  - **Requester Role**: `My Tickets` (Requester dashboard view), `Create Ticket` (`/tickets/new`). The dashboard Quick Action `View My Tickets` opens the full ticket list.
  - **IT Staff Role**: `Dashboard` (`/staff-dashboard`), `Ticket Queue` (`/queue`).
  - **Administrator Role**: `Dashboard` (`/staff-dashboard`), `Ticket Queue` (`/queue`), `User Management` (`/admin/users`).
- **Right Profile Menu**: User Full Name, Role Badge, `Change Password`, `Logout`.

---

## 3. Screen Specifications

### 3.1. IT Staff / Administrator Dashboard (`/staff-dashboard`)

- **Header Section**:
  - Title: `"IT Staff Operational Dashboard"`
  - Subheading: `"Welcome back, [User Name]! Operational summary as of today."`
  - Action Controls: `Refresh Data` button (triggers refetch with spinner state).
- **Metric Cards Grid (Responsive Grid 4-col desktop, 2-col tablet, 1-col mobile)**:
  1. **New Tickets**: Value counter, icon, subtext `"Awaiting initial triage"`, clickable drill-down (`/queue?status=New`).
  2. **Open Tickets**: Value counter, icon, subtext `"In active queue"`, clickable drill-down (`/queue?status=Open`).
  3. **In Progress**: Value counter, icon, subtext `"Under investigation"`, clickable drill-down (`/queue?status=In Progress`).
  4. **Waiting for Requester**: Value counter, icon, subtext `"Pending user response"`, clickable drill-down (`/queue?status=Waiting for Requester`).
  5. **My Assigned Tickets**: Value counter, icon, subtext `"Assigned to me"`, clickable drill-down (`/queue?ownerId=me`).
  6. **Unassigned Tickets**: Value counter, icon, subtext `"Needs owner assignment"`, clickable drill-down (`/queue?ownerId=unassigned`).
- A status breakdown panel lists counts for all eight statuses, including Resolved, Closed, Reopened, and Cancelled. Use the API `statusCounts`; zero values remain visible as `0`.
- **Main Operational Panels (2-Column Desktop Layout)**:
  - **Left Panel — "Recent & Urgent Tickets"**:
    - List of 5 most recently updated tickets. Visually flag high/urgent priority and unassigned tickets so urgent work is easy to spot.
    - Each row displays: Ticket Number, Summary, IT Priority Badge, Status Badge, Age, and `"View Ticket"` button.
  - **Right Panel — "My Actions Taken History"**:
    - List of 5 recent Actions Taken recorded by the current user.
    - Displays: Ticket Number link, Action Description snippet, Result, Timestamp, and Follow-Up indicator.
- **Administrator View Extensions**:
  - May show a concise top summary row of active Requester, IT Staff, and Administrator counts when the optional account metrics are included by the API.
- **Feedback & State Handling**:
  - **Loading State**: Skeleton cards with pulsating shimmer effect.
  - **Empty State**: Concise message explaining that no recent tickets match the selected view, with a link to the full queue.
  - **Forbidden State**: Requesters accessing this URL see a clear `403 Forbidden` card with `"Return to Requester Dashboard"` button.
  - **Failure State**: Top banner alert `"Unable to calculate operational metrics. Retrying..."` with a retry button.

---

### 3.2. Requester Dashboard (`/requester-dashboard`)

- **Header Section**:
  - Welcome heading: `"Welcome, [User Name]!"`
  - Subheading: `"Here's the latest on your requests."`
- **Metric Cards Grid (4-col desktop, 2-col tablet, 1-col mobile)**:
  1. **My Open Tickets**: Count of owned Tickets except `Resolved`, `Closed`, or `Cancelled`; drill-down opens My Tickets filtered to the same set.
  2. **In Progress**: Count of owned Tickets currently being worked on; drill-down filters by status.
  3. **Resolved**: Count of owned Tickets in the `Resolved` status; drill-down filters by status.
  4. **Closed**: Count of owned Tickets in the `Closed` status; drill-down filters by status.
- **Main Section — "My Recent Tickets"**:
  - Show up to five owned Tickets from the recently updated and recently resolved summaries, ordered by `updatedAt` descending and linked to Ticket Detail. Each row shows Ticket Number, Summary, Status, and update time. Empty results show a concise empty state.
  - A `View all` action opens My Tickets.
- **Quick Actions**:
  - `Create Ticket` opens the ticket submission form.
  - `View My Tickets` opens the full My Tickets list.
- **Feedback & State Handling**:
  - **Loading State**: Skeleton loader lines.
  - **Empty State**: Friendly card: `"You have no active support tickets. Need help?"` with a `Create Ticket` button.
  - **Ownership Protection**: Requesters only see tickets where `requesterId === auth.user.id`.

---

### 3.3. Actions Taken Area on Ticket Detail Screen (`/tickets/:id`)

The Actions Taken section is rendered directly below Ticket Description and metadata.

- **Header Toolbar**:
  - Title: `"Actions Taken"` + Count Badge (e.g., `Actions Taken (3)`).
  - Action Button (IT Staff & Admin only): `+ Record Action Taken` (toggles creation form).
- **List / Table View**:
  - Displays chronological cards/rows of recorded actions.
  - Fields shown for each action entry:
    - **Header Row**: Performer Name (`performedBy.name`), Role Badge, Action Date/Time (`actionDateTime` formatted in the user's local time zone). Show record creation/update timestamps only where useful for editing/audit context.
    - **Action Description**: Detailed text of action performed.
    - **Result**: Outcome of the action.
    - **Follow-Up Badge**: Amber badge `"Follow-up Required"` with `followUpNote` text displayed when `followUpRequired = true`.
    - **Attachment Notes**: Text snippet detailing referenced files/screenshots (`"Attachment Notes: See log_error.png attached"`).
    - **Controls (IT Staff / Admin)**: `Edit Action` button.
- **Create Mode Form (IT Staff & Admin Only)**:
  - Form Fields:
    - **Action Date/Time**: Required date/time input, initialized to the current time and editable to record when earlier work occurred; submit as an ISO-8601 UTC timestamp.
    - **Performed By**: Read-only input pre-filled with current authenticated staff member's name.
    - **Action Description**: Textarea (required, 1–2000 characters).
    - **Result**: Textarea (required, 1–1000 characters).
    - **Follow-Up Required?**: Checkbox toggle.
    - **Follow-up Note**: Textarea. *Validation Rule*: Automatically becomes MANDATORY with red asterisk when `Follow-Up Required?` is checked.
    - **Attachment Notes**: Text input (optional, up to 500 chars).
  - Buttons: `Save Action Taken` (primary green) and `Cancel`.
- **View / Edit Mode Form (IT Staff & Admin Only)**:
  - Inline editing of action date/time, description, result, follow-up state, follow-up note, and attachment notes.
  - Performs optimistic concurrency validation (`updatedAt`).
- **Requester Mode View**:
  - Full visibility of all Actions Taken entries in read-only mode.
  - `+ Record Action Taken` and `Edit Action` buttons are completely removed from DOM.

---

### 3.4. Ticket Workflow & Status Controls

Rendered in the Ticket Detail header panel.

- **Status Transition Selector (IT Staff & Admin)**:
  - Dropdown populated strictly with permitted next statuses based on the BR-07 transition matrix.
  - Selecting a new status enables `Update Status` button; the selection alone does not modify the Ticket.
  - Status writes include the Ticket's last-read `updatedAt`. On success, the displayed status refreshes; on `409 STALE_UPDATE`, show a safe conflict alert and reload the Ticket.
- **Advisory Resolution Indication Banner (Requester & Staff View)**:
  - When `requesterResolvedIndicated = true`, a prominent Zen Green banner displays:
    - *"✓ Requester indicated this problem appears resolved on [Timestamp]. Awaiting IT Staff formal resolution."*
  - Only the owning Requester sees the indication button. IT Staff/Admin see the advisory flag but cannot set it; the flag never changes formal status.

---

## 4. Responsive & Accessibility Specifications

### Responsive Layout Rules:
| Component / View | Desktop (≥992px) | Tablet (768px - 991px) | Mobile (<768px) |
| :--- | :--- | :--- | :--- |
| **Header Navbar** | Horizontal link bar with profile pill | Collapsible menu drawer | Collapsible menu drawer |
| **Dashboard Grid** | 4-Column Metric Cards | 2-Column Metric Cards | 1-Column Stacked Cards |
| **Dashboard Panels** | 2-Column Side-by-Side | Stacked Vertically | Stacked Vertically |
| **Actions Taken Table** | Detailed Table / Cards | Full-width Action Cards | Stacked Mobile Action Cards |
| **Ticket Workflow Header** | Inline controls row | Stacked form controls | Full-width stacked controls |

### Accessibility Rules (WCAG 2.1 AA):
1. **Visible Keyboard Focus**: All interactive controls (buttons, inputs, cards, dropdowns) render a high-contrast visible focus ring using the existing primary color and an accessible outline.
2. **Semantic Structure**: Proper HTML5 elements (`<nav>`, `<main>`, `<article>`, `<header>`, `<table>`) with correct heading levels (`<h1>` for screen titles, `<h2>` for panels).
3. **Non-Color Status Cues**: Statuses and priorities pair color badges with text labels and distinct icon indicators (e.g., `Urgent` = Red tint + `[!]` icon).
4. **Form Field Validation**: Form validation errors render directly below the input with `aria-describedby` links and `aria-invalid="true"`.

---

## 5. Visual and Accessibility Inspection Checklist

This checklist is used during visual polish and accessibility verification (Issue 10):

| Visual & Accessibility Item | Desktop Standard | Tablet Standard | Mobile Standard | Pass / Fail Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **Zen Green Token Consistency** | Deep Forest Green header, soft card backgrounds | Identical design tokens | Identical design tokens | Color values match CSS variables exactly |
| **Dashboard Card Layout** | 4-column aligned grid | 2-column stacked grid | 1-column responsive cards | Zero horizontal scroll; `scrollWidth <= innerWidth` |
| **Actions Taken List / Table** | Action metadata clearly tabularized | Responsive card list | Full-width card layout | Text wraps cleanly; zero clipping |
| **Editable vs Read-Only Controls** | Staff gets edit controls; Requester read-only | Staff gets edit controls; Requester read-only | Staff gets edit controls; Requester read-only | Requester DOM contains zero edit/create buttons |
| **Validation Message Placement** | Immediate sub-input inline red text | Immediate sub-input inline red text | Immediate sub-input inline red text | Required follow-up note triggers error on submit |
| **Visible Keyboard Focus** | Focus ring on Tab key navigation | Focus ring on keyboard/touch | Focus ring on touch focus | Ring visible on all interactive elements |
| **No Overlapping Elements** | Controls separated by 8px+ padding | Controls separated by 8px+ padding | Controls separated by 8px+ padding | No overlapping text or buttons |
| **No Horizontal Overflow** | Viewport width `100vw` | Viewport width `100vw` | Viewport width `100vw` | Horizontal scrollbar never appears |

## 6. Requirement Coverage

| Contract requirement | UI coverage |
|---|---|
| FR-01–FR-05, FR-14, BR-01–BR-06, BR-15 | Actions Taken list, create/edit/read-only modes, all seven fields, date/time display, validation and role controls (§3.3) |
| FR-06–FR-08, BR-07–BR-08 | Permitted status control, refreshed summary, and advisory resolution banner (§3.4) |
| FR-09–FR-11, BR-09–BR-11, BR-17 | Requester/staff dashboards, role navigation, metric definitions, drill-downs and feedback states (§2, §3.1–3.2) |
| FR-12, BR-12 | Conflict notification and refresh after stale edits (§3.3–3.4) |
| FR-13, BR-13, BR-16 | Existing role navigation, ticket detail patterns, ownership behavior, and Lab 3 UI conventions (§1–2, §3) |
| FR-13, AC-10 | Responsive and accessibility checks at desktop, tablet, and mobile widths (§4–5) |
