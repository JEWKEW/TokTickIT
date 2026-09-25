import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { getPrisma } from "./prisma.js";

const JWT_SECRET = process.env.JWT_SECRET || "toktickit-jwt-secret-key-2026";
const SALT_ROUNDS = 10;

export interface JwtUserPayload {
  id: number;
  email: string;
  role: string;
  mustChangePassword: boolean;
}

export interface AuthRequest extends Request {
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
    mustChangePassword: boolean;
    isActive: boolean;
  };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(payload: JwtUserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

export function verifyToken(token: string): JwtUserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtUserPayload;
  } catch (error) {
    return null;
  }
}

/**
 * BR-03 Password Strength Validation
 * New passwords must be at least 8 characters long and contain at least:
 * - one uppercase letter
 * - one lowercase letter
 * - one number
 * - one special character
 */
export function validatePasswordPolicy(password: string): { valid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters long" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one uppercase letter" };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one lowercase letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one number" };
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return { valid: false, message: "Password must contain at least one special character" };
  }
  return { valid: true };
}

/**
 * Authentication Middleware
 * Checks Authorization Bearer header (or x-user-id fallback for lab-02 tests)
 * Enforces BR-01 (active users only)
 */
export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.substring(7) : null;
    const rawUserId = req.headers["x-user-id"];

    let userId: number | null = null;

    if (token) {
      const decoded = verifyToken(token);
      if (!decoded) {
        return res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Invalid or expired token",
          },
        });
      }
      userId = decoded.id;
    } else if (rawUserId) {
      const parsedId = parseInt(String(rawUserId), 10);
      if (!isNaN(parsedId)) {
        userId = parsedId;
      }
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    const prisma = getPrisma();
    const userModel = (prisma as any).user || (prisma as any).requesterUser;
    const user = await userModel.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        mustChangePassword: true,
        isActive: true,
        passwordHash: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        },
      });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      isActive: user.isActive,
    };

    next();
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Authentication failure",
      },
    });
  }
}

/**
 * BR-02 Mandatory First-Login Password Enforcement Middleware
 * Blocks access to operational APIs if mustChangePassword = true.
 * Allowed endpoints: /api/auth/change-password, /api/auth/logout, /api/auth/me
 */
export function enforcePasswordChange(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user && req.user.mustChangePassword) {
    const allowedPaths = [
      "/api/auth/change-password",
      "/api/auth/logout",
      "/api/auth/me",
    ];
    
    // Normalize path (without query params)
    const reqPath = req.path || req.originalUrl.split("?")[0];
    if (!allowedPaths.includes(reqPath)) {
      return res.status(403).json({
        success: false,
        error: {
          code: "PASSWORD_CHANGE_REQUIRED",
          message: "Password change required before accessing other features",
        },
      });
    }
  }
  next();
}
