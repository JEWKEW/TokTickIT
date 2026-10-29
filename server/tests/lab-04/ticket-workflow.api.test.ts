import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import * as prismaModule from "../../src/prisma.js";

const statusValues = ["New", "Open", "In Progress", "Waiting for Requester", "Resolved", "Closed", "Reopened", "Cancelled"];
const allowed: Record<string, string[]> = {
  "New": ["Open", "In Progress", "Cancelled"],
  "Open": ["In Progress", "Waiting for Requester", "Resolved", "Cancelled"],
  "In Progress": ["Waiting for Requester", "Resolved", "Cancelled"],
  "Waiting for Requester": ["In Progress", "Resolved", "Cancelled"],
  "Resolved": ["Closed", "Reopened"],
  "Closed": [],
  "Reopened": ["In Progress", "Resolved", "Cancelled"],
  "Cancelled": [],
};
const now = new Date("2026-10-07T04:00:00.000Z");
const staff = { id: 3, name: "Morgan Staff", email: "staff@example.test", role: "IT_STAFF", mustChangePassword: false, isActive: true };
const admin = { ...staff, id: 4, role: "ADMINISTRATOR" };
const requester = { ...staff, id: 1, role: "REQUESTER" };
const roles = [
  { label: "IT Staff", user: staff },
  { label: "Administrator", user: admin },
  { label: "Requester", user: requester },
];

function setup(user: any = staff, status = "New", updatedAt = now) {
  const ticket = { id: 12, requesterId: 1, ownerId: 8, currentStatus: status, updatedAt };
  const mock = {
    user: { findUnique: vi.fn().mockResolvedValue(user) },
    ticket: {
      findUnique: vi.fn().mockResolvedValue(ticket),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  };
  vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mock as any);
  return mock;
}

describe("Lab 4 Ticket workflow API", () => {
  beforeEach(() => vi.restoreAllMocks());

  it.each(roles.flatMap(({ label, user }) => statusValues.flatMap((from) => statusValues.map((to) => [label, user, from, to] as const)) ))(
    "enforces the status matrix for %s: %s -> %s",
    async (_label, user, from, to) => {
      const db = setup(user, from);
      const isAllowed = user.role !== "REQUESTER" && allowed[from].includes(to);
      const updated = { id: 12, requesterId: 1, currentStatus: to, updatedAt: new Date(now.getTime() + 1) };
      db.ticket.findUnique.mockResolvedValueOnce({ id: 12, requesterId: 1, currentStatus: from, updatedAt: now }).mockResolvedValueOnce(updated);
      const res = await request(app).patch("/api/tickets/12/status").set("x-user-id", String(user.id))
        .send({ status: to, expectedUpdatedAt: now.toISOString() });
      if (isAllowed) {
        expect(res.status).toBe(200);
        expect(res.body.data.currentStatus).toBe(to);
        expect(db.ticket.updateMany).toHaveBeenCalledWith(expect.objectContaining({
          where: { id: 12, updatedAt: now }, data: expect.objectContaining({ currentStatus: to }),
        }));
      } else if (user.role === "REQUESTER") {
        expect(res.status).toBe(403);
        expect(res.body.error.code).toBe("FORBIDDEN");
        expect(db.ticket.findUnique).not.toHaveBeenCalled();
        expect(db.ticket.updateMany).not.toHaveBeenCalled();
      } else {
        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe("INVALID_TRANSITION");
        expect(db.ticket.updateMany).not.toHaveBeenCalled();
      }
    },
  );

  it("requires a valid expectedUpdatedAt value", async () => {
    const db = setup();
    const res = await request(app).patch("/api/tickets/12/status").set("x-user-id", "3").send({ status: "Open" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(db.ticket.updateMany).not.toHaveBeenCalled();
  });

  it("normalizes legacy Lab 3 underscore status values to canonical display names", async () => {
    const db = setup(staff, "New");
    db.ticket.findUnique.mockResolvedValueOnce({ id: 12, requesterId: 1, currentStatus: "New", updatedAt: now })
      .mockResolvedValueOnce({ id: 12, currentStatus: "In Progress", updatedAt: now });
    const res = await request(app).patch("/api/tickets/12/status").set("x-user-id", "3")
      .send({ status: "in_progress", expectedUpdatedAt: now.toISOString() });
    expect(res.status).toBe(200);
    expect(db.ticket.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ currentStatus: "In Progress" }) }));
  });

  it("returns 409 on a stale timestamp without changing the Ticket", async () => {
    const db = setup(staff, "New", new Date(now.getTime() + 1000));
    db.ticket.updateMany.mockResolvedValue({ count: 0 });
    const res = await request(app).patch("/api/tickets/12/status").set("x-user-id", "3")
      .send({ status: "Open", expectedUpdatedAt: now.toISOString() });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("STALE_UPDATE");
  });

  it("keeps Requester resolution indication advisory and rejects non-owner access", async () => {
    const staffDb = setup(staff, "In Progress");
    const staffAttempt = await request(app).patch("/api/tickets/12/indicate-resolved").set("x-user-id", "3");
    expect(staffAttempt.status).toBe(403);
    expect(staffDb.ticket.findUnique).not.toHaveBeenCalled();

    const db = setup(requester, "In Progress");
    db.ticket.findUnique.mockResolvedValue({ id: 12, requesterId: 1, currentStatus: "In Progress", updatedAt: now });
    (db.ticket as any).update = vi.fn().mockResolvedValue({
      id: 12, requesterResolvedIndicated: true, requesterResolvedAt: now, currentStatus: "In Progress",
    });
    const response = await request(app).patch("/api/tickets/12/indicate-resolved").set("x-user-id", "1");
    expect(response.status).toBe(200);
    expect(response.body.data.currentStatus).toBe("In Progress");
    expect((db.ticket as any).update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.not.objectContaining({ currentStatus: "Resolved" }) }));

    const other = setup({ ...requester, id: 2 }, "In Progress");
    other.ticket.findUnique.mockResolvedValue({ id: 12, requesterId: 1, currentStatus: "In Progress" });
    const forbidden = await request(app).patch("/api/tickets/12/indicate-resolved").set("x-user-id", "2");
    expect(forbidden.status).toBe(403);
    expect((other.ticket as any).update).toBeUndefined();
  });
});
