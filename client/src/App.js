import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from "react";
import { getCurrentUser, logout, checkSystem } from "./api.js";
import Navbar from "./components/Navbar.js";
import Login from "./components/Login.js";
import ChangePassword from "./components/ChangePassword.js";
import CreateTicketForm from "./components/CreateTicketForm.js";
import MyTicketsList from "./components/MyTicketsList.js";
import TicketDetail from "./components/TicketDetail.js";
import StaffTicketQueue from "./components/StaffTicketQueue.js";
import UserManagement from "./components/UserManagement.js";
export default function App() {
    const [authUser, setAuthUser] = useState(null);
    const [activeRequester, setActiveRequester] = useState(() => {
        const saved = sessionStorage.getItem("selectedRequester");
        if (saved) {
            try {
                return JSON.parse(saved);
            }
            catch {
                return null;
            }
        }
        return null;
    });
    const [loadingAuth, setLoadingAuth] = useState(() => {
        return Boolean(sessionStorage.getItem("token") || localStorage.getItem("token"));
    });
    const [currentView, setCurrentView] = useState("dashboard");
    const [selectedTicketId, setSelectedTicketId] = useState(null);
    const [diagState, setDiagState] = useState("idle");
    const [categories, setCategories] = useState([]);
    const [diagError, setDiagError] = useState("");
    const checkAuth = useCallback(async () => {
        const hasToken = Boolean(sessionStorage.getItem("token") || localStorage.getItem("token"));
        if (!hasToken) {
            setLoadingAuth(false);
            return;
        }
        setLoadingAuth(true);
        try {
            const user = await getCurrentUser();
            setAuthUser(user);
            if (user.role === "ADMINISTRATOR") {
                setCurrentView("user-management");
            }
            else if (user.role === "IT_STAFF") {
                setCurrentView("queue");
            }
            else {
                setCurrentView("dashboard");
            }
        }
        catch {
            const saved = sessionStorage.getItem("selectedRequester");
            if (saved) {
                try {
                    const req = JSON.parse(saved);
                    setActiveRequester(req);
                    setAuthUser({
                        id: req.id,
                        name: req.name,
                        email: req.email,
                        role: "REQUESTER",
                        mustChangePassword: false,
                        isActive: true,
                    });
                }
                catch {
                    setAuthUser(null);
                }
            }
            else {
                setAuthUser(null);
            }
        }
        finally {
            setLoadingAuth(false);
        }
    }, []);
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);
    const handleLoginSuccess = (user) => {
        setAuthUser(user);
        if (user.role === "ADMINISTRATOR") {
            setCurrentView("user-management");
        }
        else if (user.role === "IT_STAFF") {
            setCurrentView("queue");
        }
        else {
            setCurrentView("dashboard");
        }
    };
    const handleSelectDevRequester = (requester) => {
        setActiveRequester(requester);
        sessionStorage.setItem("selectedRequester", JSON.stringify(requester));
        sessionStorage.setItem("x-user-id", requester.id.toString());
        setAuthUser({
            id: requester.id,
            name: requester.name,
            email: requester.email,
            role: "REQUESTER",
            mustChangePassword: false,
            isActive: true,
        });
        setCurrentView("dashboard");
    };
    const handleLogout = async () => {
        sessionStorage.removeItem("selectedRequester");
        sessionStorage.removeItem("x-user-id");
        sessionStorage.removeItem("token");
        localStorage.removeItem("token");
        setAuthUser(null);
        setActiveRequester(null);
        setSelectedTicketId(null);
        setCurrentView("dashboard");
        await logout();
    };
    async function handleCheckSystem() {
        setDiagState("loading");
        setDiagError("");
        try {
            const status = await checkSystem();
            setCategories(status.categories);
            setDiagState("success");
        }
        catch (err) {
            setDiagError(err.message || "Unable to connect to TokTickIT API");
            setDiagState("error");
        }
    }
    if (loadingAuth) {
        return (_jsx("div", { className: "min-vh-100 d-flex align-items-center justify-content-center bg-light", "data-testid": "app-loading", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "spinner-border text-zen-green mb-3", role: "status", children: _jsx("span", { className: "visually-hidden", children: "Loading application..." }) }), _jsx("p", { className: "text-muted fw-medium", children: "Loading TokTickIT..." })] }) }));
    }
    if (!authUser && !activeRequester) {
        return (_jsx(Login, { onSuccess: handleLoginSuccess, onSelectDevRequester: handleSelectDevRequester }));
    }
    if (authUser && authUser.mustChangePassword) {
        return (_jsx(ChangePassword, { onSuccess: () => {
                setAuthUser((prev) => (prev ? { ...prev, mustChangePassword: false } : null));
            }, onLogout: handleLogout }));
    }
    const effectiveUser = authUser || (activeRequester ? {
        id: activeRequester.id,
        name: activeRequester.name,
        email: activeRequester.email,
        role: "REQUESTER",
        mustChangePassword: false,
        isActive: true,
    } : null);
    if (!effectiveUser) {
        return (_jsx(Login, { onSuccess: handleLoginSuccess, onSelectDevRequester: handleSelectDevRequester }));
    }
    const role = effectiveUser.role;
    const isRequester = role === "REQUESTER";
    const isStaff = role === "IT_STAFF";
    const isAdmin = role === "ADMINISTRATOR";
    return (_jsxs("div", { className: "min-vh-100 d-flex flex-column bg-light", "data-testid": "app-authenticated", children: [_jsx(Navbar, { authUser: effectiveUser, activeRequester: activeRequester, onChangeRequester: handleLogout, onLogout: handleLogout, currentView: currentView, onNavigate: (view) => {
                    setSelectedTicketId(null);
                    setCurrentView(view);
                } }), _jsxs("main", { className: "flex-grow-1", children: [isRequester && (_jsx(_Fragment, { children: currentView === "ticket-detail" && selectedTicketId !== null ? (_jsx(TicketDetail, { ticketId: selectedTicketId, userId: effectiveUser.id, userRole: effectiveUser.role, onBack: () => {
                                setSelectedTicketId(null);
                                setCurrentView("dashboard");
                            } })) : currentView === "create-ticket" ? (_jsx(CreateTicketForm, { userId: effectiveUser.id, onCancel: () => setCurrentView("dashboard") })) : (_jsx(MyTicketsList, { userId: effectiveUser.id, onCreateTicket: () => setCurrentView("create-ticket"), onSelectTicket: (ticketId) => {
                                setSelectedTicketId(ticketId);
                                setCurrentView("ticket-detail");
                            } })) })), isStaff && (_jsx(_Fragment, { children: currentView === "ticket-detail" && selectedTicketId !== null ? (_jsx(TicketDetail, { ticketId: selectedTicketId, userId: effectiveUser.id, userRole: effectiveUser.role, onBack: () => {
                                setSelectedTicketId(null);
                                setCurrentView("queue");
                            } })) : (_jsx(StaffTicketQueue, { userRole: effectiveUser.role, tokenOrUserId: effectiveUser.id, onSelectTicket: (ticketId) => {
                                setSelectedTicketId(ticketId);
                                setCurrentView("ticket-detail");
                            } })) })), isAdmin && (_jsx(_Fragment, { children: currentView === "user-management" ? (_jsx(UserManagement, { currentAdminId: effectiveUser.id })) : currentView === "ticket-detail" && selectedTicketId !== null ? (_jsx(TicketDetail, { ticketId: selectedTicketId, userId: effectiveUser.id, userRole: effectiveUser.role, onBack: () => {
                                setSelectedTicketId(null);
                                setCurrentView("queue");
                            } })) : (_jsx(StaffTicketQueue, { userRole: effectiveUser.role, tokenOrUserId: effectiveUser.id, onSelectTicket: (ticketId) => {
                                setSelectedTicketId(ticketId);
                                setCurrentView("ticket-detail");
                            } })) })), _jsx("div", { className: "container pb-5 mt-4 d-none", style: { maxWidth: 768 }, children: _jsxs("div", { className: "card shadow-sm p-4 border-0 mb-4 bg-white rounded-3", children: [_jsx("div", { className: "d-flex justify-content-between align-items-center mb-3", children: _jsxs("div", { children: [_jsx("h2", { className: "h6 text-zen-green mb-1 fw-bold", children: "System Diagnostics" }), _jsxs("p", { className: "text-muted small mb-0", children: ["Authenticated User: ", _jsx("strong", { children: effectiveUser.name }), " (", effectiveUser.email, ") \u2022 Role: ", _jsx("strong", { children: effectiveUser.role })] })] }) }), _jsxs("div", { className: "border-top pt-3", children: [_jsx("button", { className: "btn btn-outline-success btn-sm mb-2 fw-medium", onClick: handleCheckSystem, disabled: diagState === "loading", "data-testid": "check-system-btn", children: diagState === "loading" ? "Loading…" : "Check System" }), diagState === "loading" && _jsx("div", { className: "mt-3 text-muted", children: "Loading\u2026" }), diagState === "success" && (_jsxs("div", { className: "mt-3", children: [_jsx("div", { className: "alert alert-success py-2 px-3 small", children: "System Status: Online" }), _jsxs("div", { className: "mt-2", children: [_jsx("h3", { className: "h6 fw-bold small", children: "Supported Request Categories:" }), _jsx("ol", { className: "list-group list-group-numbered mt-1 small", children: categories.map((category) => (_jsx("li", { className: "list-group-item py-1", children: category.name }, category.id))) })] })] })), diagState === "error" && (_jsxs("div", { className: "mt-3 alert alert-danger py-2 px-3 small", children: [_jsx("div", { children: "System Status: Offline" }), _jsx("div", { className: "mt-1", children: diagError })] }))] })] }) })] })] }));
}
