import { jsx as _jsx } from "react/jsx-runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import TicketDetail, { getPermittedStatusTransitions } from "../../src/components/TicketDetail.js";
import * as api from "../../src/api.js";
const matrix = {
    "New": ["Open", "In Progress", "Cancelled"],
    "Open": ["In Progress", "Waiting for Requester", "Resolved", "Cancelled"],
    "In Progress": ["Waiting for Requester", "Resolved", "Cancelled"],
    "Waiting for Requester": ["In Progress", "Resolved", "Cancelled"],
    "Resolved": ["Closed", "Reopened"],
    "Closed": [],
    "Reopened": ["In Progress", "Resolved", "Cancelled"],
    "Cancelled": [],
};
const version = "2026-10-07T04:00:00.000Z";
const ticket = {
    id: 12, ticketNumber: "TKT-2026-000012", summary: "VPN unavailable", description: "Cannot connect",
    requestedPriority: "High", itPriority: "High", currentStatus: "New", requesterId: 1,
    ownerId: 3, categoryId: 1, relatedSystemId: 1, category: { id: 1, name: "Network" },
    relatedSystem: { id: 1, name: "VPN" }, requester: { id: 1, name: "Requester", email: "requester@example.test", isActive: true },
    owner: { id: 3, name: "Staff", email: "staff@example.test" }, attachments: [],
    requesterResolvedIndicated: false, requesterResolvedAt: null, createdAt: version, updatedAt: version,
};
function mockDetail() {
    vi.spyOn(api, "fetchTicketById").mockResolvedValue(ticket);
    vi.spyOn(api, "fetchPublicComments").mockResolvedValue([]);
    vi.spyOn(api, "fetchInternalNotes").mockResolvedValue([]);
    vi.spyOn(api, "fetchRequesters").mockResolvedValue([]);
    vi.spyOn(api, "updateTicketStatus").mockResolvedValue({ ...ticket, currentStatus: "In Progress" });
    vi.spyOn(api, "indicateTicketResolved").mockResolvedValue({
        id: ticket.id, requesterResolvedIndicated: true, requesterResolvedAt: version, currentStatus: ticket.currentStatus,
    });
}
describe("Lab 4 Ticket workflow UI", () => {
    beforeEach(() => vi.restoreAllMocks());
    it("shows only the documented matrix transitions for all eight statuses", () => {
        for (const [status, expected] of Object.entries(matrix)) {
            expect(getPermittedStatusTransitions(status)).toEqual(expected);
        }
        expect(getPermittedStatusTransitions("unknown")).toEqual([]);
    });
    it("submits a selected permitted status with its version and refreshes the Ticket summary", async () => {
        mockDetail();
        render(_jsx(TicketDetail, { ticketId: 12, userId: 3, userRole: "IT_STAFF", onBack: vi.fn() }));
        const select = await screen.findByTestId("status-select");
        expect(Array.from(select.options).map((option) => option.value)).toEqual([
            "New", "Open", "In Progress", "Cancelled",
        ]);
        fireEvent.change(select, { target: { value: "In Progress" } });
        expect(api.updateTicketStatus).not.toHaveBeenCalled();
        fireEvent.click(screen.getByTestId("update-status-btn"));
        await waitFor(() => expect(api.updateTicketStatus).toHaveBeenCalledWith(12, "In Progress", version, 3));
        await waitFor(() => expect(screen.getByTestId("status-select").value).toBe("In Progress"));
        expect(screen.queryByTestId("update-status-btn")).not.toBeInTheDocument();
    });
    it("refreshes the Ticket after stale status conflict and shows safe feedback", async () => {
        mockDetail();
        const fresh = { ...ticket, currentStatus: "Open", updatedAt: "2026-10-07T04:05:00.000Z" };
        vi.mocked(api.fetchTicketById).mockReset().mockResolvedValueOnce(ticket).mockResolvedValueOnce(fresh);
        vi.mocked(api.updateTicketStatus).mockRejectedValueOnce(Object.assign(new Error("Stale"), { code: "STALE_UPDATE" }));
        render(_jsx(TicketDetail, { ticketId: 12, userId: 3, userRole: "IT_STAFF", onBack: vi.fn() }));
        fireEvent.change(await screen.findByTestId("status-select"), { target: { value: "In Progress" } });
        fireEvent.click(screen.getByTestId("update-status-btn"));
        expect(await screen.findByTestId("operation-error")).toHaveTextContent("modified by another user");
        await waitFor(() => expect(screen.getByTestId("status-select").value).toBe("Open"));
        expect(api.fetchTicketById).toHaveBeenCalledTimes(2);
    });
    it("keeps Requester indication advisory and exposes no formal status controls", async () => {
        mockDetail();
        render(_jsx(TicketDetail, { ticketId: 12, userId: 1, userRole: "REQUESTER", onBack: vi.fn() }));
        expect(await screen.findByTestId("requester-resolution-feedback")).toHaveTextContent("advisory");
        expect(screen.queryByTestId("status-select")).not.toBeInTheDocument();
        fireEvent.click(screen.getByTestId("indicate-resolved-btn"));
        await waitFor(() => expect(api.indicateTicketResolved).toHaveBeenCalledWith(12, 1));
        expect(await screen.findByTestId("requester-resolved-badge")).toHaveTextContent("Awaiting IT Staff formal resolution");
    });
});
