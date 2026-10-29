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

  // Bottom Tabs State (Image 1 & 5)
  const [activeTab, setActiveTab] = useState<"comments" | "notes" | "attachments" | "services" | "events">("comments");

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

  const activeAttachments = ticket?.attachments?.filter((a) => !a.isRemoved) || [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    if (!e.target.files || e.target.files.length === 0) {
      setSelectedFile(null);
      return;
    }

    const file = e.target.files[0];
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Invalid file type. Allowed types: JPG, JPEG, PNG, WEBP, PDF");
      setSelectedFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File size exceeds 5MB limit.");
      setSelectedFile(null);
      return;
    }

    if (activeAttachments.length >= 5) {
      setUploadError("Maximum 5 active attachments allowed per ticket.");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setUploadError(null);

    try {
      await uploadAttachment(ticketId, selectedFile, userId);
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
    setDownloadError(null);
    try {
      await (downloadAttachment as any)(att.id, userId, att.originalFileName);
    } catch (err: any) {
      setDownloadError(err.message || "Failed to download attachment");
    }
  };

  const handleRemove = async () => {
    if (!removingAttachment) return;
    if (!removalReason.trim()) {
      setRemovalError("Removal reason is required");
      return;
    }

    setRemoving(true);
    setRemovalError(null);

    try {
      await (removeAttachment as any)(removingAttachment.id, removalReason.trim(), userId);
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
      const updated = await indicateTicketResolved(ticketId, userId);
      setTicket((prev) => (prev ? { ...prev, requesterResolvedIndicated: updated.requesterResolvedIndicated } : null));
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

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCommentDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="container py-3 px-3 px-md-4" style={{ maxWidth: 1140 }} data-testid="ticket-detail-view">
      {/* Top Breadcrumb & Back Navigation matching Image 1 & 5 */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center gap-2 text-muted small fw-medium">
          <span
            className="cursor-pointer text-zen-green"
            onClick={onBack}
            style={{ cursor: "pointer" }}
          >
            {isStaffOrAdmin ? "My Queue" : "My Tickets"}
          </span>
          <span>&gt;</span>
          <span className="text-dark fw-semibold">
            {isStaffOrAdmin ? "Ticket Detail" : "Ticket Details"}
          </span>
        </div>

        <button
          type="button"
          className="btn btn-outline-zen-green btn-sm px-3 py-1.5 rounded-2 d-flex align-items-center gap-2 fw-medium"
          onClick={onBack}
          data-testid="back-to-tickets-link"
        >
          <span>←</span>
          <span>Back to {isStaffOrAdmin ? "Queue" : "My Tickets"}</span>
        </button>
      </div>

      {loading ? (
        <div className="card border shadow-sm rounded-3 p-5 bg-white text-center" data-testid="loading-state">
          <div className="spinner-border text-zen-green mx-auto mb-3" role="status">
            <span className="visually-hidden">Loading ticket details...</span>
          </div>
          <h5 className="text-muted mb-0">Loading ticket details...</h5>
        </div>
      ) : error ? (
        <div className="card border shadow-sm rounded-3 p-4 bg-white" data-testid="error-state">
          <div className="alert alert-danger mb-3" role="alert">
            <h5 className="alert-heading mb-1">Access Error</h5>
            <p className="mb-0">{error}</p>
          </div>
          <button type="button" className="btn btn-outline-secondary" onClick={onBack}>
            Back to {isStaffOrAdmin ? "Queue" : "My Tickets"}
          </button>
        </div>
      ) : ticket ? (
        <div className="d-flex flex-column gap-4">
          {opError && (
            <div className="alert alert-danger mb-0" data-testid="operation-error">
              {opError}
            </div>
          )}

          {/* Main Ticket Information Form Card matching Images 1 & 5 */}
          <div className="card border shadow-sm rounded-3 p-4 bg-white" style={{ borderColor: "#e2e8f0" }}>
            <div className="row g-3">
              {/* Row 1: Ticket No., Ticket Date / Category, Related System */}
              <div className="col-12 col-md-4">
                <label className="form-label small fw-semibold text-muted mb-1">Ticket No.</label>
                <div
                  className="form-control rounded-2 bg-light font-monospace fw-semibold d-flex align-items-center"
                  style={{ borderColor: "#e2e8f0", minHeight: 38 }}
                >
                  <span data-testid="ticket-code">{ticket.ticketNumber}</span>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label small fw-semibold text-muted mb-1">
                  {isStaffOrAdmin ? "Category" : "Ticket Date"}
                </label>
                {isStaffOrAdmin ? (
                  <div
                    className="form-control rounded-2 bg-white d-flex align-items-center"
                    style={{ borderColor: "#e2e8f0", minHeight: 38 }}
                    data-testid="ticket-category"
                  >
                    <span>{ticket.category?.name || "Hardware"}</span>
                  </div>
                ) : (
                  <div
                    className="form-control rounded-2 bg-light text-muted d-flex align-items-center"
                    style={{ borderColor: "#e2e8f0", minHeight: 38 }}
                    data-testid="ticket-created-at"
                  >
                    <span>
                      {new Date(ticket.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                  </div>
                )}
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label small fw-semibold text-muted mb-1">Related System</label>
                <div
                  className="form-control rounded-2 bg-light text-dark d-flex align-items-center"
                  style={{ borderColor: "#e2e8f0", minHeight: 38 }}
                >
                  <span data-testid="ticket-system">{ticket.relatedSystem?.name || "Corporate Laptop"}</span>
                </div>
              </div>

              {/* Row 2: Requester, Requested Priority, Current Status / IT Priority */}
              <div className="col-12 col-md-4">
                <label className="form-label small fw-semibold text-muted mb-1">Requester</label>
                <div
                  className="form-control rounded-2 bg-light text-dark d-flex align-items-center"
                  style={{ borderColor: "#e2e8f0", minHeight: 38 }}
                >
                  <span data-testid="ticket-requester-name">{ticket.requester?.name || "Self"}</span>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label small fw-semibold text-muted mb-1">Requested Priority</label>
                <div
                  className="form-control rounded-2 bg-light d-flex align-items-center"
                  style={{ borderColor: "#e2e8f0", minHeight: 38 }}
                >
                  <span
                    className={`pill-badge ${
                      ticket.requestedPriority?.toLowerCase() === "high"
                        ? "pill-priority-high"
                        : ticket.requestedPriority?.toLowerCase() === "medium"
                        ? "pill-priority-medium"
                        : "pill-priority-low"
                    }`}
                    data-testid="ticket-priority"
                  >
                    {ticket.requestedPriority}
                    <span className="d-none"> Priority</span>
                  </span>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <label className="form-label small fw-semibold text-muted mb-1">
                  {isStaffOrAdmin ? "Current Status" : "IT Priority"}
                </label>
                {isStaffOrAdmin ? (
                  <select
                    id="statusSelect"
                    className="form-select rounded-2"
                    style={{ borderColor: "#e2e8f0" }}
                    value={ticket.currentStatus}
                    onChange={(e) => handleUpdateStatus(e.target.value)}
                    disabled={updatingStatus}
                    data-testid="status-select"
                  >
                    <option value={ticket.currentStatus}>{ticket.currentStatus}</option>
                    {getPermittedTransitions(ticket.currentStatus).map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div
                    className="form-control rounded-2 bg-light d-flex align-items-center"
                    style={{ borderColor: "#e2e8f0", minHeight: 38 }}
                  >
                    <span
                      className={`pill-badge ${
                        (ticket.itPriority || ticket.requestedPriority)?.toLowerCase() === "high"
                          ? "pill-priority-high"
                          : (ticket.itPriority || ticket.requestedPriority)?.toLowerCase() === "medium"
                          ? "pill-priority-medium"
                          : "pill-priority-low"
                      }`}
                    >
                      {ticket.itPriority || ticket.requestedPriority}
                    </span>
                  </div>
                )}
              </div>

              {/* Row 3: Ticket Owner, IT Priority (Staff) or Status (Requester) */}
              <div className="col-12 col-md-4">
                <label className="form-label small fw-semibold text-muted mb-1">Ticket Owner</label>
                {isStaffOrAdmin ? (
                  <select
                    id="ownerSelect"
                    className="form-select rounded-2"
                    style={{ borderColor: "#e2e8f0" }}
                    value={ticket.ownerId ? String(ticket.ownerId) : "unassigned"}
                    onChange={(e) => handleAssignOwner(e.target.value)}
                    disabled={updatingOwner}
                    data-testid="owner-select"
                  >
                    <option value="unassigned">-- Unassigned --</option>
                    {staffUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} (IT Support)
                      </option>
                    ))}
                  </select>
                ) : (
                  <div
                    className="form-control rounded-2 bg-light text-dark d-flex align-items-center"
                    style={{ borderColor: "#e2e8f0", minHeight: 38 }}
                  >
                    <span>{ticket.owner ? `${ticket.owner.name} (IT Support)` : "Unassigned"}</span>
                  </div>
                )}
              </div>

              {isStaffOrAdmin ? (
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold text-muted mb-1">IT Priority</label>
                  <select
                    id="itPrioritySelect"
                    className="form-select rounded-2"
                    style={{ borderColor: "#e2e8f0" }}
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
              ) : (
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold text-muted mb-1">Current Status</label>
                  <div
                    className="form-control rounded-2 bg-light d-flex align-items-center"
                    style={{ borderColor: "#e2e8f0", minHeight: 38 }}
                  >
                    <span className="pill-badge pill-status-in-progress" data-testid="ticket-status">
                      {ticket.currentStatus}
                    </span>
                  </div>
                </div>
              )}

              {!isStaffOrAdmin && (
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold text-muted mb-1">Category</label>
                  <div
                    className="form-control rounded-2 bg-light text-dark d-flex align-items-center"
                    style={{ borderColor: "#e2e8f0", minHeight: 38 }}
                  >
                    <span data-testid="ticket-category">{ticket.category?.name || "Hardware"}</span>
                  </div>
                </div>
              )}

              {/* Row 4: Summary */}
              <div className="col-12">
                <label className="form-label small fw-semibold text-muted mb-1">Summary</label>
                <div
                  className="form-control rounded-2 bg-light text-dark fw-medium d-flex align-items-center"
                  style={{ borderColor: "#e2e8f0", minHeight: 38 }}
                >
                  <span data-testid="ticket-summary">{ticket.summary}</span>
                </div>
              </div>

              {/* Row 5: Description */}
              <div className="col-12">
                <label className="form-label small fw-semibold text-muted mb-1">Description</label>
                <div
                  className="form-control rounded-2 bg-light text-dark p-3"
                  style={{ borderColor: "#e2e8f0", minHeight: 70, whiteSpace: "pre-wrap" }}
                  data-testid="ticket-description"
                >
                  {ticket.description}
                </div>
              </div>

              {/* Row 6: Resolution Summary */}
              <div className="col-12">
                <label className="form-label small fw-semibold text-muted mb-1">Resolution Summary</label>
                <input
                  type="text"
                  className="form-control rounded-2 bg-light text-muted"
                  style={{ borderColor: "#e2e8f0" }}
                  placeholder={
                    isStaffOrAdmin
                      ? "Add resolution summary (visible to requester)..."
                      : "No resolution summary available yet."
                  }
                  readOnly
                />
              </div>
            </div>

            {/* Requester Indication Banner (BR-05) */}
            {!isStaffOrAdmin && (
              <div className="mt-3 pt-3 border-top d-flex justify-content-between align-items-center">
                <span className="small text-muted">Problem Status Feedback:</span>
                {ticket.requesterResolvedIndicated ? (
                  <span
                    className="pill-badge pill-status-resolved fs-6"
                    data-testid="requester-resolved-badge"
                  >
                    ✓ Problem Appears Resolved by Requester
                  </span>
                ) : (
                  <button
                    type="button"
                    className="btn btn-outline-zen-green btn-sm fw-medium rounded-2"
                    onClick={handleIndicateResolved}
                    disabled={indicatingResolved}
                    data-testid="indicate-resolved-btn"
                  >
                    {indicatingResolved ? "Updating..." : "✓ Problem Appears Resolved"}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Bottom Tabbed Card matching Image 1 & Image 5 */}
          <div className="card border shadow-sm rounded-3 bg-white overflow-hidden" style={{ borderColor: "#e2e8f0" }}>
            {/* Custom Tab Bar Header */}
            <div className="d-flex align-items-center border-bottom px-3 pt-2 bg-white flex-wrap">
              <button
                type="button"
                className={`custom-tab-btn ${activeTab === "comments" ? "active" : ""}`}
                onClick={() => setActiveTab("comments")}
              >
                <span>💬</span>
                <span>Public Comments</span>
                <span className="custom-tab-badge">{comments.length}</span>
              </button>

              {isStaffOrAdmin && (
                <button
                  type="button"
                  className={`custom-tab-btn ${activeTab === "notes" ? "active" : ""}`}
                  onClick={() => setActiveTab("notes")}
                >
                  <span>📝</span>
                  <span>Internal Notes</span>
                  <span className="custom-tab-badge">{internalNotes.length}</span>
                </button>
              )}

              <button
                type="button"
                className={`custom-tab-btn ${activeTab === "attachments" ? "active" : ""}`}
                onClick={() => setActiveTab("attachments")}
              >
                <span>📎</span>
                <span>Attachments</span>
                <span className="custom-tab-badge">{activeAttachments.length}</span>
              </button>

              <button
                type="button"
                className={`custom-tab-btn ${activeTab === "services" ? "active" : ""}`}
                onClick={() => setActiveTab("services")}
              >
                <span>🔧</span>
                <span>Service Actions</span>
                <span className="custom-tab-badge">1</span>
              </button>

              {!isStaffOrAdmin && (
                <button
                  type="button"
                  className={`custom-tab-btn ${activeTab === "events" ? "active" : ""}`}
                  onClick={() => setActiveTab("events")}
                >
                  <span>🕒</span>
                  <span>Event Log</span>
                  <span className="custom-tab-badge">6</span>
                </button>
              )}
            </div>

            {/* Tab 1: Public Comments */}
            <div
              className={`p-4 ${activeTab === "comments" ? "d-block" : "d-none"}`}
              data-testid="public-comments-section"
            >
              <div className="mb-4">
                <div className="fw-semibold text-dark small mb-2">Add Public Comment</div>
                <form onSubmit={handlePostComment} className="d-flex gap-2">
                  <input
                    type="text"
                    className="form-control rounded-2"
                    style={{ borderColor: "#e2e8f0" }}
                    placeholder="Type your comment here..."
                    value={newComment}
                    onChange={(e) => {
                      setNewComment(e.target.value);
                      if (commentError) setCommentError(null);
                    }}
                    maxLength={2000}
                    data-testid="comment-input"
                  />
                  <button
                    type="submit"
                    className="btn btn-zen-green d-flex align-items-center gap-2 px-3 text-nowrap rounded-2 shadow-sm"
                    disabled={!newComment.trim() || postingComment}
                    data-testid="post-comment-btn"
                  >
                    <span>✈</span>
                    <span>{postingComment ? "Posting..." : "Post Comment"}</span>
                  </button>
                </form>
                {commentError && <div className="text-danger small mt-1">{commentError}</div>}
              </div>

              {/* Comments Feed matching Image 1 & 5 */}
              <div className="d-flex flex-column gap-3">
                {comments.length === 0 ? (
                  <p className="text-muted mb-0 small">No public comments yet.</p>
                ) : (
                  comments.map((c) => (
                    <div
                      key={c.id}
                      className="d-flex gap-3 p-3 rounded-3"
                      style={{ backgroundColor: "#f8fafc", border: "1px solid #f1f5f9" }}
                      data-testid={`comment-${c.id}`}
                    >
                      <div className="user-avatar-circle flex-shrink-0">
                        {getInitials(c.author?.name)}
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <div className="d-flex align-items-center gap-2">
                            <span className="fw-bold text-dark small">{c.author?.name || "User"}</span>
                            <span className="pill-badge pill-role-staff" style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem" }}>
                              {c.author?.role === "IT_STAFF" ? "IT Support" : "Requester"}
                            </span>
                          </div>
                          <div className="d-flex align-items-center gap-2 text-muted small">
                            <span>{formatCommentDate(c.createdAt)}</span>
                            <span className="cursor-pointer" style={{ cursor: "pointer" }}>⋮</span>
                          </div>
                        </div>
                        <p className="text-dark small mb-0" style={{ whiteSpace: "pre-wrap" }}>
                          {c.content}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Tab 2: Internal Notes (IT Staff / Admin) */}
            {isStaffOrAdmin && (
              <div
                className={`p-4 ${activeTab === "notes" ? "d-block" : "d-none"}`}
                data-testid="internal-notes-section"
              >
                <div className="alert alert-warning py-2 mb-3 rounded-2 small d-flex justify-content-between align-items-center">
                  <span>🔒 Operational notes are strictly private to IT Staff & Admin.</span>
                  <span className="badge bg-warning text-dark border">
                    Restricted to IT Staff & Admin (BR-04)
                  </span>
                </div>

                <div className="mb-4">
                  <div className="fw-semibold text-dark small mb-2">Add Private Internal Note</div>
                  <form onSubmit={handlePostInternalNote} className="d-flex gap-2">
                    <input
                      type="text"
                      className="form-control rounded-2 border-warning"
                      placeholder="Diagnose issue, log troubleshooting details..."
                      value={newInternalNote}
                      onChange={(e) => {
                        setNewInternalNote(e.target.value);
                        if (internalNoteError) setInternalNoteError(null);
                      }}
                      maxLength={2000}
                      data-testid="internal-note-input"
                    />
                    <button
                      type="submit"
                      className="btn btn-warning text-dark fw-bold d-flex align-items-center gap-2 px-3 text-nowrap rounded-2 shadow-sm"
                      disabled={!newInternalNote.trim() || postingInternalNote}
                      data-testid="post-internal-note-btn"
                    >
                      <span>🔒</span>
                      <span>{postingInternalNote ? "Saving..." : "Save Note"}</span>
                    </button>
                  </form>
                  {internalNoteError && <div className="text-danger small mt-1">{internalNoteError}</div>}
                </div>

                <div className="d-flex flex-column gap-3">
                  {internalNotes.length === 0 ? (
                    <p className="text-muted mb-0 small">No internal notes recorded yet.</p>
                  ) : (
                    internalNotes.map((note) => (
                      <div
                        key={note.id}
                        className="p-3 bg-white rounded-3 border border-warning shadow-sm"
                        data-testid={`internal-note-${note.id}`}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <strong className="text-dark small">{note.author?.name || "IT Staff"}</strong>
                          <span className="text-muted small">{formatCommentDate(note.createdAt)}</span>
                        </div>
                        <p className="text-dark small mb-0" style={{ whiteSpace: "pre-wrap" }}>
                          {note.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tab 3: Attachments Section */}
            <div
              className={`p-4 ${activeTab === "attachments" ? "d-block" : "d-none"}`}
              data-testid="ticket-attachments-section"
            >
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="fw-semibold text-dark small">
                  Ticket Attachments ({activeAttachments.length} / 5 active)
                </div>
                <span className="text-muted small">JPG, PNG, WEBP, PDF (Max 5MB)</span>
              </div>

              {/* Upload Form */}
              <form onSubmit={handleUpload} className="mb-4 p-3 bg-light rounded-3 border">
                <div className="row g-2 align-items-center">
                  <div className="col">
                    <input
                      type="file"
                      className="form-control form-control-sm rounded-2"
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
                      className="btn btn-zen-green btn-sm rounded-2 px-3 fw-medium"
                      disabled={!selectedFile || uploading || activeAttachments.length >= 5 || Boolean(uploadError)}
                      data-testid="upload-attachment-btn"
                    >
                      {uploading ? "Uploading..." : "Upload File"}
                    </button>
                  </div>
                </div>
                {uploadError && <div className="text-danger small mt-1" data-testid="upload-error">{uploadError}</div>}
              </form>

              {downloadError && <div className="alert alert-danger py-2 small mb-3" data-testid="download-error">{downloadError}</div>}

              {/* Attachments List */}
              <div className="row g-3">
                {ticket.attachments && ticket.attachments.length > 0 ? (
                  ticket.attachments.map((att) => {
                    const isRemoved = Boolean(att.isRemoved);
                    return (
                      <div key={att.id} className="col-12 col-md-6" data-testid={`attachment-${att.id}`}>
                        <div className={`p-3 rounded-3 border ${isRemoved ? "bg-light opacity-75" : "bg-white shadow-sm"}`}>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span className="fw-medium text-truncate small">{att.originalFileName}</span>
                            {isRemoved ? (
                              <span className="badge bg-secondary" data-testid={`removed-badge-${att.id}`}>
                                Soft Removed
                              </span>
                            ) : (
                              <span className="pill-badge pill-active-true">Active</span>
                            )}
                          </div>
                          <div className="text-muted small mb-2">{formatFileSize(att.fileSize)}</div>
                          {isRemoved ? (
                            <div className="small text-muted mt-2" data-testid={`removed-metadata-${att.id}`}>
                              <div>
                                <strong>Reason:</strong> <span data-testid={`removal-reason-${att.id}`}>{att.removalReason || "No reason provided"}</span>
                              </div>
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
                            <div className="d-flex gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-zen-green rounded-2 py-1 px-3"
                                onClick={() => handleDownload(att)}
                                data-testid={`download-attachment-${att.id}`}
                              >
                                Download
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger rounded-2 py-1 px-3"
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
                  })
                ) : (
                  <p className="text-muted small mb-0">No attachments uploaded yet.</p>
                )}
              </div>
            </div>

            {/* Tab 4: Service Actions */}
            <div className={`p-4 ${activeTab === "services" ? "d-block" : "d-none"}`}>
              <div className="text-muted small">1 service action logged for this ticket.</div>
            </div>

            {/* Tab 5: Event Log */}
            {!isStaffOrAdmin && (
              <div className={`p-4 ${activeTab === "events" ? "d-block" : "d-none"}`}>
                <div className="text-muted small">Audit event timeline recorded.</div>
              </div>
            )}
          </div>

          {/* Remove Attachment Modal Dialog */}
          {removingAttachment && (
            <div
              className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center z-3 p-3"
              data-testid="removal-modal"
            >
              <div className="card shadow rounded-3 p-4 bg-white" style={{ maxWidth: 450, width: "100%" }}>
                <h5 className="fw-bold mb-3">Remove Attachment</h5>
                <p className="small text-muted">
                  Please provide a reason for soft-removing <strong>{removingAttachment.originalFileName}</strong>:
                </p>
                {removalError && (
                  <div className="text-danger small mb-2" data-testid="removal-error">
                    {removalError}
                  </div>
                )}
                <textarea
                  className="form-control rounded-2 mb-3"
                  rows={2}
                  placeholder="Reason for removal (required)"
                  value={removalReason}
                  onChange={(e) => setRemovalReason(e.target.value)}
                  data-testid="removal-reason-input"
                />
                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary rounded-2"
                    onClick={() => setRemovingAttachment(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-danger rounded-2"
                    onClick={handleRemove}
                    data-testid="confirm-remove-btn"
                  >
                    {removing ? "Removing..." : "Confirm Removal"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
