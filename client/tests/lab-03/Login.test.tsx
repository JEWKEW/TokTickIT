import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Login from "../../src/components/Login.js";
import * as api from "../../src/api.js";

describe("Login UI Component Tests (TC-UI-01)", () => {
  const mockUser: api.AuthUser = {
    id: 1,
    name: "Jennifer Anderson",
    email: "janderson@tiktockit.com",
    role: "IT_STAFF",
    mustChangePassword: false,
    isActive: true,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders login form with email, password inputs and sign-in button", () => {
    render(<Login onSuccess={vi.fn()} />);

    expect(screen.getByTestId("login-screen")).toBeInTheDocument();
    expect(screen.getByTestId("login-form")).toBeInTheDocument();
    expect(screen.getByTestId("login-email-input")).toBeInTheDocument();
    expect(screen.getByTestId("login-password-input")).toBeInTheDocument();
    expect(screen.getByTestId("login-submit-btn")).toHaveTextContent("Sign In");
  });

  it("toggles password visibility when toggle button is clicked", () => {
    render(<Login onSuccess={vi.fn()} />);

    const passwordInput = screen.getByTestId("login-password-input") as HTMLInputElement;
    const toggleBtn = screen.getByTestId("toggle-password-visibility");

    expect(passwordInput.type).toBe("password");
    fireEvent.click(toggleBtn);
    expect(passwordInput.type).toBe("text");
    fireEvent.click(toggleBtn);
    expect(passwordInput.type).toBe("password");
  });

  it("displays error alert when login fails with invalid credentials", async () => {
    vi.spyOn(api, "login").mockRejectedValue(new Error("Invalid email or password"));

    render(<Login onSuccess={vi.fn()} />);

    fireEvent.change(screen.getByTestId("login-email-input"), {
      target: { value: "invalid@toktickit.com" },
    });
    fireEvent.change(screen.getByTestId("login-password-input"), {
      target: { value: "wrongpassword" },
    });
    fireEvent.click(screen.getByTestId("login-submit-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("login-error-alert")).toBeInTheDocument();
    });
    expect(screen.getByTestId("login-error-alert")).toHaveTextContent("Invalid email or password");
  });

  it("calls onSuccess callback with user profile and token upon successful login", async () => {
    vi.spyOn(api, "login").mockResolvedValue({
      token: "mock-jwt-token-123",
      user: mockUser,
    });

    const onSuccessMock = vi.fn();
    render(<Login onSuccess={onSuccessMock} />);

    fireEvent.change(screen.getByTestId("login-email-input"), {
      target: { value: "janderson@tiktockit.com" },
    });
    fireEvent.change(screen.getByTestId("login-password-input"), {
      target: { value: "ValidPassword123!" },
    });
    fireEvent.click(screen.getByTestId("login-submit-btn"));

    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalledWith(mockUser, "mock-jwt-token-123");
    });
  });
});
