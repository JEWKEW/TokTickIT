# Lab 1 — Test Plan and Evidence

All test files live under `server/tests/lab-01/` and `client/tests/lab-01/`.

| # | Tool | Test | Result |
|---|------|------|--------|
| 1 | Supertest | GET /api/health returns 200, status=ok and service name | PASS |
| 2 | Supertest | GET /api/categories returns 4 seeded categories in id order | PASS |
| 3 | Vitest | Renders the TokTickIT heading | PASS |
| 4 | Vitest | Shows loading state when button is clicked | PASS |
| 5 | Vitest | Success state shows Online + category list | PASS |
| 6 | Vitest | Error state shows Offline + message | PASS |

### Test Execution Summary
- **Server Tests (`server/tests/lab-01/`):** 2 passed (2 total)
- **Client Tests (`client/tests/lab-01/`):** 4 passed (4 total)
