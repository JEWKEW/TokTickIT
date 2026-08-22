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
