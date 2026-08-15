# Lab 1 — AI Use and Reflection

**LLM/agent used:** Gemini 3.6 Flash (Antigravity AI Assistant)

## Selected key prompts (6–10)
| # | Prompt (summarised) | What I did with the result |
|---|---------------------|----------------------------|
| 1 | Set up project foundation for Express server and Vite React client with TypeScript. | Verified folder structure, installed dependencies, and initialized dev scripts. |
| 2 | Create `GET /api/health` endpoint returning `{ status: "ok", service: "TokTickIT API" }`. | Implemented route in `src/app.ts` and confirmed endpoint response format. |
| 3 | Write Supertest suite for `/api/health` verifying 200 response and JSON payload. | Added `server/tests/lab-01/health.test.ts` and executed `npm test`. |
| 4 | Define Prisma schema for Category and seed 4 categories: Account and Access, Hardware, Software, Network. | Ran Prisma migration and seed script to populate database. |
| 5 | Implement `GET /api/categories` endpoint returning categories sorted by ID. | Added route handler in server and verified database query ordering. |
| 6 | Write Supertest test verifying `GET /api/categories` returns 4 seeded categories in ID order. | Added `server/tests/lab-01/categories.test.ts` and ensured test passes. |
| 7 | Create frontend component with "Check System" button displaying loading, online/offline status, and category list. | Built React UI state in `src/App.tsx` with async API integration. |
| 8 | Write Vitest tests for App component covering initial render, loading state, success state, and API error state. | Added `client/tests/lab-01/App.test.tsx` and ran frontend test suite. |

## Reflection
Providing clear project context and explicit file structures significantly improved the accuracy and quality of generated code. I had to manually correct the category query logic to ensure explicit ascending ordering by ID (`orderBy: { id: 'asc' }`) so it satisfied the test suite requirement.
