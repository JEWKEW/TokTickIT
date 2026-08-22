import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { checkSystem } from "./api.js";
import Navbar from "./components/Navbar.js";
import RequesterSelection from "./components/RequesterSelection.js";
import CreateTicketForm from "./components/CreateTicketForm.js";
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
    return (_jsxs("div", { className: "min-vh-100 d-flex flex-column", children: [_jsx(Navbar, { activeRequester: activeRequester, onChangeRequester: handleChangeRequester, currentView: currentView, onNavigate: (view) => setCurrentView(view) }), _jsx("main", { className: "flex-grow-1 bg-light", children: !activeRequester ? (_jsx(RequesterSelection, { onSelectRequester: handleSelectRequester })) : currentView === "create-ticket" ? (_jsx(CreateTicketForm, { userId: activeRequester.id, onCancel: () => setCurrentView("dashboard") })) : (_jsx("div", { className: "container py-5", style: { maxWidth: 768 }, children: _jsxs("div", { className: "card shadow-sm p-4 border-0 mb-4 bg-white rounded-3", children: [_jsxs("div", { className: "d-flex justify-content-between align-items-center mb-3", children: [_jsxs("div", { children: [_jsx("h1", { className: "h4 text-zen-green mb-1 fw-bold", children: "Requester Portal Dashboard" }), _jsxs("p", { className: "text-muted small mb-0", children: ["Active Context: ", _jsx("strong", { children: activeRequester.name }), " (", activeRequester.email, ")"] })] }), _jsxs("div", { className: "d-flex align-items-center gap-2", children: [_jsx("button", { type: "button", className: "btn btn-zen-green btn-sm fw-bold px-3", onClick: () => setCurrentView("create-ticket"), "data-testid": "create-ticket-btn", children: "+ New Ticket" }), _jsx("span", { className: "badge bg-success bg-opacity-10 text-success px-3 py-2 border border-success border-opacity-25 rounded-pill", children: "Simulated Session" })] })] }), _jsxs("div", { className: "border-top pt-4 mt-2", children: [_jsx("button", { className: "btn btn-zen-green mb-3", onClick: handleCheck, disabled: state === "loading", "data-testid": "check-system-btn", children: state === "loading" ? "Loading…" : "Check System" }), state === "loading" && (_jsx("div", { className: "mt-3 text-muted", children: "Loading\u2026" })), state === "success" && (_jsxs("div", { className: "mt-3", children: [_jsx("div", { className: "alert alert-success", children: "System Status: Online" }), _jsxs("div", { className: "mt-3", children: [_jsx("h2", { className: "h6 fw-bold", children: "Supported Request Categories:" }), _jsx("ol", { className: "list-group list-group-numbered mt-2", children: categories.map((category) => (_jsx("li", { className: "list-group-item", children: category.name }, category.id))) })] })] })), state === "error" && (_jsxs("div", { className: "mt-3 alert alert-danger", children: [_jsx("div", { children: "System Status: Offline" }), _jsx("div", { className: "mt-1", children: errorMsg })] }))] })] }) })) })] }));
}
