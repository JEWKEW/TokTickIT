import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ChangePassword from "../../src/components/ChangePassword.js";
import * as api from "../../src/api.js";
describe("ChangePassword UI Component Tests (TC-UI-02)", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });
    it("renders mandatory password change form and requirement checklist", () => {
        render(_jsx(ChangePassword, { onSuccess: vi.fn(), onLogout: vi.fn() }));
        expect(screen.getByTestId("change-password-screen")).toBeInTheDocument();
        expect(screen.getByTestId("change-password-form")).toBeInTheDocument();
        expect(screen.getByTestId("current-password-input")).toBeInTheDocument();
        expect(screen.getByTestId("new-password-input")).toBeInTheDocument();
        expect(screen.getByTestId("confirm-password-input")).toBeInTheDocument();
        expect(screen.getByTestId("req-length")).toBeInTheDocument();
        expect(screen.getByTestId("req-case")).toBeInTheDocument();
        expect(screen.getByTestId("req-symbol")).toBeInTheDocument();
        expect(screen.getByTestId("change-password-submit-btn")).toBeDisabled();
    });
    it("enables submit button only when all password policy rules and match conditions are satisfied", () => {
        render(_jsx(ChangePassword, { onSuccess: vi.fn(), onLogout: vi.fn() }));
        const currentInput = screen.getByTestId("current-password-input");
        const newInput = screen.getByTestId("new-password-input");
        const confirmInput = screen.getByTestId("confirm-password-input");
        const submitBtn = screen.getByTestId("change-password-submit-btn");
        fireEvent.change(currentInput, { target: { value: "InitialPass1!" } });
        fireEvent.change(newInput, { target: { value: "Weak" } });
        fireEvent.change(confirmInput, { target: { value: "Weak" } });
        expect(submitBtn).toBeDisabled();
        fireEvent.change(newInput, { target: { value: "NewStrongPass123!" } });
        fireEvent.change(confirmInput, { target: { value: "NewStrongPass123!" } });
        expect(submitBtn).not.toBeDisabled();
    });
    it("displays error alert when API call to change password fails", async () => {
        vi.spyOn(api, "changePassword").mockRejectedValue(new Error("Current password is incorrect"));
        render(_jsx(ChangePassword, { onSuccess: vi.fn(), onLogout: vi.fn() }));
        fireEvent.change(screen.getByTestId("current-password-input"), {
            target: { value: "WrongCurrentPass!" },
        });
        fireEvent.change(screen.getByTestId("new-password-input"), {
            target: { value: "NewStrongPass123!" },
        });
        fireEvent.change(screen.getByTestId("confirm-password-input"), {
            target: { value: "NewStrongPass123!" },
        });
        fireEvent.click(screen.getByTestId("change-password-submit-btn"));
        await waitFor(() => {
            expect(screen.getByTestId("change-password-error-alert")).toBeInTheDocument();
        });
        expect(screen.getByTestId("change-password-error-alert")).toHaveTextContent("Current password is incorrect");
    });
    it("calls onSuccess callback after successful password change", async () => {
        vi.spyOn(api, "changePassword").mockResolvedValue({
            message: "Password updated successfully",
            mustChangePassword: false,
        });
        const onSuccessMock = vi.fn();
        render(_jsx(ChangePassword, { onSuccess: onSuccessMock, onLogout: vi.fn() }));
        fireEvent.change(screen.getByTestId("current-password-input"), {
            target: { value: "InitialPass1!" },
        });
        fireEvent.change(screen.getByTestId("new-password-input"), {
            target: { value: "NewStrongPass123!" },
        });
        fireEvent.change(screen.getByTestId("confirm-password-input"), {
            target: { value: "NewStrongPass123!" },
        });
        fireEvent.click(screen.getByTestId("change-password-submit-btn"));
        await waitFor(() => {
            expect(onSuccessMock).toHaveBeenCalledTimes(1);
        });
    });
});
