import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import StaffTicketQueue from "../../src/components/StaffTicketQueue.js";
import * as apiModule from "../../src/api.js";
describe("Lab 03 IT Staff Ticket Queue UI Component Tests (StaffTicketQueue.test.tsx)", () => {
    const mockTickets = [
        {
            id: 101,
            ticketNumber: "TKT-2026-000101",
            summary: "Laptop battery drains quickly",
            description: "Battery fails within 30 minutes",
            requestedPriority: "Medium",
            itPriority: "Medium",
            currentStatus: "In Progress",
            requesterId: 1,
            categoryId: 1,
            relatedSystemId: 1,
            category: { id: 1, name: "Hardware" },
            relatedSystem: { id: 1, name: "Corporate Laptop" },
            requester: { id: 1, name: "Jennifer Anderson", email: "jandersson@toktickit.com", isActive: true },
            owner: { id: 3, name: "Michael Support", email: "msupport@toktickit.com" },
            createdAt: "2026-09-18T08:00:00Z",
            updatedAt: "2026-09-18T09:00:00Z",
        },
        {
            id: 102,
            ticketNumber: "TKT-2026-000102",
            summary: "Cannot connect to VPN",
            description: "VPN client shows auth timeout",
            requestedPriority: "High",
            itPriority: "Urgent",
            currentStatus: "Open",
            requesterId: 2,
            categoryId: 2,
            relatedSystemId: 2,
            category: { id: 2, name: "Network" },
            relatedSystem: { id: 2, name: "Global VPN" },
            requester: { id: 2, name: "Bob Smith", email: "bsmith@toktickit.com", isActive: true },
            owner: undefined,
            createdAt: "2026-09-18T09:00:00Z",
            updatedAt: "2026-09-18T09:30:00Z",
        },
    ];
    const mockCategories = [
        { id: 1, name: "Hardware" },
        { id: 2, name: "Network" },
    ];
    const mockPaginatedData = {
        items: mockTickets,
        meta: {
            currentPage: 1,
            limit: 10,
            totalItems: 2,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
        },
    };
    beforeEach(() => {
        vi.restoreAllMocks();
    });
    it("TC-UI-QUEUE-01: Renders ticket queue table displaying Ticket No, Summary, Category, Priorities, Status, and Owner", async () => {
        vi.spyOn(apiModule, "fetchCategories").mockResolvedValue(mockCategories);
        vi.spyOn(apiModule, "fetchTicketQueue").mockResolvedValue(mockPaginatedData);
        const onSelectTicket = vi.fn();
        render(_jsx(StaffTicketQueue, { userId: 3, onSelectTicket: onSelectTicket }));
        await waitFor(() => {
            expect(screen.getByTestId("ticket-queue-container")).toBeInTheDocument();
            expect(screen.getByTestId("total-tickets-count")).toHaveTextContent(/Total:\s*2/);
            expect(screen.getByTestId("ticket-code-101")).toHaveTextContent("TKT-2026-000101");
            expect(screen.getByTestId("ticket-code-102")).toHaveTextContent("TKT-2026-000102");
            expect(screen.getAllByText("Laptop battery drains quickly").length).toBeGreaterThan(0);
            expect(screen.getAllByText("Cannot connect to VPN").length).toBeGreaterThan(0);
            expect(screen.getAllByText(/Michael Support/).length).toBeGreaterThan(0);
            expect(screen.getAllByText("Unassigned").length).toBeGreaterThan(0);
        });
    });
    it("TC-UI-QUEUE-02: Typing keyword search updates search input and calls fetchTicketQueue", async () => {
        vi.spyOn(apiModule, "fetchCategories").mockResolvedValue(mockCategories);
        const fetchQueueSpy = vi
            .spyOn(apiModule, "fetchTicketQueue")
            .mockResolvedValue(mockPaginatedData);
        render(_jsx(StaffTicketQueue, { userId: 3, onSelectTicket: () => { } }));
        await waitFor(() => {
            expect(screen.getByTestId("ticket-queue-container")).toBeInTheDocument();
        });
        const searchInput = screen.getByTestId("queue-search-input");
        fireEvent.change(searchInput, { target: { value: "VPN" } });
        await waitFor(() => {
            expect(fetchQueueSpy).toHaveBeenCalledWith(expect.objectContaining({ q: "VPN" }), 3);
        });
    });
    it("TC-UI-QUEUE-03: Selecting Status and Priority filter dropdowns triggers fetchTicketQueue", async () => {
        vi.spyOn(apiModule, "fetchCategories").mockResolvedValue(mockCategories);
        const fetchQueueSpy = vi
            .spyOn(apiModule, "fetchTicketQueue")
            .mockResolvedValue(mockPaginatedData);
        render(_jsx(StaffTicketQueue, { userId: 3, onSelectTicket: () => { } }));
        await waitFor(() => {
            expect(screen.getByTestId("status-filter-select")).toBeInTheDocument();
        });
        const statusSelect = screen.getByTestId("status-filter-select");
        fireEvent.change(statusSelect, { target: { value: "Open" } });
        await waitFor(() => {
            expect(fetchQueueSpy).toHaveBeenCalledWith(expect.objectContaining({ status: "Open" }), 3);
        });
        const prioritySelect = screen.getByTestId("priority-filter-select");
        fireEvent.change(prioritySelect, { target: { value: "High" } });
        await waitFor(() => {
            expect(fetchQueueSpy).toHaveBeenCalledWith(expect.objectContaining({ itPriority: "High" }), 3);
        });
    });
    it("TC-UI-QUEUE-04: Clicking 'View Ticket' button invokes onSelectTicket callback", async () => {
        vi.spyOn(apiModule, "fetchCategories").mockResolvedValue(mockCategories);
        vi.spyOn(apiModule, "fetchTicketQueue").mockResolvedValue(mockPaginatedData);
        const onSelectTicket = vi.fn();
        render(_jsx(StaffTicketQueue, { userId: 3, onSelectTicket: onSelectTicket }));
        await waitFor(() => {
            expect(screen.getByTestId("view-ticket-btn-101")).toBeInTheDocument();
        });
        fireEvent.click(screen.getByTestId("view-ticket-btn-101"));
        expect(onSelectTicket).toHaveBeenCalledWith(101);
    });
    it("TC-UI-QUEUE-05: Pagination controls navigate pages correctly", async () => {
        vi.spyOn(apiModule, "fetchCategories").mockResolvedValue(mockCategories);
        const fetchQueueSpy = vi
            .spyOn(apiModule, "fetchTicketQueue")
            .mockResolvedValue({
            items: mockTickets,
            meta: {
                currentPage: 1,
                limit: 10,
                totalItems: 15,
                totalPages: 2,
                hasNextPage: true,
                hasPrevPage: false,
            },
        });
        render(_jsx(StaffTicketQueue, { userId: 3, onSelectTicket: () => { } }));
        await waitFor(() => {
            expect(screen.getByTestId("pagination-next")).not.toBeDisabled();
        });
        fireEvent.click(screen.getByTestId("pagination-next"));
        await waitFor(() => {
            expect(fetchQueueSpy).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }), 3);
        });
    });
    it("TC-UI-QUEUE-06: Renders empty queue message when no tickets match", async () => {
        vi.spyOn(apiModule, "fetchCategories").mockResolvedValue(mockCategories);
        vi.spyOn(apiModule, "fetchTicketQueue").mockResolvedValue({
            items: [],
            meta: {
                currentPage: 1,
                limit: 10,
                totalItems: 0,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false,
            },
        });
        render(_jsx(StaffTicketQueue, { userId: 3, onSelectTicket: () => { } }));
        await waitFor(() => {
            expect(screen.getByTestId("empty-queue-msg")).toBeInTheDocument();
            expect(screen.getByText("No tickets found")).toBeInTheDocument();
        });
    });
});
