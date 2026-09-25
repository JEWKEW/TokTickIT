import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import * as prismaModule from "../../src/prisma.js";

describe("Lab 03 IT Staff Ticket Operations Integration Tests (staff-ticket-detail.api.test.ts)", () => {
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
    createdAt: new Date("2026-09-18T10:00:00Z"),
    updatedAt: new Date("2026-09-18T10:00:00Z"),
    summary: "Laptop screen flickering",
    description: "Display keeps flickering randomly",
    requestedPriority: "High",
    itPriority: "High",
    currentStatus: "New",
    requesterId: 1,
    ownerId: null,
    categoryId: 1,
    relatedSystemId: 1,
    category: { id: 1, name: "Hardware" },
    relatedSystem: { id: 1, name: "Workstation" },
    requester: { id: 1, name: "Jennifer Anderson", email: "jandersson@toktickit.com" },
    owner: null,
    requesterResolvedIndicated: false,
    requesterResolvedAt: null,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("PATCH /api/tickets/:id/assign - Claim & Reassign Ownership", () => {
    it("TC-API-WORKFLOW-01a: IT Staff claims unassigned ticket ownership", async () => {
      const updatedTicket = {
        ...baseTicket,
        ownerId: 3,
        owner: { id: 3, name: "Michael Support", email: "msupport@toktickit.com" },
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
          update: vi.fn().mockResolvedValue(updatedTicket),
        },
      };

      vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

      const res = await request(app)
        .patch("/api/tickets/101/assign")
        .set("x-user-id", "3")
        .send({ ownerId: 3 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.ownerId).toBe(3);
      expect(res.body.data.owner.name).toBe("Michael Support");
    });

    it("TC-API-WORKFLOW-01b: IT Staff unassigns ticket ownership by setting ownerId to null", async () => {
      const assignedTicket = {
        ...baseTicket,
        ownerId: 3,
        owner: { id: 3, name: "Michael Support", email: "msupport@toktickit.com" },
      };
      const unassignedTicket = { ...baseTicket, ownerId: null, owner: null };

      const mockPrisma = {
        user: {
          findUnique: vi.fn().mockImplementation(({ where }) => {
            if (where.id === 3) return Promise.resolve(staffUser);
            return Promise.resolve(null);
          }),
        },
        ticket: {
          findUnique: vi.fn().mockResolvedValue(assignedTicket),
          update: vi.fn().mockResolvedValue(unassignedTicket),
        },
      };

      vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

      const res = await request(app)
        .patch("/api/tickets/101/assign")
        .set("x-user-id", "3")
        .send({ ownerId: null });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.ownerId).toBeNull();
      expect(res.body.data.owner).toBeNull();
    });

    it("TC-API-WORKFLOW-01c: Rejects assigning owner to a Requester or inactive user", async () => {
      const mockPrisma = {
        user: {
          findUnique: vi.fn().mockImplementation(({ where }) => {
            if (where.id === 3) return Promise.resolve(staffUser);
            if (where.id === 1) return Promise.resolve(requesterUser);
            return Promise.resolve(null);
          }),
        },
        ticket: {
          findUnique: vi.fn().mockResolvedValue(baseTicket),
        },
      };

      vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

      const res = await request(app)
        .patch("/api/tickets/101/assign")
        .set("x-user-id", "3")
        .send({ ownerId: 1 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(res.body.error.message).toMatch(/active IT Staff or Administrator/i);
    });

    it("TC-API-WORKFLOW-01d: Returns 403 Forbidden when Requester attempts to assign ticket owner", async () => {
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
        .patch("/api/tickets/101/assign")
        .set("x-user-id", "1")
        .send({ ownerId: 3 });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });
  });

  describe("PATCH /api/tickets/:id/it-priority - Update IT Priority", () => {
    it("TC-API-WORKFLOW-02a: IT Staff updates IT Priority to Urgent", async () => {
      const updatedTicket = { ...baseTicket, itPriority: "Urgent" };

      const mockPrisma = {
        user: {
          findUnique: vi.fn().mockImplementation(({ where }) => {
            if (where.id === 3) return Promise.resolve(staffUser);
            return Promise.resolve(null);
          }),
        },
        ticket: {
          findUnique: vi.fn().mockResolvedValue(baseTicket),
          update: vi.fn().mockResolvedValue(updatedTicket),
        },
      };

      vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

      const res = await request(app)
        .patch("/api/tickets/101/it-priority")
        .set("x-user-id", "3")
        .send({ itPriority: "Urgent" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.itPriority).toBe("Urgent");
    });

    it("TC-API-WORKFLOW-02b: Rejects invalid priority value", async () => {
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
      };

      vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

      const res = await request(app)
        .patch("/api/tickets/101/it-priority")
        .set("x-user-id", "3")
        .send({ itPriority: "InvalidPriority" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(res.body.error.message).toMatch(/Low, Medium, High, or Urgent/i);
    });

    it("TC-API-WORKFLOW-02c: Returns 403 Forbidden when Requester attempts to update IT Priority", async () => {
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
        .patch("/api/tickets/101/it-priority")
        .set("x-user-id", "1")
        .send({ itPriority: "Urgent" });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });
  });

  describe("PATCH /api/tickets/:id/status - Status Transition Workflow", () => {
    it("TC-API-WORKFLOW-03: IT Staff executes valid status transition (New -> In Progress)", async () => {
      const updatedTicket = { ...baseTicket, currentStatus: "In Progress" };

      const mockPrisma = {
        user: {
          findUnique: vi.fn().mockImplementation(({ where }) => {
            if (where.id === 3) return Promise.resolve(staffUser);
            return Promise.resolve(null);
          }),
        },
        ticket: {
          findUnique: vi.fn().mockResolvedValue(baseTicket),
          update: vi.fn().mockResolvedValue(updatedTicket),
        },
      };

      vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

      const res = await request(app)
        .patch("/api/tickets/101/status")
        .set("x-user-id", "3")
        .send({ status: "In Progress" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.currentStatus).toBe("In Progress");
    });

    it("TC-API-WORKFLOW-04a: Rejects invalid status transition (Closed -> In Progress) per BR-07", async () => {
      const closedTicket = { ...baseTicket, currentStatus: "Closed" };

      const mockPrisma = {
        user: {
          findUnique: vi.fn().mockImplementation(({ where }) => {
            if (where.id === 3) return Promise.resolve(staffUser);
            return Promise.resolve(null);
          }),
        },
        ticket: {
          findUnique: vi.fn().mockResolvedValue(closedTicket),
        },
      };

      vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

      const res = await request(app)
        .patch("/api/tickets/101/status")
        .set("x-user-id", "3")
        .send({ status: "In Progress" });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(res.body.error.message).toMatch(/Invalid status transition/i);
    });

    it("TC-API-WORKFLOW-04b: Returns 403 Forbidden when Requester attempts to update status directly", async () => {
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
        .patch("/api/tickets/101/status")
        .set("x-user-id", "1")
        .send({ status: "Resolved" });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });
  });

  describe("PATCH /api/tickets/:id/indicate-resolved - Requester Problem Resolution Indication", () => {
    it("TC-API-WORKFLOW-05a: Requester indicates problem appears resolved on owned ticket", async () => {
      const resolvedIndicatedTicket = {
        ...baseTicket,
        requesterResolvedIndicated: true,
        requesterResolvedAt: new Date("2026-09-19T12:00:00Z"),
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
          update: vi.fn().mockResolvedValue(resolvedIndicatedTicket),
        },
      };

      vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

      const res = await request(app)
        .patch("/api/tickets/101/indicate-resolved")
        .set("x-user-id", "1");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.requesterResolvedIndicated).toBe(true);
      expect(res.body.data.requesterResolvedAt).toBeDefined();
    });

    it("TC-API-WORKFLOW-05b: Returns 403 Forbidden when non-owner Requester attempts to indicate resolved", async () => {
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
        .patch("/api/tickets/101/indicate-resolved")
        .set("x-user-id", "2");

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });
  });
});
