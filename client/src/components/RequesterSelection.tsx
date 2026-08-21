import React, { useEffect, useState } from "react";
import { fetchRequesters, Requester } from "../api.js";

interface RequesterSelectionProps {
  onSelectRequester: (requester: Requester) => void;
}

export const RequesterSelection: React.FC<RequesterSelectionProps> = ({
  onSelectRequester,
}) => {
  const [requesters, setRequesters] = useState<Requester[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

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
      } catch (err: any) {
        setError(err.message || "Failed to load active requesters");
      } finally {
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

  return (
    <div className="container py-5" data-testid="requester-selection-screen">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="card card-zen-green overflow-hidden">
            <div className="card-header bg-zen-green p-4 text-center">
              <h2 className="h4 mb-1 text-white fw-bold">
                Development Requester Selection
              </h2>
              <p className="small text-white-50 mb-0">
                Simulated User Context (Lab 02)
              </p>
            </div>

            <div className="card-body p-4">
              <div className="alert alert-info border-0 shadow-sm d-flex align-items-center gap-2 mb-4" role="alert">
                <span className="fs-5">ℹ️</span>
                <div>
                  <strong>Dev Environment Notice:</strong> Authentication arrives in Lab 3. Please select an active requester profile to continue.
                </div>
              </div>

              {loading && (
                <div className="text-center py-4" data-testid="loading-indicator">
                  <div className="spinner-border text-zen-green" role="status">
                    <span className="visually-hidden">Loading requesters...</span>
                  </div>
                  <p className="mt-2 text-muted small">Loading active requesters...</p>
                </div>
              )}

              {error && (
                <div className="alert alert-danger" data-testid="error-message">
                  {error}
                </div>
              )}

              {!loading && !error && (
                <div className="mb-4">
                  <label htmlFor="requester-select" className="form-label fw-bold text-zen-green">
                    Active User Context
                  </label>
                  <select
                    id="requester-select"
                    className="form-select form-select-lg border-zen-green"
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                    data-testid="requester-dropdown"
                  >
                    {requesters.map((r) => (
                      <option key={r.id} value={r.id.toString()}>
                        {r.name} ({r.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="button"
                className="btn btn-zen-green w-100 py-2 fw-bold fs-5 rounded-3"
                disabled={loading || !!error || !selectedId}
                onClick={handleContinue}
                data-testid="continue-btn"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequesterSelection;
