import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TicketDetail from "../../src/components/TicketDetail.js";
import * as apiModule from "../../src/api.js";
describe("Lab 03 IT Staff Ticket Detail UI Component Tests (StaffTicketDetail.test.tsx)", () => {
    const mockTicket = {
        id: 101,
        ticketNumber: "TKT-2026-000101",
        summary: "Laptop battery drains quickly",
        description: "Battery fails within 30 minutes of disconnected power",
        requestedPriority: "Medium",
        itPriority: "High",
        currentStatus: "Open",
        requesterId: 1,
        ownerId: 3,
        categoryId: 1,
        relatedSystemId: 1,
        category: { id: 1, name: "Hardware" },
        relatedSystem: { id: 1, name: "Corporate Laptop" },
        requester: { id: 1, name: "Jennifer Anderson", email: "jandersson@toktickit.com", isActive: true },
        owner: { id: 3, name: "Michael Support", email: "msupport@toktickit.com" },
        attachments: [],
        requesterResolvedIndicated: true,
        createdAt: "2026-09-18T08:00:00Z",
        updatedAt: "2026-09-18T09:00:00Z",
    };
    const mockStaffUsers = [
        { id: 3, name: "Michael Support", email: "msupport@toktickit.com", isActive: true },
        { id: 4, name: "Sarah Tech", email: "stech@toktickit.com", isActive: true },
    ];
    const mockInternalNotes = [
        {
            id: 1,
            ticketId: 101,
            authorId: 3,
            content: "Diagnosed battery health at 42%. Ordered replacement part.",
            createdAt: "2026-09-18T10:00:00Z",
            author: { id: 3, name: "Michael Support", role: "IT_STAFF" },
        },
    ];
    const mockPublicComments = [
        {
            id: 1,
            ticketId: 101,
            authorId: 1,
            content: "Please check the charging dock as well.",
            createdAt: "2026-09-18T09:30:00Z",
            author: { id: 1, name: "Jennifer Anderson", role: "REQUESTER" },
        },
    ];
    beforeEach(() => {
        vi.restoreAllMocks();
    });
    it("TC-UI-DETAIL-01: Renders IT Staff operational controls (Owner, IT Priority, Status) and visually distinct Internal Notes", async () => {
        vi.spyOn(apiModule, "fetchTicketById").mockResolvedValue(mockTicket);
        vi.spyOn(apiModule, "fetchPublicComments").mockResolvedValue(mockPublicComments);
        vi.spyOn(apiModule, "fetchInternalNotes").mockResolvedValue(mockInternalNotes);
        vi.spyOn(apiModule, "fetchRequesters").mockResolvedValue(mockStaffUsers);
        render(_jsx(TicketDetail, { ticketId: 101, userId: 3, userRole: "IT_STAFF", onBack: () => { } }));
        await waitFor(() => {
            expect(screen.getByTestId("ticket-detail-view")).toBeInTheDocument();
            expect(screen.getByTestId("owner-select")).toBeInTheDocument();
            expect(screen.getByTestId("it-priority-select")).toBeInTheDocument();
            expect(screen.getByTestId("status-select")).toBeInTheDocument();
            expect(screen.getByTestId("internal-notes-section")).toBeInTheDocument();
            expect(screen.getByTestId("public-comments-section")).toBeInTheDocument();
            expect(screen.getByText(/Restricted to IT Staff & Admin/i)).toBeInTheDocument();
            expect(screen.getByText("Diagnosed battery health at 42%. Ordered replacement part.")).toBeInTheDocument();
        });
    });
    it("TC-UI-DETAIL-02: Changing owner dropdown invokes assignTicketOwner API", async () => {
        vi.spyOn(apiModule, "fetchTicketById").mockResolvedValue(mockTicket);
        vi.spyOn(apiModule, "fetchPublicComments").mockResolvedValue(mockPublicComments);
        vi.spyOn(apiModule, "fetchInternalNotes").mockResolvedValue(mockInternalNotes);
        vi.spyOn(apiModule, "fetchRequesters").mockResolvedValue(mockStaffUsers);
        const assignSpy = vi.spyOn(apiModule, "assignTicketOwner").mockResolvedValue({
            ...mockTicket,
            ownerId: 4,
            owner: { id: 4, name: "Sarah Tech", email: "stech@toktickit.com" },
        });
        render(_jsx(TicketDetail, { ticketId: 101, userId: 3, userRole: "IT_STAFF", onBack: () => { } }));
        await waitFor(() => {
            expect(screen.getByTestId("owner-select")).toBeInTheDocument();
        });
        fireEvent.change(screen.getByTestId("owner-select"), { target: { value: "4" } });
        await waitFor(() => {
            expect(assignSpy).toHaveBeenCalledWith(101, 4, 3);
        });
    });
    it("TC-UI-DETAIL-03: Changing IT priority dropdown invokes updateITPriority API", async () => {
        vi.spyOn(apiModule, "fetchTicketById").mockResolvedValue(mockTicket);
        vi.spyOn(apiModule, "fetchPublicComments").mockResolvedValue(mockPublicComments);
        vi.spyOn(apiModule, "fetchInternalNotes").mockResolvedValue(mockInternalNotes);
        vi.spyOn(apiModule, "fetchRequesters").mockResolvedValue(mockStaffUsers);
        const prioSpy = vi.spyOn(apiModule, "updateITPriority").mockResolvedValue({
            ...mockTicket,
            itPriority: "Urgent",
        });
        render(_jsx(TicketDetail, { ticketId: 101, userId: 3, userRole: "IT_STAFF", onBack: () => { } }));
        await waitFor(() => {
            expect(screen.getByTestId("it-priority-select")).toBeInTheDocument();
        });
        fireEvent.change(screen.getByTestId("it-priority-select"), { target: { value: "Urgent" } });
        await waitFor(() => {
            expect(prioSpy).toHaveBeenCalledWith(101, "Urgent", 3);
        });
    });
    it("TC-UI-DETAIL-04: Submitting Internal Note form invokes postInternalNote API", async () => {
        vi.spyOn(apiModule, "fetchTicketById").mockResolvedValue(mockTicket);
        vi.spyOn(apiModule, "fetchPublicComments").mockResolvedValue(mockPublicComments);
        vi.spyOn(apiModule, "fetchInternalNotes").mockResolvedValue(mockInternalNotes);
        vi.spyOn(apiModule, "fetchRequesters").mockResolvedValue(mockStaffUsers);
        const noteSpy = vi.spyOn(apiModule, "postInternalNote").mockResolvedValue({
            id: 2,
            ticketId: 101,
            authorId: 3,
            content: "Replacement battery installed and tested.",
            createdAt: "2026-09-18T11:00:00Z",
            author: { id: 3, name: "Michael Support", role: "IT_STAFF" },
        });
        render(_jsx(TicketDetail, { ticketId: 101, userId: 3, userRole: "IT_STAFF", onBack: () => { } }));
        await waitFor(() => {
            expect(screen.getByTestId("internal-note-input")).toBeInTheDocument();
        });
        fireEvent.change(screen.getByTestId("internal-note-input"), {
            target: { value: "Replacement battery installed and tested." },
        });
        fireEvent.click(screen.getByTestId("post-internal-note-btn"));
        await waitFor(() => {
            expect(noteSpy).toHaveBeenCalledWith(101, "Replacement battery installed and tested.", 3);
        });
    });
    it("TC-UI-DETAIL-05: Does not render Internal Notes section when userRole is REQUESTER", async () => {
        vi.spyOn(apiModule, "fetchTicketById").mockResolvedValue(mockTicket);
        vi.spyOn(apiModule, "fetchPublicComments").mockResolvedValue(mockPublicComments);
        render(_jsx(TicketDetail, { ticketId: 101, userId: 1, userRole: "REQUESTER", onBack: () => { } }));
        await waitFor(() => {
            expect(screen.getByTestId("ticket-detail-view")).toBeInTheDocument();
            expect(screen.queryByTestId("internal-notes-section")).not.toBeInTheDocument();
            expect(screen.queryByTestId("owner-select")).not.toBeInTheDocument();
        });
    });
});
