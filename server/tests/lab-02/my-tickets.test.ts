import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import * as prismaModule from "../../src/prisma.js";

describe("GET /api/tickets - My Tickets Listing & Data Isolation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 401 Unauthorized if x-user-id header is missing", async () => {
    const res = await request(app).get("/api/tickets");

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

    const res = await request(app).get("/api/tickets").set("x-user-id", "999");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("returns paginated ticket list for the requesting user with metadata", async () => {
    const mockTickets = [
      {
        id: 1,
        ticketNumber: "TKT-2026-000001",
        summary: "VPN is broken",
        description: "Cannot connect from home",
        requestedPriority: "High",
        currentStatus: "New",
        requesterId: 1,
        categoryId: 1,
        relatedSystemId: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        category: { id: 1, name: "Account and Access" },
        relatedSystem: { id: 1, name: "Email" },
        attachments: [],
        requester: { id: 1, name: "Alice Johnson", email: "alice@toktickit.io" },
      },
    ];

    const mockPrisma = {
      requesterUser: {
        findUnique: vi.fn().mockResolvedValue({
          id: 1,
          name: "Alice Johnson",
          email: "alice@toktickit.io",
          isActive: true,
        }),
      },
      ticket: {
        findMany: vi.fn().mockResolvedValue(mockTickets),
        count: vi.fn().mockResolvedValue(1),
      },
    };
    vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

    const res = await request(app)
      .get("/api/tickets?page=1&limit=10")
      .set("x-user-id", "1");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].ticketNumber).toBe("TKT-2026-000001");
    expect(res.body.data.meta).toEqual({
      currentPage: 1,
      limit: 10,
      totalItems: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    });
  });

  it("filters tickets by search, categoryId, priority, and status query parameters", async () => {
    const mockPrisma = {
      requesterUser: {
        findUnique: vi.fn().mockResolvedValue({
          id: 1,
          name: "Alice Johnson",
          email: "alice@toktickit.io",
          isActive: true,
        }),
      },
      ticket: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
      },
    };
    vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

    const res = await request(app)
      .get("/api/tickets?search=VPN&categoryId=2&priority=High&status=New")
      .set("x-user-id", "1");

    expect(res.status).toBe(200);
    expect(mockPrisma.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          requesterId: 1,
          categoryId: 2,
          requestedPriority: expect.objectContaining({ equals: "High", mode: "insensitive" }),
          currentStatus: expect.objectContaining({ equals: "New", mode: "insensitive" }),
          OR: expect.arrayContaining([
            { summary: { contains: "VPN", mode: "insensitive" } },
            { ticketNumber: { contains: "VPN", mode: "insensitive" } },
          ]),
        }),
      })
    );
  });

  it("verifies strict data isolation between requesters", async () => {
    const user1Tickets = [
      {
        id: 10,
        ticketNumber: "TKT-2026-000010",
        summary: "Alice's Issue",
        requesterId: 1,
        requestedPriority: "Low",
        currentStatus: "New",
        category: { id: 1, name: "General" },
        relatedSystem: { id: 1, name: "System A" },
        attachments: [],
      },
    ];

    const user2Tickets = [
      {
        id: 20,
        ticketNumber: "TKT-2026-000020",
        summary: "Bob's Confidential Ticket",
        requesterId: 2,
        requestedPriority: "Urgent",
        currentStatus: "In Progress",
        category: { id: 2, name: "Security" },
        relatedSystem: { id: 2, name: "System B" },
        attachments: [],
      },
    ];

    const mockPrisma = {
      requesterUser: {
        findUnique: vi.fn().mockImplementation(async ({ where }) => {
          if (where.id === 1) return { id: 1, name: "Alice Johnson", isActive: true };
          if (where.id === 2) return { id: 2, name: "Bob Smith", isActive: true };
          return null;
        }),
      },
      ticket: {
        findMany: vi.fn().mockImplementation(async ({ where }) => {
          if (where.requesterId === 1) return user1Tickets;
          if (where.requesterId === 2) return user2Tickets;
          return [];
        }),
        count: vi.fn().mockImplementation(async ({ where }) => {
          if (where.requesterId === 1) return user1Tickets.length;
          if (where.requesterId === 2) return user2Tickets.length;
          return 0;
        }),
      },
    };
    vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

    // Request for User 1 (Alice)
    const res1 = await request(app).get("/api/tickets").set("x-user-id", "1");
    expect(res1.status).toBe(200);
    expect(res1.body.data.items).toHaveLength(1);
    expect(res1.body.data.items[0].summary).toBe("Alice's Issue");

    // Request for User 2 (Bob)
    const res2 = await request(app).get("/api/tickets").set("x-user-id", "2");
    expect(res2.status).toBe(200);
    expect(res2.body.data.items).toHaveLength(1);
    expect(res2.body.data.items[0].summary).toBe("Bob's Confidential Ticket");

    // Ensure findMany was strictly called with requesterId 1 and 2 respectively
    expect(mockPrisma.ticket.findMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ where: expect.objectContaining({ requesterId: 1 }) })
    );
    expect(mockPrisma.ticket.findMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ where: expect.objectContaining({ requesterId: 2 }) })
    );
  });
});
