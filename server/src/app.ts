import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import multer from "multer";
import { getPrisma } from "./prisma.js";

export const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Storage directory setup for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
app.use("/uploads", express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

const uploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const multerHandler = upload.any();
  multerHandler(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "File size exceeds 5MB limit",
          },
        });
      }
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: err.message,
        },
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: err.message || "File upload error",
        },
      });
    }
    next();
  });
};

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", service: "TokTickIT API" });
});

// ---------------------------------------------------------------------------
// Category list
// ---------------------------------------------------------------------------
app.get("/api/categories", async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
      select: { id: true, name: true },
    });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ error: "Unable to retrieve categories" });
  }
});

// ---------------------------------------------------------------------------
// Related Systems list
// ---------------------------------------------------------------------------
app.get("/api/related-systems", async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const systems = await prisma.relatedSystem.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
      select: { id: true, name: true },
    });
    res.status(200).json(systems);
  } catch (error) {
    res.status(500).json({ error: "Unable to retrieve related systems" });
  }
});

// ---------------------------------------------------------------------------
// GET /api/requesters & GET /api/users/dev-list
// ---------------------------------------------------------------------------
const handleGetRequesters = async (_req: Request, res: Response) => {
  try {
    const prisma = getPrisma();
    const requesters = await prisma.requesterUser.findMany({
      where: { isActive: true },
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
      },
    });
    res.status(200).json(requesters);
  } catch (error) {
    res.status(500).json({ error: "Unable to retrieve requesters" });
  }
};

app.get("/api/requesters", handleGetRequesters);
app.get("/api/users/dev-list", handleGetRequesters);

// ---------------------------------------------------------------------------
// ISSUE-05: GET /api/tickets & GET /api/tickets/my
// ---------------------------------------------------------------------------
const handleGetTickets = async (req: Request, res: Response) => {
  try {
    const rawUserId = req.headers["x-user-id"];
    const userId = parseInt(String(rawUserId), 10);

    if (isNaN(userId)) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Missing or invalid x-user-id header",
        },
      });
    }

    const prisma = getPrisma();
    const requester = await prisma.requesterUser.findUnique({
      where: { id: userId },
    });

    if (!requester || !requester.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Requester not found or inactive",
        },
      });
    }

    const search = req.query.search ? String(req.query.search).trim() : "";
    const categoryId = req.query.categoryId ? parseInt(String(req.query.categoryId), 10) : undefined;
    const priority = req.query.priority ? String(req.query.priority).trim() : "";
    const status = req.query.status ? String(req.query.status).trim() : "";

    const rawSort = String(req.query.sort || req.query.sortBy || "createdAt");
    const rawOrder = String(req.query.order || req.query.sortOrder || "desc").toLowerCase();
    const order: "asc" | "desc" = rawOrder === "asc" ? "asc" : "desc";

    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
    const rawLimit = parseInt(String(req.query.limit || "10"), 10) || 10;
    const limit = Math.min(50, Math.max(1, rawLimit));

    const whereClause: any = {
      requesterId: userId,
    };

    if (categoryId !== undefined && !isNaN(categoryId)) {
      whereClause.categoryId = categoryId;
    }

    if (priority && priority.toLowerCase() !== "all") {
      whereClause.requestedPriority = {
        equals: priority,
        mode: "insensitive",
      };
    }

    if (status && status.toLowerCase() !== "all") {
      whereClause.currentStatus = {
        equals: status,
        mode: "insensitive",
      };
    }

    if (search) {
      whereClause.OR = [
        { summary: { contains: search, mode: "insensitive" } },
        { ticketNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    let orderBy: any = {};
    const fieldMap: Record<string, string> = {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
      ticketNumber: "ticketNumber",
      summary: "summary",
      priority: "requestedPriority",
      requestedPriority: "requestedPriority",
      status: "currentStatus",
      currentStatus: "currentStatus",
    };

    const sortField = fieldMap[rawSort] || "createdAt";
    orderBy[sortField] = order;

    const skip = (page - 1) * limit;

    const [items, totalItems] = await Promise.all([
      prisma.ticket.findMany({
        where: whereClause,
        orderBy,
        skip,
        take: limit,
        include: {
          category: { select: { id: true, name: true } },
          relatedSystem: { select: { id: true, name: true } },
          attachments: {
            where: { isRemoved: false },
            select: {
              id: true,
              originalFileName: true,
              storedFileName: true,
              fileSize: true,
              mimeType: true,
              createdAt: true,
            },
          },
          requester: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.ticket.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(totalItems / limit) || 1;

    return res.status(200).json({
      success: true,
      data: {
        items,
        meta: {
          currentPage: page,
          limit,
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      },
    });
  } catch (error: any) {
    console.error("Fetch tickets error:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to retrieve tickets",
      },
    });
  }
};

app.get("/api/tickets", handleGetTickets);
app.get("/api/tickets/my", handleGetTickets);

// ---------------------------------------------------------------------------
// ISSUE-06: GET /api/tickets/:id
// ---------------------------------------------------------------------------
app.get("/api/tickets/:id", async (req: Request, res: Response) => {
  try {
    const rawUserId = req.headers["x-user-id"];
    const userId = parseInt(String(rawUserId), 10);

    if (isNaN(userId)) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Missing or invalid x-user-id header",
        },
      });
    }

    const prisma = getPrisma();
    const requester = await prisma.requesterUser.findUnique({
      where: { id: userId },
    });

    if (!requester || !requester.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Requester not found or inactive",
        },
      });
    }

    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid ticket ID",
        },
      });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        category: { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true, email: true } },
        attachments: {
          select: {
            id: true,
            originalFileName: true,
            storedFileName: true,
            fileSize: true,
            mimeType: true,
            isRemoved: true,
            removalReason: true,
            removedAt: true,
            createdAt: true,
          },
          orderBy: { id: "asc" },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Ticket not found",
        },
      });
    }

    if (ticket.requesterId !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to view this ticket",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error: any) {
    console.error("Fetch ticket detail error:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to retrieve ticket details",
      },
    });
  }
});

