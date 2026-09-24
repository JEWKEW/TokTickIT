import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import * as prismaModule from "../../src/prisma.js";
import { generateToken } from "../../src/auth.js";

describe("Lab 03 Administrator User Management Integration Tests (users-admin.api.test.ts)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockAdminToken = generateToken({
    id: 1,
    email: "admin@toktickit.com",
    role: "ADMINISTRATOR",
    mustChangePassword: false,
  });

  const mockStaffToken = generateToken({
    id: 2,
    email: "staff@toktickit.com",
    role: "IT_STAFF",
    mustChangePassword: false,
  });

  const mockRequesterToken = generateToken({
    id: 3,
    email: "requester@toktickit.com",
    role: "REQUESTER",
    mustChangePassword: false,
  });

  const mockAdminUser = {
    id: 1,
    name: "System Administrator",
    email: "admin@toktickit.com",
    role: "ADMINISTRATOR",
    mustChangePassword: false,
    isActive: true,
    createdAt: "2026-09-01T08:00:00Z",
    passwordHash: "$2a$10$hashedpassword1",
  };

  const mockStaffUser = {
    id: 2,
    name: "Michael Staff",
    email: "staff@toktickit.com",
    role: "IT_STAFF",
    mustChangePassword: false,
    isActive: true,
    createdAt: "2026-09-02T08:00:00Z",
    passwordHash: "$2a$10$hashedpassword2",
  };

  const mockRequesterUser = {
    id: 3,
    name: "Jennifer Requester",
    email: "requester@toktickit.com",
    role: "REQUESTER",
    mustChangePassword: false,
    isActive: true,
    createdAt: "2026-09-03T08:00:00Z",
    passwordHash: "$2a$10$hashedpassword3",
  };

  // Helper mock setup for auth middleware
  function setupAuthMock(mockUsersMap: Record<number, any>) {
    return {
      user: {
        findUnique: vi.fn().mockImplementation(({ where }) => {
          const u = mockUsersMap[where.id];
          return Promise.resolve(u || null);
        }),
        findFirst: vi.fn().mockImplementation(({ where }) => {
          if (where.email) {
            const searchEmail = typeof where.email === "string" ? where.email : where.email.equals;
            const found = Object.values(mockUsersMap).find(
              (u: any) => u.email.toLowerCase() === (searchEmail || "").toLowerCase() && (!where.id?.not || u.id !== where.id.not)
            );
            return Promise.resolve(found || null);
          }
          return Promise.resolve(null);
        }),
        findMany: vi.fn().mockImplementation(({ where }) => {
          let list = Object.values(mockUsersMap);
          if (where?.role) {
            list = list.filter((u: any) => u.role === where.role);
          }
          if (where?.isActive !== undefined) {
            list = list.filter((u: any) => u.isActive === where.isActive);
          }
          if (where?.id?.not) {
            list = list.filter((u: any) => u.id !== where.id.not);
          }
          return Promise.resolve(list);
        }),
        create: vi.fn().mockImplementation(({ data }) => {
          const created = {
            id: 99,
            name: data.name,
            email: data.email,
            role: data.role,
            mustChangePassword: data.mustChangePassword,
            isActive: data.isActive,
            createdAt: new Date().toISOString(),
          };
          return Promise.resolve(created);
        }),
        update: vi.fn().mockImplementation(({ where, data }) => {
          const existing = mockUsersMap[where.id] || {};
          const updated = {
            ...existing,
            ...data,
          };
          delete updated.passwordHash;
          return Promise.resolve(updated);
        }),
      },
    };
  }

  // TC-API-ADMIN-01: Admin lists users with keyword search and role filter
  it("TC-API-ADMIN-01: Admin lists users with keyword search and role filter", async () => {
    const mockPrisma = setupAuthMock({
      1: mockAdminUser,
      2: mockStaffUser,
      3: mockRequesterUser,
    });
    vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

    const res = await request(app)
      .get("/api/admin/users?role=IT_STAFF")
      .set("Authorization", `Bearer ${mockAdminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].role).toBe("IT_STAFF");
  });

  // TC-API-ADMIN-02: Admin creates new IT Staff user account
  it("TC-API-ADMIN-02: Admin creates new IT Staff user account", async () => {
    const mockPrisma = setupAuthMock({
      1: mockAdminUser,
    });
    vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

    const res = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${mockAdminToken}`)
      .send({
        name: "Alex Thompson",
        email: "alex.thompson@toktickit.com",
        role: "IT_STAFF",
        isActive: true,
        initialPassword: "InitialPassword123!",
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Alex Thompson");
    expect(res.body.data.email).toBe("alex.thompson@toktickit.com");
    expect(res.body.data.role).toBe("IT_STAFF");
    expect(res.body.data.mustChangePassword).toBe(true);
    expect(res.body.data.isActive).toBe(true);
  });

  // TC-API-ADMIN-03: Reject user creation with duplicate email address
  it("TC-API-ADMIN-03: Reject user creation with duplicate email address", async () => {
    const mockPrisma = setupAuthMock({
      1: mockAdminUser,
      2: mockStaffUser,
    });
    vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

    const res = await request(app)
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${mockAdminToken}`)
      .send({
        name: "Duplicate User",
        email: "staff@toktickit.com",
        role: "REQUESTER",
        initialPassword: "InitialPassword123!",
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("CONFLICT");
    expect(res.body.error.message).toMatch(/already exists/i);
  });

  // TC-API-ADMIN-04: Admin updates user name, email, and role
  it("TC-API-ADMIN-04: Admin updates user name, email, and role", async () => {
    const mockPrisma = setupAuthMock({
      1: mockAdminUser,
      2: mockStaffUser,
    });
    vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

    const res = await request(app)
      .patch("/api/admin/users/2")
      .set("Authorization", `Bearer ${mockAdminToken}`)
      .send({
        name: "Michael Staff Updated",
        role: "ADMINISTRATOR",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Michael Staff Updated");
    expect(res.body.data.role).toBe("ADMINISTRATOR");
  });

  // TC-API-ADMIN-05: Reject Admin self-deactivation attempt
  it("TC-API-ADMIN-05: Reject Admin self-deactivation attempt", async () => {
    const mockPrisma = setupAuthMock({
      1: mockAdminUser,
    });
    vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

    const res = await request(app)
      .patch("/api/admin/users/1")
      .set("Authorization", `Bearer ${mockAdminToken}`)
      .send({
        isActive: false,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.message).toMatch(/Cannot deactivate your own account/i);
  });

  // TC-API-ADMIN-06: Reject deactivation of last active Administrator
  it("TC-API-ADMIN-06: Reject deactivation of last active Administrator", async () => {
    const secondAdminUser = {
      id: 4,
      name: "Second Admin",
      email: "admin2@toktickit.com",
      role: "ADMINISTRATOR",
      mustChangePassword: false,
      isActive: true,
      passwordHash: "$2a$10$hashedpassword4",
    };

    const mockPrisma = setupAuthMock({
      1: mockAdminUser,
      4: secondAdminUser,
    });

    // Mock findMany to return [] when querying other active admins for id=4
    mockPrisma.user.findMany = vi.fn().mockImplementation(({ where }) => {
      if (where?.id?.not === 4 && where?.role === "ADMINISTRATOR" && where?.isActive === true) {
        // If user 1 was deactivated or not active, returns 0
        return Promise.resolve([]);
      }
      return Promise.resolve([mockAdminUser, secondAdminUser]);
    });

    vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

    const res = await request(app)
      .patch("/api/admin/users/4")
      .set("Authorization", `Bearer ${mockAdminToken}`)
      .send({
        isActive: false,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(res.body.error.message).toMatch(/last active Administrator/i);
  });

  // TC-API-ADMIN-07: Admin sets new initial password for user
  it("TC-API-ADMIN-07: Admin sets new initial password for user", async () => {
    const mockPrisma = setupAuthMock({
      1: mockAdminUser,
      2: mockStaffUser,
    });
    vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

    const res = await request(app)
      .post("/api/admin/users/2/reset-password")
      .set("Authorization", `Bearer ${mockAdminToken}`)
      .send({
        initialPassword: "NewInitialPass123!",
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.mustChangePassword).toBe(true);
  });

  // TC-API-ADMIN-08: Non-Administrator access attempt returns 403 Forbidden
  it("TC-API-ADMIN-08: Non-Administrator access attempt returns 403 Forbidden", async () => {
    const mockPrisma = setupAuthMock({
      2: mockStaffUser,
    });
    vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mockPrisma as any);

    const res = await request(app)
      .get("/api/admin/users")
      .set("Authorization", `Bearer ${mockStaffToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });
});
