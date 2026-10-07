import { describe, it } from "vitest";

describe("Lab 4 Ticket workflow API", () => {
  it.todo("accepts each documented status transition and rejects each disallowed transition");
  it.todo("enforces Requester, IT Staff, and Administrator write permissions");
  it.todo("keeps Requester resolution indication advisory");
  it.todo("rejects stale status updates with 409 Conflict");
  it.todo("accepts only null or active staff/admin Ticket owners");
});
