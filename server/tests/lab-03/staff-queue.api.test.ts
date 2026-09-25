import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import * as prismaModule from "../../src/prisma.js";

describe("Lab 03 IT Staff Ticket Queue Integration Tests (GET /api/tickets/queue)", () => {
  const staffUser = {
    id: 3,
    name: "Michael Support",
    email: "msupport@toktickit.com",
    role: "IT_STAFF",
    mustChangePassword: false,
    isActive: true,
  };

  const adminUser = {
    id: 10,
    name: "System Admin",
    email: "admin@toktickit.com",
    role: "ADMINISTRATOR",
    mustChangePassword: false,
    isActive: true,
  };

  const requesterUser = {
    id: 1,
    name: "Jennifer Anderson",
    email: "jandersson@toktickit.com",
    role: "REQUESTER",
    mustChangePassword: false,
    isActive: true,
  };

  const mockTickets = [
    {
      id: 101,
      ticketNumber: "TKT-2026-000101",
      createdAt: new Date("2026-09-18T10:00:00Z"),
      updatedAt: new Date("2026-09-18T10:00:00Z"),
      summary: "Laptop screen flickering",
      description: "Display keeps flickering randomly",
      requestedPriority: "High",
      itPriority: "High",
      currentStatus: "Open",
      requesterId: 1,
      ownerId: 3,
      categoryId: 1,
      relatedSystemId: 1,
      category: { id: 1, name: "Hardware" },
      relatedSystem: { id: 1, name: "Workstation" },
      requester: { id: 1, name: "Jennifer Anderson", email: "jandersson@toktickit.com" },
      owner: { id: 3, name: "Michael Support", email: "msupport@toktickit.com" },
      requesterResolvedIndicated: false,
    },
    {
      id: 102,
      ticketNumber: "TKT-2026-000102",
      createdAt: new Date("2026-09-18T11:00:00Z"),
      updatedAt: new Date("2026-09-18T11:00:00Z"),
      summary: "VPN Connection Error",
      description: "Unable to authenticate with radius server",
      requestedPriority: "Medium",
      itPriority: "Medium",
      currentStatus: "New",
      requesterId: 2,
      ownerId: null,
      categoryId: 2,
      relatedSystemId: 2,
      category: { id: 2, name: "Network" },
      relatedSystem: { id: 2, name: "Global VPN" },
      requester: { id: 2, name: "Bob Smith", email: "bsmith@toktickit.com" },
      owner: null,
      requesterResolvedIndicated: false,
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("TC-API-QUEUE-01: IT Staff retrieves default paginated ticket queue across all requesters", async () => {
    const mockPrisma = {
      user: {
        findUnique: vi.fn().mockImplementation(({ where }) => {
          if (where.id === 3) return Promise.resolve(staffUser);
          return Promise.resolve(null);
        }),
      },
      ticket: {
        findMany: vi.fn().mockResolvedValue(mockTickets),
        count: vi.fn().mockResolvedValue(2),
      },
    };

    vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

    const res = await request(app)
      .get("/api/tickets/queue")
      .set("x-user-id", "3");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toHaveLength(2);
    expect(res.body.data.meta).toEqual(
      expect.objectContaining({
        currentPage: 1,
        totalItems: 2,
        totalPages: 1,
      })
    );
  });

  it("TC-API-QUEUE-02: Filters queue by keyword search (q=Laptop) and status (Open)", async () => {
    const filteredTickets = [mockTickets[0]];

    const mockPrisma = {
      user: {
        findUnique: vi.fn().mockImplementation(({ where }) => {
          if (where.id === 3) return Promise.resolve(staffUser);
          return Promise.resolve(null);
        }),
      },
      ticket: {
        findMany: vi.fn().mockResolvedValue(filteredTickets),
        count: vi.fn().mockResolvedValue(1),
      },
    };

    vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

    const res = await request(app)
      .get("/api/tickets/queue?q=Laptop&status=Open")
      .set("x-user-id", "3");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].summary).toBe("Laptop screen flickering");

    expect(mockPrisma.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { ticketNumber: { contains: "Laptop", mode: "insensitive" } },
            { summary: { contains: "Laptop", mode: "insensitive" } },
          ],
          currentStatus: { equals: "Open", mode: "insensitive" },
        }),
      })
    );
  });

  it("TC-API-QUEUE-03: Filters queue by unassigned owner (ownerId=unassigned) and IT priority (Medium)", async () => {
    const filteredTickets = [mockTickets[1]];

    const mockPrisma = {
      user: {
        findUnique: vi.fn().mockImplementation(({ where }) => {
          if (where.id === 3) return Promise.resolve(staffUser);
          return Promise.resolve(null);
        }),
      },
      ticket: {
        findMany: vi.fn().mockResolvedValue(filteredTickets),
        count: vi.fn().mockResolvedValue(1),
      },
    };

    vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

    const res = await request(app)
      .get("/api/tickets/queue?ownerId=unassigned&itPriority=Medium")
      .set("x-user-id", "3");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items[0].owner).toBeNull();
    expect(mockPrisma.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          ownerId: null,
          itPriority: { equals: "Medium", mode: "insensitive" },
        }),
      })
    );
  });

  it("TC-API-QUEUE-04: Supports sorting (sortBy=ticketNumber, sortOrder=asc) and pagination (page=2, limit=5)", async () => {
    const mockPrisma = {
      user: {
        findUnique: vi.fn().mockImplementation(({ where }) => {
          if (where.id === 10) return Promise.resolve(adminUser);
          return Promise.resolve(null);
        }),
      },
      ticket: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(12),
      },
    };

    vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

    const res = await request(app)
      .get("/api/tickets/queue?sortBy=ticketNumber&sortOrder=asc&page=2&limit=5")
      .set("x-user-id", "10");

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.meta.currentPage).toBe(2);
    expect(res.body.data.meta.totalPages).toBe(3);

    expect(mockPrisma.ticket.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { ticketNumber: "asc" },
        skip: 5,
        take: 5,
      })
    );
  });

  it("TC-API-QUEUE-05: Returns 403 Forbidden when Requester user attempts to view queue", async () => {
    const mockPrisma = {
      user: {
        findUnique: vi.fn().mockImplementation(({ where }) => {
          if (where.id === 1) return Promise.resolve(requesterUser);
          return Promise.resolve(null);
        }),
      },
    };

    vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

    const res = await request(app)
      .get("/api/tickets/queue")
      .set("x-user-id", "1");

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("FORBIDDEN");
    expect(res.body.error.message).toMatch(/Access denied/i);
  });

  it("TC-API-QUEUE-06: Returns 401 Unauthorized when no authentication credentials provided", async () => {
    const res = await request(app).get("/api/tickets/queue");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });
});
