import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { changePassword } from "../api.js";
export default function ChangePassword({ onSuccess, onLogout }) {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // Requirement checks
    const isLengthValid = newPassword.length >= 8;
    const isCaseValid = /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword);
    const isSymbolValid = /[0-9]/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword);
    const isAllValid = isLengthValid && isCaseValid && isSymbolValid && newPassword === confirmPassword && !!currentPassword;
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!currentPassword || !newPassword || !confirmPassword) {
            setError("All password fields are required.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("New password and confirmation do not match.");
            return;
        }
        if (!isLengthValid || !isCaseValid || !isSymbolValid) {
            setError("Password does not meet all complexity requirements.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            await changePassword(currentPassword, newPassword, confirmPassword);
            onSuccess();
        }
        catch (err) {
            setError(err.message || "Failed to update password. Please try again.");
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "min-vh-100 d-flex flex-column bg-light", "data-testid": "change-password-screen", children: [_jsx("header", { className: "bg-zen-green text-white py-1 px-3 shadow-sm d-flex justify-content-between align-items-center", style: { minHeight: 46 }, children: _jsxs("div", { className: "container-fluid d-flex justify-content-between align-items-center px-1 px-md-2", children: [_jsxs("div", { className: "d-flex align-items-center gap-2", children: [_jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round", className: "text-white", children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("polyline", { points: "12 6 12 12 16 14" })] }), _jsx("span", { className: "fw-bold tracking-wide", style: { fontSize: "1.05rem" }, children: "TokTickIT" })] }), _jsx("button", { type: "button", className: "btn btn-outline-light btn-sm fw-medium px-2.5 py-1 rounded-2", onClick: onLogout, "data-testid": "logout-btn", children: "Sign Out" })] }) }), _jsx("main", { className: "flex-grow-1 d-flex align-items-center justify-content-center p-3", children: _jsxs("div", { className: "card border shadow-sm rounded-3 bg-white p-4", style: { maxWidth: 400, width: "100%", borderColor: "#e5e7eb" }, children: [_jsxs("div", { className: "mb-4", children: [_jsx("h1", { className: "h4 fw-bold text-dark mb-1", children: "Change Your Password" }), _jsx("p", { className: "text-muted small mb-0", children: "You must change your password to continue." })] }), error && (_jsx("div", { className: "alert alert-danger py-2 px-3 mb-4 rounded-3 small", role: "alert", "data-testid": "change-password-error-alert", style: { backgroundColor: "#fef2f2", borderColor: "#fecaca", color: "#991b1b" }, children: error })), _jsxs("form", { onSubmit: handleSubmit, "data-testid": "change-password-form", children: [_jsxs("div", { className: "mb-3", children: [_jsx("label", { htmlFor: "currentPassword", className: "form-label small text-muted fw-medium mb-1", children: "Current (temporary) password" }), _jsxs("div", { className: "input-group", children: [_jsx("input", { type: showCurrent ? "text" : "password", id: "currentPassword", className: "form-control rounded-start-2", style: { padding: "0.6rem 0.75rem", borderColor: "#d1d5db" }, placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: currentPassword, onChange: (e) => setCurrentPassword(e.target.value), required: true, disabled: loading, "data-testid": "current-password-input" }), _jsx("button", { type: "button", className: "btn btn-outline-secondary border-start-0 rounded-end-2 px-3", style: { borderColor: "#d1d5db", color: "#6b7280" }, onClick: () => setShowCurrent(!showCurrent), title: showCurrent ? "Hide password" : "Show password", children: showCurrent ? "🙈" : "👁" })] })] }), _jsxs("div", { className: "mb-3", children: [_jsx("label", { htmlFor: "newPassword", className: "form-label small text-muted fw-medium mb-1", children: "New password" }), _jsxs("div", { className: "input-group", children: [_jsx("input", { type: showNew ? "text" : "password", id: "newPassword", className: "form-control rounded-start-2", style: { padding: "0.6rem 0.75rem", borderColor: "#d1d5db" }, placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: newPassword, onChange: (e) => setNewPassword(e.target.value), required: true, disabled: loading, "data-testid": "new-password-input" }), _jsx("button", { type: "button", className: "btn btn-outline-secondary border-start-0 rounded-end-2 px-3", style: { borderColor: "#d1d5db", color: "#6b7280" }, onClick: () => setShowNew(!showNew), title: showNew ? "Hide password" : "Show password", children: showNew ? "🙈" : "👁" })] })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { htmlFor: "confirmPassword", className: "form-label small text-muted fw-medium mb-1", children: "Confirm new password" }), _jsxs("div", { className: "input-group", children: [_jsx("input", { type: showConfirm ? "text" : "password", id: "confirmPassword", className: "form-control rounded-start-2", style: { padding: "0.6rem 0.75rem", borderColor: "#d1d5db" }, placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), required: true, disabled: loading, "data-testid": "confirm-password-input" }), _jsx("button", { type: "button", className: "btn btn-outline-secondary border-start-0 rounded-end-2 px-3", style: { borderColor: "#d1d5db", color: "#6b7280" }, onClick: () => setShowConfirm(!showConfirm), title: showConfirm ? "Hide password" : "Show password", children: showConfirm ? "🙈" : "👁" })] }), confirmPassword && newPassword !== confirmPassword && (_jsx("div", { className: "text-danger small mt-1", children: "Passwords do not match" }))] }), _jsxs("div", { className: "p-3 rounded-2 mb-4 small", style: { backgroundColor: "#f0fdf4", border: "1px solid #dcfce7" }, children: [_jsx("span", { className: "fw-semibold d-block mb-1 text-success", children: "Password must:" }), _jsxs("ul", { className: "list-unstyled mb-0 d-flex flex-column gap-1 text-muted", style: { fontSize: "0.85rem" }, children: [_jsxs("li", { className: isLengthValid ? "text-success fw-medium" : "", "data-testid": "req-length", children: [isLengthValid ? "✓" : "○", " Be at least 8 characters"] }), _jsxs("li", { className: isCaseValid ? "text-success fw-medium" : "", "data-testid": "req-case", children: [isCaseValid ? "✓" : "○", " Include upper and lower case letters"] }), _jsxs("li", { className: isSymbolValid ? "text-success fw-medium" : "", "data-testid": "req-symbol", children: [isSymbolValid ? "✓" : "○", " Include a number and a special character"] })] })] }), _jsx("button", { type: "submit", className: "btn btn-zen-green w-100 fw-semibold py-2.5 rounded-2 shadow-sm", disabled: loading || !isAllValid, "data-testid": "change-password-submit-btn", children: loading ? "Updating..." : "Continue" })] })] }) })] }));
}
