import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { app } from "../../src/app.js";
import * as prismaModule from "../../src/prisma.js";

const staff = { id: 3, name: "Morgan Staff", email: "staff@example.test", role: "IT_STAFF", mustChangePassword: false, isActive: true };
const requester = { id: 1, name: "Riley Requester", email: "requester@example.test", role: "REQUESTER", mustChangePassword: false, isActive: true };
const otherRequester = { id: 2, name: "Other Requester", email: "other@example.test", role: "REQUESTER", mustChangePassword: false, isActive: true };
const now = new Date("2026-10-01T10:00:00.000Z");
const ticket = { id: 101, requesterId: 1, ownerId: 8 };
const action = {
  id: 5, ticketId: 101, performedById: 3, actionDateTime: new Date("2026-09-30T10:00:00.000Z"),
  actionDescription: "Replaced faulty component", result: "System works", followUpRequired: false,
  followUpNote: null, attachmentNotes: null, createdAt: now, updatedAt: now,
  performedBy: { id: 3, name: staff.name, email: staff.email, role: staff.role },
};
const validBody = {
  actionDescription: action.actionDescription, actionDateTime: "2026-09-30T10:00:00.000Z",
  result: action.result, followUpRequired: false,
};

function setup(user = staff, ticketRecord: any = ticket, actionRecord: any = action) {
  const mock = {
    user: { findUnique: vi.fn().mockResolvedValue(user) },
    ticket: { findUnique: vi.fn().mockResolvedValue(ticketRecord) },
    actionTaken: {
      create: vi.fn().mockResolvedValue(actionRecord),
      findMany: vi.fn().mockResolvedValue([actionRecord]),
      findFirst: vi.fn().mockResolvedValue(actionRecord),
      findUnique: vi.fn().mockResolvedValue(actionRecord),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
  };
  vi.spyOn(prismaModule, "getPrisma").mockReturnValue(mock as any);
  return mock;
}

describe("Lab 4 Actions Taken API", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("creates an action under the URL Ticket and derives the performer from authentication", async () => {
    const db = setup();
    const res = await request(app).post("/api/tickets/101/actions-taken").set("x-user-id", "3")
      .send({ ...validBody, performedById: 999, ticketId: 999 });
    expect(res.status).toBe(201);
    expect(db.actionTaken.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ ticketId: 101, performedById: 3 }),
    }));
    expect(res.body.data.ticketId).toBe(101);
  });

  it("rejects invalid fields and requires a nonblank follow-up note when selected", async () => {
    const db = setup();
    const res = await request(app).post("/api/tickets/101/actions-taken").set("x-user-id", "3")
      .send({ ...validBody, followUpRequired: true, followUpNote: "  " });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(db.actionTaken.create).not.toHaveBeenCalled();
  });

  it("blocks Requester writes and reads by non-owners", async () => {
    const db = setup(requester);
    const write = await request(app).post("/api/tickets/101/actions-taken").set("x-user-id", "1").send(validBody);
    expect(write.status).toBe(403);
    setup(otherRequester);
    const read = await request(app).get("/api/tickets/101/actions-taken").set("x-user-id", "2");
    expect(read.status).toBe(403);
    expect(db.actionTaken.create).not.toHaveBeenCalled();
    expect(db.actionTaken.findMany).not.toHaveBeenCalled();
  });

  it("lets the owning Requester read actions and lets staff read any Ticket", async () => {
    const ownDb = setup(requester);
    const own = await request(app).get("/api/tickets/101/actions-taken").set("x-user-id", "1");
    expect(own.status).toBe(200);
    expect(own.body.data).toHaveLength(1);
    expect(ownDb.actionTaken.findMany).toHaveBeenCalled();
    const staffDb = setup(staff, { ...ticket, requesterId: 55 });
    const any = await request(app).get("/api/tickets/101/actions-taken").set("x-user-id", "3");
    expect(any.status).toBe(200);
    expect(staffDb.actionTaken.findMany).toHaveBeenCalled();
  });

  it("updates allowed fields with an atomic expectedUpdatedAt check and preserves ticket and performer", async () => {
    const db = setup();
    const res = await request(app).patch("/api/tickets/101/actions-taken/5").set("x-user-id", "3")
      .send({ ...validBody, actionDescription: "Updated work", expectedUpdatedAt: now.toISOString(), ticketId: 44, performedById: 44 });
    expect(res.status).toBe(200);
    expect(db.actionTaken.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 5, ticketId: 101, updatedAt: now },
      data: expect.not.objectContaining({ ticketId: 44, performedById: 44 }),
    }));
  });

  it("returns 409 when an update timestamp is stale", async () => {
    const db = setup();
    db.actionTaken.updateMany.mockResolvedValue({ count: 0 });
    const res = await request(app).patch("/api/tickets/101/actions-taken/5").set("x-user-id", "3")
      .send({ ...validBody, expectedUpdatedAt: now.toISOString() });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("STALE_UPDATE");
  });

  it("returns safe 404s for missing Tickets and actions outside the URL Ticket", async () => {
    const noTicket = setup(staff, null);
    const missing = await request(app).post("/api/tickets/404/actions-taken").set("x-user-id", "3").send(validBody);
    expect(missing.status).toBe(404);
    expect(noTicket.actionTaken.create).not.toHaveBeenCalled();
    const mismatch = setup(staff, ticket, null);
    const absent = await request(app).patch("/api/tickets/101/actions-taken/999").set("x-user-id", "3")
      .send({ ...validBody, expectedUpdatedAt: now.toISOString() });
    expect(absent.status).toBe(404);
    expect(mismatch.actionTaken.updateMany).not.toHaveBeenCalled();
  });
});
