import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TicketDetail from "../../src/components/TicketDetail";
import * as apiModule from "../../src/api";
describe("Lab 03 Requester Workflow UI Component Tests (TicketDetail)", () => {
    const mockTicket = {
        id: 12,
        ticketNumber: "TKT-2026-000012",
        summary: "VPN Disconnection Issue",
        description: "VPN drops every 10 minutes",
        requestedPriority: "High",
        itPriority: "High",
        currentStatus: "In Progress",
        requesterId: 1,
        categoryId: 1,
        relatedSystemId: 1,
        category: { id: 1, name: "Network" },
        relatedSystem: { id: 1, name: "Global VPN" },
        attachments: [],
        requesterResolvedIndicated: false,
        createdAt: "2026-09-18T08:00:00Z",
        updatedAt: "2026-09-18T09:00:00Z",
    };
    const mockComments = [
        {
            id: 101,
            ticketId: 12,
            authorId: 1,
            content: "Thank you for looking into this!",
            createdAt: "2026-09-18T09:30:00Z",
            author: { id: 1, name: "Jennifer Anderson", role: "REQUESTER" },
        },
    ];
    beforeEach(() => {
        vi.restoreAllMocks();
    });
    it("renders 'Problem Appears Resolved' button and updates to badge when clicked", async () => {
        vi.spyOn(apiModule, "fetchTicketById").mockResolvedValue(mockTicket);
        vi.spyOn(apiModule, "fetchPublicComments").mockResolvedValue([]);
        vi.spyOn(apiModule, "indicateTicketResolved").mockResolvedValue({
            id: 12,
            requesterResolvedIndicated: true,
            requesterResolvedAt: "2026-09-18T10:00:00Z",
        });
        render(_jsx(TicketDetail, { ticketId: 12, userId: 1, onBack: () => { } }));
        await waitFor(() => {
            expect(screen.getByTestId("ticket-code")).toHaveTextContent("TKT-2026-000012");
        });
        const indicateBtn = screen.getByTestId("indicate-resolved-btn");
        expect(indicateBtn).toBeInTheDocument();
        expect(indicateBtn).toHaveTextContent("Problem Appears Resolved");
        fireEvent.click(indicateBtn);
        await waitFor(() => {
            expect(apiModule.indicateTicketResolved).toHaveBeenCalledWith(12, 1);
            expect(screen.getByTestId("requester-resolved-badge")).toBeInTheDocument();
            expect(screen.getByTestId("requester-resolved-badge")).toHaveTextContent("Problem Appears Resolved by Requester");
        });
    });
    it("renders public comments and allows posting a new public comment", async () => {
        vi.spyOn(apiModule, "fetchTicketById").mockResolvedValue(mockTicket);
        vi.spyOn(apiModule, "fetchPublicComments").mockResolvedValue(mockComments);
        vi.spyOn(apiModule, "postPublicComment").mockResolvedValue({
            id: 102,
            ticketId: 12,
            authorId: 1,
            content: "Here is additional diagnostic log.",
            createdAt: "2026-09-18T10:05:00Z",
            author: { id: 1, name: "Jennifer Anderson", role: "REQUESTER" },
        });
        render(_jsx(TicketDetail, { ticketId: 12, userId: 1, onBack: () => { } }));
        await waitFor(() => {
            expect(screen.getByTestId("comment-101")).toBeInTheDocument();
            expect(screen.getByTestId("comment-101")).toHaveTextContent("Thank you for looking into this!");
        });
        const commentInput = screen.getByTestId("comment-input");
        const postBtn = screen.getByTestId("post-comment-btn");
        fireEvent.change(commentInput, { target: { value: "Here is additional diagnostic log." } });
        expect(postBtn).not.toBeDisabled();
        fireEvent.click(postBtn);
        await waitFor(() => {
            expect(apiModule.postPublicComment).toHaveBeenCalledWith(12, "Here is additional diagnostic log.", 1);
        });
    });
});
