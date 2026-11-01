import React, { useState } from "react";
import { AuthUser, Requester } from "../api.js";

interface NavbarProps {
  authUser?: AuthUser | null;
  activeRequester?: Requester | null;
  onChangeRequester?: () => void;
  onLogout?: () => void;
  currentView?: string;
  onNavigate?: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  authUser,
  activeRequester,
  onChangeRequester,
  onLogout,
  currentView = "dashboard",
  onNavigate,
}) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const user = authUser || (activeRequester ? { name: activeRequester.name, role: "REQUESTER" } : null);

  const role = authUser?.role || "REQUESTER";
  const isRequester = role === "REQUESTER";
  const isStaff = role === "IT_STAFF";
  const isAdmin = role === "ADMINISTRATOR";

  const getRoleLabel = (r: string) => {
    switch (r) {
      case "ADMINISTRATOR":
        return "Administrator";
      case "IT_STAFF":
        return "IT Staff";
      case "REQUESTER":
      default:
        return "Requester";
    }
  };

  const handleSignOut = () => {
    setProfileDropdownOpen(false);
    if (onLogout) onLogout();
    else if (onChangeRequester) onChangeRequester();
  };

  return (
    <nav className="navbar navbar-expand-lg bg-zen-green text-white shadow-sm px-3 py-1" style={{ minHeight: 46 }} data-testid="app-navbar">
      <div className="container-fluid d-flex justify-content-between align-items-center px-1 px-md-2">
        {/* Left: Brand Logo & Main Navigation */}
        <div className="d-flex align-items-center gap-3">
          <a
            className="navbar-brand fw-bold text-white d-flex align-items-center gap-1.5 text-decoration-none py-0 me-2"
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              if (onNavigate) {
                if (isAdmin || isStaff) onNavigate("dashboard");
                else onNavigate("dashboard");
              }
            }}
          >
            {/* Clock icon in circle matching mockups */}
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-white"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="fw-bold tracking-wide" style={{ fontSize: "1.05rem" }}>TokTickIT</span>
          </a>

          {user && onNavigate && (
            <div className="d-flex align-items-center gap-1">
              {isRequester && (
                <>
                  <button
                    type="button"
                    className={`btn btn-sm d-flex align-items-center gap-1.5 border-0 px-2.5 py-1 text-white rounded-2 ${
                      currentView === "dashboard" || currentView === "my-tickets"
                        ? "fw-semibold"
                        : "opacity-85 hover-opacity-100"
                    }`}
                    style={{
                      backgroundColor: currentView === "dashboard" || currentView === "my-tickets" ? "rgba(255, 255, 255, 0.18)" : "transparent",
                    }}
                    onClick={() => onNavigate("dashboard")}
                    data-testid="nav-dashboard-btn"
                    aria-current={currentView === "dashboard" || currentView === "my-tickets" ? "page" : undefined}
                  >
                    <span>📄</span>
                    <span>My Tickets</span>
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm d-flex align-items-center gap-1.5 border-0 px-2.5 py-1 text-white rounded-2 ${
                      currentView === "create-ticket"
                        ? "fw-semibold"
                        : "opacity-85 hover-opacity-100"
                    }`}
                    style={{
                      backgroundColor: currentView === "create-ticket" ? "rgba(255, 255, 255, 0.18)" : "transparent",
                    }}
                    onClick={() => onNavigate("create-ticket")}
                    data-testid="nav-create-ticket-btn"
                    aria-current={currentView === "create-ticket" ? "page" : undefined}
                  >
                    <span>⊕</span>
                    <span>Create Ticket</span>
                  </button>
                </>
              )}

              {isStaff && (
                <>
                  <button type="button" className={`btn btn-sm d-flex align-items-center gap-1.5 border-0 px-2.5 py-1 text-white rounded-2 ${currentView === "dashboard" ? "fw-semibold" : "opacity-85 hover-opacity-100"}`} style={{ backgroundColor: currentView === "dashboard" ? "rgba(255, 255, 255, 0.18)" : "transparent" }} onClick={() => onNavigate("dashboard")} data-testid="nav-staff-dashboard-btn" aria-current={currentView === "dashboard" ? "page" : undefined}><span>▦</span><span>Dashboard</span></button>
                  <button
                    type="button"
                    className={`btn btn-sm d-flex align-items-center gap-1.5 border-0 px-2.5 py-1 text-white rounded-2 ${
                      currentView === "queue"
                        ? "fw-semibold"
                        : "opacity-85 hover-opacity-100"
                    }`}
                    style={{
                      backgroundColor: currentView === "queue" ? "rgba(255, 255, 255, 0.18)" : "transparent",
                    }}
                    onClick={() => onNavigate("queue")}
                    data-testid="nav-queue-btn"
                    aria-current={currentView === "queue" ? "page" : undefined}
                  >
                    <span>📄</span>
                    <span>Ticket Queue</span>
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm d-flex align-items-center gap-1.5 border-0 px-2.5 py-1 text-white rounded-2 ${
                      currentView === "create-ticket"
                        ? "fw-semibold"
                        : "opacity-85 hover-opacity-100"
                    }`}
                    style={{
                      backgroundColor: currentView === "create-ticket" ? "rgba(255, 255, 255, 0.18)" : "transparent",
                    }}
                    onClick={() => onNavigate("create-ticket")}
                    data-testid="nav-create-ticket-btn"
                    aria-current={currentView === "create-ticket" ? "page" : undefined}
                  >
                    <span>⊕</span>
                    <span>Create Ticket</span>
                  </button>
                </>
              )}

              {isAdmin && (
                <>
                  <button type="button" className={`btn btn-sm d-flex align-items-center gap-1.5 border-0 px-2.5 py-1 text-white rounded-2 ${currentView === "dashboard" ? "fw-semibold" : "opacity-85 hover-opacity-100"}`} style={{ backgroundColor: currentView === "dashboard" ? "rgba(255, 255, 255, 0.18)" : "transparent" }} onClick={() => onNavigate("dashboard")} data-testid="nav-staff-dashboard-btn" aria-current={currentView === "dashboard" ? "page" : undefined}><span>▦</span><span>Dashboard</span></button>
                  <button
                    type="button"
                    className={`btn btn-sm d-flex align-items-center gap-1.5 border-0 px-2.5 py-1 text-white rounded-2 ${
                      currentView === "user-management"
                        ? "fw-semibold"
                        : "opacity-85 hover-opacity-100"
                    }`}
                    style={{
                      backgroundColor: currentView === "user-management" ? "rgba(255, 255, 255, 0.18)" : "transparent",
                    }}
                    onClick={() => onNavigate("user-management")}
                    data-testid="nav-admin-btn"
                    aria-current={currentView === "user-management" ? "page" : undefined}
                  >
                    <span>💻</span>
                    <span>Admin</span>
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm d-flex align-items-center gap-1.5 border-0 px-2.5 py-1 text-white rounded-2 ${
                      currentView === "queue"
                        ? "fw-semibold"
                        : "opacity-85 hover-opacity-100"
                    }`}
                    style={{
                      backgroundColor: currentView === "queue" ? "rgba(255, 255, 255, 0.18)" : "transparent",
                    }}
                    onClick={() => onNavigate("queue")}
                    data-testid="nav-queue-btn"
                    aria-current={currentView === "queue" ? "page" : undefined}
                  >
                    <span>📄</span>
                    <span>Ticket Queue</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right: Profile Dropdown & Controls */}
        {user && (
          <div className="position-relative" data-testid="active-requester-info">
            <button
              type="button"
              className="btn btn-sm text-white d-flex align-items-center gap-2 border-0 py-1 px-2"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              aria-expanded={profileDropdownOpen}
              aria-label={`Profile menu for ${user.name}`}
            >
              <div
                className="rounded-circle d-flex align-items-center justify-content-center bg-white text-zen-green fw-bold"
                style={{ width: 24, height: 24, fontSize: "0.75rem" }}
              >
                👤
              </div>
              <span className="fw-medium d-none d-sm-inline" style={{ fontSize: "0.85rem" }}>Profile</span>
              <span style={{ fontSize: "0.65rem" }}>▼</span>
            </button>

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && (
              <div
                className="position-absolute end-0 mt-2 bg-white text-dark rounded-3 shadow border p-2 z-3"
                style={{ minWidth: 220 }}
              >
                <div className="px-3 py-2 border-bottom mb-2">
                  <div className="fw-bold text-truncate" data-testid="active-requester-name">
                    {user.name}
                  </div>
                  <div className="d-flex align-items-center gap-2 mt-1">
                    <span
                      className="pill-badge pill-role-staff text-uppercase"
                      style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem" }}
                      data-testid="active-user-role"
                    >
                      {getRoleLabel(role)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger w-100 text-start px-3 py-1.5 rounded-2 d-flex align-items-center gap-2"
                  onClick={handleSignOut}
                  data-testid={activeRequester ? "change-requester-btn" : "logout-btn"}
                >
                  <span>🚪</span>
                  <span>{activeRequester ? "Change Requester" : "Sign Out"}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
