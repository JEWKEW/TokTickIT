# Lab 4 GitHub Issues (Detailed)
**Project:** TokTickIT, CPE 334, Lab 4: Actions Taken, Dashboards, and Final Regression

> Every item below comes from the Lab 4 handout. The handout section is cited as **[H§x.x]**.
> Where the handout says "students must define / decide", the item is marked **DECIDE** and the answer goes in the named spec file. No values are invented here.

---

## 0. Workflow Rules for All Issues

| Rule | Source |
|---|---|
| Use the same Kanban statuses introduced in earlier labs; all Issues must be in **Done** at the end | [H§11], [H§14 Part 1] |
| Branch flow: feature branches → `lab4-staging` → `main` (same as Labs 2 and 3) | [H§11.1], [H§14 Part 1] |
| Every change goes through a Pull Request with peer review recorded in `reviewer.md` | [H§2], [H§12] |
| AI specification agent and coding agent rules are the same as Labs 2 and 3 | [H§11.2] |
| The spec must exist **before** the main implementation PRs are completed | [H§14 Part 2] |
| Test plan is created before or alongside implementation (Test DD / TDD) | [H§10] |
| Every write operation is enforced by the backend; hiding UI controls is not authorization | [H§4.3] |
| Every Acceptance Criterion maps to at least one planned test | [H§9.1] |
| Do not add features outside the approved engineering contract | [H§4.2] |

### Out of scope for every issue [H§4.2]
Automatic SLA clocks, escalation, on-call; email/SMS/LINE/push notifications; inventory, spare parts, purchasing, cost accounting; time-sheet billing, payroll; multi-level approval, e-signatures; BI tools, custom report builders, export warehouses; multi-tenant and production-scale cloud; any feature not approved in the Sprint 4 contract.

---

## 1. Issue Overview (with Branch Names)

| # | Title | Description (for Kanban card) | Feature branch | Depends on | Submission part |
|---|---|---|---|---|---|
| 1 | Sprint 4 engineering contract (Spec DD) | Write `specification.md`, `ui-spec.md`, and `api-spec.md` before implementation. Define numbered FR/BR/AC, Actions Taken fields, authorization matrix, Ticket status-transition matrix, dashboard metric calculations, migration decisions, and Product Definition of Done. | `feature/lab4-spec` | none | Part 2 |
| 2 | Sprint 4 test plan and traceability (Test DD) | Write `tests.md` covering unit, API, UI component, UI style, responsive, authorization, workflow, migration/regression, performance-smoke, and E2E tests. Map every AC to a test ID and test-file path, and create the test file skeletons. | `feature/lab4-tests-plan` | 1 | Part 3 |
| 3 | Database increment: migration, backfill, seed | Add the Action Taken model (one Ticket has many Actions) with Prisma migration that keeps all Lab 1-3 data. Define legacy-Ticket behavior and rollback/recovery. Write idempotent seed with zero/one/many Actions and data for zero and non-zero dashboard metrics. | `feature/lab4-db-actions-taken` | 1 | Parts 2, 6 |
| 4 | Actions Taken API, validation, authorization | Build REST endpoints to create, update, and list Actions Taken. Performed by is set automatically. Follow-up Note is required when Follow-Up Required is true. Backend blocks Requester writes and handles stale updates, duplicate submits, and safe errors. | `feature/lab4-actions-taken-api` | 3 | Part 6 |
| 5 | Actions Taken UI on Ticket Detail | Add the Actions Taken area to Ticket Detail with list/table, create mode, and view/edit mode. Requesters see all items read-only. Include validation, loading, empty, forbidden, conflict, and failure states, plus responsive and accessible layout. | `feature/lab4-actions-taken-ui` | 4 | Part 6 |
| 6 | Ticket workflow, resolution gate, conflict handling | Finalize and enforce the status-transition matrix and roles in the backend. Requester "appears resolved" stays advisory only. UI shows only permitted transitions, refreshes the Ticket summary after changes, and stale updates are detected. | `feature/lab4-ticket-workflow` | 3 | Part 7 |
| 7 | Requester dashboard (API + UI) | Backend-calculated, concise dashboard for the authenticated Requester only: open, waiting for Requester, recently updated, recently resolved Tickets. Metric cards with drill-down, recent list, empty states, and ownership protection. | `feature/lab4-requester-dashboard` | 3, 6 | Part 8 |
| 8 | IT Staff / Administrator dashboard (API + UI) | Backend-calculated operational dashboard: status counts, unassigned, owned by current user, by IT Priority, recently updated, and current user's Actions Taken. Cards and items drill down to queue/detail. Admin may reuse it. Loading, empty, forbidden, and failure states. | `feature/lab4-staff-dashboard` | 3, 4, 6 | Part 5 |
| 9 | Final regression and product hardening | Verify Labs 1-3 still work: authentication, role navigation, My Tickets, Ticket Detail, attachments, comments, internal notes, user management. Remove console errors and broken links. Run the full test suite on staging and main. | `feature/lab4-regression` | 4 to 8 | Parts 3, 8 |
| 10 | Accessibility and responsive verification | Check visible focus, keyboard use, semantic labels, non-color cues, and no clipping, overlap, or horizontal scroll on desktop, tablet, and mobile. Complete the visual and accessibility checklist in `ui-spec.md`. | `feature/lab4-a11y-responsive` | 5, 7, 8 | Part 9 |
| 11 | Zen Green visual inspection and UI cleanup | Keep Zen Green design consistent across all screens, add Dashboard navigation with active-page indication, remove temporary/duplicate/obsolete UI, and capture desktop, tablet, and mobile screenshots. | `feature/lab4-visual-polish` | 5, 7, 8 | Part 9 |
| 12 | Release integration, README, and submission PDF | Merge feature branches into `lab4-staging` then `main`. Complete `reviewer.md` and `ai-use.md`, update README and `.gitignore`, move all Issues to Done, and build the single PDF with Answer Part 1 to 9. | `feature/lab4-release` | all | Parts 1, 4 |

