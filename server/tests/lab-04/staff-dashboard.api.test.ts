import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import * as prismaModule from "../../src/prisma.js";

function setup(role = "IT_STAFF") {
  const user = { id: 31, name: "Staff", email: "staff@example.test", role, isActive: true, mustChangePassword: false };
  const db = {
    user: { findUnique: vi.fn().mockResolvedValue(user), groupBy: vi.fn().mockResolvedValue([{ role: "REQUESTER", _count: { _all: 4 } }]) },
    ticket: {
      count: vi.fn().mockImplementation(({ where }: any) => Promise.resolve(where.ownerId === null ? 2 : where.ownerId === 31 ? 3 : 5)),
      groupBy: vi.fn().mockResolvedValue([{ itPriority: "High", _count: { _all: 2 } }, { itPriority: "Low", _count: { _all: 1 } }]),
      findMany: vi.fn().mockResolvedValue([{ id: 7, ticketNumber: "TKT-7", summary: "Network issue", currentStatus: "Open", itPriority: "High", ownerId: null, updatedAt: new Date("2026-10-29T10:00:00Z") }]),
    },
    actionTaken: { findMany: vi.fn().mockResolvedValue([{ id: 5, ticketId: 7, actionDescription: "Checked switch", result: "Port reset", actionDateTime: new Date("2026-10-29T11:00:00Z"), followUpRequired: true, ticket: { ticketNumber: "TKT-7" } }]) },
  };
  vi.spyOn(prismaModule, "getPrisma").mockReturnValue(db as any);
  return db;
}

describe("Lab 4 Staff dashboard API", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("returns status, priority, ownership metrics, recent Tickets, and my Actions Taken", async () => {
    const db = setup();
    const res = await request(app).get("/api/dashboards/staff").set("x-user-id", "31");
    expect(res.status).toBe(200);
    expect(res.body.data.metrics).toEqual({ unassignedCount: 2, myAssignedCount: 3, statusCounts: { New: 5, Open: 5, "In Progress": 5, "Waiting for Requester": 5, Resolved: 5, Closed: 5, Reopened: 5, Cancelled: 5 }, priorityCounts: { High: 2, Low: 1 } });
    expect(db.ticket.groupBy).toHaveBeenCalledWith(expect.objectContaining({ by: ["itPriority"], where: { itPriority: { not: null } } }));
    expect(db.ticket.findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: { updatedAt: "desc" }, take: 5 }));
    expect(db.actionTaken.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { performedById: 31 }, orderBy: { actionDateTime: "desc" }, take: 5 }));
    expect(res.body.data.myRecentActions[0].ticketNumber).toBe("TKT-7");
  });

  it("includes concise active account counts for Administrators only", async () => {
    const db = setup("ADMINISTRATOR");
    const res = await request(app).get("/api/dashboards/staff").set("x-user-id", "31");
    expect(res.status).toBe(200);
    expect(res.body.data.adminUserCounts).toEqual({ activeRequesters: 4, activeStaff: 0, activeAdmins: 0 });
    expect(db.user.groupBy).toHaveBeenCalledWith(expect.objectContaining({ where: { isActive: true } }));
  });

  it("denies Requester access before dashboard queries", async () => {
    const db = setup("REQUESTER");
    const res = await request(app).get("/api/dashboards/staff").set("x-user-id", "31");
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
    expect(db.ticket.count).not.toHaveBeenCalled();
  });

  it("returns stable empty collections and zero counts for an empty work queue", async () => {
    const db = setup();
    db.ticket.count.mockResolvedValue(0);
    db.ticket.groupBy.mockResolvedValue([]);
    db.ticket.findMany.mockResolvedValue([]);
    db.actionTaken.findMany.mockResolvedValue([]);
    const res = await request(app).get("/api/dashboards/staff").set("x-user-id", "31");
    expect(res.status).toBe(200);
    expect(res.body.data.metrics.unassignedCount).toBe(0);
    expect(res.body.data.metrics.myAssignedCount).toBe(0);
    expect(res.body.data.metrics.priorityCounts).toEqual({});
    expect(res.body.data.recentTickets).toEqual([]);
    expect(res.body.data.myRecentActions).toEqual([]);
  });
});
