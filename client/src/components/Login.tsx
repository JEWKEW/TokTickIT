import React, { useState } from "react";
import { login, AuthUser } from "../api.js";

interface LoginProps {
  onSuccess: (user: AuthUser, token?: string) => void;
  onSelectDevRequester?: (requester: any) => void;
}

export default function Login({ onSuccess }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
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
    } catch (err: any) {
      setError(err.message || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column bg-light" data-testid="login-screen">
      {/* Top Header Bar */}
      <header className="bg-zen-green text-white px-3 shadow-sm d-flex align-items-center" style={{ minHeight: 46 }}>
        <div className="container-fluid d-flex align-items-center gap-2 px-1 px-md-2">
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
          <span className="fw-bold tracking-wide" style={{ fontSize: "1.05rem", lineHeight: 1 }}>TokTickIT</span>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-grow-1 d-flex align-items-center justify-content-center p-3">
        <div
          className="card border shadow-sm rounded-3 bg-white p-4"
          style={{ maxWidth: 390, width: "100%", borderColor: "#e5e7eb" }}
        >
          <div className="mb-3">
            <h1 className="h5 fw-bold text-dark mb-0">Sign in to your account</h1>
          </div>

          {error && (
            <div
              className="alert alert-danger py-2 px-3 mb-4 rounded-3 d-flex align-items-start gap-2"
              role="alert"
              data-testid="login-error-alert"
              style={{ backgroundColor: "#fef2f2", borderColor: "#fecaca", color: "#991b1b" }}
            >
              <div className="mt-0.5 fw-bold fs-6">ⓘ</div>
              <div className="small">
                <div className="fw-semibold">
                  {error.includes("Invalid email or password")
                    ? "Invalid email or password."
                    : error}
                </div>
                {error.includes("Invalid email or password") && (
                  <div className="text-muted small">Please try again.</div>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} data-testid="login-form">
            <div className="mb-3">
              <label htmlFor="loginEmail" className="form-label small text-muted fw-medium mb-1">
                Email address
              </label>
              <input
                type="email"
                id="loginEmail"
                className="form-control rounded-2"
                style={{ padding: "0.6rem 0.75rem", borderColor: "#d1d5db" }}
                placeholder="janderson@toktickit.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                data-testid="login-email-input"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="loginPassword" className="form-label small text-muted fw-medium mb-1">
                Password
              </label>
              <div className="input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  id="loginPassword"
                  className="form-control rounded-start-2"
                  style={{ padding: "0.6rem 0.75rem", borderColor: "#d1d5db" }}
                  placeholder="•••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  data-testid="login-password-input"
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary border-start-0 rounded-end-2 px-3"
                  style={{ borderColor: "#d1d5db", color: "#6b7280" }}
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="toggle-password-visibility"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-zen-green w-100 fw-semibold py-2.5 rounded-2 shadow-sm mb-3"
              disabled={loading}
              data-testid="login-submit-btn"
            >
              {loading ? (
                <span className="d-flex align-items-center justify-content-center gap-2">
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>

            <div className="text-center">
              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Please contact your system Administrator to reset your password.");
                }}
                className="small text-zen-green text-decoration-none fw-medium"
                data-testid="forgot-password-link"
              >
                Forgot your password?
              </a>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
