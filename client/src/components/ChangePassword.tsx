import React, { useState } from "react";
import { changePassword } from "../api.js";

interface ChangePasswordProps {
  onSuccess: () => void;
  onLogout: () => void;
}

export default function ChangePassword({ onSuccess, onLogout }: ChangePasswordProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Requirement checks
  const isLengthValid = newPassword.length >= 8;
  const isCaseValid = /[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword);
  const isSymbolValid = /[0-9]/.test(newPassword) && /[^A-Za-z0-9]/.test(newPassword);
  const isAllValid = isLengthValid && isCaseValid && isSymbolValid && newPassword === confirmPassword && !!currentPassword;

  const handleSubmit = async (e: React.FormEvent) => {
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
    } catch (err: any) {
      setError(err.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex flex-column bg-light" data-testid="change-password-screen">
      {/* Top Header Bar */}
      <header className="bg-zen-green text-white py-1 px-3 shadow-sm d-flex justify-content-between align-items-center" style={{ minHeight: 46 }}>
        <div className="container-fluid d-flex justify-content-between align-items-center px-1 px-md-2">
          <div className="d-flex align-items-center gap-2">
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
          </div>
          <button
            type="button"
            className="btn btn-outline-light btn-sm fw-medium px-2.5 py-1 rounded-2"
            onClick={onLogout}
            data-testid="logout-btn"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Change Password Card */}
      <main className="flex-grow-1 d-flex align-items-center justify-content-center p-3">
        <div
          className="card border shadow-sm rounded-3 bg-white p-4"
          style={{ maxWidth: 400, width: "100%", borderColor: "#e5e7eb" }}
        >
          <div className="mb-4">
            <h1 className="h4 fw-bold text-dark mb-1">Change Your Password</h1>
            <p className="text-muted small mb-0">
              You must change your password to continue.
            </p>
          </div>

          {error && (
            <div
              className="alert alert-danger py-2 px-3 mb-4 rounded-3 small"
              role="alert"
              data-testid="change-password-error-alert"
              style={{ backgroundColor: "#fef2f2", borderColor: "#fecaca", color: "#991b1b" }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} data-testid="change-password-form">
            {/* Current Password */}
            <div className="mb-3">
              <label htmlFor="currentPassword" className="form-label small text-muted fw-medium mb-1">
                Current (temporary) password
              </label>
              <div className="input-group">
                <input
                  type={showCurrent ? "text" : "password"}
                  id="currentPassword"
                  className="form-control rounded-start-2"
                  style={{ padding: "0.6rem 0.75rem", borderColor: "#d1d5db" }}
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  disabled={loading}
                  data-testid="current-password-input"
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary border-start-0 rounded-end-2 px-3"
                  style={{ borderColor: "#d1d5db", color: "#6b7280" }}
                  onClick={() => setShowCurrent(!showCurrent)}
                  title={showCurrent ? "Hide password" : "Show password"}
                >
                  {showCurrent ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="mb-3">
              <label htmlFor="newPassword" className="form-label small text-muted fw-medium mb-1">
                New password
              </label>
              <div className="input-group">
                <input
                  type={showNew ? "text" : "password"}
                  id="newPassword"
                  className="form-control rounded-start-2"
                  style={{ padding: "0.6rem 0.75rem", borderColor: "#d1d5db" }}
                  placeholder="•••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading}
                  data-testid="new-password-input"
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary border-start-0 rounded-end-2 px-3"
                  style={{ borderColor: "#d1d5db", color: "#6b7280" }}
                  onClick={() => setShowNew(!showNew)}
                  title={showNew ? "Hide password" : "Show password"}
                >
                  {showNew ? "🙈" : "👁"}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="mb-4">
              <label htmlFor="confirmPassword" className="form-label small text-muted fw-medium mb-1">
                Confirm new password
              </label>
              <div className="input-group">
                <input
                  type={showConfirm ? "text" : "password"}
                  id="confirmPassword"
                  className="form-control rounded-start-2"
                  style={{ padding: "0.6rem 0.75rem", borderColor: "#d1d5db" }}
                  placeholder="•••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  data-testid="confirm-password-input"
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary border-start-0 rounded-end-2 px-3"
                  style={{ borderColor: "#d1d5db", color: "#6b7280" }}
                  onClick={() => setShowConfirm(!showConfirm)}
                  title={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? "🙈" : "👁"}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <div className="text-danger small mt-1">Passwords do not match</div>
              )}
            </div>

            {/* Password checklist matching Image 4 */}
            <div
              className="p-3 rounded-2 mb-4 small"
              style={{ backgroundColor: "#f0fdf4", border: "1px solid #dcfce7" }}
            >
              <span className="fw-semibold d-block mb-1 text-success">Password must:</span>
              <ul className="list-unstyled mb-0 d-flex flex-column gap-1 text-muted" style={{ fontSize: "0.85rem" }}>
                <li className={isLengthValid ? "text-success fw-medium" : ""} data-testid="req-length">
                  {isLengthValid ? "✓" : "○"} Be at least 8 characters
                </li>
                <li className={isCaseValid ? "text-success fw-medium" : ""} data-testid="req-case">
                  {isCaseValid ? "✓" : "○"} Include upper and lower case letters
                </li>
                <li className={isSymbolValid ? "text-success fw-medium" : ""} data-testid="req-symbol">
                  {isSymbolValid ? "✓" : "○"} Include a number and a special character
                </li>
              </ul>
            </div>

            <button
              type="submit"
              className="btn btn-zen-green w-100 fw-semibold py-2.5 rounded-2 shadow-sm"
              disabled={loading || !isAllValid}
              data-testid="change-password-submit-btn"
            >
              {loading ? "Updating..." : "Continue"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
