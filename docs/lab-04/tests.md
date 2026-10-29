# Lab 4 Test Plan and Acceptance-Criterion Traceability

This is the planned verification for the Lab 4 contract in `specification.md`, `ui-spec.md`, and `api-spec.md`. Test IDs are stable and are the references for implementation and evidence. **Final** is `Pending` until the test is implemented and run against the integrated `main` branch; no test results are claimed here.

## Test Environment and Conventions

- API tests run with Vitest and Supertest against an isolated test database. Reset/seed fixtures between tests; do not use developer data.
- UI component/style tests run with Vitest, Testing Library, and jsdom using the existing `client/tests/setup.ts`.
- E2E tests run with Playwright against the integrated client and server using the existing root `playwright.config.ts`.
- Use named fixtures for Requester, active IT Staff, Administrator, inactive staff, and at least two Requesters. Keep assertions independent of generated numeric IDs.
- For stale-update tests, read a record version, update it once, and submit the original `expectedUpdatedAt`; assert HTTP 409 and that the newer data remains unchanged.
- Responsive browser checks use 1280px desktop, 768px tablet, and 375px mobile viewports. Capture screenshots as evidence when doing the visual verification in Issue 11.
- Performance smoke runs against 500 seeded Tickets and up to 2,000 Actions Taken on the same local test environment: after one warm-up request, each of five sequential dashboard requests should complete in at most 1,000 ms. Record the fixture size and machine/runtime with results; this is a local smoke threshold, not a production-scale claim.
- Do not mark a test Pass until it has actually run. Record the command, branch, and final output in the submission evidence for Answer Part 3.

## Planned Test Cases