// ---------------------------------------------------------------------------
// ISSUE-07: POST /api/tickets/:id/attachments - Upload attachment
// ---------------------------------------------------------------------------
app.post("/api/tickets/:id/attachments", uploadMiddleware, async (req: Request, res: Response) => {
  try {
    const rawUserId = req.headers["x-user-id"];
    const userId = parseInt(String(rawUserId), 10);

    if (isNaN(userId)) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Missing or invalid x-user-id header",
        },
      });
    }

    const prisma = getPrisma();
    const requester = await prisma.requesterUser.findUnique({
      where: { id: userId },
    });

    if (!requester || !requester.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Requester not found or inactive",
        },
      });
    }

    const ticketId = parseInt(req.params.id, 10);
    if (isNaN(ticketId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid ticket ID",
        },
      });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        attachments: {
          where: { isRemoved: false },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Ticket not found",
        },
      });
    }

    if (ticket.requesterId !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to modify attachments on this ticket",
        },
      });
    }

    const files = (req.files as Express.Multer.File[]) || [];
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "No file uploaded",
        },
      });
    }

    const activeAttachmentsCount = ticket.attachments.length;
    if (activeAttachmentsCount + files.length > 5) {
      for (const file of files) {
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Maximum 5 active attachments allowed per ticket",
        },
      });
    }

    const allowedMimeTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];

    for (const file of files) {
      const ext = path.extname(file.originalname).toLowerCase();
      const isMimeAllowed = allowedMimeTypes.includes(file.mimetype.toLowerCase());
      const isExtAllowed = allowedExtensions.includes(ext);

      if (!isMimeAllowed && !isExtAllowed) {
        for (const f of files) {
          if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
        }
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid file type. Allowed types: JPG, JPEG, PNG, WEBP, PDF",
          },
        });
      }

      if (file.size > 5 * 1024 * 1024) {
        for (const f of files) {
          if (fs.existsSync(f.path)) fs.unlinkSync(f.path);
        }
        return res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: `File ${file.originalname} exceeds 5MB limit`,
          },
        });
      }
    }

    const createdAttachments = [];
    for (const file of files) {
      const attachment = await prisma.attachment.create({
        data: {
          ticketId,
          originalFileName: file.originalname,
          storedFileName: file.filename,
          fileSize: file.size,
          mimeType: file.mimetype,
          isRemoved: false,
        },
      });
      createdAttachments.push(attachment);
    }

    return res.status(201).json({
      success: true,
      data: createdAttachments,
    });
  } catch (error: any) {
    console.error("Upload attachment error:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to upload attachment",
      },
    });
  }
});