### Branch Flow [H§11.1, H§14 Part 1]
The handout requires feature branches merged into `lab4-staging`, then `main` (same as Labs 2 and 3).

```text
main
 └── lab4-staging                      (integration branch; run full tests here)
      ├── feature/lab4-spec            (Issue 1)
      ├── feature/lab4-tests-plan      (Issue 2)
      ├── feature/lab4-db-actions-taken        (Issue 3)
      ├── feature/lab4-actions-taken-api       (Issue 4)
      ├── feature/lab4-actions-taken-ui        (Issue 5)
      ├── feature/lab4-ticket-workflow         (Issue 6)
      ├── feature/lab4-requester-dashboard     (Issue 7)
      ├── feature/lab4-staff-dashboard         (Issue 8)
      ├── feature/lab4-regression              (Issue 9)
      ├── feature/lab4-a11y-responsive         (Issue 10)
      ├── feature/lab4-visual-polish           (Issue 11)
      └── feature/lab4-release                 (Issue 12)
```

**Merge path:** `feature/*` → (PR + peer review) → `lab4-staging` → (full test run passes) → `main`

> The branch names above are suggestions. The handout only fixes the `lab4-staging` and `main` names; keep your own names consistent with the Lab 2 and 3 convention if it differs.

**Suggested conventions**
- Create each branch from `lab4-staging` after the issue moves to In Progress
- Link the Issue in the PR (e.g., `Closes #<issue-number>`)
- Suggested PR title format: `[Lab4][Issue N] <short title>`
- Suggested commit format: `lab4: <what changed> (#<issue-number>)`

---

# Issue 1: Sprint 4 engineering contract (Spec DD)

**Labels:** `docs` `spec-dd` `sprint-4` **Branch:** `feature/lab4-spec`
**Handout refs:** [H§4], [H§9], [H§14 Part 2]

### Objective
Transform the handout into a concise, internally consistent Sprint 4 engineering specification. Do not copy the entire handout. Resolve implementation choices, identify assumptions, and explain how earlier increments are preserved. [H§9]

### Work sequence and ownership
1. Read the Lab 4 handout and the existing Labs 1–3 code, schema, API routes, UI patterns, and tests before making decisions. Record the handout section for each requirement so decisions stay grounded in the assignment.
2. Draft `specification.md` first. Give every functional requirement, business rule, and acceptance criterion a stable ID (`FR-xx`, `BR-xx`, `AC-xx`); do not reuse IDs when revising text.
3. Derive `ui-spec.md` and `api-spec.md` from those IDs. Keep names, roles, statuses, field rules, errors, and workflow behavior consistent across all three files. Cross-reference IDs where practical.
4. Mark each choice that the handout leaves open as a decision, and record the selected value plus a short rationale in §11. Keep unresolved choices visibly marked `OPEN`; do not silently invent behavior or start dependent implementation while a blocking decision remains open.
5. Review the three rendered Markdown files together. Resolve contradictions and check links, headings, tables, and code examples before requesting peer review.

**Ownership:** the specification agent drafts and checks the documents; the coding agent uses only the reviewed contract for implementation and flags ambiguity or conflicts before coding. A peer reviewer records review comments, responses, and approval in `reviewer.md` as part of the release evidence (Issue 12). The student owns final decisions and confirms the spec matches the handout and existing product.

### Deliverable files [H§9]
- `docs/lab-04/specification.md`
- `docs/lab-04/ui-spec.md`
- `docs/lab-04/api-spec.md`

### `specification.md` must contain these 11 sections [H§9]
| # | Section | What must be provided |
|---|---|---|
| 1 | Sprint Goal | One short paragraph stating the delivered value |
| 2 | Stakeholder Request | Concise interpretation in the student's own words |
| 3 | Scope | Included and explicitly excluded work |
| 4 | Functional Requirements | Numbered FR statements for Actions Taken, workflow, dashboards, hardening |
| 5 | Business Rules | Numbered BR statements including assignment, dates, statuses, resolution gate, dashboard calculations |
| 6 | UI Specification Summary | Screen structure, modes, controls, feedback, role behavior, responsive rules, reference to `ui-spec.md` |
| 7 | Data Changes | Models, fields, relationships, indexes, migration, backfill, seed decisions |
| 8 | API Contract | Endpoints, request/response shapes, statuses, authorization, conflicts, safe errors |
| 9 | Acceptance Criteria | Observable, testable criteria such as AC-01 |
| 10 | Definition of Done | Product-completion checklist used by the coding agent |
| 11 | Assumptions and Decisions | Only meaningful choices not fixed by the handout |

