import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import path from "path";
import fs from "fs";
import { app } from "../../src/app.js";
import * as prismaModule from "../../src/prisma.js";

describe("Attachment Lifecycle API (POST /api/tickets/:id/attachments, GET /api/attachments/:id/download, DELETE /api/attachments/:id)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // POST /api/tickets/:id/attachments
  // ---------------------------------------------------------------------------
  describe("POST /api/tickets/:id/attachments - Upload Attachment", () => {
    it("returns 401 Unauthorized if x-user-id header is missing", async () => {
      const res = await request(app).post("/api/tickets/1/attachments");
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
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

      const res = await request(app)
        .post("/api/tickets/9999/attachments")
        .set("x-user-id", "1")
        .attach("files", Buffer.from("test content"), "test.pdf");

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });

    it("returns 403 Forbidden if ticket belongs to another requester", async () => {
      const mockTicketOwnedByBob = {
        id: 10,
        requesterId: 2, // Owned by Bob (User 2)
        attachments: [],
      };
      const mockPrisma = {
        requesterUser: {
          findUnique: vi.fn().mockResolvedValue({ id: 1, name: "Alice", isActive: true }),
        },
        ticket: {
          findUnique: vi.fn().mockResolvedValue(mockTicketOwnedByBob),
        },
      };
      vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

      const res = await request(app)
        .post("/api/tickets/10/attachments")
        .set("x-user-id", "1")
        .attach("files", Buffer.from("pdf content"), "document.pdf");

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("returns 400 Bad Request for unallowed file type", async () => {
      const mockTicket = {
        id: 1,
        requesterId: 1,
        attachments: [],
      };
      const mockPrisma = {
        requesterUser: {
          findUnique: vi.fn().mockResolvedValue({ id: 1, name: "Alice", isActive: true }),
        },
        ticket: {
          findUnique: vi.fn().mockResolvedValue(mockTicket),
        },
      };
      vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

      const res = await request(app)
        .post("/api/tickets/1/attachments")
        .set("x-user-id", "1")
        .attach("files", Buffer.from("executable payload"), "malicious.exe");

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(res.body.error.message).toMatch(/Invalid file type/i);
    });

    it("returns 400 Bad Request if ticket already has max 5 active attachments", async () => {
      const mockTicketWith5Active = {
        id: 1,
        requesterId: 1,
        attachments: [
          { id: 1, isRemoved: false },
          { id: 2, isRemoved: false },
          { id: 3, isRemoved: false },
          { id: 4, isRemoved: false },
          { id: 5, isRemoved: false },
        ],
      };
      const mockPrisma = {
        requesterUser: {
          findUnique: vi.fn().mockResolvedValue({ id: 1, name: "Alice", isActive: true }),
        },
        ticket: {
          findUnique: vi.fn().mockResolvedValue(mockTicketWith5Active),
        },
      };
      vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

      const res = await request(app)
        .post("/api/tickets/1/attachments")
        .set("x-user-id", "1")
        .attach("files", Buffer.from("pdf data"), "extra.pdf");

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(res.body.error.message).toMatch(/Maximum 5 active attachments/i);
    });

    it("returns 201 Created and saves attachment for valid file upload", async () => {
      const mockTicket = {
        id: 1,
        requesterId: 1,
        attachments: [],
      };
      const createdAttachment = {
        id: 101,
        ticketId: 1,
        originalFileName: "sample.png",
        storedFileName: "12345-sample.png",
        fileSize: 1024,
        mimeType: "image/png",
        isRemoved: false,
        removalReason: null,
        removedAt: null,
        createdAt: new Date().toISOString(),
      };
      const mockPrisma = {
        requesterUser: {
          findUnique: vi.fn().mockResolvedValue({ id: 1, name: "Alice", isActive: true }),
        },
        ticket: {
          findUnique: vi.fn().mockResolvedValue(mockTicket),
        },
        attachment: {
          create: vi.fn().mockResolvedValue(createdAttachment),
        },
      };
      vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

      const res = await request(app)
        .post("/api/tickets/1/attachments")
        .set("x-user-id", "1")
        .attach("files", Buffer.from("fake image data"), "sample.png");

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].originalFileName).toBe("sample.png");
    });
  });

  // ---------------------------------------------------------------------------
  // GET /api/attachments/:id/download
  // ---------------------------------------------------------------------------
  describe("GET /api/attachments/:id/download - Secure Download", () => {
    it("returns 401 Unauthorized if x-user-id header is missing", async () => {
      const res = await request(app).get("/api/attachments/101/download");
      expect(res.status).toBe(401);
    });

    it("returns 404 Not Found if attachment does not exist", async () => {
      const mockPrisma = {
        requesterUser: {
          findUnique: vi.fn().mockResolvedValue({ id: 1, name: "Alice", isActive: true }),
        },
        attachment: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      };
      vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

      const res = await request(app).get("/api/attachments/9999/download").set("x-user-id", "1");
      expect(res.status).toBe(404);
    });

    it("returns 403 Forbidden if attachment ticket belongs to another requester", async () => {
      const mockAttachmentOwnedByBob = {
        id: 101,
        originalFileName: "secret.pdf",
        storedFileName: "123-secret.pdf",
        isRemoved: false,
        ticket: {
          id: 10,
          requesterId: 2, // Bob
        },
      };
      const mockPrisma = {
        requesterUser: {
          findUnique: vi.fn().mockResolvedValue({ id: 1, name: "Alice", isActive: true }),
        },
        attachment: {
          findUnique: vi.fn().mockResolvedValue(mockAttachmentOwnedByBob),
        },
      };
      vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

      const res = await request(app).get("/api/attachments/101/download").set("x-user-id", "1");
      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("blocks download (returns 400 Bad Request) if attachment is soft-removed", async () => {
      const mockRemovedAttachment = {
        id: 101,
        originalFileName: "old_doc.pdf",
        storedFileName: "123-old_doc.pdf",
        isRemoved: true,
        removalReason: "Obsolete information",
        ticket: {
          id: 1,
          requesterId: 1, // Alice
        },
      };
      const mockPrisma = {
        requesterUser: {
          findUnique: vi.fn().mockResolvedValue({ id: 1, name: "Alice", isActive: true }),
        },
        attachment: {
          findUnique: vi.fn().mockResolvedValue(mockRemovedAttachment),
        },
      };
      vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

      const res = await request(app).get("/api/attachments/101/download").set("x-user-id", "1");
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/removed/i);
    });

    it("serves file download for active attachment", async () => {
      // Create temporary dummy file in uploads folder
      const uploadsDir = path.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const testFileName = "test-download-file.txt";
      const testFilePath = path.join(uploadsDir, testFileName);
      fs.writeFileSync(testFilePath, "Sample file content for download test");

      const mockActiveAttachment = {
        id: 202,
        originalFileName: "my_report.txt",
        storedFileName: testFileName,
        isRemoved: false,
        ticket: {
          id: 1,
          requesterId: 1,
        },
      };
      const mockPrisma = {
        requesterUser: {
          findUnique: vi.fn().mockResolvedValue({ id: 1, name: "Alice", isActive: true }),
        },
        attachment: {
          findUnique: vi.fn().mockResolvedValue(mockActiveAttachment),
        },
      };
      vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

      const res = await request(app).get("/api/attachments/202/download").set("x-user-id", "1");
      expect(res.status).toBe(200);

      // Cleanup
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // DELETE /api/attachments/:id
  // ---------------------------------------------------------------------------
  describe("DELETE /api/attachments/:id - Soft Removal", () => {
    it("returns 401 Unauthorized if x-user-id header is missing", async () => {
      const res = await request(app).delete("/api/attachments/101");
      expect(res.status).toBe(401);
    });

    it("returns 404 Not Found if attachment does not exist", async () => {
      const mockPrisma = {
        requesterUser: {
          findUnique: vi.fn().mockResolvedValue({ id: 1, name: "Alice", isActive: true }),
        },
        attachment: {
          findUnique: vi.fn().mockResolvedValue(null),
        },
      };
      vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

      const res = await request(app).delete("/api/attachments/9999").set("x-user-id", "1");
      expect(res.status).toBe(404);
    });

    it("returns 403 Forbidden if attachment belongs to another user's ticket", async () => {
      const mockAttachmentOwnedByBob = {
        id: 101,
        originalFileName: "bob_file.png",
        ticket: {
          id: 10,
          requesterId: 2, // Bob
        },
      };
      const mockPrisma = {
        requesterUser: {
          findUnique: vi.fn().mockResolvedValue({ id: 1, name: "Alice", isActive: true }),
        },
        attachment: {
          findUnique: vi.fn().mockResolvedValue(mockAttachmentOwnedByBob),
        },
      };
      vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

      const res = await request(app)
        .delete("/api/attachments/101")
        .set("x-user-id", "1")
        .send({ removalReason: "Cleaning up" });

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("FORBIDDEN");
    });

    it("soft-removes attachment and sets isRemoved=true, timestamp, and reason", async () => {
      const mockActiveAttachment = {
        id: 101,
        originalFileName: "screenshot.png",
        isRemoved: false,
        ticket: {
          id: 1,
          requesterId: 1,
        },
      };
      const updatedAttachment = {
        ...mockActiveAttachment,
        isRemoved: true,
        removalReason: "Uploaded wrong screenshot",
        removedAt: "2026-08-23T16:00:00.000Z",
      };
      const mockPrisma = {
        requesterUser: {
          findUnique: vi.fn().mockResolvedValue({ id: 1, name: "Alice", isActive: true }),
        },
        attachment: {
          findUnique: vi.fn().mockResolvedValue(mockActiveAttachment),
          update: vi.fn().mockResolvedValue(updatedAttachment),
        },
      };
      vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

      const res = await request(app)
        .delete("/api/attachments/101")
        .set("x-user-id", "1")
        .send({ removalReason: "Uploaded wrong screenshot" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isRemoved).toBe(true);
      expect(res.body.data.removalReason).toBe("Uploaded wrong screenshot");
      expect(mockPrisma.attachment.update).toHaveBeenCalledWith({
        where: { id: 101 },
        data: {
          isRemoved: true,
          removedAt: expect.any(Date),
          removalReason: "Uploaded wrong screenshot",
        },
      });
    });
  });
});
