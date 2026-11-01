import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../../src/App.js";
import * as api from "../../src/api.js";

describe("App shell", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    sessionStorage.setItem("selectedRequester", JSON.stringify({
      id: 1,
      name: "Alice Johnson",
      email: "alice@toktickit.io",
      isActive: true,
    }));
    vi.spyOn(api, "fetchRequesterDashboard").mockResolvedValue({
      metrics: { openCount: 0, inProgressCount: 0, resolvedCount: 0, closedCount: 0, waitingForRequesterCount: 0 },
      recentlyUpdated: [],
      recentlyResolved: [],
    });
  });

  it("renders the role-appropriate navigation and Requester dashboard", async () => {
    render(<App />);
    expect(await screen.findByRole("heading", { name: "Welcome, Alice Johnson!" })).toBeInTheDocument();
    expect(screen.getByTestId("nav-dashboard-btn")).toHaveAttribute("aria-current", "page");
    expect(screen.getByTestId("nav-create-ticket-btn")).toBeInTheDocument();
  });

  it("does not render the removed hidden diagnostics panel", async () => {
    render(<App />);
    expect(await screen.findByTestId("requester-dashboard")).toBeInTheDocument();
    expect(screen.queryByTestId("check-system-btn")).not.toBeInTheDocument();
    expect(screen.queryByText("System Diagnostics")).not.toBeInTheDocument();
  });
});
