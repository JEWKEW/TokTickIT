import React, { useEffect, useState, useCallback } from "react";
import {
  fetchTicketById,
  Ticket,
  Attachment,
  uploadAttachment,
  downloadAttachment,
  removeAttachment,
  indicateTicketResolved,
  fetchPublicComments,
  postPublicComment,
  PublicComment,
  fetchInternalNotes,
  postInternalNote,
  InternalNote,
  assignTicketOwner,
  updateITPriority,
  updateTicketStatus,
  fetchRequesters,
  Requester,
} from "../api.js";

interface TicketDetailProps {
  ticketId: number;
  userId: number;
  userRole?: string;
  onBack: () => void;
}

export default function TicketDetail({
  ticketId,
  userId,
  userRole = "REQUESTER",
  onBack,
}: TicketDetailProps) {
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

  // BR-05 Requester Resolution Indication State
  const [indicatingResolved, setIndicatingResolved] = useState<boolean>(false);
  const [indicateError, setIndicateError] = useState<string | null>(null);

  // Public Comments State
  const [comments, setComments] = useState<PublicComment[]>([]);
  const [newComment, setNewComment] = useState<string>("");
  const [postingComment, setPostingComment] = useState<boolean>(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  // Internal Notes State (BR-04, BR-10)
  const [internalNotes, setInternalNotes] = useState<InternalNote[]>([]);
  const [newInternalNote, setNewInternalNote] = useState<string>("");
  const [postingInternalNote, setPostingInternalNote] = useState<boolean>(false);
  const [internalNoteError, setInternalNoteError] = useState<string | null>(null);

  // Operational Controls State (IT Staff / Admin)
  const [staffUsers, setStaffUsers] = useState<Requester[]>([]);
  const [updatingOwner, setUpdatingOwner] = useState<boolean>(false);
  const [updatingPriority, setUpdatingPriority] = useState<boolean>(false);
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);
  const [opError, setOpError] = useState<string | null>(null);

  const isStaffOrAdmin = userRole === "IT_STAFF" || userRole === "ADMINISTRATOR";

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

  const loadComments = useCallback(async () => {
    try {
      const data = await fetchPublicComments(ticketId, userId);
      setComments(data);
    } catch (err: any) {
      console.error("Failed to load public comments:", err);
    }
  }, [ticketId, userId]);

  const loadNotes = useCallback(async () => {
    if (!isStaffOrAdmin) return;
    try {
      const data = await fetchInternalNotes(ticketId, userId);
      setInternalNotes(data);
    } catch (err: any) {
      console.error("Failed to load internal notes:", err);
    }
  }, [ticketId, userId, isStaffOrAdmin]);

  const loadStaffUsers = useCallback(async () => {
    if (!isStaffOrAdmin) return;
    try {
      const users = await fetchRequesters();
      setStaffUsers(users.filter((u) => u.isActive));
    } catch (err: any) {
      console.error("Failed to load user list for assignment:", err);
    }
  }, [isStaffOrAdmin]);

  useEffect(() => {
    loadTicketDetail();
    loadComments();
    loadNotes();
    loadStaffUsers();
  }, [loadTicketDetail, loadComments, loadNotes, loadStaffUsers]);

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

  const handleIndicateResolved = async () => {
    setIndicatingResolved(true);
    setIndicateError(null);
    try {
      const res = await indicateTicketResolved(ticketId, userId);
      setTicket((prev) =>
        prev
          ? {
              ...prev,
              requesterResolvedIndicated: res.requesterResolvedIndicated,
              requesterResolvedAt: res.requesterResolvedAt,
            }
          : null
      );
    } catch (err: any) {
      setIndicateError(err.message || "Failed to indicate problem resolved");
    } finally {
      setIndicatingResolved(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) {
      setCommentError("Comment content is required");
      return;
    }
    if (newComment.trim().length > 2000) {
      setCommentError("Comment content cannot exceed 2000 characters");
      return;
    }
    setPostingComment(true);
    setCommentError(null);
    try {
      await postPublicComment(ticketId, newComment.trim(), userId);
      setNewComment("");
      await loadComments();
    } catch (err: any) {
      setCommentError(err.message || "Failed to post public comment");
    } finally {
      setPostingComment(false);
    }
  };

  const handlePostInternalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInternalNote.trim()) {
      setInternalNoteError("Internal note content is required");
      return;
    }
    if (newInternalNote.trim().length > 2000) {
      setInternalNoteError("Internal note content cannot exceed 2000 characters");
      return;
    }
    setPostingInternalNote(true);
    setInternalNoteError(null);
    try {
      await postInternalNote(ticketId, newInternalNote.trim(), userId);
      setNewInternalNote("");
      await loadNotes();
    } catch (err: any) {
      setInternalNoteError(err.message || "Failed to post internal note");
    } finally {
      setPostingInternalNote(false);
    }
  };

  // Operational Controls Handlers
  const handleAssignOwner = async (newOwnerIdStr: string) => {
    setUpdatingOwner(true);
    setOpError(null);
    try {
      const newOwnerId = newOwnerIdStr === "" || newOwnerIdStr === "unassigned" ? null : parseInt(newOwnerIdStr, 10);
      const updated = await assignTicketOwner(ticketId, newOwnerId, userId);
      setTicket((prev) => (prev ? { ...prev, ownerId: updated.ownerId, owner: updated.owner } : null));
    } catch (err: any) {
      setOpError(err.message || "Failed to update ticket owner");
    } finally {
      setUpdatingOwner(false);
    }
  };

  const handleUpdateITPriority = async (newPriority: string) => {
    setUpdatingPriority(true);
    setOpError(null);
    try {
      const updated = await updateITPriority(ticketId, newPriority, userId);
      setTicket((prev) => (prev ? { ...prev, itPriority: updated.itPriority } : null));
    } catch (err: any) {
      setOpError(err.message || "Failed to update IT Priority");
    } finally {
      setUpdatingPriority(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    setUpdatingStatus(true);
    setOpError(null);
    try {
      const updated = await updateTicketStatus(ticketId, newStatus, userId);
      setTicket((prev) => (prev ? { ...prev, currentStatus: updated.currentStatus } : null));
    } catch (err: any) {
      setOpError(err.message || "Failed to update ticket status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Permitted Status Transitions (BR-07)
  const getPermittedTransitions = (currentStatus: string): string[] => {
    const sLower = (currentStatus || "").toLowerCase();
    switch (sLower) {
      case "new":
        return ["Open", "In Progress", "Cancelled"];
      case "open":
        return ["In Progress", "Waiting for Requester", "Resolved", "Cancelled"];
      case "in progress":
      case "in_progress":
        return ["Waiting for Requester", "Resolved", "Cancelled"];
      case "waiting for requester":
      case "waiting_for_requester":
        return ["In Progress", "Resolved", "Cancelled"];
      case "resolved":
        return ["Closed", "Reopened"];
      case "reopened":
        return ["In Progress", "Resolved", "Cancelled"];
      case "closed":
      case "cancelled":
      default:
        return [];
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
          &larr; Back to {isStaffOrAdmin ? "Queue" : "My Tickets"}
        </button>
      </div>

      {loading ? (
        <div className="card border-0 shadow-sm rounded-3 p-5 bg-white text-center" data-testid="loading-state">
          <div className="spinner-border text-zen-green mx-auto mb-3" role="status">
            <span className="visually-hidden">Loading ticket details...</span>
          </div>
          <h5 className="text-muted mb-0">Loading ticket details...</h5>
        </div>
      ) : error ? (
        <div className="card border-0 shadow-sm rounded-3 p-4 bg-white" data-testid="error-state">
          <div className="alert alert-danger mb-3" role="alert">
            <h5 className="alert-heading mb-1">Access Error</h5>
            <p className="mb-0">{error}</p>
          </div>
          <div className="d-flex justify-content-between align-items-center">
            <button type="button" className="btn btn-outline-secondary" onClick={onBack}>
              Back to {isStaffOrAdmin ? "Queue" : "My Tickets"}
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
          {opError && (
            <div className="alert alert-danger mb-0" data-testid="operation-error">
              {opError}
            </div>
          )}

          {/* Ticket Header Card */}
          <div className="card border-0 shadow-sm rounded-3 p-4 bg-white card-zen-green">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-3 pb-3 border-bottom">
              <div>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="font-monospace fw-bold fs-4 text-zen-green" data-testid="ticket-code">
                    {ticket.ticketNumber}
                  </span>
                  <span className="badge bg-light text-muted border">
                    {isStaffOrAdmin ? "IT Operational Mode" : "Requester View"}
                  </span>
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

              {/* Status, Priority & Resolution Indication */}
              <div className="d-flex flex-column align-items-md-end gap-2">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  {renderPriorityBadge(ticket.itPriority || ticket.requestedPriority)}
                  {renderStatusPill(ticket.currentStatus)}
                </div>

                {/* BR-05: Indicate Problem Appears Resolved Control for Requester */}
                {!isStaffOrAdmin && (
                  <div className="mt-2">
                    {ticket.requesterResolvedIndicated ? (
                      <span
                        className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 fs-6 d-inline-flex align-items-center gap-1"
                        data-testid="requester-resolved-badge"
                      >
                        ✓ Problem Appears Resolved by Requester
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-outline-success btn-sm fw-medium d-inline-flex align-items-center gap-1"
                        onClick={handleIndicateResolved}
                        disabled={indicatingResolved}
                        data-testid="indicate-resolved-btn"
                      >
                        {indicatingResolved ? "Updating..." : "✓ Problem Appears Resolved"}
                      </button>
                    )}
                    {indicateError && (
                      <div className="text-danger small mt-1" data-testid="indicate-error">
                        {indicateError}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Classification Info & Operational Controls Grid */}
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

            {/* IT Staff Operational Controls Bar (Owner, IT Priority, Status Transition) */}
            {isStaffOrAdmin && (
              <div className="mt-4 pt-3 border-top bg-light p-3 rounded-3 border">
                <h2 className="h6 fw-bold text-dark mb-3">🛠 IT Staff Controls</h2>
                <div className="row g-3 align-items-center">
                  {/* Ticket Owner Dropdown */}
                  <div className="col-12 col-md-4">
                    <label htmlFor="ownerSelect" className="form-label small fw-semibold text-muted mb-1">
                      Ticket Owner
                    </label>
                    <select
                      id="ownerSelect"
                      className="form-select form-select-sm"
                      value={ticket.ownerId ? String(ticket.ownerId) : "unassigned"}
                      onChange={(e) => handleAssignOwner(e.target.value)}
                      disabled={updatingOwner}
                      data-testid="owner-select"
                    >
                      <option value="unassigned">-- Unassigned --</option>
                      {staffUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* IT Priority Dropdown */}
                  <div className="col-12 col-md-4">
                    <label htmlFor="itPrioritySelect" className="form-label small fw-semibold text-muted mb-1">
                      IT Priority
                    </label>
                    <select
                      id="itPrioritySelect"
                      className="form-select form-select-sm"
                      value={ticket.itPriority || ticket.requestedPriority}
                      onChange={(e) => handleUpdateITPriority(e.target.value)}
                      disabled={updatingPriority}
                      data-testid="it-priority-select"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>

                  {/* Status Transition Dropdown */}
                  <div className="col-12 col-md-4">
                    <label htmlFor="statusSelect" className="form-label small fw-semibold text-muted mb-1">
                      Current Status (Transition)
                    </label>
                    {getPermittedTransitions(ticket.currentStatus).length === 0 ? (
                      <div className="form-control form-control-sm bg-light text-muted">
                        {ticket.currentStatus} (Terminal State)
                      </div>
                    ) : (
                      <select
                        id="statusSelect"
                        className="form-select form-select-sm"
                        value={ticket.currentStatus}
                        onChange={(e) => handleUpdateStatus(e.target.value)}
                        disabled={updatingStatus}
                        data-testid="status-select"
                      >
                        <option value={ticket.currentStatus}>
                          {ticket.currentStatus} (Current)
                        </option>
                        {getPermittedTransitions(ticket.currentStatus).map((nextStatus) => (
                          <option key={nextStatus} value={nextStatus}>
                            ➜ {nextStatus}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {ticket.requesterResolvedIndicated && (
                  <div className="alert alert-info py-2 mt-3 mb-0 small d-flex align-items-center gap-2">
                    <span>💡</span>
                    <span>
                      <strong>Requester Indication:</strong> The requester reported that this issue appears resolved.
                    </span>
                  </div>
                )}
              </div>
            )}
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

          {/* BR-04 & BR-10: Visually Distinct Internal Notes Section (IT Staff & Admin Only) */}
          {isStaffOrAdmin && (
            <div
              className="card border border-warning border-opacity-50 shadow-sm rounded-3 p-4 bg-warning bg-opacity-10 text-dark mb-2"
              data-testid="internal-notes-section"
            >
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="d-flex align-items-center gap-2">
                  <span className="fs-5">🔒</span>
                  <h2 className="h5 fw-bold text-dark mb-0">Internal Notes</h2>
                </div>
                <span className="badge bg-warning text-dark border border-warning px-3 py-2 fw-semibold">
                  Restricted to IT Staff & Admin (BR-04)
                </span>
              </div>
              <p className="small text-muted mb-3">
                Operational notes recorded here are strictly private to IT Staff and Administrators. Requesters cannot see this content.
              </p>

              {/* Internal Notes List */}
              <div className="d-flex flex-column gap-3 mb-4">
                {internalNotes.length > 0 ? (
                  internalNotes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3 bg-white rounded-3 border border-warning border-opacity-25 shadow-sm"
                      data-testid={`internal-note-${note.id}`}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <strong className="text-dark">{note.author?.name || "IT Staff"}</strong>
                          <span className="badge bg-warning bg-opacity-25 text-dark border border-warning border-opacity-50 small">
                            {note.author?.role || "IT_STAFF"}
                          </span>
                        </div>
                        <span className="text-muted small">
                          {new Date(note.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-dark mb-0" style={{ whiteSpace: "pre-wrap" }}>
                        {note.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-muted mb-0 fst-italic">No internal notes recorded yet.</p>
                )}
              </div>

              {/* Post Internal Note Form */}
              <form onSubmit={handlePostInternalNote} className="pt-3 border-top border-warning border-opacity-25">
                <div className="mb-3">
                  <label htmlFor="internalNoteInput" className="form-label fw-semibold text-dark">
                    Add Private Internal Note
                  </label>
                  <textarea
                    id="internalNoteInput"
                    className="form-control border-warning border-opacity-50"
                    rows={3}
                    value={newInternalNote}
                    onChange={(e) => {
                      setNewInternalNote(e.target.value);
                      if (internalNoteError) setInternalNoteError(null);
                    }}
                    placeholder="Record private operational details, troubleshooting steps, or internal references..."
                    maxLength={2000}
                    data-testid="internal-note-input"
                  />
                  <div className="d-flex justify-content-between text-muted small mt-1">
                    <span>{2000 - newInternalNote.length} characters remaining</span>
                  </div>
                </div>
                {internalNoteError && (
                  <div className="alert alert-danger py-2 small mb-3" data-testid="internal-note-error">
                    {internalNoteError}
                  </div>
                )}
                <div className="d-flex justify-content-end">
                  <button
                    type="submit"
                    className="btn btn-warning text-dark fw-bold px-4"
                    disabled={!newInternalNote.trim() || postingInternalNote}
                    data-testid="post-internal-note-btn"
                  >
                    {postingInternalNote ? "Saving..." : "🔒 Post Internal Note"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* BR-09: Public Comments Section */}
          <div className="card border-0 shadow-sm rounded-3 p-4 bg-white" data-testid="public-comments-section">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="d-flex align-items-center gap-2">
                <span className="fs-5">💬</span>
                <h2 className="h5 fw-bold text-dark mb-0">
                  Public Comments ({comments.length})
                </h2>
              </div>
              <span className="badge bg-light text-secondary border px-3 py-2">
                Public (Visible to Requester)
              </span>
            </div>

            {/* Comments List */}
            <div className="d-flex flex-column gap-3 mb-4">
              {comments.length > 0 ? (
                comments.map((c) => (
                  <div key={c.id} className="p-3 bg-light rounded-3 border" data-testid={`comment-${c.id}`}>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <strong className="text-dark">{c.author?.name || "User"}</strong>
                        <span
                          className={`badge ${
                            c.author?.role === "IT_STAFF"
                              ? "bg-primary"
                              : c.author?.role === "ADMINISTRATOR"
                              ? "bg-danger"
                              : "bg-secondary"
                          } bg-opacity-10 text-${
                            c.author?.role === "IT_STAFF"
                              ? "primary"
                              : c.author?.role === "ADMINISTRATOR"
                              ? "danger"
                              : "secondary"
                          } border border-opacity-25 small`}
                        >
                          {c.author?.role || "REQUESTER"}
                        </span>
                      </div>
                      <span className="text-muted small">
                        {new Date(c.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-dark mb-0" style={{ whiteSpace: "pre-wrap" }}>
                      {c.content}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-muted mb-0">No public comments yet.</p>
              )}
            </div>

            {/* Post Public Comment Form */}
            <form onSubmit={handlePostComment} className="pt-3 border-top">
              <div className="mb-3">
                <label htmlFor="publicCommentInput" className="form-label fw-semibold text-dark">
                  Add a Public Comment
                </label>
                <textarea
                  id="publicCommentInput"
                  className="form-control"
                  rows={3}
                  value={newComment}
                  onChange={(e) => {
                    setNewComment(e.target.value);
                    if (commentError) setCommentError(null);
                  }}
                  placeholder="Type a public message visible to IT Staff and the requester..."
                  maxLength={2000}
                  data-testid="comment-input"
                />
                <div className="d-flex justify-content-between text-muted small mt-1">
                  <span>{2000 - newComment.length} characters remaining</span>
                </div>
              </div>
              {commentError && (
                <div className="alert alert-danger py-2 small mb-3" data-testid="comment-error">
                  {commentError}
                </div>
              )}
              <div className="d-flex justify-content-end">
                <button
                  type="submit"
                  className="btn btn-zen-green"
                  disabled={!newComment.trim() || postingComment}
                  data-testid="post-comment-btn"
                >
                  {postingComment ? "Posting..." : "Post Comment"}
                </button>
              </div>
            </form>
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
