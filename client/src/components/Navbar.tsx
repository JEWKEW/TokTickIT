import React from "react";
import { Requester } from "../api.js";

interface NavbarProps {
  activeRequester: Requester | null;
  onChangeRequester: () => void;
  currentView?: "dashboard" | "create-ticket";
  onNavigate?: (view: "dashboard" | "create-ticket") => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeRequester,
  onChangeRequester,
  currentView = "dashboard",
  onNavigate,
}) => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-zen-green shadow-sm px-3 py-2">
      <div className="container-fluid d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-4">
          <a
            className="navbar-brand fw-bold d-flex align-items-center gap-2 cursor-pointer"
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              if (onNavigate) onNavigate("dashboard");
            }}
          >
            <span className="fs-4">🎫</span>
            <span>TokTickIT</span>
          </a>

          {activeRequester && onNavigate && (
            <div className="d-flex gap-2">
              <button
                type="button"
                className={`btn btn-sm ${
                  currentView === "dashboard"
                    ? "btn-light text-zen-green fw-bold"
                    : "btn-outline-light"
                }`}
                onClick={() => onNavigate("dashboard")}
                data-testid="nav-dashboard-btn"
              >
                Dashboard
              </button>
              <button
                type="button"
                className={`btn btn-sm ${
                  currentView === "create-ticket"
                    ? "btn-light text-zen-green fw-bold"
                    : "btn-outline-light"
                }`}
                onClick={() => onNavigate("create-ticket")}
                data-testid="nav-create-ticket-btn"
              >
                + New Ticket
              </button>
            </div>
          )}
        </div>

        {activeRequester && (
          <div className="d-flex align-items-center gap-3" data-testid="active-requester-info">
            <span className="text-white fw-medium" data-testid="active-requester-name">
              👤 {activeRequester.name}
            </span>
            <button
              type="button"
              className="btn btn-sm btn-outline-light fw-medium"
              onClick={onChangeRequester}
              data-testid="change-requester-btn"
            >
              Change Requester
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
