import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import * as prismaModule from "../../src/prisma.js";

function setup(role = "REQUESTER", counts = [3, 1, 1, 1, 1], recent: any[] = [{ id: 9, ticketNumber: "TKT-9", currentStatus: "In Progress" }], resolved: any[] = []) {
  const user = { id: 21, name: "Requester", email: "r@example.test", role, isActive: true, mustChangePassword: false };
  const db = {
    user: { findUnique: vi.fn().mockResolvedValue(user) },
    ticket: {
      count: vi.fn().mockImplementation(() => Promise.resolve(counts.shift() ?? 0)),
      findMany: vi.fn().mockResolvedValueOnce(recent).mockResolvedValueOnce(resolved),
    },
  };
  vi.spyOn(prismaModule, "getPrisma").mockReturnValue(db as any);
  return db;
}

describe("Lab 4 Requester dashboard API", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("returns concise metrics and two recent lists scoped to the authenticated Requester", async () => {
    const db = setup("REQUESTER", [7, 2, 3, 1, 4], [{ id: 9, ticketNumber: "TKT-9" }], [{ id: 8, ticketNumber: "TKT-8" }]);
    const res = await request(app).get("/api/dashboards/requester").set("x-user-id", "21");
    expect(res.status).toBe(200);
    expect(res.body.data.metrics).toEqual({ openCount: 7, inProgressCount: 2, resolvedCount: 1, closedCount: 4, waitingForRequesterCount: 3 });
    expect(res.body.data.recentlyUpdated).toEqual([{ id: 9, ticketNumber: "TKT-9" }]);
    expect(db.ticket.count).toHaveBeenCalledWith({ where: { requesterId: 21, currentStatus: { notIn: ["Resolved", "Closed", "Cancelled"] } } });
    expect(db.ticket.count).toHaveBeenCalledWith({ where: { requesterId: 21, currentStatus: "Resolved" } });
    expect(db.ticket.count).toHaveBeenCalledWith({ where: { requesterId: 21, currentStatus: "Closed" } });
    expect(db.ticket.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { requesterId: 21 }, orderBy: { updatedAt: "desc" }, take: 5 }));
    expect(db.ticket.findMany.mock.calls[1][0].where).toEqual(expect.objectContaining({ requesterId: 21, currentStatus: { in: ["Resolved", "Closed"] }, updatedAt: expect.objectContaining({ gte: expect.any(Date) }) }));
  });

  it("returns zero counts and empty collections when the Requester has no Tickets", async () => {
    const db = setup("REQUESTER", [0, 0, 0, 0, 0], [], []);
    const res = await request(app).get("/api/dashboards/requester").set("x-user-id", "21");
    expect(res.status).toBe(200);
    expect(res.body.data.metrics).toEqual({ openCount: 0, inProgressCount: 0, resolvedCount: 0, closedCount: 0, waitingForRequesterCount: 0 });
    expect(res.body.data.recentlyUpdated).toEqual([]);
    expect(res.body.data.recentlyResolved).toEqual([]);
    expect(db.ticket.count).toHaveBeenCalledTimes(5);
  });

  it.each(["IT_STAFF", "ADMINISTRATOR"])("denies %s access", async (role) => {
    const db = setup(role);
    const res = await request(app).get("/api/dashboards/requester").set("x-user-id", "21");
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
    expect(db.ticket.count).not.toHaveBeenCalled();
  });

  it("supports dashboard drill-down filters without changing exact status filters", async () => {
    const user = { id: 21, name: "Requester", email: "r@example.test", role: "REQUESTER", isActive: true, mustChangePassword: false };
    const db = { user: { findUnique: vi.fn().mockResolvedValue(user) }, ticket: { findMany: vi.fn().mockResolvedValue([]), count: vi.fn().mockResolvedValue(0) } };
    vi.spyOn(prismaModule, "getPrisma").mockReturnValue(db as any);
    await request(app).get("/api/tickets/my?status=open-tickets").set("x-user-id", "21");
    expect(db.ticket.findMany).toHaveBeenLastCalledWith(expect.objectContaining({ where: { requesterId: 21, currentStatus: { notIn: ["Resolved", "Closed", "Cancelled"] } } }));
    await request(app).get("/api/tickets/my?status=Open").set("x-user-id", "21");
    expect(db.ticket.findMany).toHaveBeenLastCalledWith(expect.objectContaining({ where: { requesterId: 21, currentStatus: { equals: "Open", mode: "insensitive" } } }));
  });
});
