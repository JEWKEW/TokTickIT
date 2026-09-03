import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TicketDetail from "../../src/components/TicketDetail.js";
import * as api from "../../src/api.js";
describe("TicketDetail Component (Requester View)", () => {
    const mockTicket = {
        id: 12,
        ticketNumber: "TKT-2026-000012",
        summary: "VPN Connection Error",
        description: "Cannot connect to corporate VPN from home network",
        requestedPriority: "High",
        currentStatus: "New",
        requesterId: 1,
        categoryId: 4,
        relatedSystemId: 2,
        createdAt: "2026-08-20T14:45:00.000Z",
        updatedAt: "2026-08-20T14:45:00.000Z",
        category: { id: 4, name: "Network" },
        relatedSystem: { id: 2, name: "VPN Service" },
        requester: { id: 1, name: "Alice Johnson", email: "alice@toktickit.io", isActive: true },
        attachments: [
            {
                id: 101,
                originalFileName: "vpn_log.txt",
                fileSize: 153600,
                mimeType: "text/plain",
            },
        ],
    };
    beforeEach(() => {
        vi.restoreAllMocks();
    });
    it("renders loading state initially while fetching ticket details", async () => {
        vi.spyOn(api, "fetchTicketById").mockReturnValue(new Promise(() => { }));
        render(_jsx(TicketDetail, { ticketId: 12, userId: 1, onBack: vi.fn() }));
        expect(screen.getByTestId("loading-state")).toBeInTheDocument();
        expect(screen.getAllByText("Loading ticket details...")[0]).toBeInTheDocument();
    });
    it("renders read-only ticket detail header, classification, description, and status/priority badges", async () => {
        vi.spyOn(api, "fetchTicketById").mockResolvedValue(mockTicket);
        render(_jsx(TicketDetail, { ticketId: 12, userId: 1, onBack: vi.fn() }));
        await waitFor(() => {
            expect(screen.getByTestId("ticket-detail-view")).toBeInTheDocument();
        });
        expect(screen.getByTestId("ticket-code")).toHaveTextContent("TKT-2026-000012");
        expect(screen.getByTestId("ticket-summary")).toHaveTextContent("VPN Connection Error");
        expect(screen.getByTestId("ticket-description")).toHaveTextContent("Cannot connect to corporate VPN from home network");
        expect(screen.getByTestId("ticket-category")).toHaveTextContent("Network");
        expect(screen.getByTestId("ticket-system")).toHaveTextContent("VPN Service");
        expect(screen.getByTestId("ticket-priority")).toHaveTextContent("High Priority");
        expect(screen.getByTestId("ticket-status")).toHaveTextContent("New");
        expect(screen.getByText("vpn_log.txt")).toBeInTheDocument();
        expect(screen.getByText("150.0 KB")).toBeInTheDocument();
    });
    it("calls onBack callback when clicking 'Back to My Tickets' link", async () => {
        vi.spyOn(api, "fetchTicketById").mockResolvedValue(mockTicket);
        const onBackMock = vi.fn();
        render(_jsx(TicketDetail, { ticketId: 12, userId: 1, onBack: onBackMock }));
        await waitFor(() => {
            expect(screen.getByTestId("back-to-tickets-link")).toBeInTheDocument();
        });
        fireEvent.click(screen.getByTestId("back-to-tickets-link"));
        expect(onBackMock).toHaveBeenCalledTimes(1);
    });
    it("renders access error state when ticket is forbidden or not found", async () => {
        vi.spyOn(api, "fetchTicketById").mockRejectedValue(new Error("You do not have permission to view this ticket"));
        render(_jsx(TicketDetail, { ticketId: 99, userId: 1, onBack: vi.fn() }));
        await waitFor(() => {
            expect(screen.getByTestId("error-state")).toBeInTheDocument();
        });
        expect(screen.getByText("You do not have permission to view this ticket")).toBeInTheDocument();
    });
    it("enforces read-only UI by verifying no IT controls, comment inputs, or status dropdowns are present", async () => {
        vi.spyOn(api, "fetchTicketById").mockResolvedValue(mockTicket);
        render(_jsx(TicketDetail, { ticketId: 12, userId: 1, onBack: vi.fn() }));
        await waitFor(() => {
            expect(screen.getByTestId("ticket-detail-view")).toBeInTheDocument();
        });
        // Ensure no form inputs, select dropdowns for status, or comment submit buttons exist
        expect(screen.queryByRole("select")).not.toBeInTheDocument();
        expect(screen.queryByPlaceholderText(/add a comment/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/assign agent/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/update status/i)).not.toBeInTheDocument();
    });
});