### Tasks
- [ ] **Scope (§3):** list included work and copy the excluded items from [H§4.2]
- [ ] **Action Taken fields [H§4.1, H§8.3]:** document all seven: Action Date/Time, Action Description, Result, Performed by (auto), Follow-Up Required?, Follow-up Note (required when follow-up is needed), Attachment Notes (what file to look for, images, etc.)
- [ ] **Business rules [H§4.4]:** start from the two mandatory examples, then identify and number the rest (BR-03 onward)
  - BR-01 Action Taken belongs to exactly one Ticket
  - BR-02 The Ticket Owner coordinates the Ticket, but an Action Taken may be by a different IT Staff member
  - **DECIDE** further BRs covering: assignment, dates, statuses, resolution gate, dashboard calculations [H§9], follow-up note requirement [H§4.1], Requester advisory-only indication [H§4.5]
- [ ] **Authorization matrix [H§4.3]:** complete the matrix with the AI specification agent

  | Role | Minimum behavior from handout |
  |---|---|
  | Requester | View Actions Taken for owned Tickets where approved; cannot create or change |
  | IT Staff | Create and update Action Taken on accessible Tickets |
  | Administrator | IT Staff behavior plus administrative access for support and testing |

- [ ] **Status transition matrix [H§4.5]:** statuses remain New, Open, In Progress, Waiting for Requester, Resolved, Closed, Reopened, Cancelled. **DECIDE** the final permitted transitions and authorized roles
- [ ] **Resolution rule [H§4.5]:** backend enforces it even if the client bypasses the screen; Requester "appears resolved" is advisory and does not change status to Resolved
- [ ] **Dashboard metrics [H§4.6, H§6.2]:** for each card/count **DECIDE** exact name, query, time zone and date boundaries, drill-down link or query parameters, empty behavior
- [ ] **Data changes [H§5]:** fields, data types, foreign keys, indexes, enums or reference tables, timestamps, optimistic-concurrency / stale-update handling, migration strategy. Justify **at least two** database-design decisions [H§5.1]
- [ ] **Migration and backfill [H§5.2]:** how legacy Tickets without Actions Taken behave; how dashboards treat existing records; rollback or recovery approach
- [ ] **Seed [H§5.3]:** idempotent; realistic Tickets covering all major statuses, priorities, assigned and unassigned ownership; Tickets with zero, one, and multiple Actions Taken; data for both non-zero and zero dashboard metrics
- [ ] **Acceptance criteria [H§9.1]:** write AC-01, AC-02 (examples below) and add enough to cover the whole approved scope
  - AC-01: Given a permitted IT Staff user and valid data, when an Actions Taken is created, then it is saved under the correct Ticket with the authenticated creator and approved assignee
  - AC-02: Given an authenticated Requester, when dashboard data is retrieved, then only metrics and recent Tickets owned by that Requester are returned
- [ ] **Definition of Done [H§13]:** same as Labs 2 and 3, finalized with an LLM for Product Completion
- [ ] **Explain preservation of earlier increments** (Labs 1 to 3) [H§9]
- [ ] **Traceability and consistency:** add a compact requirement index or equivalent links showing each FR/BR/AC is covered by the relevant UI and API behavior and can be mapped to Issue 2 tests; use the same field, role, status, and error names in all three files.
- [ ] **Decision log:** record each handout-open choice, its chosen value, rationale, and any consequential assumption in §11; label unresolved items `OPEN` and identify whether they block implementation.
- [ ] **Review evidence:** have a peer review the rendered three-file contract; capture the PR link, reviewer comments, responses, and approval in `reviewer.md` (Issue 12). Keep this spec PR separate from implementation PRs.

### `ui-spec.md` must define [H§8, H§7]
- [ ] IT Staff Dashboard: final cards, lists, responsive arrangement, loading, empty, forbidden, safe-failure feedback [H§8.1]
- [ ] Requester Dashboard layout [H§8.2]
- [ ] Actions Taken area on Ticket Detail: list/table, create mode, view/edit mode [H§8.3]
- [ ] Ticket status controls showing only permitted transitions; summary status refresh [H§8.4]
- [ ] Zen Green rules from [H§7] (see Issue 11)
- [ ] Responsive and accessibility requirements: same as Labs 2 and 3 [H§8.6]
- [ ] Visual and accessibility checklist (used in Issue 10)

### `api-spec.md` must define [H§6]
- [ ] Exact endpoint paths, methods, request and response shapes, validation, authorization, safe errors, conflict handling, status codes
- [ ] Endpoints for: create and update Actions Taken; Requester dashboard; IT Staff dashboard; continued Labs 2 and 3 APIs; health, validation, regression behavior
- [ ] Concurrent / stale update behavior so one user does not unknowingly overwrite another's workflow change [H§6.1]
- [ ] Dashboard responses are concise, not entire Ticket collections [H§6.2]

