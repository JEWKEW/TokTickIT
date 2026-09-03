import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CreateTicketForm from "../../src/components/CreateTicketForm.js";
import * as api from "../../src/api.js";
describe("Lab 02 - CreateTicketForm Component & Integration Suite", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });
    const mockCategories = [
        { id: 1, name: "Account and Access" },
        { id: 2, name: "Hardware" },
    ];
    const mockRelatedSystems = [
        { id: 1, name: "Email" },
        { id: 2, name: "Corporate Laptop" },
    ];
    it("renders form fields correctly after loading categories and related systems", async () => {
        vi.spyOn(api, "fetchCategories").mockResolvedValue(mockCategories);
        vi.spyOn(api, "fetchRelatedSystems").mockResolvedValue(mockRelatedSystems);
        render(_jsx(CreateTicketForm, { userId: 1 }));
        // Wait for form options to load
        await waitFor(() => {
            expect(screen.getByTestId("category-dropdown")).toBeInTheDocument();
            expect(screen.getByTestId("related-system-dropdown")).toBeInTheDocument();
        });
        expect(screen.getByTestId("summary-input")).toBeInTheDocument();
        expect(screen.getByTestId("description-input")).toBeInTheDocument();
        expect(screen.getByTestId("file-input")).toBeInTheDocument();
        expect(screen.getByTestId("submit-ticket-btn")).toBeInTheDocument();
        // Priority buttons
        expect(screen.getByTestId("priority-low")).toBeInTheDocument();
        expect(screen.getByTestId("priority-medium")).toBeInTheDocument();
        expect(screen.getByTestId("priority-high")).toBeInTheDocument();
        expect(screen.getByTestId("priority-urgent")).toBeInTheDocument();
    });
    it("validates summary and description required fields inline", async () => {
        vi.spyOn(api, "fetchCategories").mockResolvedValue(mockCategories);
        vi.spyOn(api, "fetchRelatedSystems").mockResolvedValue(mockRelatedSystems);
        render(_jsx(CreateTicketForm, { userId: 1 }));
        await waitFor(() => {
            expect(screen.getByTestId("summary-input")).toBeInTheDocument();
        });
        // Leave summary and description blank and submit
        fireEvent.click(screen.getByTestId("submit-ticket-btn"));
        await waitFor(() => {
            expect(screen.getByText("Summary is required")).toBeInTheDocument();
            expect(screen.getByText("Description is required")).toBeInTheDocument();
        });
    });
    it("updates real-time character counters for summary and description", async () => {
        vi.spyOn(api, "fetchCategories").mockResolvedValue(mockCategories);
        vi.spyOn(api, "fetchRelatedSystems").mockResolvedValue(mockRelatedSystems);
        render(_jsx(CreateTicketForm, { userId: 1 }));
        await waitFor(() => {
            expect(screen.getByTestId("summary-input")).toBeInTheDocument();
        });
        const summaryInput = screen.getByTestId("summary-input");
        fireEvent.change(summaryInput, { target: { value: "VPN Access Error" } });
        expect(screen.getByTestId("summary-char-counter")).toHaveTextContent("16/100");
        const descInput = screen.getByTestId("description-input");
        fireEvent.change(descInput, { target: { value: "Cannot authenticate with VPN server." } });
        expect(screen.getByTestId("description-char-counter")).toHaveTextContent("36/1000");
    });
    it("preserves input values on API failure and displays error banner", async () => {
        vi.spyOn(api, "fetchCategories").mockResolvedValue(mockCategories);
        vi.spyOn(api, "fetchRelatedSystems").mockResolvedValue(mockRelatedSystems);
        vi.spyOn(api, "createTicket").mockRejectedValue(new Error("Server error: Unable to create ticket"));
        render(_jsx(CreateTicketForm, { userId: 1 }));
        await waitFor(() => {
            expect(screen.getByTestId("summary-input")).toBeInTheDocument();
        });
        const summaryInput = screen.getByTestId("summary-input");
        const descInput = screen.getByTestId("description-input");
        fireEvent.change(summaryInput, { target: { value: "Password Reset Request" } });
        fireEvent.change(descInput, { target: { value: "Please reset active directory password." } });
        fireEvent.click(screen.getByTestId("submit-ticket-btn"));
        await waitFor(() => {
            expect(screen.getByTestId("api-error-banner")).toHaveTextContent("Server error: Unable to create ticket");
        });
        // Verify inputs preserved
        expect(summaryInput.value).toBe("Password Reset Request");
        expect(descInput.value).toBe("Please reset active directory password.");
    });
    it("shows busy submit state during API submission and displays success screen with Ticket Number", async () => {
        vi.spyOn(api, "fetchCategories").mockResolvedValue(mockCategories);
        vi.spyOn(api, "fetchRelatedSystems").mockResolvedValue(mockRelatedSystems);
        const mockTicketResponse = {
            id: 42,
            ticketNumber: "TKT-2026-000042",
            summary: "New Laptop Setup",
            description: "Need developer laptop configured with Docker and Node.js.",
            requestedPriority: "High",
            currentStatus: "New",
            requesterId: 1,
            categoryId: 2,
            relatedSystemId: 2,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        let resolvePromise;
        const pendingPromise = new Promise((resolve) => {
            resolvePromise = resolve;
        });
        vi.spyOn(api, "createTicket").mockReturnValue(pendingPromise);
        render(_jsx(CreateTicketForm, { userId: 1 }));
        await waitFor(() => {
            expect(screen.getByTestId("summary-input")).toBeInTheDocument();
        });
        fireEvent.change(screen.getByTestId("summary-input"), {
            target: { value: "New Laptop Setup" },
        });
        fireEvent.change(screen.getByTestId("description-input"), {
            target: { value: "Need developer laptop configured with Docker and Node.js." },
        });
        const submitBtn = screen.getByTestId("submit-ticket-btn");
        fireEvent.click(submitBtn);
        // Verify busy state
        expect(submitBtn).toBeDisabled();
        expect(submitBtn).toHaveTextContent(/Submitting/i);
        // Resolve API request
        resolvePromise(mockTicketResponse);
        // Verify success confirmation card
        await waitFor(() => {
            expect(screen.getByTestId("success-confirmation")).toBeInTheDocument();
            expect(screen.getByTestId("new-ticket-number")).toHaveTextContent("TKT-2026-000042");
        });
    });
});
