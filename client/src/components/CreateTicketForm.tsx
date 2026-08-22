import React, { useState, useEffect } from "react";
import {
  Category,
  RelatedSystem,
  Ticket,
  fetchCategories,
  fetchRelatedSystems,
  createTicket,
} from "../api.js";

interface CreateTicketFormProps {
  userId: number;
  onSuccess?: (ticket: Ticket) => void;
  onCancel?: () => void;
}

export const CreateTicketForm: React.FC<CreateTicketFormProps> = ({
  userId,
  onSuccess,
  onCancel,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedSystems, setRelatedSystems] = useState<RelatedSystem[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // Form State
  const [categoryId, setCategoryId] = useState<string>("");
  const [relatedSystemId, setRelatedSystemId] = useState<string>("");
  const [requestedPriority, setRequestedPriority] = useState<string>("Medium");
  const [summary, setSummary] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);

  // Validation & Submission State
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [apiError, setApiError] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [createdTicket, setCreatedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    async function loadDropdowns() {
      try {
        setLoadingData(true);
        const [cats, systems] = await Promise.all([
          fetchCategories(),
          fetchRelatedSystems(),
        ]);
        setCategories(cats);
        setRelatedSystems(systems);
        if (cats.length > 0) setCategoryId(cats[0].id.toString());
        if (systems.length > 0) setRelatedSystemId(systems[0].id.toString());
      } catch (err: any) {
        setApiError(err.message || "Failed to load options");
      } finally {
        setLoadingData(false);
      }
    }
    loadDropdowns();
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      if (files.length + selected.length > 3) {
        setFieldErrors((prev) => ({
          ...prev,
          files: "Maximum 3 files allowed as attachments.",
        }));
        return;
      }
      setFieldErrors((prev) => ({ ...prev, files: "" }));
      setFiles((prev) => [...prev, ...selected].slice(0, 3));
    }
  }

  function handleRemoveFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFieldErrors((prev) => ({ ...prev, files: "" }));
  }

  function validate(): boolean {
    const errors: { [key: string]: string } = {};

    if (!categoryId) {
      errors.categoryId = "Please select a Category";
    }

    if (!relatedSystemId) {
      errors.relatedSystemId = "Please select a Related System";
    }

    if (!summary.trim()) {
      errors.summary = "Summary is required";
    } else if (summary.length > 100) {
      errors.summary = "Summary must not exceed 100 characters";
    }

    if (!description.trim()) {
      errors.description = "Description is required";
    } else if (description.length > 1000) {
      errors.description = "Description must not exceed 1000 characters";
    }

    if (files.length > 3) {
      errors.files = "Maximum 3 files allowed as attachments";
    }

    for (const f of files) {
      if (f.size > 5 * 1024 * 1024) {
        errors.files = `File ${f.name} exceeds 5MB size limit`;
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setApiError("");

    if (!validate()) {
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("categoryId", categoryId);
      formData.append("relatedSystemId", relatedSystemId);
      formData.append("requestedPriority", requestedPriority);
      formData.append("summary", summary.trim());
      formData.append("description", description.trim());

      files.forEach((file) => {
        formData.append("files", file);
      });

      const newTicket = await createTicket(formData, userId);
      setCreatedTicket(newTicket);
      if (onSuccess) {
        onSuccess(newTicket);
      }
    } catch (err: any) {
      // Preserve input values on API failure!
      setApiError(err.message || "Failed to submit ticket. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    setCreatedTicket(null);
    setSummary("");
    setDescription("");
    setFiles([]);
    setRequestedPriority("Medium");
    setFieldErrors({});
    setApiError("");
  }

  if (createdTicket) {
    return (
      <div className="container py-4" style={{ maxWidth: 768 }} data-testid="success-confirmation">
        <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
          <div className="card-header bg-success text-white p-4 text-center">
            <span className="fs-1 d-block mb-2">🎉</span>
            <h2 className="h4 fw-bold mb-1">Ticket Submitted Successfully!</h2>
            <p className="small mb-0 opacity-75">
              Your request has been logged and assigned default status <strong>'New'</strong>.
            </p>
          </div>

          <div className="card-body p-4 text-center">
            <div className="p-3 bg-light rounded-3 mb-4 border" data-testid="ticket-number-display">
              <span className="text-muted d-block small mb-1 fw-semibold text-uppercase">Ticket Number</span>
              <span className="fs-3 fw-bold text-zen-green text-monospace" data-testid="new-ticket-number">
                {createdTicket.ticketNumber}
              </span>
            </div>

            <div className="text-start bg-white p-3 rounded-3 border mb-4">
              <div className="row g-2">
                <div className="col-12">
                  <strong>Summary:</strong> {createdTicket.summary}
                </div>
                <div className="col-6">
                  <strong>Priority:</strong>{" "}
                  <span className="badge bg-warning text-dark px-2 py-1">
                    {createdTicket.requestedPriority}
                  </span>
                </div>
                <div className="col-6">
                  <strong>Status:</strong>{" "}
                  <span className="badge bg-info text-dark px-2 py-1">
                    {createdTicket.currentStatus}
                  </span>
                </div>
              </div>
            </div>

            <div className="d-flex gap-3 justify-content-center">
              <button
                type="button"
                className="btn btn-zen-green px-4 py-2 fw-semibold"
                onClick={handleReset}
                data-testid="create-another-btn"
              >
                Create Another Ticket
              </button>
              {onCancel && (
                <button
                  type="button"
                  className="btn btn-outline-secondary px-4 py-2"
                  onClick={onCancel}
                >
                  Return to Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4" style={{ maxWidth: 768 }} data-testid="create-ticket-page">
      <div className="card shadow-sm border-0 rounded-4 overflow-hidden">
        <div className="card-header bg-zen-green text-white p-4">
          <h2 className="h4 fw-bold mb-1">Create IT Support Ticket</h2>
          <p className="small text-white-50 mb-0">
            Submit a new ticket for IT support, access requests, or system issues.
          </p>
        </div>

        <div className="card-body p-4">
          {apiError && (
            <div className="alert alert-danger mb-4 d-flex align-items-center gap-2" role="alert" data-testid="api-error-banner">
              <span>⚠️</span>
              <div>{apiError}</div>
            </div>
          )}

          {loadingData ? (
            <div className="text-center py-5">
              <div className="spinner-border text-zen-green" role="status">
                <span className="visually-hidden">Loading options...</span>
              </div>
              <p className="mt-2 text-muted small">Loading ticket form options...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              {/* Category & Related System Row */}
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <label htmlFor="category-select" className="form-label fw-semibold text-zen-green">
                    Category <span className="text-danger">*</span>
                  </label>
                  <select
                    id="category-select"
                    className={`form-select ${fieldErrors.categoryId ? "is-invalid" : ""}`}
                    value={categoryId}
                    onChange={(e) => {
                      setCategoryId(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, categoryId: "" }));
                    }}
                    data-testid="category-dropdown"
                  >
                    <option value="">-- Select Category --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id.toString()}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.categoryId && (
                    <div className="invalid-feedback">{fieldErrors.categoryId}</div>
                  )}
                </div>

                <div className="col-md-6">
                  <label htmlFor="system-select" className="form-label fw-semibold text-zen-green">
                    Related System <span className="text-danger">*</span>
                  </label>
                  <select
                    id="system-select"
                    className={`form-select ${fieldErrors.relatedSystemId ? "is-invalid" : ""}`}
                    value={relatedSystemId}
                    onChange={(e) => {
                      setRelatedSystemId(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, relatedSystemId: "" }));
                    }}
                    data-testid="related-system-dropdown"
                  >
                    <option value="">-- Select Related System --</option>
                    {relatedSystems.map((s) => (
                      <option key={s.id} value={s.id.toString()}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.relatedSystemId && (
                    <div className="invalid-feedback">{fieldErrors.relatedSystemId}</div>
                  )}
                </div>
              </div>

              {/* Requested Priority */}
              <div className="mb-3">
                <label className="form-label fw-semibold text-zen-green d-block">
                  Requested Priority <span className="text-danger">*</span>
                </label>
                <div className="btn-group w-100" role="group" aria-label="Requested Priority">
                  {["Low", "Medium", "High", "Urgent"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`btn ${
                        requestedPriority === p
                          ? "btn-zen-green fw-bold"
                          : "btn-outline-secondary"
                      }`}
                      onClick={() => setRequestedPriority(p)}
                      data-testid={`priority-${p.toLowerCase()}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label htmlFor="summary-input" className="form-label fw-semibold text-zen-green mb-0">
                    Summary <span className="text-danger">*</span>
                  </label>
                  <span
                    className={`small ${
                      summary.length > 100 ? "text-danger fw-bold" : "text-muted"
                    }`}
                    data-testid="summary-char-counter"
                  >
                    {summary.length}/100
                  </span>
                </div>
                <input
                  type="text"
                  id="summary-input"
                  className={`form-control ${fieldErrors.summary ? "is-invalid" : ""}`}
                  placeholder="Brief summary of your request (max 100 characters)"
                  maxLength={100}
                  value={summary}
                  onChange={(e) => {
                    setSummary(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, summary: "" }));
                  }}
                  data-testid="summary-input"
                />
                {fieldErrors.summary && (
                  <div className="invalid-feedback">{fieldErrors.summary}</div>
                )}
              </div>

              {/* Description */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label htmlFor="description-input" className="form-label fw-semibold text-zen-green mb-0">
                    Description <span className="text-danger">*</span>
                  </label>
                  <span
                    className={`small ${
                      description.length > 1000 ? "text-danger fw-bold" : "text-muted"
                    }`}
                    data-testid="description-char-counter"
                  >
                    {description.length}/1000
                  </span>
                </div>
                <textarea
                  id="description-input"
                  rows={4}
                  className={`form-control ${fieldErrors.description ? "is-invalid" : ""}`}
                  placeholder="Detailed description of your issue or request (max 1000 characters)"
                  maxLength={1000}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, description: "" }));
                  }}
                  data-testid="description-input"
                />
                {fieldErrors.description && (
                  <div className="invalid-feedback">{fieldErrors.description}</div>
                )}
              </div>

              {/* File Attachments */}
              <div className="mb-4">
                <label className="form-label fw-semibold text-zen-green">
                  File Attachments <span className="text-muted fw-normal">(Optional, max 3 files up to 5MB each)</span>
                </label>

                <input
                  type="file"
                  id="file-attachment-input"
                  className={`form-control ${fieldErrors.files ? "is-invalid" : ""}`}
                  multiple
                  onChange={handleFileChange}
                  disabled={files.length >= 3}
                  data-testid="file-input"
                />
                {fieldErrors.files && (
                  <div className="invalid-feedback d-block">{fieldErrors.files}</div>
                )}

                {/* File chips preview */}
                {files.length > 0 && (
                  <div className="mt-3 d-flex flex-wrap gap-2" data-testid="file-list">
                    {files.map((file, idx) => (
                      <div
                        key={idx}
                        className="badge bg-light text-dark border p-2 d-flex align-items-center gap-2 rounded-3"
                      >
                        <span>📎 {file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                        <button
                          type="button"
                          className="btn-close btn-close-sm"
                          aria-label="Remove"
                          onClick={() => handleRemoveFile(idx)}
                          data-testid={`remove-file-${idx}`}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit / Cancel Action Buttons */}
              <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                {onCancel && (
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-4"
                    onClick={onCancel}
                    disabled={submitting}
                    data-testid="cancel-btn"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="btn btn-zen-green px-5 fw-bold"
                  disabled={submitting}
                  data-testid="submit-ticket-btn"
                >
                  {submitting ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      />
                      Submitting...
                    </>
                  ) : (
                    "Submit Ticket"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateTicketForm;
