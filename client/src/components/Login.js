import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { login } from "../api.js";
export default function Login({ onSuccess }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email.trim() || !password) {
            setError("Please enter both email and password.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await login(email.trim(), password);
            onSuccess(data.user, data.token);
        }
        catch (err) {
            setError(err.message || "Invalid email or password. Please try again.");
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "min-vh-100 d-flex flex-column bg-light", "data-testid": "login-screen", children: [_jsx("header", { className: "bg-zen-green text-white px-3 shadow-sm d-flex align-items-center", style: { minHeight: 46 }, children: _jsxs("div", { className: "container-fluid d-flex align-items-center gap-2 px-1 px-md-2", children: [_jsxs("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.2", strokeLinecap: "round", strokeLinejoin: "round", className: "text-white", children: [_jsx("circle", { cx: "12", cy: "12", r: "10" }), _jsx("polyline", { points: "12 6 12 12 16 14" })] }), _jsx("span", { className: "fw-bold tracking-wide", style: { fontSize: "1.05rem", lineHeight: 1 }, children: "TokTickIT" })] }) }), _jsx("main", { className: "flex-grow-1 d-flex align-items-center justify-content-center p-3", children: _jsxs("div", { className: "card border shadow-sm rounded-3 bg-white p-4", style: { maxWidth: 390, width: "100%", borderColor: "#e5e7eb" }, children: [_jsx("div", { className: "mb-3", children: _jsx("h1", { className: "h5 fw-bold text-dark mb-0", children: "Sign in to your account" }) }), error && (_jsxs("div", { className: "alert alert-danger py-2 px-3 mb-4 rounded-3 d-flex align-items-start gap-2", role: "alert", "data-testid": "login-error-alert", style: { backgroundColor: "#fef2f2", borderColor: "#fecaca", color: "#991b1b" }, children: [_jsx("div", { className: "mt-0.5 fw-bold fs-6", children: "\u24D8" }), _jsxs("div", { className: "small", children: [_jsx("div", { className: "fw-semibold", children: error.includes("Invalid email or password")
                                                ? "Invalid email or password."
                                                : error }), error.includes("Invalid email or password") && (_jsx("div", { className: "text-muted small", children: "Please try again." }))] })] })), _jsxs("form", { onSubmit: handleSubmit, "data-testid": "login-form", children: [_jsxs("div", { className: "mb-3", children: [_jsx("label", { htmlFor: "loginEmail", className: "form-label small text-muted fw-medium mb-1", children: "Email address" }), _jsx("input", { type: "email", id: "loginEmail", className: "form-control rounded-2", style: { padding: "0.6rem 0.75rem", borderColor: "#d1d5db" }, placeholder: "janderson@toktickit.com", value: email, onChange: (e) => setEmail(e.target.value), required: true, disabled: loading, "data-testid": "login-email-input" })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { htmlFor: "loginPassword", className: "form-label small text-muted fw-medium mb-1", children: "Password" }), _jsxs("div", { className: "input-group", children: [_jsx("input", { type: showPassword ? "text" : "password", id: "loginPassword", className: "form-control rounded-start-2", style: { padding: "0.6rem 0.75rem", borderColor: "#d1d5db" }, placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", value: password, onChange: (e) => setPassword(e.target.value), required: true, disabled: loading, "data-testid": "login-password-input" }), _jsx("button", { type: "button", className: "btn btn-outline-secondary border-start-0 rounded-end-2 px-3", style: { borderColor: "#d1d5db", color: "#6b7280" }, onClick: () => setShowPassword(!showPassword), "data-testid": "toggle-password-visibility", title: showPassword ? "Hide password" : "Show password", children: showPassword ? "🙈" : "👁" })] })] }), _jsx("button", { type: "submit", className: "btn btn-zen-green w-100 fw-semibold py-2.5 rounded-2 shadow-sm mb-3", disabled: loading, "data-testid": "login-submit-btn", children: loading ? (_jsxs("span", { className: "d-flex align-items-center justify-content-center gap-2", children: [_jsx("span", { className: "spinner-border spinner-border-sm", role: "status", "aria-hidden": "true" }), "Signing in..."] })) : ("Sign In") }), _jsx("div", { className: "text-center", children: _jsx("a", { href: "#forgot", onClick: (e) => {
                                            e.preventDefault();
                                            alert("Please contact your system Administrator to reset your password.");
                                        }, className: "small text-zen-green text-decoration-none fw-medium", "data-testid": "forgot-password-link", children: "Forgot your password?" }) })] })] }) })] }));
}
