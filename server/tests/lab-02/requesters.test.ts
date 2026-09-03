import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import * as prismaModule from "../../src/prisma.js";

describe("GET /api/requesters", () => {
  it("returns only active requesters (isActive = true) in id order", async () => {
    const res = await request(app).get("/api/requesters");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    // All returned requesters must have isActive = true
    res.body.forEach((r: { isActive: boolean }) => {
      expect(r.isActive).toBe(true);
    });

    // Check that inactive user "Evan Wright" is excluded
    const names = res.body.map((r: { name: string }) => r.name);
    expect(names).toContain("Alice Johnson");
    expect(names).toContain("Bob Smith");
    expect(names).toContain("Charlie Davis");
    expect(names).toContain("Diana Prince");
    expect(names).not.toContain("Evan Wright");

    // Verify IDs are sorted in ascending order
    const ids = res.body.map((r: { id: number }) => r.id);
    const sortedIds = [...ids].sort((a, b) => a - b);
    expect(ids).toEqual(sortedIds);
  });

  it("returns 500 if database query fails", async () => {
    const mockPrisma = {
      requesterUser: {
        findMany: vi.fn().mockRejectedValue(new Error("DB connection error")),
      },
    };
    vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

    const res = await request(app).get("/api/requesters");
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: "Unable to retrieve requesters" });

    vi.restoreAllMocks();
  });

  it("GET /api/users/dev-list returns 200 OK with active requesters list", async () => {
    const res = await request(app).get("/api/users/dev-list");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