// ---------------------------------------------------------------------------
// ISSUE-07: GET /api/attachments/:id/download - Secure File Download
// ---------------------------------------------------------------------------
app.get("/api/attachments/:id/download", async (req: Request, res: Response) => {
  try {
    const rawUserId = req.headers["x-user-id"];
    const userId = parseInt(String(rawUserId), 10);

    if (isNaN(userId)) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Missing or invalid x-user-id header",
        },
      });
    }

    const prisma = getPrisma();
    const requester = await prisma.requesterUser.findUnique({
      where: { id: userId },
    });

    if (!requester || !requester.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Requester not found or inactive",
        },
      });
    }

    const attachmentId = parseInt(req.params.id, 10);
    if (isNaN(attachmentId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid attachment ID",
        },
      });
    }

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { ticket: true },
    });

    if (!attachment) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Attachment not found",
        },
      });
    }

    if (attachment.ticket.requesterId !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to download this attachment",
        },
      });
    }

    if (attachment.isRemoved) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Attachment has been removed and cannot be downloaded",
        },
      });
    }

    const filePath = path.join(uploadDir, attachment.storedFileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "File not found on server",
        },
      });
    }

    return res.download(filePath, attachment.originalFileName);
  } catch (error: any) {
    console.error("Download attachment error:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to download attachment",
      },
    });
  }
});

// ---------------------------------------------------------------------------
// ISSUE-07: DELETE /api/attachments/:id & DELETE /api/tickets/:id/attachments/:attachmentId
// ---------------------------------------------------------------------------
const handleDeleteAttachment = async (req: Request, res: Response) => {
  try {
    const rawUserId = req.headers["x-user-id"];
    const userId = parseInt(String(rawUserId), 10);

    if (isNaN(userId)) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Missing or invalid x-user-id header",
        },
      });
    }

    const prisma = getPrisma();
    const requester = await prisma.requesterUser.findUnique({
      where: { id: userId },
    });

    if (!requester || !requester.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Requester not found or inactive",
        },
      });
    }

    const rawAttachmentId = req.params.attachmentId || req.params.id;
    const attachmentId = parseInt(rawAttachmentId, 10);
    if (isNaN(attachmentId)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid attachment ID",
        },
      });
    }

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: { ticket: true },
    });

    if (!attachment) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Attachment not found",
        },
      });
    }

    if (attachment.ticket.requesterId !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to remove this attachment",
        },
      });
    }

    const removalReason = req.body?.removalReason ? String(req.body.removalReason).trim() : null;

    const updatedAttachment = await prisma.attachment.update({
      where: { id: attachmentId },
      data: {
        isRemoved: true,
        removedAt: new Date(),
        removalReason,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Attachment removed successfully",
      data: updatedAttachment,
    });
  } catch (error: any) {
    console.error("Delete attachment error:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to remove attachment",
      },
    });
  }
};

app.delete("/api/attachments/:id", handleDeleteAttachment);
app.delete("/api/tickets/:id/attachments/:attachmentId", handleDeleteAttachment);