### Acceptance criteria for this issue
- [ ] All three files exist and render in GitHub
- [ ] Every applicable requirement in [H§4] to [H§8] is covered by a stable FR/BR/AC ID or explicitly excluded with a reason; no required handout behavior is silently omitted
- [ ] Every AC is observable and testable, has an unambiguous pass condition, and is ready to map to at least one test ID in Issue 2
- [ ] The authorization and transition matrices cover every listed role/status and specify allowed and denied behavior, including backend enforcement
- [ ] Dashboard metric definitions state the population/filter, calculation, time zone/date boundary where relevant, drill-down behavior, and zero-result behavior
- [ ] Data, migration, legacy-record, seed, concurrency, validation, and safe-error decisions agree across the specification and API contract
- [ ] No `OPEN` decision blocks the first dependent implementation issue; any remaining non-blocking assumption is explicit
- [ ] Peer review is recorded, and the spec PR is merged before implementation PRs begin (timestamp evidence for Answer Part 2)
- [ ] Spec PR is merged before the main implementation PRs (timestamp evidence for Answer Part 2)

---

# Issue 2: Sprint 4 test plan and traceability (Test DD)

**Labels:** `docs` `test-dd` `sprint-4` **Branch:** `feature/lab4-tests-plan`
**Handout refs:** [H§10], [H§12], [H§14 Part 3]

### Objective
Create `docs/lab-04/tests.md` before or alongside implementation. [H§10]

### Required test types [H§10]
Unit, API or integration, UI component, UI style, responsive, authorization, workflow, migration/regression, performance-smoke, end-to-end.

### Required table columns [H§10]
Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final

Handout examples to include as the format model:

| Test ID | Type | Req/AC | What It Tests | Expected | File | Final |
|---|---|---|---|---|---|---|
| API-03 | API | AC-01 | Create a valid Actions Taken | Created under the correct Ticket and actor | `server/tests/lab-04/actions-taken.api.test.ts` | Pass |
| E2E-02 | E2E | AC-03 | (define) | (define) | (define) | Pass |

### Students must identify tests for [H§10]
All UI, dashboard calculations, drill-down, role restrictions, concurrent or stale updates, safe failures, responsive behavior, accessibility, and complete Labs 1 to 3 regression.

### Tasks
- [ ] Build the table with one row per planned test
- [ ] Add a traceability section: every AC maps to at least one Test ID [H§9.1]
- [ ] Create skeleton test files at the exact paths below (TDD: tests exist first) [H§12]

```text
server/tests/lab-04/
├── actions-taken.api.test.ts
├── ticket-workflow.api.test.ts
├── requester-dashboard.api.test.ts
└── staff-dashboard.api.test.ts
client/.../lab-04 tests/
├── StaffDashboard.test.tsx
├── RequesterDashboard.test.tsx
├── ActionsTaken.test.tsx
└── TicketWorkflow.test.tsx
e2e/lab-04/
├── actions-taken-flow.spec.ts
├── ticket-resolution.spec.ts
└── dashboards.spec.ts
```

- [ ] At the end: fill in the **Final** column and attach full passing output from `main` (unit, API/integration, UI, authorization, workflow, regression, E2E) [H§14 Part 3]

### Acceptance criteria for this issue
- [ ] 100% of ACs trace to a Test ID with an actual test-file path
- [ ] Final status for each test is recorded

---

# Issue 3: Database increment: migration, backfill, seed

**Labels:** `backend` `database` `prisma` **Branch:** `feature/lab4-db-actions-taken`
**Handout refs:** [H§5], [H§5.1], [H§5.2], [H§5.3]

### Objective
Evolve the existing PostgreSQL and Prisma design **without discarding data from earlier labs**. It must support Actions Taken, dashboard queries, and any additional fields required by the approved Ticket workflow. [H§5]

### Required concepts [H§5.1]
- One Ticket may contain many Action Taken
- All earlier Users, Tickets, Attachments, Public Comments, and Internal Notes remain valid after migration

### DECIDE (record in `specification.md` §7) [H§5.1]
Fields, data types, foreign keys, indexes, enums or reference tables, timestamps, optimistic-concurrency or stale-update handling, migration strategy. Justify at least two design decisions.

### Tasks
- [ ] Add the Action Taken model with fields for: Action Date/Time, Action Description, Result, Performed by (auto, linked to a User), Follow-Up Required?, Follow-up Note, Attachment Notes, Ticket reference
- [ ] Add Ticket relation: one Ticket to many Action Taken (BR-01)
- [ ] Add indexes that support the dashboard queries defined in Issue 1
- [ ] Add timestamps and the optimistic-concurrency / stale-update mechanism chosen in the spec
- [ ] Add any additional Ticket fields required by the approved workflow
- [ ] Write the Prisma migration; verify existing Lab 1 to 3 data is intact [H§5.2]
- [ ] Define and document legacy behavior: Tickets without Actions Taken, and how dashboards treat existing records [H§5.2]
- [ ] Document **and test** migration plus rollback or recovery approach [H§5.2]
- [ ] Write idempotent seed (safe to run repeatedly) that includes [H§5.3]:
  - [ ] Realistic Tickets covering all major statuses
  - [ ] Multiple priorities
  - [ ] Assigned and unassigned ownership
  - [ ] Tickets with zero, one, and multiple Actions Taken
  - [ ] Data enough to show both non-zero and zero dashboard metrics