| Test ID | Type | Requirement / AC | What It Tests | Expected Result | Automated Test File | Final |
|---|---|---|---|---|---|---|
| UNIT-01 | Unit | BR-04, BR-05, AC-03 | Actions Taken field validation, whitespace, and length boundaries | Invalid values fail validation; valid boundary values pass | `server/tests/lab-04/actions-taken.api.test.ts` | Pending |
| UNIT-02 | Unit | BR-07, AC-05 | Status transition lookup for every source/target pair | Only the documented transitions are allowed | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pending |
| API-01 | API | FR-01, FR-02, FR-14, AC-01, AC-11 | Create Action Taken with action time; server assigns performer | 201 response links correct Ticket, action time, and authenticated performer; client cannot spoof performer | `server/tests/lab-04/actions-taken.api.test.ts` | Pending |
| API-02 | API | FR-03, BR-04, AC-03 | Missing, blank, and valid conditional follow-up notes | Required blank note returns 400; valid note is saved | `server/tests/lab-04/actions-taken.api.test.ts` | Pending |
| API-03 | API | FR-04, BR-06, AC-14 | List actions for owned and unowned Requester Tickets | Owner can read; another Requester is denied; list has stable action-time ordering | `server/tests/lab-04/actions-taken.api.test.ts` | Pending |
| API-04 | API | FR-05, FR-12, AC-08, AC-18 | Edit permitted Action Taken fields and preserve immutable IDs/performer | Valid edit updates timestamp; Ticket and original performer remain unchanged | `server/tests/lab-04/actions-taken.api.test.ts` | Pending |
| API-05 | API / Concurrency | FR-12, BR-12, AC-08, AC-18 | Stale Action Taken update with old `expectedUpdatedAt` | Returns 409; latest record remains unchanged | `server/tests/lab-04/actions-taken.api.test.ts` | Pending |
| AUTH-01 | Authorization | BR-06, AC-04, AC-14 | Requester attempts Action Taken create/update; staff/admin access allowed | Requester receives 403; permitted roles can write on accessible Tickets | `server/tests/lab-04/actions-taken.api.test.ts` | Pending |
| API-06 | API / Authorization | BR-16, AC-12 | Assign Ticket to active staff/admin, inactive staff, requester, or null | Only null or active IT Staff/Admin assignment is accepted | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pending |
| API-07 | API / Workflow | FR-06, BR-07, AC-05 | Allowed and forbidden status changes across all eight statuses | Allowed transitions succeed; disallowed transitions return 400 | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pending |
| AUTH-02 | Authorization | FR-07, BR-08, AC-04 | Requester cannot formally change status; staff/admin resolution authorization | Requester gets 403; only permitted roles may resolve/close | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pending |
| API-08 | API / Workflow | FR-08, BR-08, AC-06 | Requester indicates that problem appears resolved | Advisory flag/time is saved and formal status is unchanged | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pending |
| API-09 | API / Concurrency | FR-12, BR-12, AC-08 | Stale Ticket status update | Returns 409 and does not overwrite the current status | `server/tests/lab-04/ticket-workflow.api.test.ts` | Pending |
| API-10 | API / Authorization | FR-09, BR-09, AC-02 | Requester dashboard identity isolation | Response contains only the authenticated Requester's metrics and Ticket summaries | `server/tests/lab-04/requester-dashboard.api.test.ts` | Pending |
| API-11 | API / Metrics | FR-09, BR-17, AC-13 | Open, in-progress, waiting, recently updated/resolved calculations and 30-day UTC boundary | Counts and ordered lists match seeded database queries at both sides of the boundary | `server/tests/lab-04/requester-dashboard.api.test.ts` | Pending |
| API-12 | API / Empty State | FR-09, BR-17, AC-13 | Requester with no Tickets or no recent matches | Zero counts and empty lists are returned | `server/tests/lab-04/requester-dashboard.api.test.ts` | Pending |
| AUTH-03 | Authorization | FR-10, BR-10, AC-15 | Requester denied access to staff dashboard | Returns 403 without leaking staff metrics | `server/tests/lab-04/staff-dashboard.api.test.ts` | Pending |
| API-13 | API / Metrics | FR-10, BR-11, AC-07 | All eight status counts, priorities, unassigned, current owner, recent Tickets, and current user's Actions Taken | Every metric matches direct database queries; response contains concise summaries only | `server/tests/lab-04/staff-dashboard.api.test.ts` | Pending |
| API-14 | API / Empty State | FR-10, BR-11 | Staff dashboard with zero matching Tickets and actions | Zero counts and empty recent lists are returned | `server/tests/lab-04/staff-dashboard.api.test.ts` | Pending |
| API-15 | API / Authorization | FR-11, AC-15 | Admin staff dashboard and optional account metrics | Admin receives staff data; optional role counts include active users only and are hidden from IT Staff | `server/tests/lab-04/staff-dashboard.api.test.ts` | Pending |
| API-16 | API / Safe Failure | FR-04, FR-05, AC-16 | Missing Ticket/action and action ID belonging to another Ticket | Safe 404 envelope; no internal details or unrelated action data | `server/tests/lab-04/actions-taken.api.test.ts` | Pending |
| UI-01 | UI Component | FR-10, AC-07 | Staff dashboard cards, status breakdown, recent list, and drill-down links | Labels/values render; links carry the expected filters; loading, empty, error, and retry states work | `client/tests/lab-04/StaffDashboard.test.tsx` | Pending |
| UI-02 | UI Component | FR-09, AC-02 | Requester dashboard lists, metric cards, and Ticket links | Only server-provided owned data is rendered; empty state and drill-downs work | `client/tests/lab-04/RequesterDashboard.test.tsx` | Pending |
| UI-03 | UI Component / Validation | FR-01, FR-03, FR-14, AC-03, AC-11 | Action form fields, date-time input, conditional note, save/cancel, and validation placement | All seven fields are present; follow-up note required conditionally; action time submitted as UTC | `client/tests/lab-04/ActionsTaken.test.tsx` | Pending |
| UI-04 | UI Component / Authorization | FR-04, FR-05, AC-14 | Requester read-only list versus staff create/edit controls | Requester sees all permitted action details and no write controls; staff can enter create/edit mode | `client/tests/lab-04/ActionsTaken.test.tsx` | Pending |
| UI-05 | UI Component / Conflict | FR-12, AC-18 | Recoverable API failure, duplicate click prevention, and stale update message | Entered form data is preserved when recoverable; stale response prompts refresh/reload | `client/tests/lab-04/ActionsTaken.test.tsx` | Pending |
| UI-06 | UI Component / Workflow | FR-06, FR-08, AC-05, AC-06 | Permitted status options and advisory-resolution feedback | Only permitted next states appear; status summary refreshes; advisory flag does not imply formal resolution | `client/tests/lab-04/TicketWorkflow.test.tsx` | Pending |
| STYLE-01 | UI Style / Accessibility | FR-13, AC-10 | Focus visibility, semantic names, non-color status cues, and shared Zen Green tokens | Controls are keyboard reachable and labeled; color is not the only status cue; tokens match `client/src/index.css` | `client/tests/lab-04/StaffDashboard.test.tsx` | Pending |
| RESP-01 | Responsive | FR-13, AC-10 | Staff and Requester dashboards at desktop/tablet/mobile sizes | No clipped/overlapping cards or page-level horizontal overflow | `client/tests/lab-04/StaffDashboard.test.tsx`; `client/tests/lab-04/RequesterDashboard.test.tsx` | Pending |
| RESP-02 | Responsive / Accessibility | FR-13, AC-10 | Actions Taken and workflow controls at desktop/tablet/mobile sizes | Fields and actions reflow, keyboard focus remains visible, and no horizontal page overflow occurs | `client/tests/lab-04/ActionsTaken.test.tsx`; `client/tests/lab-04/TicketWorkflow.test.tsx` | Pending |
| MIG-01 | Migration / Regression | BR-13, AC-09 | Apply migration to an isolated Lab 3 schema containing Users, Tickets, Attachments, Comments, and Notes | Existing rows and relations remain intact; legacy Tickets start with zero Actions Taken and remain viewable | `server/tests/lab-04/database-migration.test.ts` | Pending |
| MIG-02 | Migration / Recovery | BR-13 | Re-run `prisma migrate deploy` after successful Lab 4 migration | Deployment is a safe no-op and existing Lab 3 rows and Action Taken rows remain intact; recovery remains forward-only | `server/tests/lab-04/database-migration.test.ts` | Pending |
| MIG-03 | Migration / Relationship | BR-01, AC-01 | Create Actions Taken under a Ticket and read its parent and performer relations | Every row has exactly one valid Ticket and one valid User performer; one Ticket can have multiple actions | `server/tests/lab-04/database-migration.test.ts` | Pending |
| MIG-04 | Migration / Seed | BR-14 | Run the Lab 4 seed twice and compare seeded Action Taken counts | Second run succeeds without duplicates; zero/one/multiple-action Ticket cases remain available | `server/tests/lab-04/database-migration.test.ts` | Pending |
| PERF-01 | Performance-Smoke | FR-09–FR-11 | Request both dashboard endpoints over 500 Tickets and up to 2,000 Actions Taken | After one warm-up, each of five requests per endpoint completes within 1,000 ms; record durations and environment | `server/tests/lab-04/requester-dashboard.api.test.ts`; `server/tests/lab-04/staff-dashboard.api.test.ts` | Pending |
| REG-01 | Migration / Regression | FR-13, AC-17 | Existing authentication, password change, health/category, requester workflow, attachments, comments/notes, queue/detail, and Admin APIs/UI | Existing Labs 1–3 suites continue passing with role and ownership rules intact | `server/tests/lab-01/health.test.ts`; `server/tests/lab-01/categories.test.ts`; `server/tests/lab-02/tickets.test.ts`; `server/tests/lab-02/ticket-detail.test.ts`; `server/tests/lab-02/requesters.test.ts`; `server/tests/lab-02/my-tickets.test.ts`; `server/tests/lab-02/attachments.test.ts`; `server/tests/lab-03/auth.api.test.ts`; `server/tests/lab-03/requester-workflow.api.test.ts`; `server/tests/lab-03/comments-notes.api.test.ts`; `server/tests/lab-03/staff-queue.api.test.ts`; `server/tests/lab-03/staff-ticket-detail.api.test.ts`; `server/tests/lab-03/users-admin.api.test.ts`; `client/tests/lab-01/App.test.tsx`; `client/tests/lab-02/CreateTicketForm.test.tsx`; `client/tests/lab-02/MyTicketsList.test.tsx`; `client/tests/lab-02/TicketDetail.test.tsx`; `client/tests/lab-02/AttachmentLifecycle.test.tsx`; `client/tests/lab-03/Login.test.tsx`; `client/tests/lab-03/ChangePassword.test.tsx`; `client/tests/lab-03/RequesterWorkflow.test.tsx`; `client/tests/lab-03/StaffTicketDetail.test.tsx`; `client/tests/lab-03/StaffTicketQueue.test.tsx`; `client/tests/lab-03/UserManagement.test.tsx`; `e2e/lab-03/authentication.spec.ts`; `e2e/lab-03/staff-ticket-flow.spec.ts`; `e2e/lab-03/user-administration.spec.ts` | Pending |
| RESP-03 | Responsive / End-to-End | AC-10 | Open the staff/requester dashboards, Actions Taken, and workflow screens at 1280px, 768px, and 375px | No page-level horizontal overflow, clipped labels, or overlapping controls at any target width | `e2e/lab-04/dashboards.spec.ts`; `e2e/lab-04/actions-taken-flow.spec.ts`; `e2e/lab-04/ticket-resolution.spec.ts` | Pending |
| E2E-01 | End-to-End | FR-01–FR-05, AC-01, AC-03, AC-11, AC-14, AC-18 | Staff creates/edits an Action Taken; Requester views owned Ticket | Actor/date are correct, validation and conflict behavior are visible, Requester view stays read-only | `e2e/lab-04/actions-taken-flow.spec.ts` | Pending |
| E2E-02 | End-to-End / Workflow | FR-06–FR-08, AC-04–AC-06 | Requester advisory indication and staff formal status transitions | Requester cannot formally resolve; permitted staff transitions update the summary | `e2e/lab-04/ticket-resolution.spec.ts` | Pending |
| E2E-03 | End-to-End / Authorization | FR-09–FR-11, AC-02, AC-07, AC-13, AC-15 | Requester and staff/admin dashboards, drill-down, empty and forbidden states | Role sees only permitted metrics; links open correct filtered views and empty states are clear | `e2e/lab-04/dashboards.spec.ts` | Pending |