// ---------------------------------------------------------------------------
// ISSUE-04: POST /api/tickets
// ---------------------------------------------------------------------------
app.post("/api/tickets", uploadMiddleware, async (req: Request, res: Response) => {
  try {
    // 1. Authenticate Requester via x-user-id header
    const rawUserId = req.headers["x-user-id"] || req.body?.requesterId;
    const userId = parseInt(String(rawUserId), 10);

    if (isNaN(userId)) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Missing or invalid x-user-id header",
        },
      });
    }

    const prisma = getPrisma();
    const requester = await prisma.requesterUser.findUnique({
      where: { id: userId },
    });

    if (!requester || !requester.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Requester not found or inactive",
        },
      });
    }

    // 2. Validate input fields
    const { categoryId, relatedSystemId, requestedPriority, summary, description } = req.body;
    const errors: string[] = [];

    const parsedCategoryId = parseInt(String(categoryId), 10);
    const parsedRelatedSystemId = parseInt(String(relatedSystemId), 10);

    if (isNaN(parsedCategoryId)) {
      errors.push("Category is required");
    } else {
      const categoryExists = await prisma.category.findUnique({
        where: { id: parsedCategoryId },
      });
      if (!categoryExists) {
        errors.push("Invalid Category selected");
      }
    }

    if (isNaN(parsedRelatedSystemId)) {
      errors.push("Related System is required");
    } else {
      const systemExists = await prisma.relatedSystem.findUnique({
        where: { id: parsedRelatedSystemId },
      });
      if (!systemExists) {
        errors.push("Invalid Related System selected");
      }
    }

    const validPriorities = ["low", "medium", "high", "urgent"];
    if (!requestedPriority || !validPriorities.includes(String(requestedPriority).toLowerCase())) {
      errors.push("Requested Priority must be Low, Medium, High, or Urgent");
    }

    if (!summary || typeof summary !== "string" || summary.trim().length === 0) {
      errors.push("Summary is required");
    } else if (summary.trim().length > 100) {
      errors.push("Summary must not exceed 100 characters");
    }

    if (!description || typeof description !== "string" || description.trim().length === 0) {
      errors.push("Description is required");
    } else if (description.trim().length > 1000) {
      errors.push("Description must not exceed 1000 characters");
    }

    const files = (req.files as Express.Multer.File[]) || [];
    if (files.length > 3) {
      errors.push("Maximum 3 file attachments allowed");
    }

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        errors.push(`File ${file.originalname} exceeds 5MB size limit`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: errors[0],
          details: errors,
        },
      });
    }

    // Standardize priority title-cased
    const formattedPriority =
      String(requestedPriority).charAt(0).toUpperCase() +
      String(requestedPriority).slice(1).toLowerCase();

    // 3. Generate unique Ticket Number (e.g. TKT-YYYY-XXXXXX)
    const year = new Date().getFullYear();
    const count = await prisma.ticket.count();
    let nextNum = count + 1;
    let ticketNumber = `TKT-${year}-${String(nextNum).padStart(6, "0")}`;
    while (await prisma.ticket.findUnique({ where: { ticketNumber } })) {
      nextNum++;
      ticketNumber = `TKT-${year}-${String(nextNum).padStart(6, "0")}`;
    }

    // 4. Create Ticket & Attachments in DB
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        requesterId: requester.id,
        categoryId: parsedCategoryId,
        relatedSystemId: parsedRelatedSystemId,
        summary: summary.trim(),
        description: description.trim(),
        requestedPriority: formattedPriority,
        currentStatus: "New",
        attachments: {
          create: files.map((file) => ({
            originalFileName: file.originalname,
            storedFileName: file.filename,
            fileSize: file.size,
            mimeType: file.mimetype,
          })),
        },
      },
      include: {
        requester: { select: { id: true, name: true, email: true } },
        category: { select: { id: true, name: true } },
        relatedSystem: { select: { id: true, name: true } },
        attachments: true,
      },
    });

    return res.status(201).json({
      success: true,
      data: ticket,
    });
  } catch (error: any) {
    console.error("Ticket creation error:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to create ticket",
      },
    });
  }
});

export default app;
