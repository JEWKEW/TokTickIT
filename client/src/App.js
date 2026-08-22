import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { checkSystem } from "./api.js";
import Navbar from "./components/Navbar.js";
import RequesterSelection from "./components/RequesterSelection.js";
import CreateTicketForm from "./components/CreateTicketForm.js";
import MyTicketsList from "./components/MyTicketsList.js";

export default function App() {
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
    const [currentView, setCurrentView] = useState("dashboard");
    const [state, setState] = useState("idle");
    const [categories, setCategories] = useState([]);
    const [errorMsg, setErrorMsg] = useState("");

    function handleSelectRequester(requester) {
        setActiveRequester(requester);
        sessionStorage.setItem("selectedRequester", JSON.stringify(requester));
        sessionStorage.setItem("x-user-id", requester.id.toString());
        setCurrentView("dashboard");
    }

    function handleChangeRequester() {
        setActiveRequester(null);
        sessionStorage.removeItem("selectedRequester");
        sessionStorage.removeItem("x-user-id");
        setState("idle");
        setCategories([]);
        setErrorMsg("");
        setCurrentView("dashboard");
    }

    async function handleCheck() {
        setState("loading");
        setErrorMsg("");
        try {
            const status = await checkSystem();
            setCategories(status.categories);
            setState("success");
        }
        catch (err) {
            setErrorMsg(err.message || "Unable to connect to TokTickIT API");
            setState("error");
        }
    }

    return (_jsxs("div", { className: "min-vh-100 d-flex flex-column", children: [
        _jsx(Navbar, { activeRequester: activeRequester, onChangeRequester: handleChangeRequester, currentView: currentView, onNavigate: (view) => setCurrentView(view) }),
        _jsx("main", { className: "flex-grow-1 bg-light", children: !activeRequester ? (_jsx(RequesterSelection, { onSelectRequester: handleSelectRequester })) : currentView === "create-ticket" ? (_jsx(CreateTicketForm, { userId: activeRequester.id, onCancel: () => setCurrentView("dashboard") })) : (_jsxs("div", { children: [
            _jsx(MyTicketsList, { userId: activeRequester.id, onCreateTicket: () => setCurrentView("create-ticket") }, "my-tickets-list"),
            _jsx("div", { className: "container pb-5", style: { maxWidth: 768 }, children: _jsxs("div", { className: "card shadow-sm p-4 border-0 mb-4 bg-white rounded-3", children: [
                _jsx("div", { className: "d-flex justify-content-between align-items-center mb-3", children: _jsx("div", { children: [
                    _jsx("h2", { className: "h6 text-zen-green mb-1 fw-bold", children: "System Diagnostics" }),
                    _jsxs("p", { className: "text-muted small mb-0", children: ["Active Context: ", _jsx("strong", { children: activeRequester.name }), " (", activeRequester.email, ")"] })
                ] }) }),
                _jsxs("div", { className: "border-top pt-3", children: [
                    _jsx("button", { className: "btn btn-outline-success btn-sm mb-2 fw-medium", onClick: handleCheck, disabled: state === "loading", "data-testid": "check-system-btn", children: state === "loading" ? "Loading…" : "Check System" }),
                    state === "loading" && (_jsx("div", { className: "mt-3 text-muted", children: "Loading\u2026" })),
                    state === "success" && (_jsxs("div", { className: "mt-3", children: [
                        _jsx("div", { className: "alert alert-success py-2 px-3 small", children: "System Status: Online" }),
                        _jsxs("div", { className: "mt-2", children: [
                            _jsx("h3", { className: "h6 fw-bold small", children: "Supported Request Categories:" }),
                            _jsx("ol", { className: "list-group list-group-numbered mt-1 small", children: categories.map((category) => (_jsx("li", { className: "list-group-item py-1", children: category.name }, category.id))) })
                        ] })
                    ] })),
                    state === "error" && (_jsxs("div", { className: "mt-3 alert alert-danger py-2 px-3 small", children: [
                        _jsx("div", { children: "System Status: Offline" }),
                        _jsx("div", { className: "mt-1", children: errorMsg })
                    ] }))
                ] })
            ] }) })
        ] })) })
    ] }));
}
