# Lab 4 Accessibility and Responsive Verification

This checklist records local Issue 10 verification against the Lab 4 handout. Browser checks used Chromium at 1280px (desktop), 768px (tablet), and 375px (mobile). The checklist is linked from `ui-spec.md` §5.

| Check | Result | Evidence |
|---|---|---|
| Zen Green tokens and active page indication | Pass | E2E verifies the `#006039` primary token and navbar color; dashboard test verifies `aria-current="page"`. |
| Dashboard cards and drill-downs | Pass | Requester and staff dashboard tests verify accessible button names, text labels for metrics/statuses, and drill-down behavior. |
| Visible keyboard focus | Pass | A global `:focus-visible` outline uses the Zen Green primary token; browser tests tab through dashboard controls and Actions Taken fields and verify the visible focus indicator. |
| Actions Taken semantics and validation | Pass | Named form, associated labels, error summary, and field-linked `aria-invalid` / `aria-describedby` are checked by UI and browser tests. |
| Editable versus read-only fields | Pass | Staff can create/edit Actions Taken; requester Actions Taken controls are absent. Workflow tests confirm Requesters cannot edit formal status. |
| Status and priority cues do not rely on color alone | Pass | Status and priority badges retain their visible text; browser assertions verify the status labels and counts. |
| Private versus shared content | Pass | Internal Notes are marked with a lock and a warning identifying them as private; the browser test distinguishes this from the named Public Comment form. |
| Attachment-removal dialog accessibility | Pass | The dialog has a name and modal semantics, a labeled reason field, initial focus, Tab trapping, Escape close, and focus return to the opener; verified in the Requester Ticket Flow E2E test. |
| Desktop/tablet/mobile dashboard layout | Pass | Staff and Requester dashboards tested at 1280px, 768px, and 375px. No horizontal page overflow, clipped interactive controls, or overlapping controls found. |
| Desktop/tablet/mobile Actions Taken and workflow layout | Pass | Ticket Detail, Actions Taken, and status workflow tested at the same widths. No horizontal page overflow, clipped interactive controls, or overlapping controls found. |
| Form labels and attachments/comments controls | Pass | Ticket Detail status, owner, priority, resolution, comments, internal notes, and attachment controls have associated or visually hidden labels. |

## Local test evidence

- Client suite: 32 test files, 156 passed.
- Lab 4 accessibility/responsive browser suite: 10 passed.
- Requester Ticket Flow browser test, including the attachment dialog focus checks: 1 passed.
- Full Chromium browser regression suite across Labs 2–4: 18 passed. Legacy screenshot output is routed into `artifacts/lab-04/screenshots/regression/`.
- Client TypeScript and production build: passed.
- Server TypeScript build: passed; server test suite: 301 passed, 1 opt-in migration integration test skipped because no disposable migration-test URL was configured.

The full planned Lab 4 regression suite still needs to run on integrated `main`; the **Final** columns in `tests.md` remain Pending until that requirement is met.
