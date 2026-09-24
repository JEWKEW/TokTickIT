import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
export const Navbar = ({ authUser, activeRequester, onChangeRequester, onLogout, currentView = "dashboard", onNavigate, }) => {
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const user = authUser || (activeRequester ? { name: activeRequester.name, role: "REQUESTER" } : null);
    const role = authUser?.role || "REQUESTER";
    const isRequester = role === "REQUESTER";
    const isStaff = role === "IT_STAFF";
    const isAdmin = role === "ADMINISTRATOR";
    const getRoleLabel = (r) => {
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
        if (onLogout)
            onLogout();
        else if (onChangeRequester)
            onChangeRequester();
    };
    return (_jsx("nav", { className: "navbar navbar-expand-lg bg-zen-green text-white shadow-sm px-3 py-1", style: { minHeight: 46 }, "data-testid": "app-navbar", children: _jsxs("div", { className: "container-fluid d-flex justify-content-between align-items-center px-1 px-md-2", children: [_jsxs("div", { className: "d-flex align-items-center gap-3", children: [_jsxs("a", { className: "navbar-brand fw-bold text-white d-flex align-items-center gap-1.5 text-decoration-none py-0 me-2", href: "#home", onClick: (e) => {
                                e.preventDefault();
                                if (onNavigate) {
                                    if (isAdmin)
                                        onNavigate("user-management");
                                    else if (isStaff)
                                        onNavigate("queue");
                                    else
                                        onNavigate("dashboard");
                                }
                            }, children: [_jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round", className: "text-white", children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("polyline", { points: "12 6 12 12 16 14" })] }), _jsx("span", { className: "fw-bold tracking-wide", style: { fontSize: "1.05rem" }, children: "TokTickIT" })] }), user && onNavigate && (_jsxs("div", { className: "d-flex align-items-center gap-1", children: [isRequester && (_jsxs(_Fragment, { children: [_jsxs("button", { type: "button", className: `btn btn-sm d-flex align-items-center gap-1.5 border-0 px-2.5 py-1 text-white rounded-2 ${currentView === "dashboard"
                                                ? "fw-semibold"
                                                : "opacity-85 hover-opacity-100"}`, style: {
                                                backgroundColor: currentView === "dashboard" ? "rgba(255, 255, 255, 0.18)" : "transparent",
                                            }, onClick: () => onNavigate("dashboard"), "data-testid": "nav-dashboard-btn", children: [_jsx("span", { children: "\uD83D\uDCC4" }), _jsx("span", { children: "My Tickets" })] }), _jsxs("button", { type: "button", className: `btn btn-sm d-flex align-items-center gap-1.5 border-0 px-2.5 py-1 text-white rounded-2 ${currentView === "create-ticket"
                                                ? "fw-semibold"
                                                : "opacity-85 hover-opacity-100"}`, style: {
                                                backgroundColor: currentView === "create-ticket" ? "rgba(255, 255, 255, 0.18)" : "transparent",
                                            }, onClick: () => onNavigate("create-ticket"), "data-testid": "nav-create-ticket-btn", children: [_jsx("span", { children: "\u2295" }), _jsx("span", { children: "Create Ticket" })] })] })), isStaff && (_jsxs(_Fragment, { children: [_jsxs("button", { type: "button", className: `btn btn-sm d-flex align-items-center gap-1.5 border-0 px-2.5 py-1 text-white rounded-2 ${currentView === "queue" || currentView === "dashboard"
                                                ? "fw-semibold"
                                                : "opacity-85 hover-opacity-100"}`, style: {
                                                backgroundColor: currentView === "queue" || currentView === "dashboard" ? "rgba(255, 255, 255, 0.18)" : "transparent",
                                            }, onClick: () => onNavigate("queue"), "data-testid": "nav-queue-btn", children: [_jsx("span", { children: "\uD83D\uDCC4" }), _jsx("span", { children: "My Queue" })] }), _jsxs("button", { type: "button", className: `btn btn-sm d-flex align-items-center gap-1.5 border-0 px-2.5 py-1 text-white rounded-2 ${currentView === "create-ticket"
                                                ? "fw-semibold"
                                                : "opacity-85 hover-opacity-100"}`, style: {
                                                backgroundColor: currentView === "create-ticket" ? "rgba(255, 255, 255, 0.18)" : "transparent",
                                            }, onClick: () => onNavigate("create-ticket"), "data-testid": "nav-create-ticket-btn", children: [_jsx("span", { children: "\u2295" }), _jsx("span", { children: "Create Ticket" })] })] })), isAdmin && (_jsxs(_Fragment, { children: [_jsxs("button", { type: "button", className: `btn btn-sm d-flex align-items-center gap-1.5 border-0 px-2.5 py-1 text-white rounded-2 ${currentView === "user-management"
                                                ? "fw-semibold"
                                                : "opacity-85 hover-opacity-100"}`, style: {
                                                backgroundColor: currentView === "user-management" ? "rgba(255, 255, 255, 0.18)" : "transparent",
                                            }, onClick: () => onNavigate("user-management"), "data-testid": "nav-admin-btn", children: [_jsx("span", { children: "\uD83D\uDCBB" }), _jsx("span", { children: "Admin" })] }), _jsxs("button", { type: "button", className: `btn btn-sm d-flex align-items-center gap-1.5 border-0 px-2.5 py-1 text-white rounded-2 ${currentView === "queue"
                                                ? "fw-semibold"
                                                : "opacity-85 hover-opacity-100"}`, style: {
                                                backgroundColor: currentView === "queue" ? "rgba(255, 255, 255, 0.18)" : "transparent",
                                            }, onClick: () => onNavigate("queue"), "data-testid": "nav-queue-btn", children: [_jsx("span", { children: "\uD83D\uDCC4" }), _jsx("span", { children: "Ticket Queue" })] })] }))] }))] }), user && (_jsxs("div", { className: "position-relative", "data-testid": "active-requester-info", children: [_jsxs("button", { type: "button", className: "btn btn-sm text-white d-flex align-items-center gap-2 border-0 py-1 px-2", onClick: () => setProfileDropdownOpen(!profileDropdownOpen), "aria-expanded": profileDropdownOpen, children: [_jsx("div", { className: "rounded-circle d-flex align-items-center justify-content-center bg-white text-zen-green fw-bold", style: { width: 24, height: 24, fontSize: "0.75rem" }, children: "\uD83D\uDC64" }), _jsx("span", { className: "fw-medium d-none d-sm-inline", style: { fontSize: "0.85rem" }, children: "Profile" }), _jsx("span", { style: { fontSize: "0.65rem" }, children: "\u25BC" })] }), profileDropdownOpen && (_jsxs("div", { className: "position-absolute end-0 mt-2 bg-white text-dark rounded-3 shadow border p-2 z-3", style: { minWidth: 220 }, children: [_jsxs("div", { className: "px-3 py-2 border-bottom mb-2", children: [_jsx("div", { className: "fw-bold text-truncate", "data-testid": "active-requester-name", children: user.name }), _jsx("div", { className: "d-flex align-items-center gap-2 mt-1", children: _jsx("span", { className: "pill-badge pill-role-staff text-uppercase", style: { fontSize: "0.7rem", padding: "0.15rem 0.5rem" }, "data-testid": "active-user-role", children: getRoleLabel(role) }) })] }), _jsxs("button", { type: "button", className: "btn btn-sm btn-outline-danger w-100 text-start px-3 py-1.5 rounded-2 d-flex align-items-center gap-2", onClick: handleSignOut, "data-testid": activeRequester ? "change-requester-btn" : "logout-btn", children: [_jsx("span", { children: "\uD83D\uDEAA" }), _jsx("span", { children: activeRequester ? "Change Requester" : "Sign Out" })] })] })), _jsxs("div", { className: "d-none", children: [_jsx("span", { "data-testid": "active-requester-name", children: user.name }), _jsx("span", { "data-testid": "active-user-role", children: getRoleLabel(role) }), _jsx("button", { type: "button", onClick: handleSignOut, "data-testid": activeRequester ? "change-requester-btn" : "logout-btn", children: "Sign Out" })] })] }))] }) }));
};
export default Navbar;
