import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import App from "../../src/App.js";
import RequesterSelection from "../../src/components/RequesterSelection.js";
import Navbar from "../../src/components/Navbar.js";
import * as api from "../../src/api.js";

describe("Lab 02 - Dev Requester Context & Selection UI", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  const mockActiveRequesters: api.Requester[] = [
    { id: 1, name: "Alice Johnson", email: "alice@toktickit.io", isActive: true },
    { id: 2, name: "Bob Smith", email: "bob@toktickit.io", isActive: true },
    { id: 3, name: "Charlie Davis", email: "charlie@toktickit.io", isActive: true },
  ];

  describe("RequesterSelection Component", () => {
    it("renders selection screen with Zen Green header, Lab 3 notice banner, dropdown, and Continue button", async () => {
      vi.spyOn(api, "fetchRequesters").mockResolvedValue(mockActiveRequesters);
      const handleSelect = vi.fn();

      render(<RequesterSelection onSelectRequester={handleSelect} />);

      // Notice banner text verification
      expect(
        screen.getByText(/Authentication arrives in Lab 3/i)
      ).toBeInTheDocument();

      // Heading verification
      expect(
        screen.getByText(/Development Requester Selection/i)
      ).toBeInTheDocument();

      // Wait for dropdown to populate
      await waitFor(() => {
        const dropdown = screen.getByTestId("requester-dropdown") as HTMLSelectElement;
        expect(dropdown).toBeInTheDocument();
        expect(dropdown.options.length).toBe(3);
      });

      // Verify active users in dropdown
      expect(screen.getByText(/Alice Johnson/i)).toBeInTheDocument();
      expect(screen.getByText(/Bob Smith/i)).toBeInTheDocument();
      expect(screen.getByText(/Charlie Davis/i)).toBeInTheDocument();

      // Click Continue button
      const continueBtn = screen.getByTestId("continue-btn");
      expect(continueBtn).toBeEnabled();
      fireEvent.click(continueBtn);

      expect(handleSelect).toHaveBeenCalledWith(mockActiveRequesters[0]);
    });

    it("displays error message when fetching requesters fails", async () => {
      vi.spyOn(api, "fetchRequesters").mockRejectedValue(
        new Error("Unable to retrieve requesters")
      );

      render(<RequesterSelection onSelectRequester={vi.fn()} />);

      await waitFor(() => {
        expect(screen.getByTestId("error-message")).toHaveTextContent(
          "Unable to retrieve requesters"
        );
      });

      const continueBtn = screen.getByTestId("continue-btn");
      expect(continueBtn).toBeDisabled();
    });
  });

  describe("Navbar Component", () => {
    it("renders brand logo and active requester name with Change Requester button", () => {
      const handleChange = vi.fn();
      const activeUser: api.Requester = {
        id: 1,
        name: "Alice Johnson",
        email: "alice@toktickit.io",
        isActive: true,
      };

      render(
        <Navbar activeRequester={activeUser} onChangeRequester={handleChange} />
      );

      expect(screen.getByText(/TokTickIT/i)).toBeInTheDocument();
      expect(screen.getByTestId("active-requester-name")).toHaveTextContent(
        "Alice Johnson"
      );

      const changeBtn = screen.getByTestId("change-requester-btn");
      expect(changeBtn).toBeInTheDocument();

      fireEvent.click(changeBtn);
      expect(handleChange).toHaveBeenCalledTimes(1);
    });
  });

  describe("Full App Requester Context Integration", () => {
    it("allows user selection, stores session context, updates navbar, and resets context on Change Requester", async () => {
      vi.spyOn(api, "fetchRequesters").mockResolvedValue(mockActiveRequesters);

      render(<App />);

      // Initially renders RequesterSelection screen
      await waitFor(() => {
        expect(screen.getByTestId("requester-dropdown")).toBeInTheDocument();
      });

      // Select Bob Smith (id: 2)
      const dropdown = screen.getByTestId("requester-dropdown");
      fireEvent.change(dropdown, { target: { value: "2" } });

      // Click Continue
      const continueBtn = screen.getByTestId("continue-btn");
      fireEvent.click(continueBtn);

      // Main dashboard view should render with Navbar showing Bob Smith
      await waitFor(() => {
        expect(screen.getByTestId("active-requester-name")).toHaveTextContent(
          "Bob Smith"
        );
      });

      // Verify stored in sessionStorage
      expect(sessionStorage.getItem("selectedRequester")).toContain("Bob Smith");
      expect(sessionStorage.getItem("x-user-id")).toBe("2");

      // Click Change Requester button
      const changeBtn = screen.getByTestId("change-requester-btn");
      fireEvent.click(changeBtn);

      // Context and sessionStorage cleared, returns to Requester Selection screen
      expect(sessionStorage.getItem("selectedRequester")).toBeNull();
      expect(sessionStorage.getItem("x-user-id")).toBeNull();

      await waitFor(() => {
        expect(screen.getByTestId("requester-selection-screen")).toBeInTheDocument();
      });
    });
  });
});
