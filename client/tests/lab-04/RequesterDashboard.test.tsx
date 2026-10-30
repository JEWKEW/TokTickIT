import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import RequesterDashboard from "../../src/components/RequesterDashboard.js";
import * as api from "../../src/api.js";

const sample: api.RequesterDashboardData = {
  metrics: { openCount: 2, inProgressCount: 1, resolvedCount: 1, closedCount: 1, waitingForRequesterCount: 1 },
  recentlyUpdated: [{ id: 9, ticketNumber: "TKT-9", summary: "Email trouble", currentStatus: "In Progress", updatedAt: "2026-10-28T10:00:00.000Z" }],
  recentlyResolved: [],
};
const props = { userId: 5, userName: "Ada Requester", onCreateTicket: vi.fn(), onViewTickets: vi.fn(), onSelectTicket: vi.fn() };

describe("Lab 4 Requester Dashboard", () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it("renders authenticated Requester metrics and recent owned Tickets", async () => {
    const fetch = vi.spyOn(api, "fetchRequesterDashboard").mockResolvedValue(sample);
    render(<RequesterDashboard {...props} />);
    expect(await screen.findByText("Welcome, Ada Requester!")).toBeTruthy();
    expect(screen.getByText("Here's the latest on your requests.")).toBeTruthy();
    expect(screen.getByText("TKT-9")).toBeTruthy();
    expect(screen.getByText("2", { selector: "strong" })).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith(5);
  });

  it("exposes an accessible loading state while dashboard data is pending", async () => {
    vi.spyOn(api, "fetchRequesterDashboard").mockReturnValue(new Promise(() => {}));
    render(<RequesterDashboard {...props} />);
    expect(screen.getByRole("status")).toBeTruthy();
    expect(screen.getByText("Loading dashboard…")).toBeTruthy();
  });

  it("routes metric drill-downs and Ticket details to their callbacks", async () => {
    vi.spyOn(api, "fetchRequesterDashboard").mockResolvedValue(sample);
    render(<RequesterDashboard {...props} />);
    fireEvent.click(await screen.findByTestId("metric-in-progress"));
    fireEvent.click(screen.getByTestId("recent-ticket-9"));
    expect(props.onViewTickets).toHaveBeenCalledWith("In Progress");
    expect(props.onSelectTicket).toHaveBeenCalledWith(9);
    fireEvent.click(screen.getByTestId("dashboard-view-tickets"));
    expect(props.onViewTickets).toHaveBeenLastCalledWith();
    expect(screen.getByText("Quick Actions")).toBeTruthy();
    expect(screen.getByTestId("metric-resolved")).toBeTruthy();
    expect(screen.getByTestId("metric-closed")).toBeTruthy();
  });

  it("shows an empty state and can create a Ticket", async () => {
    vi.spyOn(api, "fetchRequesterDashboard").mockResolvedValue({ ...sample, recentlyUpdated: [], recentlyResolved: [] });
    render(<RequesterDashboard {...props} />);
    fireEvent.click(await screen.findByTestId("dashboard-create-ticket"));
    expect(screen.getByTestId("dashboard-empty")).toBeTruthy();
    expect(props.onCreateTicket).toHaveBeenCalled();
  });

  it("shows safe failure feedback and retries", async () => {
    const fetch = vi.spyOn(api, "fetchRequesterDashboard").mockRejectedValueOnce(new Error("Unable to load your dashboard." )).mockResolvedValueOnce(sample);
    render(<RequesterDashboard {...props} />);
    fireEvent.click(await screen.findByText("Retry"));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("TKT-9")).toBeTruthy();
  });
});