### Tests (planned in `tests.md`)
Migration/regression test; seed idempotency test; relationship test (Action belongs to exactly one Ticket).

### Acceptance criteria for this issue
- [ ] Migration applies to a database with Lab 3 data and loses nothing
- [ ] Seed can run twice with no duplicates or errors
- [ ] Rollback or recovery steps are documented and tested

---

# Issue 4: Actions Taken API, validation, authorization

**Labels:** `backend` `api` `security` **Branch:** `feature/lab4-actions-taken-api`
**Handout refs:** [H§4.3], [H§4.4], [H§6], [H§6.1], [H§8.5]
**Test file:** `server/tests/lab-04/actions-taken.api.test.ts`

### Objective
Support creating and updating Actions Taken as permitted, with backend-enforced authorization and safe conflict/error handling. [H§6]

### DECIDE in `api-spec.md` [H§6]
Exact endpoint paths, methods, request and response shapes, validation, authorization, safe errors, conflict handling, status codes.

### Tasks (TDD: write failing tests first)
- [ ] Create Action Taken endpoint (IT Staff and Administrator)
- [ ] Update Action Taken endpoint (IT Staff and Administrator)
- [ ] Retrieve Actions Taken for a Ticket (IT Staff, Administrator, and the owning Requester read-only) [H§4.3, H§8.3]
- [ ] **Performed by is set automatically** from the authenticated user, never trusted from the client [H§4.1]
- [ ] Validation: **Follow-up Note is required when Follow-Up Required? is true** [H§4.1, H§8.3]
- [ ] Validation for other fields per the spec (required fields, lengths, date/time)
- [ ] Action belongs to exactly one Ticket (BR-01); reject writes to missing Tickets
- [ ] Different IT Staff member than the Ticket Owner may record an Action (BR-02)
- [ ] Requester write attempts are rejected by the backend even if the UI is bypassed [H§4.3]
- [ ] A Requester cannot read Actions on another Requester's Ticket [H§8.2]
- [ ] Stale update is detected or safely handled so no silent overwrite [H§6.1]
- [ ] Duplicate actions from repeated clicking or network retry are prevented or safely handled [H§8.5]
- [ ] Safe error responses (validation, forbidden, conflict, not-found, failure) with no internals leaked [H§8.5]

### Tests to plan (examples from handout)
- API-03: create a valid Actions Taken → created under the correct Ticket and actor (AC-01)
- Authorization tests per role; conflict test; validation tests for the follow-up note rule

### Acceptance criteria for this issue
- [ ] AC-01 passes
- [ ] Direct API calls by a Requester cannot create or change Actions Taken
- [ ] Stale-update test passes

---

# Issue 5: Actions Taken UI on Ticket Detail

**Labels:** `frontend` `ui` `zen-green` **Branch:** `feature/lab4-actions-taken-ui`
**Handout refs:** [H§8.3], [H§7], [H§8.5], [H§8.6]
**Test file:** `ActionsTaken.test.tsx`; E2E `e2e/lab-04/actions-taken-flow.spec.ts`

### Objective
The existing IT Staff Ticket Detail screen adds an Actions Taken area with an appropriate list or table, **create mode**, and **view/edit mode**. Requesters see all Actions Taken items. [H§8.3]

### Fields shown per action [H§8.3]
Action create date/time, Action Description, Result, Performed by (auto), Follow-Up Required?, Follow-up Note (required when follow-up is needed), Attachment Notes (what file to look for, images, etc.)

### Tasks
- [ ] List/table of Actions Taken on Ticket Detail
- [ ] Create mode form (IT Staff and Administrator only); Performed by displayed read-only (auto)
- [ ] View/edit mode for existing actions (IT Staff and Administrator)
- [ ] Requester view: all Actions Taken visible, read-only, no create/edit controls [H§8.3, H§4.3]
- [ ] Follow-up Note becomes required when Follow-Up Required? is selected, with validation message placed per the UI checklist [H§14 Part 9]
- [ ] Show different Actions Taken on one Ticket (multiple lines) [H§14 Part 6]
- [ ] Feedback states: loading, validation, success, empty/no-results, forbidden, conflict, not-found, safe API-failure [H§8.5]
- [ ] Prevent duplicate submission by repeated clicks [H§8.5]
- [ ] Protect entered data after recoverable failures [H§8.5]
- [ ] Reuse existing Zen Green tab, badge, button, form, table, card, loading, empty, error, responsive conventions [H§7]
- [ ] Keyboard operation, visible focus, semantic labels, non-color cues [H§7]
- [ ] No clipped content, overlapping controls, inaccessible modals, or horizontal page scrolling [H§7]
- [ ] Responsive behavior on desktop, tablet, mobile [H§8.6]

### Demonstration evidence needed (Answer Part 6) [H§14]
List, create, assign, edit, status transition, complete, cancel, validation, inactive-assignee rejection, role restrictions, safe failures, responsive behavior, multiple Actions on one Ticket.

### Acceptance criteria for this issue
- [ ] IT Staff can create and edit Actions; Requester sees read-only list
- [ ] Validation, loading, empty, forbidden, and failure states are visible and consistent

---

# Issue 6: Ticket workflow, resolution gate, conflict handling

