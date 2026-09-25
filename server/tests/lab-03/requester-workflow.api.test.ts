import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import * as prismaModule from "../../src/prisma.js";

describe("Lab 03 Requester Flows & Security Endpoints", () => {
  const requesterUser = {
    id: 1,
    name: "Jennifer Anderson",
    email: "jandersson@toktickit.com",
    role: "REQUESTER",
    mustChangePassword: false,
    isActive: true,
  };

  const otherUser = {
    id: 2,
    name: "Bob Smith",
    email: "bsmith@toktickit.com",
    role: "REQUESTER",
    mustChangePassword: false,
    isActive: true,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // BR-04 & BR-06: Ticket Creation Session Ownership & Priority Default
  // ---------------------------------------------------------------------------
  describe("POST /api/tickets - Session Ownership Integrity (BR-04 & BR-06)", () => {
    it("derives requester identity strictly from authenticated session, ignoring body requesterId", async () => {
      const mockCategory = { id: 1, name: "Hardware" };
      const mockSystem = { id: 1, name: "Workstation" };

      const mockCreatedTicket = {
        id: 101,
        ticketNumber: "TKT-2026-000101",
        requesterId: 1, // Must be 1 (from session header x-user-id: 1), ignoring body requesterId: 999
        categoryId: 1,
        relatedSystemId: 1,
        summary: "Monitor flickering",
        description: "Display blinks randomly",
        requestedPriority: "High",
        itPriority: "High",
        currentStatus: "New",
        requester: { id: 1, name: "Jennifer Anderson", email: "jandersson@toktickit.com" },
        category: mockCategory,
        relatedSystem: mockSystem,
        attachments: [],
      };

      const mockPrisma = {
        user: {
          findUnique: vi.fn().mockImplementation(({ where }) => {
            if (where.id === 1) return Promise.resolve(requesterUser);
            return Promise.resolve(null);
          }),
        },
        category: {
          findUnique: vi.fn().mockResolvedValue(mockCategory),
        },
        relatedSystem: {
          findUnique: vi.fn().mockResolvedValue(mockSystem),
        },
        ticket: {
          count: vi.fn().mockResolvedValue(0),
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue(mockCreatedTicket),
        },
      };

      vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

      const res = await request(app)
        .post("/api/tickets")
        .set("x-user-id", "1")
        .field("categoryId", "1")
        .field("relatedSystemId", "1")
        .field("requestedPriority", "High")
        .field("summary", "Monitor flickering")
        .field("description", "Display blinks randomly")
        .field("requesterId", "999"); // Attacker attempting spoofing

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(mockPrisma.ticket.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            requesterId: 1, // Derived strictly from session (1), NOT 999
            itPriority: "High", // BR-06: itPriority set to requestedPriority
          }),
        })
      );
    });
  });

  // ---------------------------------------------------------------------------
  // BR-05: Indicate Problem Appears Resolved
  // ---------------------------------------------------------------------------
  describe("PATCH /api/tickets/:id/indicate-resolved (BR-05)", () => {
    it("allows requester to indicate problem is resolved on owned ticket", async () => {
      const mockTicket = {
        id: 12,
        ticketNumber: "TKT-2026-000012",
        requesterId: 1,
        summary: "VPN Login Error",
        requesterResolvedIndicated: false,
      };

      const mockUpdatedTicket = {
        ...mockTicket,
        requesterResolvedIndicated: true,
        requesterResolvedAt: new Date("2026-09-18T10:00:00Z"),
      };

      const mockPrisma = {
        user: {
          findUnique: vi.fn().mockImplementation(({ where }) => {
            if (where.id === 1) return Promise.resolve(requesterUser);
            return Promise.resolve(null);
          }),
        },
        ticket: {
          findUnique: vi.fn().mockResolvedValue(mockTicket),
          update: vi.fn().mockResolvedValue(mockUpdatedTicket),
        },
      };

      vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

      const res = await request(app)
        .patch("/api/tickets/12/indicate-resolved")
        .set("x-user-id", "1");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.requesterResolvedIndicated).toBe(true);
      expect(res.body.data.requesterResolvedAt).toBeDefined();
    });

    it("rejects resolution indication if ticket belongs to another requester", async () => {
      const mockTicketOwnedByOther = {
        id: 15,
        ticketNumber: "TKT-2026-000015",
        requesterId: 2, // Owned by Bob (User 2)
      };

      const mockPrisma = {
        user: {
          findUnique: vi.fn().mockImplementation(({ where }) => {
            if (where.id === 1) return Promise.resolve(requesterUser);
            return Promise.resolve(null);
          }),
        },
        ticket: {
          findUnique: vi.fn().mockResolvedValue(mockTicketOwnedByOther),
        },
      };

      vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

      const res = await request(app)
        .patch("/api/tickets/15/indicate-resolved")
        .set("x-user-id", "1"); // User 1 attempting to update User 2's ticket

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });
  });

  // ---------------------------------------------------------------------------
  // BR-09: Public Comments
  // ---------------------------------------------------------------------------
  describe("Public Comments API (GET & POST /api/tickets/:id/comments - BR-09)", () => {
    it("allows requester to post a public comment on owned ticket", async () => {
      const mockTicket = { id: 12, requesterId: 1 };
      const mockComment = {
        id: 101,
        ticketId: 12,
        authorId: 1,
        content: "Thank you for the update!",
        createdAt: new Date("2026-09-18T10:30:00Z"),
        author: { id: 1, name: "Jennifer Anderson", role: "REQUESTER" },
      };

      const mockPrisma = {
        user: {
          findUnique: vi.fn().mockImplementation(({ where }) => {
            if (where.id === 1) return Promise.resolve(requesterUser);
            return Promise.resolve(null);
          }),
        },
        ticket: {
          findUnique: vi.fn().mockResolvedValue(mockTicket),
        },
        publicComment: {
          create: vi.fn().mockResolvedValue(mockComment),
        },
      };

      vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

      const res = await request(app)
        .post("/api/tickets/12/comments")
        .set("x-user-id", "1")
        .send({ content: "Thank you for the update!" });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe("Thank you for the update!");
      expect(res.body.data.author.name).toBe("Jennifer Anderson");
    });

    it("rejects empty or whitespace-only public comment", async () => {
      const mockTicket = { id: 12, requesterId: 1 };
      const mockPrisma = {
        user: {
          findUnique: vi.fn().mockImplementation(({ where }) => {
            if (where.id === 1) return Promise.resolve(requesterUser);
            return Promise.resolve(null);
          }),
        },
        ticket: {
          findUnique: vi.fn().mockResolvedValue(mockTicket),
        },
      };

      vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

      const res = await request(app)
        .post("/api/tickets/12/comments")
        .set("x-user-id", "1")
        .send({ content: "   " });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("allows requester to list public comments on owned ticket", async () => {
      const mockTicket = { id: 12, requesterId: 1 };
      const mockComments = [
        {
          id: 101,
          ticketId: 12,
          authorId: 1,
          content: "Initial comment",
          createdAt: new Date("2026-09-18T10:00:00Z"),
          author: { id: 1, name: "Jennifer Anderson", role: "REQUESTER" },
        },
      ];

      const mockPrisma = {
        user: {
          findUnique: vi.fn().mockImplementation(({ where }) => {
            if (where.id === 1) return Promise.resolve(requesterUser);
            return Promise.resolve(null);
          }),
        },
        ticket: {
          findUnique: vi.fn().mockResolvedValue(mockTicket),
        },
        publicComment: {
          findMany: vi.fn().mockResolvedValue(mockComments),
        },
      };

      vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

      const res = await request(app)
        .get("/api/tickets/12/comments")
        .set("x-user-id", "1");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------------------
  // BR-10: Internal Notes Restriction for Requesters
  // ---------------------------------------------------------------------------
  describe("Internal Notes Access Control (BR-10)", () => {
    it("returns 403 Forbidden when Requester attempts GET /api/tickets/:id/internal-notes", async () => {
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
        .get("/api/tickets/12/internal-notes")
        .set("x-user-id", "1");

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
      expect(res.body.error.message).toMatch(/Internal notes are restricted/i);
    });

    it("returns 403 Forbidden when Requester attempts POST /api/tickets/:id/internal-notes", async () => {
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
        .post("/api/tickets/12/internal-notes")
        .set("x-user-id", "1")
        .send({ content: "Sneaky internal note attempt" });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });
  });
});
