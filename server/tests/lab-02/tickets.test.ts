import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import * as prismaModule from "../../src/prisma.js";

describe("POST /api/tickets - Ticket Creation API", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 401 Unauthorized if x-user-id header is missing", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .send({
        categoryId: 1,
        relatedSystemId: 1,
        requestedPriority: "High",
        summary: "VPN is broken",
        description: "Cannot connect to VPN from home office",
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 400 Bad Request if summary exceeds 100 characters", async () => {
    const longSummary = "a".repeat(101);
    const res = await request(app)
      .post("/api/tickets")
      .set("x-user-id", "1")
      .send({
        categoryId: 1,
        relatedSystemId: 1,
        requestedPriority: "High",
        summary: longSummary,
        description: "Valid description text",
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 Bad Request if description exceeds 1000 characters", async () => {
    const longDesc = "d".repeat(1001);
    const res = await request(app)
      .post("/api/tickets")
      .set("x-user-id", "1")
      .send({
        categoryId: 1,
        relatedSystemId: 1,
        requestedPriority: "Medium",
        summary: "Laptop keyboard not responding",
        description: longDesc,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("creates a valid ticket with auto-generated Ticket Number and default status 'New'", async () => {
    const mockPrisma = {
      requesterUser: {
        findUnique: vi.fn().mockResolvedValue({
          id: 1,
          name: "Alice Johnson",
          email: "alice@toktickit.io",
          isActive: true,
        }),
      },
      category: {
        findUnique: vi.fn().mockResolvedValue({ id: 1, name: "Account and Access" }),
      },
      relatedSystem: {
        findUnique: vi.fn().mockResolvedValue({ id: 1, name: "Email" }),
      },
      ticket: {
        count: vi.fn().mockResolvedValue(0),
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockImplementation(async ({ data }) => {
          return {
            id: 10,
            ticketNumber: data.ticketNumber,
            summary: data.summary,
            description: data.description,
            requestedPriority: data.requestedPriority,
            currentStatus: data.currentStatus,
            requesterId: data.requesterId,
            categoryId: data.categoryId,
            relatedSystemId: data.relatedSystemId,
            requester: { id: 1, name: "Alice Johnson", email: "alice@toktickit.io" },
            category: { id: 1, name: "Account and Access" },
            relatedSystem: { id: 1, name: "Email" },
            attachments: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }),
      },
    };

    vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

    const res = await request(app)
      .post("/api/tickets")
      .set("x-user-id", "1")
      .field("categoryId", "1")
      .field("relatedSystemId", "1")
      .field("requestedPriority", "High")
      .field("summary", "Unable to reset password")
      .field("description", "Password reset link sends 404 error");

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.currentStatus).toBe("New");
    expect(res.body.data.ticketNumber).toMatch(/^TKT-\d{4}-\d{6}$/);
    expect(res.body.data.summary).toBe("Unable to reset password");
  });

  it("creates a ticket with file attachments", async () => {
    const mockPrisma = {
      requesterUser: {
        findUnique: vi.fn().mockResolvedValue({
          id: 1,
          name: "Alice Johnson",
          email: "alice@toktickit.io",
          isActive: true,
        }),
      },
      category: {
        findUnique: vi.fn().mockResolvedValue({ id: 2, name: "Hardware" }),
      },
      relatedSystem: {
        findUnique: vi.fn().mockResolvedValue({ id: 6, name: "Corporate Laptop" }),
      },
      ticket: {
        count: vi.fn().mockResolvedValue(5),
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockImplementation(async ({ data }) => {
          return {
            id: 12,
            ticketNumber: data.ticketNumber,
            summary: data.summary,
            description: data.description,
            requestedPriority: data.requestedPriority,
            currentStatus: "New",
            requesterId: 1,
            categoryId: 2,
            relatedSystemId: 6,
            attachments: [
              {
                id: 101,
                originalFileName: "screenshot.png",
                storedFileName: "12345-screenshot.png",
                fileSize: 1024,
                mimeType: "image/png",
              },
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }),
      },
    };

    vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

    const res = await request(app)
      .post("/api/tickets")
      .set("x-user-id", "1")
      .field("categoryId", "2")
      .field("relatedSystemId", "6")
      .field("requestedPriority", "Urgent")
      .field("summary", "Screen flickering issue")
      .field("description", "Display flickers when opening design app")
      .attach("files", Buffer.from("fake image data"), "screenshot.png");

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.attachments).toHaveLength(1);
    expect(res.body.data.attachments[0].originalFileName).toBe("screenshot.png");
  });
});