**Labels:** `backend` `frontend` `workflow` **Branch:** `feature/lab4-ticket-workflow`
**Handout refs:** [H§4.5], [H§6.1], [H§8.4], [H§14 Part 7]
**Test files:** `ticket-workflow.api.test.ts`, `TicketWorkflow.test.tsx`, `e2e/lab-04/ticket-resolution.spec.ts`

### Objective
Implement and test the complete Ticket lifecycle from creation through closure or cancellation. [H§1]

### Fixed by handout [H§4.5]
- Statuses: New, Open, In Progress, Waiting for Requester, Resolved, Closed, Reopened, Cancelled
- Backend enforces the resolution rule even when the client bypasses the normal screen
- A Requester indication that the problem appears resolved is **advisory** and does not change the Ticket to Resolved
- IT Staff must review the work and formally update the Ticket [H§3]

### DECIDE in spec
The final permitted transition matrix and which roles may perform each transition. The exact resolution-gate conditions.

### Tasks
- [ ] Document the full matrix (from-status × to-status × allowed role)
- [ ] Backend rejects any transition not in the matrix, regardless of client
- [ ] Implement the resolution gate; only the approved role(s) can set Resolved
- [ ] Keep the Requester "problem appears resolved" indication advisory
- [ ] Conflict handling: stale or concurrent workflow updates are detected or safely handled with a defined status code and message [H§6.1]
- [ ] UI status controls show **only permitted transitions** for the current role and status [H§8.4]
- [ ] After a successful change, the Ticket summary status refreshes [H§8.4]
- [ ] Ticket Owner keeps coordinating responsibility (BR-02); Actions may come from other IT Staff
- [ ] Role-appropriate visibility of workflow controls

### Evidence needed (Answer Part 7) [H§14]
Permitted Ticket transitions, stable ordering, append-only behavior, role-appropriate visibility.

### Acceptance criteria for this issue
- [ ] Every cell of the transition matrix has a test (allowed and denied)
- [ ] A client bypassing the UI cannot make a disallowed transition
- [ ] A stale update does not silently overwrite another user's change

---

# Issue 7: Requester dashboard (API + UI)

**Labels:** `backend` `frontend` `dashboard` **Branch:** `feature/lab4-requester-dashboard`
**Handout refs:** [H§4.6], [H§6.2], [H§8.2], [H§14 Part 8]
**Test files:** `requester-dashboard.api.test.ts`, `RequesterDashboard.test.tsx`, `e2e/lab-04/dashboards.spec.ts`

### Objective
Summarize **only the authenticated Requester's** Tickets, helping identify Tickets requiring attention, recently updated Tickets, and resolved work **without duplicating the full My Tickets screen**. Ownership protection stays enforced by the backend. [H§8.2]

### Handout example metrics [H§4.6]
Total open Tickets, Tickets waiting for the Requester, recently updated Tickets, recently resolved Tickets.

### Reference mockup (handout p.6) [H§8.2]
Welcome message; metric cards My Open Tickets, In Progress, Resolved, Closed, each with a "View all" link; "My Recent Tickets" list with status badge and date/time; Quick Actions: Create Ticket, View My Tickets.

### DECIDE in spec [H§4.6, H§6.2]
Exact metric names, calculation for each metric, time zone and date boundaries, links/query parameters for drill-down, behavior when no records exist.

### Tasks
- [ ] Backend endpoint returns concise metric data, not entire Ticket collections [H§6.2]
- [ ] All metrics calculated by the backend from authoritative data [H§4.6]
- [ ] Query filters strictly by the authenticated Requester (AC-02)
- [ ] Each card/count has a defined query, empty behavior, and drill-down destination [H§4.6]
- [ ] Recent / attention-required Ticket list
- [ ] Dashboard navigation item with clear active-page indication [H§7]
- [ ] Concise metric cards with labels, values, and **accessible drill-down actions** [H§7]
- [ ] Loading, empty, forbidden, and safe-failure feedback [H§8.1 pattern, H§8.5]
- [ ] Responsive card arrangement; no horizontal scrolling [H§7]

### Evidence needed (Answer Part 8) [H§14]
Requester-owned metrics, recent and attention-required Tickets, drill-down, ownership protection.

### Acceptance criteria for this issue
- [ ] AC-02 passes
- [ ] A Requester cannot see another Requester's data via the API
- [ ] Zero-state and non-zero seed data both display correctly

---

# Issue 8: IT Staff / Administrator dashboard (API + UI)

**Labels:** `backend` `frontend` `dashboard` **Branch:** `feature/lab4-staff-dashboard`
**Handout refs:** [H§4.6], [H§6.2], [H§8.1], [H§14 Part 5]
**Test files:** `staff-dashboard.api.test.ts`, `StaffDashboard.test.tsx`, `e2e/lab-04/dashboards.spec.ts`

### Objective
A concise operational starting point showing approved metrics and recent or urgent Ticket information. Each actionable item opens the appropriate Ticket Queue, Ticket Detail, or filtered view. [H§8.1]

### Handout example metrics [H§4.6]
- IT Staff: unassigned Tickets, Tickets owned by the current user, Tickets by status or IT Priority, recently updated Tickets
- Administrator: may reuse the IT Staff dashboard; optionally include concise user-account counts

