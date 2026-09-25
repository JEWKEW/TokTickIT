import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import UserManagement from "../../src/components/UserManagement.js";
import * as apiModule from "../../src/api.js";
describe("Lab 03 Administrator User Management UI Component Tests (UserManagement.test.tsx)", () => {
    const mockUsers = [
        {
            id: 1,
            name: "System Administrator",
            email: "admin@toktickit.com",
            role: "ADMINISTRATOR",
            mustChangePassword: false,
            isActive: true,
            createdAt: "2026-09-01T08:00:00Z",
        },
        {
            id: 2,
            name: "Michael Staff",
            email: "staff@toktickit.com",
            role: "IT_STAFF",
            mustChangePassword: false,
            isActive: true,
            createdAt: "2026-09-02T08:00:00Z",
        },
        {
            id: 3,
            name: "Jennifer Requester",
            email: "requester@toktickit.com",
            role: "REQUESTER",
            mustChangePassword: false,
            isActive: false,
            createdAt: "2026-09-03T08:00:00Z",
        },
    ];
    beforeEach(() => {
        vi.restoreAllMocks();
    });
    // TC-UI-ADMIN-01: Renders user management table displaying Name, Email, Role, Status badges
    it("TC-UI-ADMIN-01: Renders user management table displaying Name, Email, Role, Status badges", async () => {
        vi.spyOn(apiModule, "fetchAdminUsers").mockResolvedValue(mockUsers);
        render(_jsx(UserManagement, { userId: 1 }));
        await waitFor(() => {
            expect(screen.getByTestId("user-management-container")).toBeInTheDocument();
            expect(screen.getByTestId("total-users-count")).toHaveTextContent(/Total Users:\s*3/);
            expect(screen.getByTestId("user-name-1")).toHaveTextContent("System Administrator");
            expect(screen.getByTestId("user-email-2")).toHaveTextContent("staff@toktickit.com");
            expect(screen.getByTestId("user-role-1")).toHaveTextContent("ADMINISTRATOR");
            expect(screen.getByTestId("user-status-3")).toHaveTextContent("Inactive");
        });
    });
    // TC-UI-ADMIN-02: Search input filter triggers fetchAdminUsers with query parameter
    it("TC-UI-ADMIN-02: Search input filter triggers fetchAdminUsers with query parameter", async () => {
        const fetchUsersSpy = vi
            .spyOn(apiModule, "fetchAdminUsers")
            .mockResolvedValue(mockUsers);
        render(_jsx(UserManagement, { userId: 1 }));
        await waitFor(() => {
            expect(screen.getByTestId("user-search-input")).toBeInTheDocument();
        });
        const searchInput = screen.getByTestId("user-search-input");
        fireEvent.change(searchInput, { target: { value: "staff" } });
        await waitFor(() => {
            expect(fetchUsersSpy).toHaveBeenCalledWith(expect.objectContaining({ q: "staff" }), 1);
        });
    });
    // TC-UI-ADMIN-03: Role filter dropdown selection triggers fetchAdminUsers
    it("TC-UI-ADMIN-03: Role filter dropdown selection triggers fetchAdminUsers", async () => {
        const fetchUsersSpy = vi
            .spyOn(apiModule, "fetchAdminUsers")
            .mockResolvedValue(mockUsers);
        render(_jsx(UserManagement, { userId: 1 }));
        await waitFor(() => {
            expect(screen.getByTestId("role-filter-select")).toBeInTheDocument();
        });
        const roleSelect = screen.getByTestId("role-filter-select");
        fireEvent.change(roleSelect, { target: { value: "IT_STAFF" } });
        await waitFor(() => {
            expect(fetchUsersSpy).toHaveBeenCalledWith(expect.objectContaining({ role: "IT_STAFF" }), 1);
        });
    });
    // TC-UI-ADMIN-04: Clicking "+ Create User" opens modal, submitting form invokes createAdminUser
    it("TC-UI-ADMIN-04: Clicking '+ Create User' opens modal, submitting form invokes createAdminUser", async () => {
        vi.spyOn(apiModule, "fetchAdminUsers").mockResolvedValue(mockUsers);
        const createSpy = vi.spyOn(apiModule, "createAdminUser").mockResolvedValue({
            id: 4,
            name: "Alex Thompson",
            email: "alex@toktickit.com",
            role: "IT_STAFF",
            mustChangePassword: true,
            isActive: true,
            createdAt: "2026-09-04T08:00:00Z",
        });
        render(_jsx(UserManagement, { userId: 1 }));
        await waitFor(() => {
            expect(screen.getByTestId("create-user-btn")).toBeInTheDocument();
        });
        fireEvent.click(screen.getByTestId("create-user-btn"));
        expect(screen.getByTestId("create-user-modal")).toBeInTheDocument();
        fireEvent.change(screen.getByTestId("create-user-name"), {
            target: { value: "Alex Thompson" },
        });
        fireEvent.change(screen.getByTestId("create-user-email"), {
            target: { value: "alex@toktickit.com" },
        });
        fireEvent.change(screen.getByTestId("create-user-role"), {
            target: { value: "IT_STAFF" },
        });
        fireEvent.change(screen.getByTestId("create-user-password"), {
            target: { value: "InitialPassword123!" },
        });
        fireEvent.click(screen.getByTestId("save-create-user-btn"));
        await waitFor(() => {
            expect(createSpy).toHaveBeenCalledWith({
                name: "Alex Thompson",
                email: "alex@toktickit.com",
                role: "IT_STAFF",
                isActive: true,
                initialPassword: "InitialPassword123!",
            }, 1);
        });
    });
    // TC-UI-ADMIN-05: Duplicate email error from API displays red validation error feedback
    it("TC-UI-ADMIN-05: Duplicate email error from API displays red validation error feedback", async () => {
        vi.spyOn(apiModule, "fetchAdminUsers").mockResolvedValue(mockUsers);
        vi.spyOn(apiModule, "createAdminUser").mockRejectedValue(new Error("Email address already exists"));
        render(_jsx(UserManagement, { userId: 1 }));
        await waitFor(() => {
            expect(screen.getByTestId("create-user-btn")).toBeInTheDocument();
        });
        fireEvent.click(screen.getByTestId("create-user-btn"));
        fireEvent.change(screen.getByTestId("create-user-name"), {
            target: { value: "Duplicate Person" },
        });
        fireEvent.change(screen.getByTestId("create-user-email"), {
            target: { value: "staff@toktickit.com" },
        });
        fireEvent.change(screen.getByTestId("create-user-password"), {
            target: { value: "InitialPassword123!" },
        });
        fireEvent.click(screen.getByTestId("save-create-user-btn"));
        await waitFor(() => {
            expect(screen.getByTestId("user-form-error")).toHaveTextContent("Email address already exists");
        });
    });
    // TC-UI-ADMIN-06: Clicking Edit opens modal, saving changes invokes updateAdminUser
    it("TC-UI-ADMIN-06: Clicking Edit opens modal, saving changes invokes updateAdminUser", async () => {
        vi.spyOn(apiModule, "fetchAdminUsers").mockResolvedValue(mockUsers);
        const updateSpy = vi.spyOn(apiModule, "updateAdminUser").mockResolvedValue({
            ...mockUsers[1],
            name: "Michael Staff Updated",
        });
        render(_jsx(UserManagement, { userId: 1 }));
        await waitFor(() => {
            expect(screen.getByTestId("edit-user-btn-2")).toBeInTheDocument();
        });
        fireEvent.click(screen.getByTestId("edit-user-btn-2"));
        expect(screen.getByTestId("edit-user-modal")).toBeInTheDocument();
        fireEvent.change(screen.getByTestId("edit-user-name"), {
            target: { value: "Michael Staff Updated" },
        });
        fireEvent.click(screen.getByTestId("save-edit-user-btn"));
        await waitFor(() => {
            expect(updateSpy).toHaveBeenCalledWith(2, {
                name: "Michael Staff Updated",
                email: "staff@toktickit.com",
                role: "IT_STAFF",
                isActive: true,
            }, 1);
        });
    });
    // TC-UI-ADMIN-07: Setting new initial password invokes resetUserPassword API
    it("TC-UI-ADMIN-07: Setting new initial password invokes resetUserPassword API", async () => {
        vi.spyOn(apiModule, "fetchAdminUsers").mockResolvedValue(mockUsers);
        const resetSpy = vi.spyOn(apiModule, "resetUserPassword").mockResolvedValue({
            ...mockUsers[1],
            mustChangePassword: true,
        });
        render(_jsx(UserManagement, { userId: 1 }));
        await waitFor(() => {
            expect(screen.getByTestId("edit-user-btn-2")).toBeInTheDocument();
        });
        fireEvent.click(screen.getByTestId("edit-user-btn-2"));
        expect(screen.getByTestId("reset-password-btn")).toBeInTheDocument();
        fireEvent.click(screen.getByTestId("reset-password-btn"));
        const resetInput = screen.getByTestId("reset-password-input");
        fireEvent.change(resetInput, { target: { value: "NewInitialPass123!" } });
        fireEvent.click(screen.getByTestId("confirm-reset-password-btn"));
        await waitFor(() => {
            expect(resetSpy).toHaveBeenCalledWith(2, "NewInitialPass123!", 1);
        });
    });
});
