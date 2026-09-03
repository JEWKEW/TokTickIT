import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const Navbar = ({ activeRequester, onChangeRequester, currentView = "dashboard", onNavigate, }) => {
    return (_jsx("nav", { className: "navbar navbar-expand-lg navbar-dark bg-zen-green shadow-sm px-3 py-2", children: _jsxs("div", { className: "container-fluid d-flex justify-content-between align-items-center", children: [_jsxs("div", { className: "d-flex align-items-center gap-4", children: [_jsxs("a", { className: "navbar-brand fw-bold d-flex align-items-center gap-2 cursor-pointer", href: "#home", onClick: (e) => {
                                e.preventDefault();
                                if (onNavigate)
                                    onNavigate("dashboard");
                            }, children: [_jsx("span", { className: "fs-4", children: "\uD83C\uDFAB" }), _jsx("span", { children: "TokTickIT" })] }), activeRequester && onNavigate && (_jsxs("div", { className: "d-flex gap-2", children: [_jsx("button", { type: "button", className: `btn btn-sm ${currentView === "dashboard"
                                        ? "btn-light text-zen-green fw-bold"
                                        : "btn-outline-light"}`, onClick: () => onNavigate("dashboard"), "data-testid": "nav-dashboard-btn", children: "Dashboard" }), _jsx("button", { type: "button", className: `btn btn-sm ${currentView === "create-ticket"
                                        ? "btn-light text-zen-green fw-bold"
                                        : "btn-outline-light"}`, onClick: () => onNavigate("create-ticket"), "data-testid": "nav-create-ticket-btn", children: "+ New Ticket" })] }))] }), activeRequester && (_jsxs("div", { className: "d-flex align-items-center gap-3", "data-testid": "active-requester-info", children: [_jsxs("span", { className: "text-white fw-medium", "data-testid": "active-requester-name", children: ["\uD83D\uDC64 ", activeRequester.name] }), _jsx("button", { type: "button", className: "btn btn-sm btn-outline-light fw-medium", onClick: onChangeRequester, "data-testid": "change-requester-btn", children: "Change Requester" })] }))] }) }));
};
export default Navbar;