### Reference mockup (handout p.5) [H§8.1]
Welcome message and Refresh button; cards New, Open, In Progress, Waiting for Requester, My Assigned; "My Recent Tickets" list with status badge and date/time; Quick Actions: Create Ticket, Search Tickets, My Queue.

### DECIDE in `ui-spec.md` / spec [H§8.1, H§6.2]
Final cards, lists, responsive arrangement, loading, empty, forbidden, and safe-failure feedback; metric definitions, time zone, date boundaries, drill-down parameters, empty behavior.

### Tasks
- [ ] Backend endpoint for IT Staff dashboard, concise data only [H§6.2]
- [ ] Metrics calculated by the backend from authoritative data [H§4.6]
- [ ] Include the current user's Actions Taken in the dashboard view (required evidence in [H§14 Part 5])
- [ ] Recent or urgent Ticket list
- [ ] Each card/list item links to the Ticket Queue (with filter), Ticket Detail, or filtered view [H§8.1]
- [ ] Administrator may reuse the same dashboard; optional concise user-account counts (Admin only) [H§4.6]
- [ ] Requester access to this dashboard is denied by the backend (forbidden state)
- [ ] Role-appropriate Dashboard navigation with active-page indication [H§7]
- [ ] Loading, empty, forbidden, safe-failure feedback; responsive arrangement
- [ ] Collect evidence that selected metrics match database queries [H§14 Part 5]

### Evidence needed (Answer Part 5) [H§14]
Approved operational metrics, current-user Actions Taken, recent or urgent Tickets, accurate counts, drill-down behavior, loading, empty, forbidden, safe-failure, responsive behavior; metric-to-database-query comparison.

### Acceptance criteria for this issue
- [ ] Counts match direct database queries for seeded data
- [ ] Zero and non-zero metrics both verified
- [ ] Drill-down lands on the correct filtered view

---

# Issue 9: Final regression and product hardening

**Labels:** `testing` `regression` **Branch:** `feature/lab4-regression`
**Handout refs:** [H§8.5], [H§10], [H§14 Parts 3 and 8]

### Objective
All earlier behavior from Labs 1 to 3 continues to work consistently. [H§1, H§8.5]

### Regression checklist [H§8.5]
- [ ] All Requester, IT Staff, and Administrator screens from earlier labs remain available to permitted users
- [ ] Role navigation, ownership, comments, notes, attachments, user management, and authentication remain correct
- [ ] Loading, validation, success, empty/no-results, forbidden, conflict, not-found, and safe API-failure feedback is consistent
- [ ] Duplicate actions from repeated clicking or network retry are prevented or safely handled
- [ ] Important forms protect entered data after recoverable failures
- [ ] Console errors, broken links, placeholder text, and unfinished controls are removed
- [ ] README setup, seed, migration, test, and demonstration instructions are current

### Representative regression evidence required (Answer Part 8) [H§14]
Authentication, My Tickets, Ticket Detail, Attachments, Public Comments, IT Staff functions, Internal Notes, Administrator user management.

### Tasks
- [ ] Run and keep green the Lab 1 to 3 test suites
- [ ] Add Lab 4 regression tests where Lab 4 touches earlier features (Ticket Detail now has Actions Taken; status controls changed; navigation now includes Dashboard)
- [ ] Verify Requesters still cannot see Internal Notes or others' Tickets
- [ ] Performance-smoke tests (required test type [H§10])
- [ ] Health endpoint check [H§6]
- [ ] Run the full suite (unit, API/integration, UI, authorization, workflow, regression, E2E) on `lab4-staging`, then on `main`, and save the output [H§14 Part 3]

### Acceptance criteria for this issue
- [ ] All earlier and new tests pass on `main`
- [ ] No console errors on major screens

---

# Issue 10: Accessibility and responsive verification

**Labels:** `a11y` `ui` **Branch:** `feature/lab4-a11y-responsive`
**Handout refs:** [H§7], [H§8.6], [H§14 Part 9]

### Objective
Same responsive and accessibility requirements as Labs 2 and 3. [H§8.6]

### Tasks
- [ ] Preserve visible focus and keyboard operation on dashboards, Actions Taken, and workflow controls [H§7]
- [ ] Semantic labels for forms, cards, tables, and drill-down actions [H§7]
- [ ] Non-color cues for Ticket status and priority [H§7]
- [ ] Private versus shared content visually distinguishable [H§7]
- [ ] Accessible modal dialogs (if any are used) [H§7]
- [ ] No clipped content, overlapping controls, or horizontal page scrolling at desktop, tablet, mobile [H§7]
- [ ] Complete the visual and accessibility checklist covering: design consistency, dashboards, Actions Taken, editable vs read-only fields, validation placement, keyboard focus, clipping, overlap, horizontal overflow [H§14 Part 9]
- [ ] Plan and run accessibility and responsive tests listed in `tests.md` [H§10]

### Acceptance criteria for this issue
- [ ] Checklist fully completed and linked from `ui-spec.md`
- [ ] Desktop, tablet, and mobile verified for all major Lab 4 screens

---

# Issue 11: Zen Green visual inspection and UI cleanup

