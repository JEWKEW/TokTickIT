import React, { useEffect, useState, useCallback } from "react";
import { fetchTicketById, Ticket } from "../api.js";

interface TicketDetailProps {
  ticketId: number;
  userId: number;
  onBack: () => void;
}

export default function TicketDetail({ ticketId, userId, onBack }: TicketDetailProps) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

          {/* Attachments Card (if any) */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <div className="card border-0 shadow-sm rounded-3 p-4 bg-white" data-testid="ticket-attachments-section">
              <h2 className="h5 fw-bold text-dark mb-3">
                Attachments ({ticket.attachments.length})
              </h2>
              <div className="row g-3">
                {ticket.attachments.map((att) => (
                  <div key={att.id} className="col-12 col-md-6" data-testid={`attachment-${att.id}`}>
                    <div className="d-flex align-items-center justify-content-between p-3 border rounded-3 bg-light">
                      <div className="d-flex align-items-center gap-2 text-truncate me-2">
                        <span className="fs-4">📎</span>
                        <div className="text-truncate">
                          <span className="d-block fw-medium text-dark text-truncate">
                            {att.originalFileName}
                          </span>
                          <span className="text-muted small">
                            {formatFileSize(att.fileSize)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
