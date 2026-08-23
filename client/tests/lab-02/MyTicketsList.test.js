import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MyTicketsList from "../../src/components/MyTicketsList.js";
import * as api from "../../src/api.js";
describe("MyTicketsList Component", () => {
    const mockCategories = [
        { id: 1, name: "Account and Access" },
        { id: 2, name: "Hardware" },
        { id: 3, name: "Software" },
    ];
    const mockTicketItems = [
        {
            id: 101,
            ticketNumber: "TKT-2026-000101",
            summary: "VPN Login Failed",
            description: "Cannot login to VPN",
            requestedPriority: "High",
            currentStatus: "New",
            requesterId: 1,
            categoryId: 1,
            relatedSystemId: 1,
            category: { id: 1, name: "Account and Access" },
            createdAt: "2026-08-20T10:00:00.000Z",
            updatedAt: "2026-08-20T10:00:00.000Z",
        },
        {
            id: 102,
            ticketNumber: "TKT-2026-000102",
            summary: "Laptop Monitor Flickering",
            description: "Screen flickers randomly",
            requestedPriority: "Medium",
            currentStatus: "In Progress",
            requesterId: 1,
            categoryId: 2,
            relatedSystemId: 2,
            category: { id: 2, name: "Hardware" },
            createdAt: "2026-08-21T14:30:00.000Z",
            updatedAt: "2026-08-21T14:30:00.000Z",
        },
    ];
    beforeEach(() => {
        vi.restoreAllMocks();
        vi.spyOn(api, "fetchCategories").mockResolvedValue(mockCategories);
    });
    it("renders ticket list table with data, badges, and controls", async () => {
        vi.spyOn(api, "fetchTickets").mockResolvedValue({
            items: mockTicketItems,
            meta: {
                currentPage: 1,
                limit: 10,
                totalItems: 2,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false,
            },
        });
        render(_jsx(MyTicketsList, { userId: 1 }));
        // Renders loading first or resolves to table
        await waitFor(() => {
            expect(screen.getByTestId("tickets-table")).toBeInTheDocument();
        });
        expect(screen.getByText("TKT-2026-000101")).toBeInTheDocument();
        expect(screen.getByText("VPN Login Failed")).toBeInTheDocument();
        expect(screen.getByText("Laptop Monitor Flickering")).toBeInTheDocument();
        expect(screen.getByText(/Showing/i).parentElement?.textContent).toMatch(/Showing 1 - 2 of 2 tickets/i);
    });
    it("filters tickets when typing in the search input", async () => {
        const fetchSpy = vi.spyOn(api, "fetchTickets").mockResolvedValue({
            items: [mockTicketItems[0]],
            meta: {
                currentPage: 1,
                limit: 10,
                totalItems: 1,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false,
            },
        });
        render(_jsx(MyTicketsList, { userId: 1 }));
        await waitFor(() => {
            expect(screen.getByTestId("search-input")).toBeInTheDocument();
        });
        const searchInput = screen.getByTestId("search-input");
        fireEvent.change(searchInput, { target: { value: "VPN" } });
        await waitFor(() => {
            expect(fetchSpy).toHaveBeenLastCalledWith(expect.objectContaining({ search: "VPN" }), 1);
        });
    });
    it("resets filters when clicking 'Clear Filters' button", async () => {
        const fetchSpy = vi.spyOn(api, "fetchTickets").mockResolvedValue({
            items: mockTicketItems,
            meta: {
                currentPage: 1,
                limit: 10,
                totalItems: 2,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false,
            },
        });
        render(_jsx(MyTicketsList, { userId: 1 }));
        await waitFor(() => {
            expect(screen.getByTestId("priority-filter")).toBeInTheDocument();
        });
        fireEvent.change(screen.getByTestId("priority-filter"), { target: { value: "High" } });
        await waitFor(() => {
            expect(fetchSpy).toHaveBeenLastCalledWith(expect.objectContaining({ priority: "High" }), 1);
        });
        const clearBtn = screen.getByTestId("clear-filters-btn");
        expect(clearBtn).not.toBeDisabled();
        fireEvent.click(clearBtn);
        await waitFor(() => {
            expect(fetchSpy).toHaveBeenLastCalledWith(expect.objectContaining({
                search: "",
                categoryId: "all",
                priority: "all",
                status: "all",
            }), 1);
        });
    });
    it("toggles sorting order when clicking table header columns", async () => {
        const fetchSpy = vi.spyOn(api, "fetchTickets").mockResolvedValue({
            items: mockTicketItems,
            meta: {
                currentPage: 1,
                limit: 10,
                totalItems: 2,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false,
            },
        });
        render(_jsx(MyTicketsList, { userId: 1 }));
        await waitFor(() => {
            expect(screen.getByText(/Summary/i)).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText(/Summary/i));
        await waitFor(() => {
            expect(fetchSpy).toHaveBeenLastCalledWith(expect.objectContaining({ sort: "summary", order: "asc" }), 1);
        });
    });
    it("handles pagination page change interactions", async () => {
        const fetchSpy = vi.spyOn(api, "fetchTickets").mockResolvedValue({
            items: mockTicketItems,
            meta: {
                currentPage: 1,
                limit: 10,
                totalItems: 25,
                totalPages: 3,
                hasNextPage: true,
                hasPrevPage: false,
            },
        });
        render(_jsx(MyTicketsList, { userId: 1 }));
        await waitFor(() => {
            expect(screen.getByTestId("next-page-btn")).toBeInTheDocument();
        });
        fireEvent.click(screen.getByTestId("next-page-btn"));
        await waitFor(() => {
            expect(fetchSpy).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }), 1);
        });
    });
    it("renders distinct Empty List state when requester has 0 tickets total", async () => {
        vi.spyOn(api, "fetchTickets").mockResolvedValue({
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
        render(_jsx(MyTicketsList, { userId: 1 }));
        await waitFor(() => {
            expect(screen.getByTestId("empty-state")).toBeInTheDocument();
        });
        expect(screen.getByText("No Tickets Found")).toBeInTheDocument();
        expect(screen.getByText(/You haven't submitted any service request tickets yet/i)).toBeInTheDocument();
    });
    it("renders distinct No-Results state when search yields 0 matches", async () => {
        vi.spyOn(api, "fetchTickets").mockResolvedValue({
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
        render(_jsx(MyTicketsList, { userId: 1 }));
        await waitFor(() => {
            expect(screen.getByTestId("search-input")).toBeInTheDocument();
        });
        fireEvent.change(screen.getByTestId("search-input"), { target: { value: "NonExistentKeyword" } });
        await waitFor(() => {
            expect(screen.getByTestId("no-results-state")).toBeInTheDocument();
        });
        expect(screen.getByText("No Matching Tickets")).toBeInTheDocument();
    });
    it("renders API failure state with retry option on network error", async () => {
        vi.spyOn(api, "fetchTickets").mockRejectedValue(new Error("Network Error: Failed to fetch"));
        render(_jsx(MyTicketsList, { userId: 1 }));
        await waitFor(() => {
            expect(screen.getByTestId("error-state")).toBeInTheDocument();
        });
        expect(screen.getByText("Failed to fetch tickets")).toBeInTheDocument();
        expect(screen.getByText("Network Error: Failed to fetch")).toBeInTheDocument();
    });
    it("verifies data isolation when switching user IDs", async () => {
        const fetchSpy = vi.spyOn(api, "fetchTickets").mockResolvedValue({
            items: mockTicketItems,
            meta: {
                currentPage: 1,
                limit: 10,
                totalItems: 2,
                totalPages: 1,
                hasNextPage: false,
                hasPrevPage: false,
            },
        });
        const { rerender } = render(_jsx(MyTicketsList, { userId: 1 }));
        await waitFor(() => {
            expect(fetchSpy).toHaveBeenCalledWith(expect.anything(), 1);
        });
        // Rerender component with User ID 2 (Bob)
        rerender(_jsx(MyTicketsList, { userId: 2 }));
        await waitFor(() => {
            expect(fetchSpy).toHaveBeenLastCalledWith(expect.anything(), 2);
        });
    });
});
