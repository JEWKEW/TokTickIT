import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TicketDetail from "../../src/components/TicketDetail.js";
import * as api from "../../src/api.js";
describe("Attachment Lifecycle UI Component Tests (TicketDetail)", () => {
    const mockTicket = {
        id: 12,
        ticketNumber: "TKT-2026-000012",
        summary: "VPN Connection Error",
        description: "Cannot connect to corporate VPN",
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
                originalFileName: "active_vpn_log.txt",
                fileSize: 153600,
                mimeType: "text/plain",
                isRemoved: false,
            },
            {
                id: 102,
                originalFileName: "removed_screenshot.png",
                fileSize: 524288,
                mimeType: "image/png",
                isRemoved: true,
                removalReason: "Uploaded wrong screenshot",
                removedAt: "2026-08-22T10:00:00.000Z",
            },
        ],
    };
    beforeEach(() => {
        vi.restoreAllMocks();
    });
    it("renders active and soft-removed attachments with metadata and status badges", async () => {
        vi.spyOn(api, "fetchTicketById").mockResolvedValue(mockTicket);
        render(_jsx(TicketDetail, { ticketId: 12, userId: 1, onBack: vi.fn() }));
        await waitFor(() => {
            expect(screen.getByTestId("ticket-detail-view")).toBeInTheDocument();
        });
        // Verify Active attachment
        expect(screen.getByText("active_vpn_log.txt")).toBeInTheDocument();
        expect(screen.getByTestId("download-attachment-101")).toBeInTheDocument();
        expect(screen.getByTestId("remove-attachment-101")).toBeInTheDocument();
        // Verify Soft-Removed attachment
        expect(screen.getByText("removed_screenshot.png")).toBeInTheDocument();
        expect(screen.getByTestId("removed-badge-102")).toHaveTextContent("Soft Removed");
        expect(screen.getByTestId("removal-reason-102")).toHaveTextContent("Uploaded wrong screenshot");
        expect(screen.getByTestId("download-attachment-102")).toBeDisabled();
        expect(screen.getByTestId("download-attachment-102")).toHaveTextContent("Download Blocked");
    });
    it("enforces file type and size constraints on client upload", async () => {
        vi.spyOn(api, "fetchTicketById").mockResolvedValue(mockTicket);
        render(_jsx(TicketDetail, { ticketId: 12, userId: 1, onBack: vi.fn() }));
        await waitFor(() => {
            expect(screen.getByTestId("ticket-detail-view")).toBeInTheDocument();
        });
        const fileInput = screen.getByTestId("upload-attachment-input");
        // 1. File > 5MB
        const oversizeFile = new File(["x".repeat(6 * 1024 * 1024)], "oversize.pdf", {
            type: "application/pdf",
        });
        fireEvent.change(fileInput, { target: { files: [oversizeFile] } });
        expect(screen.getByTestId("upload-error")).toHaveTextContent("File size exceeds 5MB limit");
        expect(screen.getByTestId("upload-attachment-btn")).toBeDisabled();
        // 2. Unallowed file type
        const invalidTypeFile = new File(["binary"], "script.exe", {
            type: "application/x-msdownload",
        });
        fireEvent.change(fileInput, { target: { files: [invalidTypeFile] } });
        expect(screen.getByTestId("upload-error")).toHaveTextContent("Invalid file type. Allowed types: JPG, JPEG, PNG, WEBP, PDF");
        expect(screen.getByTestId("upload-attachment-btn")).toBeDisabled();
    });
    it("uploads attachment when valid file is selected", async () => {
        vi.spyOn(api, "fetchTicketById").mockResolvedValue(mockTicket);
        const uploadSpy = vi.spyOn(api, "uploadAttachment").mockResolvedValue([
            {
                id: 103,
                originalFileName: "new_document.pdf",
                fileSize: 2048,
                mimeType: "application/pdf",
                isRemoved: false,
            },
        ]);
        render(_jsx(TicketDetail, { ticketId: 12, userId: 1, onBack: vi.fn() }));
        await waitFor(() => {
            expect(screen.getByTestId("ticket-detail-view")).toBeInTheDocument();
        });
        const fileInput = screen.getByTestId("upload-attachment-input");
        const validFile = new File(["pdf data"], "new_document.pdf", { type: "application/pdf" });
        fireEvent.change(fileInput, { target: { files: [validFile] } });
        expect(screen.queryByTestId("upload-error")).not.toBeInTheDocument();
        expect(screen.getByTestId("upload-attachment-btn")).not.toBeDisabled();
        fireEvent.click(screen.getByTestId("upload-attachment-btn"));
        await waitFor(() => {
            expect(uploadSpy).toHaveBeenCalledWith(12, validFile, 1);
        });
    });
    it("prompts for removal reason and soft-removes attachment", async () => {
        vi.spyOn(api, "fetchTicketById").mockResolvedValue(mockTicket);
        const removeSpy = vi.spyOn(api, "removeAttachment").mockResolvedValue();
        render(_jsx(TicketDetail, { ticketId: 12, userId: 1, onBack: vi.fn() }));
        await waitFor(() => {
            expect(screen.getByTestId("remove-attachment-101")).toBeInTheDocument();
        });
        // Click remove button on active attachment
        fireEvent.click(screen.getByTestId("remove-attachment-101"));
        // Modal appears
        expect(screen.getByTestId("removal-modal")).toBeInTheDocument();
        // Attempt confirm without reason
        fireEvent.click(screen.getByTestId("confirm-remove-btn"));
        expect(screen.getByTestId("removal-error")).toHaveTextContent("Removal reason is required");
        expect(removeSpy).not.toHaveBeenCalled();
        // Provide reason
        fireEvent.change(screen.getByTestId("removal-reason-input"), {
            target: { value: "Confidential info attached by mistake" },
        });
        // Confirm removal
        fireEvent.click(screen.getByTestId("confirm-remove-btn"));
        await waitFor(() => {
            expect(removeSpy).toHaveBeenCalledWith(101, "Confidential info attached by mistake", 1);
        });
    });
    it("disables upload when maximum 5 active attachments limit is reached", async () => {
        const ticketWith5Active = {
            ...mockTicket,
            attachments: [
                { id: 1, originalFileName: "a1.pdf", fileSize: 100, mimeType: "application/pdf", isRemoved: false },
                { id: 2, originalFileName: "a2.pdf", fileSize: 100, mimeType: "application/pdf", isRemoved: false },
                { id: 3, originalFileName: "a3.pdf", fileSize: 100, mimeType: "application/pdf", isRemoved: false },
                { id: 4, originalFileName: "a4.pdf", fileSize: 100, mimeType: "application/pdf", isRemoved: false },
                { id: 5, originalFileName: "a5.pdf", fileSize: 100, mimeType: "application/pdf", isRemoved: false },
            ],
        };
        vi.spyOn(api, "fetchTicketById").mockResolvedValue(ticketWith5Active);
        render(_jsx(TicketDetail, { ticketId: 12, userId: 1, onBack: vi.fn() }));
        await waitFor(() => {
            expect(screen.getByTestId("ticket-detail-view")).toBeInTheDocument();
        });
        expect(screen.getByTestId("upload-attachment-input")).toBeDisabled();
        expect(screen.getByTestId("upload-attachment-btn")).toBeDisabled();
    });
});
