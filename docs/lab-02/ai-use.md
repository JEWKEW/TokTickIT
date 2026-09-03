# Lab 2 — AI Use and Reflection

**LLM/agent used:** Gemini 3.6 Flash (Antigravity AI Assistant)

## Selected Key Prompts (Lab 02 Features)

| # | Prompt (Summarised) | What I Did with the Result |
|---|---|---|
| 1 | Create Lab 02 documentation files (`specification.md`, `api-spec.md`, `ui-spec.md`, `tests.md`) covering business rules BR-01 to BR-08 and API contracts. | Verified business rules, REST endpoint schemas, Given-When-Then acceptance criteria, and Zen Green styling guidelines. |
| 2 | Define Prisma database schema for `RequesterUser`, `Ticket`, `Attachment`, `Category`, and `RelatedSystem` with idempotent seeding logic. | Generated Prisma migrations, executed `prisma db seed`, and verified multi-run idempotency without duplicate key errors. |
| 3 | Implement Dev Requester User Context selection API (`GET /api/requesters`, `GET /api/users/dev-list`) and frontend context selector modal/dropdown. | Built navbar selector component with `isActive = true` filtering and `x-user-id` HTTP header propagation. |
| 4 | Implement `CreateTicketForm` component and `POST /api/tickets` REST endpoint with Multer file upload handling and field validation. | Added ticket code auto-generation (`TKT-YYYY-XXXXXX`), file type/size validation (5MB max, JPG/PNG/WEBP/PDF), and Vitest/Supertest test coverage. |
| 5 | Implement paginated "My Tickets" dashboard endpoint (`GET /api/tickets/my`) and frontend dashboard table/card view with debounced search and filters. | Verified requester data isolation, search debouncing, category/priority/status filters, and responsive layout switching. |
| 6 | Implement read-only Ticket Detail endpoint (`GET /api/tickets/:id`) with strict requester ownership checks (403 Forbidden). | Verified security scoping, read-only metadata display, status pills, and error handling for unauthorized access. |
| 7 | Implement file attachment lifecycle features (`POST /api/tickets/:id/attachments`, `GET /api/attachments/:id/download`, `DELETE /api/tickets/:id/attachments/:attachmentId`). | Verified active attachment limit (max 3), soft removal (`isRemoved = true`, audit reason), download restriction for removed files, and modal confirmation UI. |
| 8 | Build Playwright E2E test suite (`e2e/requester-ticket-flow.spec.ts`) and generate responsive visual audit screenshots across Desktop, Tablet, and Mobile viewports. | Ran E2E suite, verified layout overflow checks, verified Zen Green CSS tokens, and saved screenshot evidence under `artifacts/lab-02/screenshots/`. |
| 9 | Validate feature branch merge completion into `lab2-staging` and execute full clean test suites across server, client, and Playwright. | Verified 0 unmerged commits across feature branches 1-8, confirmed 36 server tests, 32 client tests, and 1 E2E flow passed with 100% pass rate. |
| 10 | Populate peer review record (`reviewer.md`), AI reflection log (`ai-use.md`), update `README.md`, and open the release PR from `lab2-staging` to `main`. | Generated complete lab documentation, verified instructions in README, and opened release PR #27. |

## Reflection

Using an AI pair programmer throughout Lab 02 accelerated contract design, database schema modeling, and full-stack component construction. Providing explicit file paths, precise business rules (e.g., BR-01 to BR-08), and pre-defined test matrices allowed the AI assistant to produce type-safe, production-ready code with minimal iteration.

Key takeaways and adjustments made during development:
1. **Security & Data Scoping**: Explicitly instructing the AI to enforce `x-user-id` header validation across all ticket and attachment endpoints ensured strict requester data isolation (preventing unauthorized cross-requester access via HTTP 403 Forbidden).
2. **Attachment Soft Removal**: Auditing file removal logic led to storing removal metadata (`isRemoved = true`, `removedAt`, `removalReason`) while preserving file records for auditability while blocking actual file downloads on soft-removed items.
3. **Responsive Visual Testing**: Automating Playwright viewports across 1280px (Desktop), 768px (Tablet), and 375px (Mobile) caught container overflow edge cases early, verifying the Zen Green color palette tokens (`--zg-primary: #006b3c`) consistently across all breakpoints.
