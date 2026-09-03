import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { fetchRequesters } from "../api.js";
export const RequesterSelection = ({ onSelectRequester, }) => {
    const [requesters, setRequesters] = useState([]);
    const [selectedId, setSelectedId] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    useEffect(() => {
        async function loadRequesters() {
            try {
                setLoading(true);
                setError("");
                const data = await fetchRequesters();
                setRequesters(data);
                if (data.length > 0) {
                    setSelectedId(data[0].id.toString());
                }
            }
            catch (err) {
                setError(err.message || "Failed to load active requesters");
            }
            finally {
                setLoading(false);
            }
        }
        loadRequesters();
    }, []);
    function handleContinue() {
        const found = requesters.find((r) => r.id.toString() === selectedId);
        if (found) {
            onSelectRequester(found);
        }
    }
    return (_jsx("div", { className: "container py-5", "data-testid": "requester-selection-screen", children: _jsx("div", { className: "row justify-content-center", children: _jsx("div", { className: "col-12 col-md-8 col-lg-6", children: _jsxs("div", { className: "card card-zen-green overflow-hidden", children: [_jsxs("div", { className: "card-header bg-zen-green p-4 text-center", children: [_jsx("h2", { className: "h4 mb-1 text-white fw-bold", children: "Development Requester Selection" }), _jsx("p", { className: "small text-white-50 mb-0", children: "Simulated User Context (Lab 02)" })] }), _jsxs("div", { className: "card-body p-4", children: [_jsxs("div", { className: "alert alert-info border-0 shadow-sm d-flex align-items-center gap-2 mb-4", role: "alert", children: [_jsx("span", { className: "fs-5", children: "\u2139\uFE0F" }), _jsxs("div", { children: [_jsx("strong", { children: "Dev Environment Notice:" }), " Authentication arrives in Lab 3. Please select an active requester profile to continue."] })] }), loading && (_jsxs("div", { className: "text-center py-4", "data-testid": "loading-indicator", children: [_jsx("div", { className: "spinner-border text-zen-green", role: "status", children: _jsx("span", { className: "visually-hidden", children: "Loading requesters..." }) }), _jsx("p", { className: "mt-2 text-muted small", children: "Loading active requesters..." })] })), error && (_jsx("div", { className: "alert alert-danger", "data-testid": "error-message", children: error })), !loading && !error && (_jsxs("div", { className: "mb-4", children: [_jsx("label", { htmlFor: "requester-select", className: "form-label fw-bold text-zen-green", children: "Active User Context" }), _jsx("select", { id: "requester-select", className: "form-select form-select-lg border-zen-green", value: selectedId, onChange: (e) => setSelectedId(e.target.value), "data-testid": "requester-dropdown", children: requesters.map((r) => (_jsxs("option", { value: r.id.toString(), children: [r.name, " (", r.email, ")"] }, r.id))) })] })), _jsx("button", { type: "button", className: "btn btn-zen-green w-100 py-2 fw-bold fs-5 rounded-3", disabled: loading || !!error || !selectedId, onClick: handleContinue, "data-testid": "continue-btn", children: "Continue" })] })] }) }) }) }));
};
export default RequesterSelection;
