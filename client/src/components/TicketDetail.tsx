import React, { useEffect, useState, useCallback } from "react";
import {
  fetchTicketById,
  Ticket,
  Attachment,
  uploadAttachment,
  downloadAttachment,
  removeAttachment,
} from "../api.js";

interface TicketDetailProps {
  ticketId: number;
  userId: number;
  onBack: () => void;
}

export default function TicketDetail({ ticketId, userId, onBack }: TicketDetailProps) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [removingAttachment, setRemovingAttachment] = useState<Attachment | null>(null);
  const [removalReason, setRemovalReason] = useState<string>("");
  const [removing, setRemoving] = useState<boolean>(false);
  const [removalError, setRemovalError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const loadTicketDetail = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTicketById(ticketId, userId);
      setTicket(data);
    } catch (err: any) {
      setError(err.message || "Failed to load ticket details");
    } finally {
      setLoading(false);
    }
  }, [ticketId, userId]);

  useEffect(() => {
    loadTicketDetail();
  }, [loadTicketDetail]);

  const activeAttachments = (ticket?.attachments || []).filter((a) => !a.isRemoved);

  const validateFile = (file: File): string | null => {
    if (activeAttachments.length >= 5) {
      return "Maximum 5 active attachments allowed per ticket";
    }
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".pdf"];
    const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    const isMimeAllowed = allowedMimeTypes.includes(file.type.toLowerCase());
    const isExtAllowed = allowedExtensions.includes(ext);
    if (!isMimeAllowed && !isExtAllowed) {
      return "Invalid file type. Allowed types: JPG, JPEG, PNG, WEBP, PDF";
    }
    if (file.size > 5 * 1024 * 1024) {
      return "File size exceeds 5MB limit";
    }
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const err = validateFile(file);
      if (err) {
        setUploadError(err);
      }
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !ticket) return;
    const err = validateFile(selectedFile);
    if (err) {
      setUploadError(err);
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      await uploadAttachment(ticket.id, selectedFile, userId);
      setSelectedFile(null);
      const fileInput = document.getElementById("attachmentFileInput") as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      await loadTicketDetail();
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload attachment");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (att: Attachment) => {
    if (att.isRemoved) {
      setDownloadError("Attachment has been removed and cannot be downloaded");
      return;
    }
    setDownloadError(null);
    try {
      await downloadAttachment(att.id, userId, att.originalFileName);
    } catch (err: any) {
      setDownloadError(err.message || "Failed to download attachment");
    }
  };

  const handleConfirmRemoval = async () => {
    if (!removingAttachment) return;
    if (!removalReason.trim()) {
      setRemovalError("Removal reason is required");
      return;
    }
    setRemoving(true);
    setRemovalError(null);
    try {
      await removeAttachment(removingAttachment.id, removalReason.trim(), userId);
      setRemovingAttachment(null);
      setRemovalReason("");
      await loadTicketDetail();
    } catch (err: any) {
      setRemovalError(err.message || "Failed to remove attachment");
    } finally {
      setRemoving(false);
    }
  };

  const renderPriorityBadge = (p: string) => {
    const pLower = (p || "").toLowerCase();
    let badgeClass = "bg-secondary";
    if (pLower === "low") badgeClass = "bg-success bg-opacity-10 text-success border border-success border-opacity-25";
    else if (pLower === "medium") badgeClass = "bg-info bg-opacity-10 text-info border border-info border-opacity-25";
    else if (pLower === "high") badgeClass = "bg-warning bg-opacity-10 text-warning-emphasis border border-warning border-opacity-25";
    else if (pLower === "urgent") badgeClass = "bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25";

    return (
      <span className={`badge px-3 py-2 ${badgeClass} text-capitalize fs-6`} data-testid="ticket-priority">
        {p} Priority
      </span>
    );
  };

  const renderStatusPill = (st: string) => {
    const sLower = (st || "").toLowerCase();
    let pillClass = "bg-secondary";
    if (sLower === "new" || sLower === "open") pillClass = "bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25";
    else if (sLower === "in_progress" || sLower === "in progress") pillClass = "bg-warning bg-opacity-10 text-warning-emphasis border border-warning border-opacity-25";
    else if (sLower === "resolved") pillClass = "bg-success bg-opacity-10 text-success border border-success border-opacity-25";
    else if (sLower === "closed") pillClass = "bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25";

    return (
      <span className={`badge rounded-pill px-3 py-2 ${pillClass} text-capitalize fs-6`} data-testid="ticket-status">
        {st}
      </span>
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="container py-4" data-testid="ticket-detail-view">
      {/* Navigation Header */}
      <div className="mb-4">
        <button
          type="button"
          className="btn btn-link text-zen-green p-0 text-decoration-none fw-semibold d-inline-flex align-items-center gap-1"
          onClick={onBack}
          data-testid="back-to-tickets-link"
        >
          &larr; Back to My Tickets
        </button>
      </div>

      {loading ? (
        <div
          className="card border-0 shadow-sm rounded-3 p-5 text-center bg-white"
          data-testid="loading-state"
        >
          <div className="spinner-border text-zen-green mx-auto mb-3" role="status">
            <span className="visually-hidden">Loading ticket details...</span>
          </div>
          <h5 className="text-muted mb-0">Loading ticket details...</h5>
        </div>
      ) : error ? (
        <div
          className="card border-0 shadow-sm rounded-3 p-4 bg-white"
          data-testid="error-state"
        >
          <div className="alert alert-danger mb-3" role="alert">
            <h5 className="alert-heading mb-1">Access Error</h5>
            <p className="mb-0">{error}</p>
          </div>
          <div className="d-flex justify-content-between align-items-center">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onBack}
            >
              Back to My Tickets
            </button>
            <button
              type="button"
              className="btn btn-zen-green"
              onClick={loadTicketDetail}
              data-testid="retry-btn"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : ticket ? (
        <div className="d-flex flex-column gap-4">
          {/* Read-Only Ticket Header Card */}
          <div className="card border-0 shadow-sm rounded-3 p-4 bg-white card-zen-green">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-3 pb-3 border-bottom">
              <div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="font-monospace fw-bold fs-4 text-zen-green" data-testid="ticket-code">
                    {ticket.ticketNumber}
                  </span>
                  <span className="badge bg-light text-muted border">Read-Only</span>
                </div>
                <h1 className="h3 fw-bold text-dark mb-2" data-testid="ticket-summary">
                  {ticket.summary}
                </h1>
                <div className="text-muted small d-flex flex-wrap align-items-center gap-3">
                  <span>
                    Created:{" "}
                    <strong className="text-dark" data-testid="ticket-created-at">
                      {new Date(ticket.createdAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </strong>
                  </span>
                  <span>&bull;</span>
                  <span>
                    Last Updated:{" "}
                    <strong className="text-dark" data-testid="ticket-updated-at">
                      {new Date(ticket.updatedAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </strong>
                  </span>
                </div>
              </div>

              {/* Status & Priority Badges */}
              <div className="d-flex align-items-center gap-2 flex-wrap">
                {renderPriorityBadge(ticket.requestedPriority)}
                {renderStatusPill(ticket.currentStatus)}
              </div>
            </div>

            {/* Classification Info Grid */}
            <div className="row g-3 pt-3">
              <div className="col-12 col-md-4">
                <div className="p-3 bg-light rounded-3">
                  <span className="text-muted small d-block mb-1">Category</span>
                  <strong className="text-dark" data-testid="ticket-category">
                    {ticket.category?.name || "N/A"}
                  </strong>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="p-3 bg-light rounded-3">
                  <span className="text-muted small d-block mb-1">Related System</span>
                  <strong className="text-dark" data-testid="ticket-system">
                    {ticket.relatedSystem?.name || "N/A"}
                  </strong>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="p-3 bg-light rounded-3">
                  <span className="text-muted small d-block mb-1">Requester</span>
                  <strong className="text-dark">
                    {ticket.requester?.name || "Self"}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Description Card */}
          <div className="card border-0 shadow-sm rounded-3 p-4 bg-white">
            <h2 className="h5 fw-bold text-dark mb-3">Description</h2>
            <div
              className="p-3 bg-light rounded-3 text-dark fs-6"
              style={{ whiteSpace: "pre-wrap" }}
              data-testid="ticket-description"
            >
              {ticket.description}
            </div>
          </div>

          {/* Attachments Section */}
          <div className="card border-0 shadow-sm rounded-3 p-4 bg-white" data-testid="ticket-attachments-section">
            <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-3 gap-2">
              <h2 className="h5 fw-bold text-dark mb-0">
                Attachments ({activeAttachments.length} / 5 max active)
              </h2>
              <span className="text-muted small">Allowed: JPG, PNG, WEBP, PDF (Max 5MB)</span>
            </div>

            {/* Upload Control Form */}
            <form onSubmit={handleUpload} className="mb-4 p-3 bg-light rounded-3">
              <div className="row g-2 align-items-center">
                <div className="col">
                  <input
                    type="file"
                    className="form-control"
                    id="attachmentFileInput"
                    accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleFileChange}
                    disabled={uploading || activeAttachments.length >= 5}
                    data-testid="upload-attachment-input"
                  />
                </div>
                <div className="col-auto">
                  <button
                    type="submit"
                    className="btn btn-zen-green"
                    disabled={!selectedFile || uploading || activeAttachments.length >= 5 || Boolean(uploadError)}
                    data-testid="upload-attachment-btn"
                  >
                    {uploading ? "Uploading..." : "Upload Attachment"}
                  </button>
                </div>
              </div>
              {uploadError && (
                <div className="text-danger small mt-2 fw-medium" data-testid="upload-error">
                  {uploadError}
                </div>
              )}
            </form>

            {downloadError && (
              <div className="alert alert-danger mb-3 py-2" data-testid="download-error">
                {downloadError}
              </div>
            )}

            {/* Attachments List */}
            {ticket.attachments && ticket.attachments.length > 0 ? (
              <div className="row g-3">
                {ticket.attachments.map((att) => {
                  const isRemoved = Boolean(att.isRemoved);
                  return (
                    <div key={att.id} className="col-12 col-md-6" data-testid={`attachment-${att.id}`}>
                      <div
                        className={`d-flex flex-column justify-content-between p-3 border rounded-3 ${
                          isRemoved ? "bg-light opacity-75 border-dashed" : "bg-light"
                        }`}
                      >
                        <div className="d-flex align-items-center justify-content-between gap-2 mb-2">
                          <div className="d-flex align-items-center gap-2 text-truncate me-2">
                            <span className="fs-4">{isRemoved ? "🚫" : "📎"}</span>
                            <div className="text-truncate">
                              <span
                                className={`d-block fw-medium text-truncate ${
                                  isRemoved ? "text-muted text-decoration-line-through" : "text-dark"
                                }`}
                              >
                                {att.originalFileName}
                              </span>
                              <span className="text-muted small">
                                {formatFileSize(att.fileSize)}
                              </span>
                            </div>
                          </div>

                          {isRemoved ? (
                            <span className="badge bg-secondary" data-testid={`removed-badge-${att.id}`}>
                              Soft Removed
                            </span>
                          ) : (
                            <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25">
                              Active
                            </span>
                          )}
                        </div>

                        {/* If Removed, display metadata & block download */}
                        {isRemoved ? (
                          <div className="mt-2 pt-2 border-top text-muted small" data-testid={`removed-metadata-${att.id}`}>
                            <div>
                              <strong>Reason:</strong>{" "}
                              <span data-testid={`removal-reason-${att.id}`}>
                                {att.removalReason || "No reason provided"}
                              </span>
                            </div>
                            {att.removedAt && (
                              <div>
                                <strong>Removed on:</strong>{" "}
                                {new Date(att.removedAt).toLocaleString()}
                              </div>
                            )}
                            <div className="mt-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-secondary w-100"
                                disabled
                                data-testid={`download-attachment-${att.id}`}
                              >
                                Download Blocked
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Active Actions */
                          <div className="d-flex align-items-center gap-2 mt-2 pt-2 border-top">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary flex-grow-1"
                              onClick={() => handleDownload(att)}
                              data-testid={`download-attachment-${att.id}`}
                            >
                              Download
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => {
                                setRemovingAttachment(att);
                                setRemovalReason("");
                                setRemovalError(null);
                              }}
                              data-testid={`remove-attachment-${att.id}`}
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted mb-0">No attachments uploaded yet.</p>
            )}
          </div>
        </div>
      ) : null}

      {/* Soft Removal Reason Prompt Modal */}
      {removingAttachment && (
        <div className="modal d-block bg-dark bg-opacity-50" tabIndex={-1} data-testid="removal-modal">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0 rounded-3">
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title fw-bold text-dark">Remove Attachment</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setRemovingAttachment(null)}
                  data-testid="close-removal-modal-btn"
                ></button>
              </div>
              <div className="modal-body py-3">
                <p className="text-secondary mb-3">
                  Are you sure you want to soft-remove <strong>{removingAttachment.originalFileName}</strong>?
                </p>
                <div className="mb-3">
                  <label htmlFor="removalReasonInput" className="form-label fw-medium text-dark">
                    Reason for removal <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="removalReasonInput"
                    className="form-control"
                    rows={3}
                    value={removalReason}
                    onChange={(e) => setRemovalReason(e.target.value)}
                    placeholder="Enter the reason for soft removing this attachment..."
                    data-testid="removal-reason-input"
                  ></textarea>
                </div>
                {removalError && (
                  <div className="alert alert-danger mb-0 py-2 small" data-testid="removal-error">
                    {removalError}
                  </div>
                )}
              </div>
              <div className="modal-footer border-top-0 pt-0">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setRemovingAttachment(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleConfirmRemoval}
                  disabled={removing}
                  data-testid="confirm-remove-btn"
                >
                  {removing ? "Removing..." : "Confirm Removal"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
