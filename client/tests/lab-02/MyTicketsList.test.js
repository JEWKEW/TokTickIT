import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import MyTicketsList from "../../src/components/MyTicketsList.js";
import * as api from "../../src/api.js";

describe("MyTicketsList Component JS", () => {
    const mockCategories = [
        { id: 1, name: "Account and Access" },
        { id: 2, name: "Hardware" },
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
    ];

    beforeEach(() => {
        vi.restoreAllMocks();
        vi.spyOn(api, "fetchCategories").mockResolvedValue(mockCategories);
    });

    it("renders ticket table", async () => {
        vi.spyOn(api, "fetchTickets").mockResolvedValue({
            items: mockTicketItems,
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
            expect(screen.getByTestId("tickets-table")).toBeInTheDocument();
        });

        expect(screen.getByText("TKT-2026-000101")).toBeInTheDocument();
        expect(screen.getByText("VPN Login Failed")).toBeInTheDocument();
    });
});
