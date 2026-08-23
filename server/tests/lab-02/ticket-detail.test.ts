import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import * as prismaModule from "../../src/prisma.js";

describe("GET /api/tickets/:id - Ticket Detail & Security Enforcement", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 401 Unauthorized if x-user-id header is missing", async () => {
    const res = await request(app).get("/api/tickets/1");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 401 Unauthorized if requester does not exist or is inactive", async () => {
    const mockPrisma = {
      requesterUser: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    };
    vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

    const res = await request(app).get("/api/tickets/1").set("x-user-id", "999");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 Bad Request for non-numeric ticket ID", async () => {
    const mockPrisma = {
      requesterUser: {
        findUnique: vi.fn().mockResolvedValue({ id: 1, name: "Alice", isActive: true }),
      },
    };
    vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

    const res = await request(app).get("/api/tickets/abc").set("x-user-id", "1");

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 404 Not Found if ticket does not exist", async () => {
    const mockPrisma = {
      requesterUser: {
        findUnique: vi.fn().mockResolvedValue({ id: 1, name: "Alice", isActive: true }),
      },
      ticket: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    };
    vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

    const res = await request(app).get("/api/tickets/9999").set("x-user-id", "1");

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("returns 403 Forbidden if ticket belongs to another requester", async () => {
    const mockTicketOwnedByBob = {
      id: 42,
      ticketNumber: "TKT-2026-000042",
      summary: "Bob's Confidential Ticket",
      description: "Private issue",
      requestedPriority: "Urgent",
      currentStatus: "Open",
      requesterId: 2, // Owned by Bob (User 2)
      categoryId: 1,
      relatedSystemId: 1,
      category: { id: 1, name: "General" },
      relatedSystem: { id: 1, name: "System A" },
      requester: { id: 2, name: "Bob Smith", email: "bob@toktickit.io" },
      attachments: [],
    };

    const mockPrisma = {
      requesterUser: {
        findUnique: vi.fn().mockResolvedValue({ id: 1, name: "Alice Johnson", isActive: true }), // Alice (User 1)
      },
      ticket: {
        findUnique: vi.fn().mockResolvedValue(mockTicketOwnedByBob),
      },
    };
    vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

    // Alice tries to access Bob's ticket
    const res = await request(app).get("/api/tickets/42").set("x-user-id", "1");

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("FORBIDDEN");
    expect(res.body.error.message).toMatch(/permission/i);
  });

  it("returns 200 OK with full ticket details when requested by ticket owner", async () => {
    const mockTicketOwnedByAlice = {
      id: 12,
      ticketNumber: "TKT-2026-000012",
      summary: "VPN Connection Error",
      description: "Cannot connect to corporate VPN from home network",
      requestedPriority: "High",
      currentStatus: "New",
      requesterId: 1, // Owned by Alice
      categoryId: 4,
      relatedSystemId: 2,
      createdAt: "2026-08-20T14:45:00.000Z",
      updatedAt: "2026-08-20T14:45:00.000Z",
      category: { id: 4, name: "Network" },
      relatedSystem: { id: 2, name: "VPN Service" },
      requester: { id: 1, name: "Alice Johnson", email: "alice@toktickit.io" },
      attachments: [
        {
          id: 101,
          originalFileName: "logs.txt",
          storedFileName: "12345-logs.txt",
          fileSize: 153600,
          mimeType: "text/plain",
          createdAt: "2026-08-20T14:45:00.000Z",
        },
      ],
    };

    const mockPrisma = {
      requesterUser: {
        findUnique: vi.fn().mockResolvedValue({ id: 1, name: "Alice Johnson", isActive: true }),
      },
      ticket: {
        findUnique: vi.fn().mockResolvedValue(mockTicketOwnedByAlice),
      },
    };
    vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

    const res = await request(app).get("/api/tickets/12").set("x-user-id", "1");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(12);
    expect(res.body.data.ticketNumber).toBe("TKT-2026-000012");
    expect(res.body.data.summary).toBe("VPN Connection Error");
    expect(res.body.data.category.name).toBe("Network");
    expect(res.body.data.attachments).toHaveLength(1);
  });
});
