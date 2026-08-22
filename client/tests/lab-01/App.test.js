import { jsx as _jsx } from "react/jsx-runtime";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import App from "../../src/App.js";
import * as api from "../../src/api.js";
describe("App", () => {
    beforeEach(() => {
        sessionStorage.setItem("selectedRequester", JSON.stringify({
            id: 1,
            name: "Alice Johnson",
            email: "alice@toktickit.io",
            isActive: true,
        }));
    });
    it("renders the TokTickIT heading", () => {
        render(_jsx(App, {}));
        expect(screen.getAllByText(/TokTickIT/i)[0]).toBeInTheDocument();
    });
    it("shows loading state when button is clicked", async () => {
        let resolvePromise;
        const pendingPromise = new Promise((resolve) => {
            resolvePromise = resolve;
        });
        vi.spyOn(api, "checkSystem").mockReturnValue(pendingPromise);
        render(_jsx(App, {}));
        const button = screen.getByRole("button", { name: /Check System/i });
        fireEvent.click(button);
        expect(screen.getAllByText(/Loading/i).length).toBeGreaterThan(0);
        resolvePromise({
            online: true,
            categories: [{ id: 1, name: "Account and Access" }],
        });
        await waitFor(() => {
            expect(screen.getByText(/System Status: Online/i)).toBeInTheDocument();
        });
    });
    it("shows Online and the seeded categories on success", async () => {
        vi.spyOn(api, "checkSystem").mockResolvedValue({
            online: true,
            categories: [
                { id: 1, name: "Account and Access" },
                { id: 2, name: "Hardware" },
                { id: 3, name: "Software" },
                { id: 4, name: "Network" },
            ],
        });
        render(_jsx(App, {}));
        const button = screen.getByRole("button", { name: /Check System/i });
        fireEvent.click(button);
        await waitFor(() => {
            expect(screen.getByText(/System Status: Online/i)).toBeInTheDocument();
        });
        expect(screen.getByText(/Supported Request Categories:/i)).toBeInTheDocument();
        expect(screen.getByText(/Account and Access/i)).toBeInTheDocument();
        expect(screen.getByText(/Hardware/i)).toBeInTheDocument();
        expect(screen.getByText(/Software/i)).toBeInTheDocument();
        expect(screen.getByText(/Network/i)).toBeInTheDocument();
    });
    it("shows an Offline error message when the API is unavailable", async () => {
        vi.spyOn(api, "checkSystem").mockRejectedValue(new Error("Unable to connect to TokTickIT API"));
        render(_jsx(App, {}));
        const button = screen.getByRole("button", { name: /Check System/i });
        fireEvent.click(button);
        await waitFor(() => {
            expect(screen.getByText(/System Status: Offline/i)).toBeInTheDocument();
            expect(screen.getByText(/Unable to connect to TokTickIT API/i)).toBeInTheDocument();
        });
    });
});
