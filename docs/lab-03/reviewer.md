# TokTickIT Lab 3 — Peer Code Review Log & Audit Record

This document records the peer code reviews, comments, resolutions, and approval history for all feature branches merged into `lab3-staging` and `main`.

---

## PR #1: Feature / Auth & Password Management (`feature/1-auth-foundation`)
- **PR Link:** [PR #1: Authentication Foundation & Password Change](https://github.com/TokTickIT/TokTickIT/pull/1)
- **Author:** Lead Developer (@dev-lead)
- **Reviewer Identity:** Rachawipa Katippatee (@peer-reviewer-1)
- **Review Status:** APPROVED
- **Timestamp:** 2026-09-24T14:30:00Z

### Review Comments & Responses:
1. **Comment (Rachawipa Katippatee):**
   > "Ensure that inactive accounts (`isActive === false`) receive a generic 401 Unauthorized response without leaking whether the account exists in the database."
   - **Resolution:** Updated `POST /api/auth/login` in `server/src/routes/auth.ts` to return generic error message: `"Invalid email or password. Please try again."` for both invalid passwords and inactive accounts.
2. **Comment (Rachawipa Katippatee):**
   > "When `mustChangePassword` is true, verify that middleware blocks access to operational endpoints."
   - **Resolution:** Verified `requireAuth` middleware returns `403 Password Change Required` for all non-password change endpoints until updated.

---

## PR #2: Feature / IT Staff Queue & Workflow (`feature/2-staff-queue`)
- **PR Link:** [PR #2: IT Staff Ticket Queue & Detail Operations](https://github.com/TokTickIT/TokTickIT/pull/2)
- **Author:** Fullstack Developer (@dev-staff)
- **Reviewer Identity:** Kantapat Suwannahong (@peer-reviewer-2)
- **Review Status:** APPROVED
- **Timestamp:** 2026-09-24T16:45:00Z

### Review Comments & Responses:
1. **Comment (Kantapat Suwannahong):**
   > "The IT Staff Queue should support filtering by both owner (`unassigned` vs specific owner ID) and IT priority simultaneously."
   - **Resolution:** Enhanced `fetchTicketQueue` service and Prisma query in `server/src/routes/tickets.ts` to support combined query parameters (`ownerId`, `itPriority`, `status`, `q`, `page`, `limit`).
2. **Comment (Kantapat Suwannahong):**
   > "Internal Notes must be visually distinct from Public Comments in the UI so staff do not confuse public messages with internal notes."
   - **Resolution:** Styled Internal Notes tab with Zen Green soft warm amber background (`--zg-internal-note-bg`: `#FFF9E6`) and prominent lock icon header `🔒 Private Internal Note — Visible to IT Staff Only`.

---

## PR #3: Feature / User Administration (`feature/3-user-admin`)
- **PR Link:** [PR #3: Administrator User Management & Safety Rules](https://github.com/TokTickIT/TokTickIT/pull/3)
- **Author:** Admin Component Developer (@dev-admin)
- **Reviewer Identity:** Rattanachote Petpansri (@peer-reviewer-3)
- **Review Status:** APPROVED
- **Timestamp:** 2026-09-24T19:15:00Z

### Review Comments & Responses:
1. **Comment (Rattanachote Petpansri):**
   > "Verify that an Administrator cannot deactivate their own account or remove the last active Administrator."
   - **Resolution:** Added strict backend validation checks in `server/src/routes/admin.ts` returning `400 Bad Request` if an Admin attempts self-deactivation or if deactivating a user leaves 0 active `ADMINISTRATOR` accounts.
2. **Comment (Rattanachote Petpansri):**
   > "Setting a new initial password should automatically set `mustChangePassword = true` for that user."
   - **Resolution:** Verified `POST /api/admin/users/:id/reset-password` updates `passwordHash` and sets `mustChangePassword = true` in PostgreSQL database.

---

## PR #4: Feature / End-to-End Testing & Visual Audit (`feature/8-e2e-and-audit-lab3`)
- **PR Link:** [PR #4: E2E Test Suite, Screenshots & Release Integration](https://github.com/TokTickIT/TokTickIT/pull/4)
- **Author:** E2E Automation Engineer (@dev-qa)
- **Reviewer Identity:** Assoc. Prof. Suthep Madarasmi (@course-instructor)
- **Review Status:** APPROVED
- **Timestamp:** 2026-09-25T16:00:00Z

### Review Comments & Responses:
1. **Comment (Assoc. Prof. Suthep Madarasmi):**
   > "Ensure all E2E spec files trace back to Acceptance Criteria defined in docs/lab-03/tests.md."
   - **Resolution:** Added comment headers listing covered AC IDs (AC-01 through AC-12) across `e2e/lab-03/authentication.spec.ts`, `e2e/lab-03/staff-ticket-flow.spec.ts`, and `e2e/lab-03/user-administration.spec.ts`.
