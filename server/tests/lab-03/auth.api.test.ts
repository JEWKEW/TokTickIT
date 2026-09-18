import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import bcrypt from "bcryptjs";
import { app } from "../../src/app.js";
import * as prismaModule from "../../src/prisma.js";
import { generateToken } from "../../src/auth.js";

describe("Lab 03 Authentication API Endpoints (POST /api/auth/login, GET /api/auth/me, POST /api/auth/change-password, POST /api/auth/logout)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const testPassword = "Password123!";
  const passwordHash = bcrypt.hashSync(testPassword, 10);

  const mockActiveUser = {
    id: 1,
    name: "Jennifer Anderson",
    email: "jandersson@toktickit.com",
    passwordHash: passwordHash,
    role: "REQUESTER",
    mustChangePassword: false,
    isActive: true,
  };

  const mockUserMustChange = {
    id: 2,
    name: "Alex Thompson",
    email: "alex@toktickit.com",
    passwordHash: passwordHash,
    role: "IT_STAFF",
    mustChangePassword: true,
    isActive: true,
  };

  const mockInactiveUser = {
    id: 3,
    name: "Inactive User",
    email: "inactive@toktickit.com",
    passwordHash: passwordHash,
    role: "REQUESTER",
    mustChangePassword: false,
    isActive: false,
  };

  // TC-API-AUTH-01: Authenticate active user with valid credentials
  it("TC-API-AUTH-01: Authenticate active user with valid credentials", async () => {
    const mockPrisma = {
      user: {
        findFirst: vi.fn().mockResolvedValue(mockActiveUser),
      },
    };
    vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "jandersson@toktickit.com",
        password: "Password123!",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(typeof res.body.data.token).toBe("string");
    expect(res.body.data.user).toEqual({
      id: 1,
      name: "Jennifer Anderson",
      email: "jandersson@toktickit.com",
      role: "REQUESTER",
      mustChangePassword: false,
      isActive: true,
    });
  });

  // TC-API-AUTH-02: Reject login with wrong password
  it("TC-API-AUTH-02: Reject login with wrong password", async () => {
    const mockPrisma = {
      user: {
        findFirst: vi.fn().mockResolvedValue(mockActiveUser),
      },
    };
    vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "jandersson@toktickit.com",
        password: "WrongPassword999!",
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
    expect(res.body.error.message).toBe("Invalid email or password");
  });

  // TC-API-AUTH-03: Reject login for inactive account (isActive = false)
  it("TC-API-AUTH-03: Reject login for inactive account (isActive = false)", async () => {
    const mockPrisma = {
      user: {
        findFirst: vi.fn().mockResolvedValue(mockInactiveUser),
      },
    };
    vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "inactive@toktickit.com",
        password: "Password123!",
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
    expect(res.body.error.message).toBe("Invalid email or password");
  });

  // TC-API-AUTH-04: Fetch authenticated user profile with valid token
  it("TC-API-AUTH-04: Fetch authenticated user profile with valid token", async () => {
    const token = generateToken({
      id: mockActiveUser.id,
      email: mockActiveUser.email,
      role: mockActiveUser.role,
      mustChangePassword: mockActiveUser.mustChangePassword,
    });

    const mockPrisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue(mockActiveUser),
      },
    };
    vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual({
      id: 1,
      name: "Jennifer Anderson",
      email: "jandersson@toktickit.com",
      role: "REQUESTER",
      mustChangePassword: false,
      isActive: true,
    });
  });

  // TC-API-AUTH-05: Update initial password when mustChangePassword = true
  it("TC-API-AUTH-05: Update initial password when mustChangePassword = true", async () => {
    const token = generateToken({
      id: mockUserMustChange.id,
      email: mockUserMustChange.email,
      role: mockUserMustChange.role,
      mustChangePassword: true,
    });

    const mockUpdate = vi.fn().mockResolvedValue({
      ...mockUserMustChange,
      mustChangePassword: false,
    });

    const mockPrisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue(mockUserMustChange),
        update: mockUpdate,
      },
    };
    vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

    const res = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: "Password123!",
        newPassword: "NewSecurePass123!",
        confirmNewPassword: "NewSecurePass123!",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.mustChangePassword).toBe(false);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 2 },
        data: expect.objectContaining({
          mustChangePassword: false,
        }),
      })
    );
  });

  // TC-API-AUTH-06: Reject password change if weak password or mismatch
  it("TC-API-AUTH-06: Reject password change if weak password or mismatch", async () => {
    const token = generateToken({
      id: mockUserMustChange.id,
      email: mockUserMustChange.email,
      role: mockUserMustChange.role,
      mustChangePassword: true,
    });

    const mockPrisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue(mockUserMustChange),
      },
    };
    vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

    // Mismatch confirmation
    const resMismatch = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: "Password123!",
        newPassword: "NewSecurePass123!",
        confirmNewPassword: "DifferentPassword123!",
      });

    expect(resMismatch.status).toBe(400);
    expect(resMismatch.body.success).toBe(false);
    expect(resMismatch.body.error.code).toBe("VALIDATION_ERROR");

    // Weak password (no special character or no uppercase)
    const resWeak = await request(app)
      .post("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: "Password123!",
        newPassword: "weakpassword",
        confirmNewPassword: "weakpassword",
      });

    expect(resWeak.status).toBe(400);
    expect(resWeak.body.success).toBe(false);
    expect(resWeak.body.error.code).toBe("VALIDATION_ERROR");
  });

  // TC-API-AUTH-07: Perform session logout
  it("TC-API-AUTH-07: Perform session logout", async () => {
    const token = generateToken({
      id: mockActiveUser.id,
      email: mockActiveUser.email,
      role: mockActiveUser.role,
      mustChangePassword: false,
    });

    const mockPrisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue(mockActiveUser),
      },
    };
    vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

    const res = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toBe("Logged out successfully");
  });
});