**Labels:** `ui` `polish` **Branch:** `feature/lab4-visual-polish`
**Handout refs:** [H§7], [H§8.5], [H§12], [H§14 Part 9]

### Objective
Preserve the Zen Green design language from Labs 2 and 3 so the final product looks and behaves like one coherent application. [H§7]

### Tasks (all from [H§7])
- [ ] Add role-appropriate Dashboard navigation and maintain clear active-page indication
- [ ] Reuse existing Ticket, tab, badge, button, form, table, card, loading, empty, error, and responsive conventions
- [ ] Visually distinguish Ticket status, priorities, and private versus shared content
- [ ] Concise metric cards with labels, values, and accessible drill-down actions
- [ ] Remove temporary, duplicate, obsolete, or inconsistent UI elements left from earlier labs
- [ ] Remove placeholder text, broken links, and unfinished controls [H§8.5]
- [ ] Capture screenshots (desktop, tablet, mobile) for all major Lab 4 screens, readable without extreme zoom [H§14]

### Screenshot folders [H§12]
```text
artifacts/lab-04/screenshots/
├── staff-dashboard/
├── requester-dashboard/
└── actions-taken/
```

### Acceptance criteria for this issue
- [ ] Screens are visually consistent across all roles
- [ ] Screenshots are committed in the required folders

---

# Issue 12: Release integration, README, and submission PDF

**Labels:** `release` `docs` **Branch:** `feature/lab4-release`
**Handout refs:** [H§11], [H§12], [H§14 Parts 1 and 4]

### Tasks
- [ ] Merge feature branches into `lab4-staging`, verify, then merge to `main` [H§14 Part 1]
- [ ] Complete `docs/lab-04/reviewer.md`: reviewer identity, PR links, comments, responses, approvals [H§14 Part 1]
- [ ] Complete `docs/lab-04/ai-use.md`: name the LLM used, 6 to 10 selected key prompts, and a brief "My Reflection" on specification-agent and coding-agent use [H§14 Part 4]
- [ ] Update README: setup, seed, migration, test, and demonstration instructions [H§8.5]
- [ ] Confirm `.gitignore` is correct (evidence required) [H§14 Part 1]
- [ ] Move all Issues to **Done** on the GitHub Project/Kanban [H§14 Part 1]
- [ ] Confirm the minimum repository structure exists [H§12]
- [ ] Final Product Definition of Done check [H§13]

### Repository structure to verify [H§12]
```text
docs/lab-04/        specification.md, tests.md, ui-spec.md, api-spec.md, reviewer.md, ai-use.md
server/tests/lab-04/   (4 API test files)
client/.../lab-04 tests/   (4 UI test files)
e2e/lab-04/            (3 spec files)
artifacts/lab-04/screenshots/   staff-dashboard/, requester-dashboard/, actions-taken/
```

### Submission PDF (exactly one, concise) [H§14]
Use headings "Answer Part 1" to "Answer Part 9" in this exact order, with working links and readable screenshots. The repository and final `main` remain the source of truth.

| Part | Pts | Evidence | Covered by issue |
|---|---|---|---|
| 1 Git Use with Engineering Workflow | 10 | Commit history (feature → `lab4-staging` → `main`); Kanban all Done; rendered `reviewer.md`; README and `.gitignore`; directory structure | 12 |
| 2 Spec DD | 5 | Rendered `specification.md` with requirements, BRs, transition rules, dashboard calculations, ACs, migration decisions, DoD; proof spec predates implementation PRs | 1 |
| 3 Test DD and Traceability | 10 | Rendered `tests.md`; AC traceability; test-file paths; final status; passing output from `main` | 2, 9 |
| 4 AI Use with Reflection | 5 | Rendered `ai-use.md`: LLM named, 6 to 10 prompts, "My Reflection" | 12 |
| 5 Working IT Staff Dashboard UI | 5 | Metrics, current-user Actions Taken, recent/urgent Tickets, counts, drill-down, all feedback states, responsive; metrics vs DB queries | 8 |
| 6 Working Actions Taken UI | 10 | List, create, assign, edit, status transition, complete, cancel, validation, inactive-assignee rejection, role restrictions, safe failures, responsive; multiple Actions on one Ticket | 3, 4, 5 |
| 7 Working Ticket Workflow | 5 | Permitted transitions, stable ordering, append-only behavior, role-appropriate visibility | 6 |
| 8 Requester Dashboard and Final Regression UI | 5 | Requester metrics, recent/attention Tickets, drill-down, ownership protection, regression evidence | 7, 9 |
| 9 Zen Green UI, Responsive, Accessibility, Polish | 5 | Rendered `ui-spec.md`; desktop/tablet/mobile screenshots; completed visual and accessibility checklist | 10, 11 |

### Acceptance criteria for this issue
- [ ] `main` builds and passes all tests following the README from a fresh clone
- [ ] PDF contains evidence for all nine parts

---

## Suggested Order of Work
1. Issue 1, then Issue 2 (documents first)
2. Issue 3 (database)
3. Issues 4 and 6 (backend APIs and workflow), then Issue 5 (Actions Taken UI)
4. Issues 7 and 8 (dashboards)
5. Issues 9, 10, 11 (regression, accessibility, polish)
6. Issue 12 (release and PDF)
