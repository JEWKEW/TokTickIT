import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState, useCallback } from "react";
import { fetchTicketById, uploadAttachment, downloadAttachment, removeAttachment, indicateTicketResolved, fetchPublicComments, postPublicComment, fetchInternalNotes, postInternalNote, assignTicketOwner, updateITPriority, updateTicketStatus, fetchRequesters, } from "../api.js";
export default function TicketDetail({ ticketId, userId, userRole = "REQUESTER", onBack, }) {
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [removingAttachment, setRemovingAttachment] = useState(null);
    const [removalReason, setRemovalReason] = useState("");
    const [removing, setRemoving] = useState(false);
    const [removalError, setRemovalError] = useState(null);
    const [downloadError, setDownloadError] = useState(null);
    // BR-05 Requester Resolution Indication State
    const [indicatingResolved, setIndicatingResolved] = useState(false);
    const [indicateError, setIndicateError] = useState(null);
    // Public Comments State
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [postingComment, setPostingComment] = useState(false);
    const [commentError, setCommentError] = useState(null);
    // Internal Notes State (BR-04, BR-10)
    const [internalNotes, setInternalNotes] = useState([]);
    const [newInternalNote, setNewInternalNote] = useState("");
    const [postingInternalNote, setPostingInternalNote] = useState(false);
    const [internalNoteError, setInternalNoteError] = useState(null);
    // Operational Controls State (IT Staff / Admin)
    const [staffUsers, setStaffUsers] = useState([]);
    const [updatingOwner, setUpdatingOwner] = useState(false);
    const [updatingPriority, setUpdatingPriority] = useState(false);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [opError, setOpError] = useState(null);
    // Bottom Tabs State (Image 1 & 5)
    const [activeTab, setActiveTab] = useState("comments");
    const isStaffOrAdmin = userRole === "IT_STAFF" || userRole === "ADMINISTRATOR";
    const loadTicketDetail = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchTicketById(ticketId, userId);
            setTicket(data);
        }
        catch (err) {
            setError(err.message || "Failed to load ticket details");
        }
        finally {
            setLoading(false);
        }
    }, [ticketId, userId]);
    const loadComments = useCallback(async () => {
        try {
            const data = await fetchPublicComments(ticketId, userId);
            setComments(data);
        }
        catch (err) {
            console.error("Failed to load public comments:", err);
        }
    }, [ticketId, userId]);
    const loadNotes = useCallback(async () => {
        if (!isStaffOrAdmin)
            return;
        try {
            const data = await fetchInternalNotes(ticketId, userId);
            setInternalNotes(data);
        }
        catch (err) {
            console.error("Failed to load internal notes:", err);
        }
    }, [ticketId, userId, isStaffOrAdmin]);
    const loadStaffUsers = useCallback(async () => {
        if (!isStaffOrAdmin)
            return;
        try {
            const users = await fetchRequesters();
            setStaffUsers(users.filter((u) => u.isActive));
        }
        catch (err) {
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
    const handleFileChange = (e) => {
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
    const handleUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile)
            return;
        setUploading(true);
        setUploadError(null);
        try {
            await uploadAttachment(ticketId, selectedFile, userId);
            setSelectedFile(null);
            const fileInput = document.getElementById("attachmentFileInput");
            if (fileInput)
                fileInput.value = "";
            await loadTicketDetail();
        }
        catch (err) {
            setUploadError(err.message || "Failed to upload attachment");
        }
        finally {
            setUploading(false);
        }
    };
    const handleDownload = async (att) => {
        setDownloadError(null);
        try {
            await downloadAttachment(att.id, userId, att.originalFileName);
        }
        catch (err) {
            setDownloadError(err.message || "Failed to download attachment");
        }
    };
    const handleRemove = async () => {
        if (!removingAttachment)
            return;
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
        }
        catch (err) {
            setRemovalError(err.message || "Failed to remove attachment");
        }
        finally {
            setRemoving(false);
        }
    };
    const handleIndicateResolved = async () => {
        setIndicatingResolved(true);
        setIndicateError(null);
        try {
            const updated = await indicateTicketResolved(ticketId, userId);
            setTicket((prev) => (prev ? { ...prev, requesterResolvedIndicated: updated.requesterResolvedIndicated } : null));
        }
        catch (err) {
            setIndicateError(err.message || "Failed to indicate problem resolved");
        }
        finally {
            setIndicatingResolved(false);
        }
    };
    const handlePostComment = async (e) => {
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
        }
        catch (err) {
            setCommentError(err.message || "Failed to post public comment");
        }
        finally {
            setPostingComment(false);
        }
    };
    const handlePostInternalNote = async (e) => {
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
        }
        catch (err) {
            setInternalNoteError(err.message || "Failed to post internal note");
        }
        finally {
            setPostingInternalNote(false);
        }
    };
    const handleAssignOwner = async (newOwnerIdStr) => {
        setUpdatingOwner(true);
        setOpError(null);
        try {
            const newOwnerId = newOwnerIdStr === "" || newOwnerIdStr === "unassigned" ? null : parseInt(newOwnerIdStr, 10);
            const updated = await assignTicketOwner(ticketId, newOwnerId, userId);
            setTicket((prev) => (prev ? { ...prev, ownerId: updated.ownerId, owner: updated.owner } : null));
        }
        catch (err) {
            setOpError(err.message || "Failed to update ticket owner");
        }
        finally {
            setUpdatingOwner(false);
        }
    };
    const handleUpdateITPriority = async (newPriority) => {
        setUpdatingPriority(true);
        setOpError(null);
        try {
            const updated = await updateITPriority(ticketId, newPriority, userId);
            setTicket((prev) => (prev ? { ...prev, itPriority: updated.itPriority } : null));
        }
        catch (err) {
            setOpError(err.message || "Failed to update IT Priority");
        }
        finally {
            setUpdatingPriority(false);
        }
    };
    const handleUpdateStatus = async (newStatus) => {
        setUpdatingStatus(true);
        setOpError(null);
        try {
            const updated = await updateTicketStatus(ticketId, newStatus, userId);
            setTicket((prev) => (prev ? { ...prev, currentStatus: updated.currentStatus } : null));
        }
        catch (err) {
            setOpError(err.message || "Failed to update ticket status");
        }
        finally {
            setUpdatingStatus(false);
        }
    };
    const getPermittedTransitions = (currentStatus) => {
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
    const getInitials = (name) => {
        if (!name)
            return "U";
        return name
            .split(" ")
            .map((part) => part[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };
    const formatCommentDate = (dateStr) => {
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
        }
        catch {
            return dateStr;
        }
    };
    const formatFileSize = (bytes) => {
        if (bytes < 1024)
            return `${bytes} B`;
        if (bytes < 1024 * 1024)
            return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };
    return (_jsxs("div", { className: "container py-3 px-3 px-md-4", style: { maxWidth: 1140 }, "data-testid": "ticket-detail-view", children: [_jsxs("div", { className: "d-flex justify-content-between align-items-center mb-3", children: [_jsxs("div", { className: "d-flex align-items-center gap-2 text-muted small fw-medium", children: [_jsx("span", { className: "cursor-pointer text-zen-green", onClick: onBack, style: { cursor: "pointer" }, children: isStaffOrAdmin ? "My Queue" : "My Tickets" }), _jsx("span", { children: ">" }), _jsx("span", { className: "text-dark fw-semibold", children: isStaffOrAdmin ? "Ticket Detail" : "Ticket Details" })] }), _jsxs("button", { type: "button", className: "btn btn-outline-zen-green btn-sm px-3 py-1.5 rounded-2 d-flex align-items-center gap-2 fw-medium", onClick: onBack, "data-testid": "back-to-tickets-link", children: [_jsx("span", { children: "\u2190" }), _jsxs("span", { children: ["Back to ", isStaffOrAdmin ? "Queue" : "My Tickets"] })] })] }), loading ? (_jsxs("div", { className: "card border shadow-sm rounded-3 p-5 bg-white text-center", "data-testid": "loading-state", children: [_jsx("div", { className: "spinner-border text-zen-green mx-auto mb-3", role: "status", children: _jsx("span", { className: "visually-hidden", children: "Loading ticket details..." }) }), _jsx("h5", { className: "text-muted mb-0", children: "Loading ticket details..." })] })) : error ? (_jsxs("div", { className: "card border shadow-sm rounded-3 p-4 bg-white", "data-testid": "error-state", children: [_jsxs("div", { className: "alert alert-danger mb-3", role: "alert", children: [_jsx("h5", { className: "alert-heading mb-1", children: "Access Error" }), _jsx("p", { className: "mb-0", children: error })] }), _jsxs("button", { type: "button", className: "btn btn-outline-secondary", onClick: onBack, children: ["Back to ", isStaffOrAdmin ? "Queue" : "My Tickets"] })] })) : ticket ? (_jsxs("div", { className: "d-flex flex-column gap-4", children: [opError && (_jsx("div", { className: "alert alert-danger mb-0", "data-testid": "operation-error", children: opError })), _jsxs("div", { className: "card border shadow-sm rounded-3 p-4 bg-white", style: { borderColor: "#e2e8f0" }, children: [_jsxs("div", { className: "row g-3", children: [_jsxs("div", { className: "col-12 col-md-4", children: [_jsx("label", { className: "form-label small fw-semibold text-muted mb-1", children: "Ticket No." }), _jsx("div", { className: "form-control rounded-2 bg-light font-monospace fw-semibold d-flex align-items-center", style: { borderColor: "#e2e8f0", minHeight: 38 }, children: _jsx("span", { "data-testid": "ticket-code", children: ticket.ticketNumber }) })] }), _jsxs("div", { className: "col-12 col-md-4", children: [_jsx("label", { className: "form-label small fw-semibold text-muted mb-1", children: isStaffOrAdmin ? "Category" : "Ticket Date" }), isStaffOrAdmin ? (_jsx("div", { className: "form-control rounded-2 bg-white d-flex align-items-center", style: { borderColor: "#e2e8f0", minHeight: 38 }, "data-testid": "ticket-category", children: _jsx("span", { children: ticket.category?.name || "Hardware" }) })) : (_jsx("div", { className: "form-control rounded-2 bg-light text-muted d-flex align-items-center", style: { borderColor: "#e2e8f0", minHeight: 38 }, "data-testid": "ticket-created-at", children: _jsx("span", { children: new Date(ticket.createdAt).toLocaleString("en-US", {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric",
                                                        hour: "numeric",
                                                        minute: "2-digit",
                                                        hour12: true,
                                                    }) }) }))] }), _jsxs("div", { className: "col-12 col-md-4", children: [_jsx("label", { className: "form-label small fw-semibold text-muted mb-1", children: "Related System" }), _jsx("div", { className: "form-control rounded-2 bg-light text-dark d-flex align-items-center", style: { borderColor: "#e2e8f0", minHeight: 38 }, children: _jsx("span", { "data-testid": "ticket-system", children: ticket.relatedSystem?.name || "Corporate Laptop" }) })] }), _jsxs("div", { className: "col-12 col-md-4", children: [_jsx("label", { className: "form-label small fw-semibold text-muted mb-1", children: "Requester" }), _jsx("div", { className: "form-control rounded-2 bg-light text-dark d-flex align-items-center", style: { borderColor: "#e2e8f0", minHeight: 38 }, children: _jsx("span", { "data-testid": "ticket-requester-name", children: ticket.requester?.name || "Self" }) })] }), _jsxs("div", { className: "col-12 col-md-4", children: [_jsx("label", { className: "form-label small fw-semibold text-muted mb-1", children: "Requested Priority" }), _jsx("div", { className: "form-control rounded-2 bg-light d-flex align-items-center", style: { borderColor: "#e2e8f0", minHeight: 38 }, children: _jsxs("span", { className: `pill-badge ${ticket.requestedPriority?.toLowerCase() === "high"
                                                        ? "pill-priority-high"
                                                        : ticket.requestedPriority?.toLowerCase() === "medium"
                                                            ? "pill-priority-medium"
                                                            : "pill-priority-low"}`, "data-testid": "ticket-priority", children: [ticket.requestedPriority, _jsx("span", { className: "d-none", children: " Priority" })] }) })] }), _jsxs("div", { className: "col-12 col-md-4", children: [_jsx("label", { className: "form-label small fw-semibold text-muted mb-1", children: isStaffOrAdmin ? "Current Status" : "IT Priority" }), isStaffOrAdmin ? (_jsxs("select", { id: "statusSelect", className: "form-select rounded-2", style: { borderColor: "#e2e8f0" }, value: ticket.currentStatus, onChange: (e) => handleUpdateStatus(e.target.value), disabled: updatingStatus, "data-testid": "status-select", children: [_jsx("option", { value: ticket.currentStatus, children: ticket.currentStatus }), getPermittedTransitions(ticket.currentStatus).map((st) => (_jsx("option", { value: st, children: st }, st)))] })) : (_jsx("div", { className: "form-control rounded-2 bg-light d-flex align-items-center", style: { borderColor: "#e2e8f0", minHeight: 38 }, children: _jsx("span", { className: `pill-badge ${(ticket.itPriority || ticket.requestedPriority)?.toLowerCase() === "high"
                                                        ? "pill-priority-high"
                                                        : (ticket.itPriority || ticket.requestedPriority)?.toLowerCase() === "medium"
                                                            ? "pill-priority-medium"
                                                            : "pill-priority-low"}`, children: ticket.itPriority || ticket.requestedPriority }) }))] }), _jsxs("div", { className: "col-12 col-md-4", children: [_jsx("label", { className: "form-label small fw-semibold text-muted mb-1", children: "Ticket Owner" }), isStaffOrAdmin ? (_jsxs("select", { id: "ownerSelect", className: "form-select rounded-2", style: { borderColor: "#e2e8f0" }, value: ticket.ownerId ? String(ticket.ownerId) : "unassigned", onChange: (e) => handleAssignOwner(e.target.value), disabled: updatingOwner, "data-testid": "owner-select", children: [_jsx("option", { value: "unassigned", children: "-- Unassigned --" }), staffUsers.map((u) => (_jsxs("option", { value: u.id, children: [u.name, " (IT Support)"] }, u.id)))] })) : (_jsx("div", { className: "form-control rounded-2 bg-light text-dark d-flex align-items-center", style: { borderColor: "#e2e8f0", minHeight: 38 }, children: _jsx("span", { children: ticket.owner ? `${ticket.owner.name} (IT Support)` : "Unassigned" }) }))] }), isStaffOrAdmin ? (_jsxs("div", { className: "col-12 col-md-4", children: [_jsx("label", { className: "form-label small fw-semibold text-muted mb-1", children: "IT Priority" }), _jsxs("select", { id: "itPrioritySelect", className: "form-select rounded-2", style: { borderColor: "#e2e8f0" }, value: ticket.itPriority || ticket.requestedPriority, onChange: (e) => handleUpdateITPriority(e.target.value), disabled: updatingPriority, "data-testid": "it-priority-select", children: [_jsx("option", { value: "Low", children: "Low" }), _jsx("option", { value: "Medium", children: "Medium" }), _jsx("option", { value: "High", children: "High" }), _jsx("option", { value: "Urgent", children: "Urgent" })] })] })) : (_jsxs("div", { className: "col-12 col-md-4", children: [_jsx("label", { className: "form-label small fw-semibold text-muted mb-1", children: "Current Status" }), _jsx("div", { className: "form-control rounded-2 bg-light d-flex align-items-center", style: { borderColor: "#e2e8f0", minHeight: 38 }, children: _jsx("span", { className: "pill-badge pill-status-in-progress", "data-testid": "ticket-status", children: ticket.currentStatus }) })] })), !isStaffOrAdmin && (_jsxs("div", { className: "col-12 col-md-4", children: [_jsx("label", { className: "form-label small fw-semibold text-muted mb-1", children: "Category" }), _jsx("div", { className: "form-control rounded-2 bg-light text-dark d-flex align-items-center", style: { borderColor: "#e2e8f0", minHeight: 38 }, children: _jsx("span", { "data-testid": "ticket-category", children: ticket.category?.name || "Hardware" }) })] })), _jsxs("div", { className: "col-12", children: [_jsx("label", { className: "form-label small fw-semibold text-muted mb-1", children: "Summary" }), _jsx("div", { className: "form-control rounded-2 bg-light text-dark fw-medium d-flex align-items-center", style: { borderColor: "#e2e8f0", minHeight: 38 }, children: _jsx("span", { "data-testid": "ticket-summary", children: ticket.summary }) })] }), _jsxs("div", { className: "col-12", children: [_jsx("label", { className: "form-label small fw-semibold text-muted mb-1", children: "Description" }), _jsx("div", { className: "form-control rounded-2 bg-light text-dark p-3", style: { borderColor: "#e2e8f0", minHeight: 70, whiteSpace: "pre-wrap" }, "data-testid": "ticket-description", children: ticket.description })] }), _jsxs("div", { className: "col-12", children: [_jsx("label", { className: "form-label small fw-semibold text-muted mb-1", children: "Resolution Summary" }), _jsx("input", { type: "text", className: "form-control rounded-2 bg-light text-muted", style: { borderColor: "#e2e8f0" }, placeholder: isStaffOrAdmin
                                                    ? "Add resolution summary (visible to requester)..."
                                                    : "No resolution summary available yet.", readOnly: true })] })] }), !isStaffOrAdmin && (_jsxs("div", { className: "mt-3 pt-3 border-top d-flex justify-content-between align-items-center", children: [_jsx("span", { className: "small text-muted", children: "Problem Status Feedback:" }), ticket.requesterResolvedIndicated ? (_jsx("span", { className: "pill-badge pill-status-resolved fs-6", "data-testid": "requester-resolved-badge", children: "\u2713 Problem Appears Resolved by Requester" })) : (_jsx("button", { type: "button", className: "btn btn-outline-zen-green btn-sm fw-medium rounded-2", onClick: handleIndicateResolved, disabled: indicatingResolved, "data-testid": "indicate-resolved-btn", children: indicatingResolved ? "Updating..." : "✓ Problem Appears Resolved" }))] }))] }), _jsxs("div", { className: "card border shadow-sm rounded-3 bg-white overflow-hidden", style: { borderColor: "#e2e8f0" }, children: [_jsxs("div", { className: "d-flex align-items-center border-bottom px-3 pt-2 bg-white flex-wrap", children: [_jsxs("button", { type: "button", className: `custom-tab-btn ${activeTab === "comments" ? "active" : ""}`, onClick: () => setActiveTab("comments"), children: [_jsx("span", { children: "\uD83D\uDCAC" }), _jsx("span", { children: "Public Comments" }), _jsx("span", { className: "custom-tab-badge", children: comments.length })] }), isStaffOrAdmin && (_jsxs("button", { type: "button", className: `custom-tab-btn ${activeTab === "notes" ? "active" : ""}`, onClick: () => setActiveTab("notes"), children: [_jsx("span", { children: "\uD83D\uDCDD" }), _jsx("span", { children: "Internal Notes" }), _jsx("span", { className: "custom-tab-badge", children: internalNotes.length })] })), _jsxs("button", { type: "button", className: `custom-tab-btn ${activeTab === "attachments" ? "active" : ""}`, onClick: () => setActiveTab("attachments"), children: [_jsx("span", { children: "\uD83D\uDCCE" }), _jsx("span", { children: "Attachments" }), _jsx("span", { className: "custom-tab-badge", children: activeAttachments.length })] }), _jsxs("button", { type: "button", className: `custom-tab-btn ${activeTab === "services" ? "active" : ""}`, onClick: () => setActiveTab("services"), children: [_jsx("span", { children: "\uD83D\uDD27" }), _jsx("span", { children: "Service Actions" }), _jsx("span", { className: "custom-tab-badge", children: "1" })] }), !isStaffOrAdmin && (_jsxs("button", { type: "button", className: `custom-tab-btn ${activeTab === "events" ? "active" : ""}`, onClick: () => setActiveTab("events"), children: [_jsx("span", { children: "\uD83D\uDD52" }), _jsx("span", { children: "Event Log" }), _jsx("span", { className: "custom-tab-badge", children: "6" })] }))] }), _jsxs("div", { className: `p-4 ${activeTab === "comments" ? "d-block" : "d-none"}`, "data-testid": "public-comments-section", children: [_jsxs("div", { className: "mb-4", children: [_jsx("div", { className: "fw-semibold text-dark small mb-2", children: "Add Public Comment" }), _jsxs("form", { onSubmit: handlePostComment, className: "d-flex gap-2", children: [_jsx("input", { type: "text", className: "form-control rounded-2", style: { borderColor: "#e2e8f0" }, placeholder: "Type your comment here...", value: newComment, onChange: (e) => {
                                                            setNewComment(e.target.value);
                                                            if (commentError)
                                                                setCommentError(null);
                                                        }, maxLength: 2000, "data-testid": "comment-input" }), _jsxs("button", { type: "submit", className: "btn btn-zen-green d-flex align-items-center gap-2 px-3 text-nowrap rounded-2 shadow-sm", disabled: !newComment.trim() || postingComment, "data-testid": "post-comment-btn", children: [_jsx("span", { children: "\u2708" }), _jsx("span", { children: postingComment ? "Posting..." : "Post Comment" })] })] }), commentError && _jsx("div", { className: "text-danger small mt-1", children: commentError })] }), _jsx("div", { className: "d-flex flex-column gap-3", children: comments.length === 0 ? (_jsx("p", { className: "text-muted mb-0 small", children: "No public comments yet." })) : (comments.map((c) => (_jsxs("div", { className: "d-flex gap-3 p-3 rounded-3", style: { backgroundColor: "#f8fafc", border: "1px solid #f1f5f9" }, "data-testid": `comment-${c.id}`, children: [_jsx("div", { className: "user-avatar-circle flex-shrink-0", children: getInitials(c.author?.name) }), _jsxs("div", { className: "flex-grow-1", children: [_jsxs("div", { className: "d-flex justify-content-between align-items-center mb-1", children: [_jsxs("div", { className: "d-flex align-items-center gap-2", children: [_jsx("span", { className: "fw-bold text-dark small", children: c.author?.name || "User" }), _jsx("span", { className: "pill-badge pill-role-staff", style: { fontSize: "0.7rem", padding: "0.15rem 0.5rem" }, children: c.author?.role === "IT_STAFF" ? "IT Support" : "Requester" })] }), _jsxs("div", { className: "d-flex align-items-center gap-2 text-muted small", children: [_jsx("span", { children: formatCommentDate(c.createdAt) }), _jsx("span", { className: "cursor-pointer", style: { cursor: "pointer" }, children: "\u22EE" })] })] }), _jsx("p", { className: "text-dark small mb-0", style: { whiteSpace: "pre-wrap" }, children: c.content })] })] }, c.id)))) })] }), isStaffOrAdmin && (_jsxs("div", { className: `p-4 ${activeTab === "notes" ? "d-block" : "d-none"}`, "data-testid": "internal-notes-section", children: [_jsxs("div", { className: "alert alert-warning py-2 mb-3 rounded-2 small d-flex justify-content-between align-items-center", children: [_jsx("span", { children: "\uD83D\uDD12 Operational notes are strictly private to IT Staff & Admin." }), _jsx("span", { className: "badge bg-warning text-dark border", children: "Restricted to IT Staff & Admin (BR-04)" })] }), _jsxs("div", { className: "mb-4", children: [_jsx("div", { className: "fw-semibold text-dark small mb-2", children: "Add Private Internal Note" }), _jsxs("form", { onSubmit: handlePostInternalNote, className: "d-flex gap-2", children: [_jsx("input", { type: "text", className: "form-control rounded-2 border-warning", placeholder: "Diagnose issue, log troubleshooting details...", value: newInternalNote, onChange: (e) => {
                                                            setNewInternalNote(e.target.value);
                                                            if (internalNoteError)
                                                                setInternalNoteError(null);
                                                        }, maxLength: 2000, "data-testid": "internal-note-input" }), _jsxs("button", { type: "submit", className: "btn btn-warning text-dark fw-bold d-flex align-items-center gap-2 px-3 text-nowrap rounded-2 shadow-sm", disabled: !newInternalNote.trim() || postingInternalNote, "data-testid": "post-internal-note-btn", children: [_jsx("span", { children: "\uD83D\uDD12" }), _jsx("span", { children: postingInternalNote ? "Saving..." : "Save Note" })] })] }), internalNoteError && _jsx("div", { className: "text-danger small mt-1", children: internalNoteError })] }), _jsx("div", { className: "d-flex flex-column gap-3", children: internalNotes.length === 0 ? (_jsx("p", { className: "text-muted mb-0 small", children: "No internal notes recorded yet." })) : (internalNotes.map((note) => (_jsxs("div", { className: "p-3 bg-white rounded-3 border border-warning shadow-sm", "data-testid": `internal-note-${note.id}`, children: [_jsxs("div", { className: "d-flex justify-content-between align-items-center mb-1", children: [_jsx("strong", { className: "text-dark small", children: note.author?.name || "IT Staff" }), _jsx("span", { className: "text-muted small", children: formatCommentDate(note.createdAt) })] }), _jsx("p", { className: "text-dark small mb-0", style: { whiteSpace: "pre-wrap" }, children: note.content })] }, note.id)))) })] })), _jsxs("div", { className: `p-4 ${activeTab === "attachments" ? "d-block" : "d-none"}`, "data-testid": "ticket-attachments-section", children: [_jsxs("div", { className: "d-flex justify-content-between align-items-center mb-3", children: [_jsxs("div", { className: "fw-semibold text-dark small", children: ["Ticket Attachments (", activeAttachments.length, " / 5 active)"] }), _jsx("span", { className: "text-muted small", children: "JPG, PNG, WEBP, PDF (Max 5MB)" })] }), _jsxs("form", { onSubmit: handleUpload, className: "mb-4 p-3 bg-light rounded-3 border", children: [_jsxs("div", { className: "row g-2 align-items-center", children: [_jsx("div", { className: "col", children: _jsx("input", { type: "file", className: "form-control form-control-sm rounded-2", id: "attachmentFileInput", accept: ".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf", onChange: handleFileChange, disabled: uploading || activeAttachments.length >= 5, "data-testid": "upload-attachment-input" }) }), _jsx("div", { className: "col-auto", children: _jsx("button", { type: "submit", className: "btn btn-zen-green btn-sm rounded-2 px-3 fw-medium", disabled: !selectedFile || uploading || activeAttachments.length >= 5 || Boolean(uploadError), "data-testid": "upload-attachment-btn", children: uploading ? "Uploading..." : "Upload File" }) })] }), uploadError && _jsx("div", { className: "text-danger small mt-1", "data-testid": "upload-error", children: uploadError })] }), downloadError && _jsx("div", { className: "alert alert-danger py-2 small mb-3", "data-testid": "download-error", children: downloadError }), _jsx("div", { className: "row g-3", children: ticket.attachments && ticket.attachments.length > 0 ? (ticket.attachments.map((att) => {
                                            const isRemoved = Boolean(att.isRemoved);
                                            return (_jsx("div", { className: "col-12 col-md-6", "data-testid": `attachment-${att.id}`, children: _jsxs("div", { className: `p-3 rounded-3 border ${isRemoved ? "bg-light opacity-75" : "bg-white shadow-sm"}`, children: [_jsxs("div", { className: "d-flex justify-content-between align-items-center mb-2", children: [_jsx("span", { className: "fw-medium text-truncate small", children: att.originalFileName }), isRemoved ? (_jsx("span", { className: "badge bg-secondary", "data-testid": `removed-badge-${att.id}`, children: "Soft Removed" })) : (_jsx("span", { className: "pill-badge pill-active-true", children: "Active" }))] }), _jsx("div", { className: "text-muted small mb-2", children: formatFileSize(att.fileSize) }), isRemoved ? (_jsxs("div", { className: "small text-muted mt-2", "data-testid": `removed-metadata-${att.id}`, children: [_jsxs("div", { children: [_jsx("strong", { children: "Reason:" }), " ", _jsx("span", { "data-testid": `removal-reason-${att.id}`, children: att.removalReason || "No reason provided" })] }), _jsx("div", { className: "mt-2", children: _jsx("button", { type: "button", className: "btn btn-sm btn-outline-secondary w-100", disabled: true, "data-testid": `download-attachment-${att.id}`, children: "Download Blocked" }) })] })) : (_jsxs("div", { className: "d-flex gap-2", children: [_jsx("button", { type: "button", className: "btn btn-sm btn-outline-zen-green rounded-2 py-1 px-3", onClick: () => handleDownload(att), "data-testid": `download-attachment-${att.id}`, children: "Download" }), _jsx("button", { type: "button", className: "btn btn-sm btn-outline-danger rounded-2 py-1 px-3", onClick: () => {
                                                                        setRemovingAttachment(att);
                                                                        setRemovalReason("");
                                                                        setRemovalError(null);
                                                                    }, "data-testid": `remove-attachment-${att.id}`, children: "Remove" })] }))] }) }, att.id));
                                        })) : (_jsx("p", { className: "text-muted small mb-0", children: "No attachments uploaded yet." })) })] }), _jsx("div", { className: `p-4 ${activeTab === "services" ? "d-block" : "d-none"}`, children: _jsx("div", { className: "text-muted small", children: "1 service action logged for this ticket." }) }), !isStaffOrAdmin && (_jsx("div", { className: `p-4 ${activeTab === "events" ? "d-block" : "d-none"}`, children: _jsx("div", { className: "text-muted small", children: "Audit event timeline recorded." }) }))] }), removingAttachment && (_jsx("div", { className: "position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50 d-flex align-items-center justify-content-center z-3 p-3", "data-testid": "removal-modal", children: _jsxs("div", { className: "card shadow rounded-3 p-4 bg-white", style: { maxWidth: 450, width: "100%" }, children: [_jsx("h5", { className: "fw-bold mb-3", children: "Remove Attachment" }), _jsxs("p", { className: "small text-muted", children: ["Please provide a reason for soft-removing ", _jsx("strong", { children: removingAttachment.originalFileName }), ":"] }), removalError && (_jsx("div", { className: "text-danger small mb-2", "data-testid": "removal-error", children: removalError })), _jsx("textarea", { className: "form-control rounded-2 mb-3", rows: 2, placeholder: "Reason for removal (required)", value: removalReason, onChange: (e) => setRemovalReason(e.target.value), "data-testid": "removal-reason-input" }), _jsxs("div", { className: "d-flex justify-content-end gap-2", children: [_jsx("button", { type: "button", className: "btn btn-sm btn-outline-secondary rounded-2", onClick: () => setRemovingAttachment(null), children: "Cancel" }), _jsx("button", { type: "button", className: "btn btn-sm btn-danger rounded-2", onClick: handleRemove, "data-testid": "confirm-remove-btn", children: removing ? "Removing..." : "Confirm Removal" })] })] }) }))] })) : null] }));
}