## Acceptance-Criterion Traceability

| Acceptance Criterion | Planned Test IDs | Test File Path(s) |
|---|---|---|
| AC-01 | API-01, MIG-03, E2E-01 | `server/tests/lab-04/actions-taken.api.test.ts`; `server/tests/lab-04/database-migration.test.ts`; `e2e/lab-04/actions-taken-flow.spec.ts` |
| AC-02 | API-10, UI-02, E2E-03 | `server/tests/lab-04/requester-dashboard.api.test.ts`; `client/tests/lab-04/RequesterDashboard.test.tsx`; `e2e/lab-04/dashboards.spec.ts` |
| AC-03 | UNIT-01, API-02, UI-03, E2E-01 | `server/tests/lab-04/actions-taken.api.test.ts`; `client/tests/lab-04/ActionsTaken.test.tsx`; `e2e/lab-04/actions-taken-flow.spec.ts` |
| AC-04 | AUTH-01, AUTH-02, E2E-02 | `server/tests/lab-04/actions-taken.api.test.ts`; `server/tests/lab-04/ticket-workflow.api.test.ts`; `e2e/lab-04/ticket-resolution.spec.ts` |
| AC-05 | UNIT-02, API-07, UI-06, E2E-02 | `server/tests/lab-04/ticket-workflow.api.test.ts`; `client/tests/lab-04/TicketWorkflow.test.tsx`; `e2e/lab-04/ticket-resolution.spec.ts` |
| AC-06 | API-08, UI-06, E2E-02 | `server/tests/lab-04/ticket-workflow.api.test.ts`; `client/tests/lab-04/TicketWorkflow.test.tsx`; `e2e/lab-04/ticket-resolution.spec.ts` |
| AC-07 | API-13, UI-01 | `server/tests/lab-04/staff-dashboard.api.test.ts`; `client/tests/lab-04/StaffDashboard.test.tsx` |
| AC-08 | API-05, API-09, UI-05, E2E-01 | `server/tests/lab-04/actions-taken.api.test.ts`; `server/tests/lab-04/ticket-workflow.api.test.ts`; `client/tests/lab-04/ActionsTaken.test.tsx`; `e2e/lab-04/actions-taken-flow.spec.ts` |
| AC-09 | MIG-01, MIG-02 | `server/tests/lab-04/database-migration.test.ts` |
| AC-10 | RESP-01, RESP-02, RESP-03, STYLE-01 | `client/tests/lab-04/StaffDashboard.test.tsx`; `client/tests/lab-04/RequesterDashboard.test.tsx`; `client/tests/lab-04/ActionsTaken.test.tsx`; `client/tests/lab-04/TicketWorkflow.test.tsx`; `e2e/lab-04/dashboards.spec.ts`; `e2e/lab-04/actions-taken-flow.spec.ts`; `e2e/lab-04/ticket-resolution.spec.ts` |
| AC-11 | API-01, UI-03, E2E-01 | `server/tests/lab-04/actions-taken.api.test.ts`; `client/tests/lab-04/ActionsTaken.test.tsx`; `e2e/lab-04/actions-taken-flow.spec.ts` |
| AC-12 | API-06 | `server/tests/lab-04/ticket-workflow.api.test.ts` |
| AC-13 | API-11, API-12, E2E-03 | `server/tests/lab-04/requester-dashboard.api.test.ts`; `e2e/lab-04/dashboards.spec.ts` |
| AC-14 | API-03, AUTH-01, UI-04, E2E-01 | `server/tests/lab-04/actions-taken.api.test.ts`; `client/tests/lab-04/ActionsTaken.test.tsx`; `e2e/lab-04/actions-taken-flow.spec.ts` |
| AC-15 | API-15, AUTH-03, E2E-03 | `server/tests/lab-04/staff-dashboard.api.test.ts`; `e2e/lab-04/dashboards.spec.ts` |
| AC-16 | API-16 | `server/tests/lab-04/actions-taken.api.test.ts` |
| AC-17 | REG-01 | All Lab 1–3 server, client, and E2E test-file paths listed in REG-01 above |
| AC-18 | API-04, API-05, UI-05, E2E-01 | `server/tests/lab-04/actions-taken.api.test.ts`; `client/tests/lab-04/ActionsTaken.test.tsx`; `e2e/lab-04/actions-taken-flow.spec.ts` |

## Test File Skeletons

Create the files below before implementation. The `it.todo` / `test.fixme` entries are placeholders, not passing evidence. Add assertions when the corresponding feature is implemented and update each Final status only after running it.

```text
server/tests/lab-04/
├── actions-taken.api.test.ts
├── ticket-workflow.api.test.ts
├── requester-dashboard.api.test.ts
├── staff-dashboard.api.test.ts
└── database-migration.test.ts (Issue 3 migration, recovery, and relationship coverage)
client/tests/lab-04/
├── StaffDashboard.test.tsx
├── RequesterDashboard.test.tsx
├── ActionsTaken.test.tsx
└── TicketWorkflow.test.tsx
e2e/lab-04/
├── actions-taken-flow.spec.ts
├── ticket-resolution.spec.ts
└── dashboards.spec.ts
```

## Final Results

Fill each table row's **Final** column with `Pass` or `Fail` only after running the complete planned suite on the integrated `main` branch. Attach the full command output and environment/commit identifier to Answer Part 3. If a planned test is intentionally deferred, state why and do not report it as passing.
