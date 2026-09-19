import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import * as prismaModule from "../../src/prisma.js";

describe("Lab 03 Public Comments & Internal Notes Integration Tests (comments-notes.api.test.ts)", () => {
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

  const otherRequester = {
    id: 2,
    name: "Bob Smith",
    email: "bsmith@toktickit.com",
    role: "REQUESTER",
    mustChangePassword: false,
    isActive: true,
  };

  const baseTicket = {
    id: 101,
    ticketNumber: "TKT-2026-000101",
    requesterId: 1,
    summary: "Laptop battery issue",
    currentStatus: "Open",
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Public Comments (GET & POST /api/tickets/:id/comments)", () => {
    it("TC-API-COMM-01: Requester posts Public Comment on owned ticket", async () => {
      const mockComment = {
        id: 1,
        ticketId: 101,
        authorId: 1,
        content: "Thank you for the update!",
        createdAt: new Date("2026-09-18T12:00:00Z"),
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
          findUnique: vi.fn().mockResolvedValue(baseTicket),
        },
        publicComment: {
          create: vi.fn().mockResolvedValue(mockComment),
        },
      };

      vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

      const res = await request(app)
        .post("/api/tickets/101/comments")
        .set("x-user-id", "1")
        .send({ content: "Thank you for the update!" });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe("Thank you for the update!");
      expect(res.body.data.author.name).toBe("Jennifer Anderson");
    });

    it("TC-API-COMM-02: IT Staff views Public Comments list", async () => {
      const mockComments = [
        {
          id: 1,
          ticketId: 101,
          authorId: 1,
          content: "Battery issue reported.",
          createdAt: new Date("2026-09-18T11:00:00Z"),
          author: { id: 1, name: "Jennifer Anderson", role: "REQUESTER" },
        },
        {
          id: 2,
          ticketId: 101,
          authorId: 3,
          content: "Replacement battery dispatched.",
          createdAt: new Date("2026-09-18T11:30:00Z"),
          author: { id: 3, name: "Michael Support", role: "IT_STAFF" },
        },
      ];

      const mockPrisma = {
        user: {
          findUnique: vi.fn().mockImplementation(({ where }) => {
            if (where.id === 3) return Promise.resolve(staffUser);
            return Promise.resolve(null);
          }),
        },
        ticket: {
          findUnique: vi.fn().mockResolvedValue(baseTicket),
        },
        publicComment: {
          findMany: vi.fn().mockResolvedValue(mockComments),
        },
      };

      vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

      const res = await request(app)
        .get("/api/tickets/101/comments")
        .set("x-user-id", "3");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[1].author.role).toBe("IT_STAFF");
    });

    it("Rejects non-owner Requester attempting to view or post public comments", async () => {
      const mockPrisma = {
        user: {
          findUnique: vi.fn().mockImplementation(({ where }) => {
            if (where.id === 2) return Promise.resolve(otherRequester);
            return Promise.resolve(null);
          }),
        },
        ticket: {
          findUnique: vi.fn().mockResolvedValue(baseTicket), // requesterId is 1
        },
      };

      vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

      const res = await request(app)
        .post("/api/tickets/101/comments")
        .set("x-user-id", "2")
        .send({ content: "Sneaky comment" });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });
  });

  describe("Internal Notes (GET & POST /api/tickets/:id/internal-notes)", () => {
    it("TC-API-COMM-03: IT Staff posts private Internal Note", async () => {
      const mockNote = {
        id: 1,
        ticketId: 101,
        authorId: 3,
        content: "Verified serial number in inventory system.",
        createdAt: new Date("2026-09-18T12:30:00Z"),
        author: { id: 3, name: "Michael Support", role: "IT_STAFF" },
      };

      const mockPrisma = {
        user: {
          findUnique: vi.fn().mockImplementation(({ where }) => {
            if (where.id === 3) return Promise.resolve(staffUser);
            return Promise.resolve(null);
          }),
        },
        ticket: {
          findUnique: vi.fn().mockResolvedValue(baseTicket),
        },
        internalNote: {
          create: vi.fn().mockResolvedValue(mockNote),
        },
      };

      vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

      const res = await request(app)
        .post("/api/tickets/101/internal-notes")
        .set("x-user-id", "3")
        .send({ content: "Verified serial number in inventory system." });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.content).toBe("Verified serial number in inventory system.");
      expect(res.body.data.author.role).toBe("IT_STAFF");
    });

    it("TC-API-COMM-04a: Returns 403 Forbidden when Requester attempts to GET Internal Notes", async () => {
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
        .get("/api/tickets/101/internal-notes")
        .set("x-user-id", "1");

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
      expect(res.body.error.message).toMatch(/Internal notes are restricted/i);
    });

    it("TC-API-COMM-04b: Returns 403 Forbidden when Requester attempts to POST Internal Note", async () => {
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
        .post("/api/tickets/101/internal-notes")
        .set("x-user-id", "1")
        .send({ content: "Requester trying to write internal note" });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });
  });

  describe("Validation & Limits (TC-API-COMM-05)", () => {
    it("TC-API-COMM-05a: Rejects empty or whitespace-only Public Comment", async () => {
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
        .post("/api/tickets/101/comments")
        .set("x-user-id", "1")
        .send({ content: "   " });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("TC-API-COMM-05b: Rejects empty or whitespace-only Internal Note", async () => {
      const mockPrisma = {
        user: {
          findUnique: vi.fn().mockImplementation(({ where }) => {
            if (where.id === 3) return Promise.resolve(staffUser);
            return Promise.resolve(null);
          }),
        },
      };

      vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

      const res = await request(app)
        .post("/api/tickets/101/internal-notes")
        .set("x-user-id", "3")
        .send({ content: "" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("TC-API-COMM-05c: Rejects comment content exceeding 2000 characters", async () => {
      const mockPrisma = {
        user: {
          findUnique: vi.fn().mockImplementation(({ where }) => {
            if (where.id === 1) return Promise.resolve(requesterUser);
            return Promise.resolve(null);
          }),
        },
      };

      vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

      const longContent = "A".repeat(2001);
      const res = await request(app)
        .post("/api/tickets/101/comments")
        .set("x-user-id", "1")
        .send({ content: longContent });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });
});
