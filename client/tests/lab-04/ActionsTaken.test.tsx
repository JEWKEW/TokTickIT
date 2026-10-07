import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ActionsTakenPanel from "../../src/components/ActionsTakenPanel.js";
import { ActionTaken } from "../../src/api.js";
import * as api from "../../src/api.js";

vi.mock("../../src/api.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/api.js")>();
  return {
    ...actual,
    fetchActionsTaken: vi.fn(),
    createActionTaken: vi.fn(),
    updateActionTaken: vi.fn(),
  };
});

const row: ActionTaken = {
  id: 7, ticketId: 12, performedById: 3,
  performedBy: { id: 3, name: "Taylor Support", role: "IT_STAFF" },
  actionDateTime: "2026-09-30T10:00:00.000Z", actionDescription: "Replaced the faulty cable",
  result: "Display is stable", followUpRequired: true, followUpNote: "Check again tomorrow",
  attachmentNotes: "See repair photo", createdAt: "2026-09-30T11:00:00.000Z", updatedAt: "2026-09-30T11:00:00.000Z",
};

const props = { ticketId: 12, userId: 3, userRole: "IT_STAFF" };

describe("Lab 4 Actions Taken UI", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.fetchActionsTaken).mockResolvedValue([row]);
    vi.mocked(api.createActionTaken).mockResolvedValue(row);
    vi.mocked(api.updateActionTaken).mockResolvedValue(row);
  });

  it("loads and displays action time, work, result, performer, follow-up, and attachment notes", async () => {
    render(<ActionsTakenPanel {...props} />);
    expect(await screen.findByText("Replaced the faulty cable")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Sep 30, 2026/ })).toBeInTheDocument();
    expect(screen.getByText("Display is stable")).toBeInTheDocument();
    expect(screen.getByText(/Taylor Support/)).toBeInTheDocument();
    expect(screen.getByText("Check again tomorrow")).toBeInTheDocument();
    expect(screen.getByText("See repair photo")).toBeInTheDocument();
  });

  it("requires a follow-up note when selected and sends an ISO timestamp when valid", async () => {
    const user = userEvent.setup();
    vi.mocked(api.fetchActionsTaken).mockResolvedValue([]);
    render(<ActionsTakenPanel {...props} />);
    const description = await screen.findByLabelText("Action description");
    await user.type(description, "Restarted network equipment");
    await user.type(screen.getByLabelText("Result"), "Connection restored");
    await user.click(screen.getByLabelText("Follow-up required"));
    await user.click(screen.getByRole("button", { name: "Record Action" }));
    expect(await screen.findByText("Enter a follow-up note when follow-up is required.")).toBeInTheDocument();
    expect(api.createActionTaken).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText(/Follow-up note/), "Verify next shift");
    await user.click(screen.getByRole("button", { name: "Record Action" }));
    await waitFor(() => expect(api.createActionTaken).toHaveBeenCalledWith(12, expect.objectContaining({
      actionDescription: "Restarted network equipment", result: "Connection restored",
      followUpRequired: true, followUpNote: "Verify next shift",
      actionDateTime: expect.stringMatching(/^\d{4}-\d\d-\d\dT/),
    }), 3));
  });

  it("shows Requester actions read-only without create or edit controls", async () => {
    render(<ActionsTakenPanel ticketId={12} userId={1} userRole="REQUESTER" />);
    expect(await screen.findByText("Replaced the faulty cable")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Record Action" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Action description")).not.toBeInTheDocument();
  });

  it("edits action fields using the version that was loaded", async () => {
    const user = userEvent.setup();
    render(<ActionsTakenPanel {...props} />);
    await user.click(await screen.findByRole("button", { name: "Edit" }));
    await user.clear(screen.getByLabelText("Action description"));
    await user.type(screen.getByLabelText("Action description"), "Updated repair detail");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));
    await waitFor(() => expect(api.updateActionTaken).toHaveBeenCalledWith(12, 7, expect.objectContaining({
      actionDescription: "Updated repair detail", followUpRequired: true, followUpNote: "Check again tomorrow",
    }), row.updatedAt, 3));
  });

  it("keeps entered values after recoverable failure and blocks a repeated submit", async () => {
    const user = userEvent.setup();
    vi.mocked(api.fetchActionsTaken).mockResolvedValue([]);
    let fail!: (error: Error) => void;
    vi.mocked(api.createActionTaken).mockImplementationOnce(() => new Promise((_resolve, reject) => { fail = reject; }));
    render(<ActionsTakenPanel {...props} />);
    const description = await screen.findByLabelText("Action description");
    await user.type(description, "Fixed the issue");
    await user.type(screen.getByLabelText("Result"), "Verified");
    const submit = screen.getByRole("button", { name: "Record Action" });
    fireEvent.click(submit);
    fireEvent.click(submit);
    await waitFor(() => expect(api.createActionTaken).toHaveBeenCalledTimes(1));
    fail(new Error("Service is temporarily unavailable"));
    expect(await screen.findByText("Service is temporarily unavailable")).toBeInTheDocument();
    expect(screen.getByLabelText("Action description")).toHaveValue("Fixed the issue");
    expect(screen.getByLabelText("Result")).toHaveValue("Verified");
  });

  it("shows stale-update feedback, reloads the list, and preserves edit values", async () => {
    const user = userEvent.setup();
    const stale = Object.assign(new Error("Conflict"), { code: "STALE_UPDATE" });
    vi.mocked(api.updateActionTaken).mockRejectedValueOnce(stale);
    render(<ActionsTakenPanel {...props} />);
    await user.click(await screen.findByRole("button", { name: "Edit" }));
    const description = screen.getByLabelText("Action description");
    await user.clear(description);
    await user.type(description, "My corrected work notes");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));
    expect(await screen.findByText(/changed while you were editing/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Action description")).toHaveValue("My corrected work notes");
    expect(api.fetchActionsTaken).toHaveBeenCalledTimes(2);
  });
});
