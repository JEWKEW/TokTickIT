import { jsx as _jsx } from "react/jsx-runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import StaffDashboard from "../../src/components/StaffDashboard.js";
import * as api from "../../src/api.js";
const sample = {
    metrics: { unassignedCount: 2, myAssignedCount: 3, statusCounts: { New: 4, Open: 5, "In Progress": 6, "Waiting for Requester": 2, Resolved: 1, Closed: 3, Reopened: 1, Cancelled: 0 }, priorityCounts: { High: 2, Low: 3 } },
    recentTickets: [{ id: 7, ticketNumber: "TKT-7", summary: "Network issue", currentStatus: "Open", itPriority: "High", ownerId: null, owner: null, updatedAt: "2026-10-29T10:00:00.000Z" }],
    myRecentActions: [{ id: 5, ticketId: 7, actionDescription: "Checked switch", result: "Port reset", actionDateTime: "2026-10-29T11:00:00.000Z", followUpRequired: true, ticketNumber: "TKT-7" }],
};
const props = { userId: 31, userName: "Michael Staff", onQueue: vi.fn(), onCreateTicket: vi.fn(), onSelectTicket: vi.fn() };
describe("Lab 4 Staff Dashboard", () => {
    beforeEach(() => { vi.restoreAllMocks(); });
    it("renders metric cards, all status counts, recent Tickets and Actions Taken", async () => {
        vi.spyOn(api, "fetchStaffDashboard").mockResolvedValue(sample);
        render(_jsx(StaffDashboard, { ...props }));
        expect(await screen.findByText("IT Staff Operational Dashboard")).toBeTruthy();
        expect(screen.getByTestId("staff-metric-new").textContent).toContain("4");
        expect(screen.getByTestId("staff-status-cancelled").textContent).toContain("0");
        expect(screen.getAllByText("TKT-7")).toHaveLength(2);
        expect(screen.getByText("Checked switch")).toBeTruthy();
        expect(screen.getByText("Follow-up required")).toBeTruthy();
    });
    it("routes metric, priority, queue and Ticket actions to their callbacks", async () => {
        vi.spyOn(api, "fetchStaffDashboard").mockResolvedValue(sample);
        render(_jsx(StaffDashboard, { ...props }));
        fireEvent.click(await screen.findByTestId("staff-metric-my-assigned"));
        expect(props.onQueue).toHaveBeenCalledWith({ ownerId: "31" });
        fireEvent.click(screen.getByTestId("staff-status-in-progress"));
        expect(props.onQueue).toHaveBeenCalledWith({ status: "In Progress" });
        fireEvent.click(screen.getByRole("button", { name: /High: 2/ }));
        expect(props.onQueue).toHaveBeenCalledWith({ itPriority: "High" });
        fireEvent.click(screen.getByTestId("staff-recent-ticket-7"));
        expect(props.onSelectTicket).toHaveBeenCalledWith(7);
        fireEvent.click(screen.getByTestId("staff-action-5"));
        expect(props.onSelectTicket).toHaveBeenLastCalledWith(7);
        fireEvent.click(screen.getByText("＋ Create Ticket"));
        expect(props.onCreateTicket).toHaveBeenCalled();
    });
    it("shows loading, empty, forbidden and retryable failure states", async () => {
        vi.spyOn(api, "fetchStaffDashboard").mockReturnValue(new Promise(() => { }));
        const loading = render(_jsx(StaffDashboard, { ...props }));
        expect(screen.getByTestId("staff-dashboard-loading")).toBeTruthy();
        loading.unmount();
        vi.spyOn(api, "fetchStaffDashboard").mockResolvedValue({ ...sample, recentTickets: [], myRecentActions: [] });
        const empty = render(_jsx(StaffDashboard, { ...props }));
        expect(await screen.findByTestId("staff-recent-tickets-empty")).toBeTruthy();
        expect(screen.getByTestId("staff-actions-empty")).toBeTruthy();
        empty.unmount();
        vi.spyOn(api, "fetchStaffDashboard").mockRejectedValue(new api.DashboardFetchError("Forbidden", 403));
        const denied = render(_jsx(StaffDashboard, { ...props }));
        expect(await screen.findByTestId("staff-dashboard-forbidden")).toBeTruthy();
        denied.unmount();
        const fetch = vi.spyOn(api, "fetchStaffDashboard").mockRejectedValueOnce(new Error("Network unavailable")).mockResolvedValueOnce(sample);
        render(_jsx(StaffDashboard, { ...props }));
        fireEvent.click(await screen.findByText("Retry"));
        expect(await screen.findByText("Checked switch")).toBeTruthy();
        expect(fetch).toHaveBeenCalledTimes(2);
    });
});
