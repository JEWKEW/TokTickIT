import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState, useCallback } from "react";
import { fetchTicketById, uploadAttachment, downloadAttachment, removeAttachment, } from "../api.js";
export default function TicketDetail({ ticketId, userId, onBack }) {
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
    useEffect(() => {
        loadTicketDetail();
    }, [loadTicketDetail]);
    const activeAttachments = (ticket?.attachments || []).filter((a) => !a.isRemoved);
    const validateFile = (file) => {
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
    const handleFileChange = (e) => {
        setUploadError(null);
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const err = validateFile(file);
            if (err) {
                setUploadError(err);
            }
            setSelectedFile(file);
        }
        else {
            setSelectedFile(null);
        }
    };
    const handleUpload = async (e) => {
        e.preventDefault();
        if (!selectedFile || !ticket)
            return;
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
        if (att.isRemoved) {
            setDownloadError("Attachment has been removed and cannot be downloaded");
            return;
        }
        setDownloadError(null);
        try {
            await downloadAttachment(att.id, userId, att.originalFileName);
        }
        catch (err) {
            setDownloadError(err.message || "Failed to download attachment");
        }
    };
    const handleConfirmRemoval = async () => {
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
    const renderPriorityBadge = (p) => {
        const pLower = (p || "").toLowerCase();
        let badgeClass = "bg-secondary";
        if (pLower === "low")
            badgeClass = "bg-success bg-opacity-10 text-success border border-success border-opacity-25";
        else if (pLower === "medium")
            badgeClass = "bg-info bg-opacity-10 text-info border border-info border-opacity-25";
        else if (pLower === "high")
            badgeClass = "bg-warning bg-opacity-10 text-warning-emphasis border border-warning border-opacity-25";
        else if (pLower === "urgent")
            badgeClass = "bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25";
        return (_jsxs("span", { className: `badge px-3 py-2 ${badgeClass} text-capitalize fs-6`, "data-testid": "ticket-priority", children: [p, " Priority"] }));
    };
    const renderStatusPill = (st) => {
        const sLower = (st || "").toLowerCase();
        let pillClass = "bg-secondary";
        if (sLower === "new" || sLower === "open")
            pillClass = "bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25";
        else if (sLower === "in_progress" || sLower === "in progress")
            pillClass = "bg-warning bg-opacity-10 text-warning-emphasis border border-warning border-opacity-25";
        else if (sLower === "resolved")
            pillClass = "bg-success bg-opacity-10 text-success border border-success border-opacity-25";
        else if (sLower === "closed")
            pillClass = "bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25";
        return (_jsx("span", { className: `badge rounded-pill px-3 py-2 ${pillClass} text-capitalize fs-6`, "data-testid": "ticket-status", children: st }));
    };
    const formatFileSize = (bytes) => {
        if (bytes < 1024)
            return `${bytes} B`;
        if (bytes < 1024 * 1024)
            return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };
    return (_jsxs("div", { className: "container py-4", "data-testid": "ticket-detail-view", children: [_jsx("div", { className: "mb-4", children: _jsx("button", { type: "button", className: "btn btn-link text-zen-green p-0 text-decoration-none fw-semibold d-inline-flex align-items-center gap-1", onClick: onBack, "data-testid": "back-to-tickets-link", children: "\u2190 Back to My Tickets" }) }), loading ? (_jsxs("div", { className: "card border-0 shadow-sm rounded-3 p-5 text-center bg-white", "data-testid": "loading-state", children: [_jsx("div", { className: "spinner-border text-zen-green mx-auto mb-3", role: "status", children: _jsx("span", { className: "visually-hidden", children: "Loading ticket details..." }) }), _jsx("h5", { className: "text-muted mb-0", children: "Loading ticket details..." })] })) : error ? (_jsxs("div", { className: "card border-0 shadow-sm rounded-3 p-4 bg-white", "data-testid": "error-state", children: [_jsxs("div", { className: "alert alert-danger mb-3", role: "alert", children: [_jsx("h5", { className: "alert-heading mb-1", children: "Access Error" }), _jsx("p", { className: "mb-0", children: error })] }), _jsxs("div", { className: "d-flex justify-content-between align-items-center", children: [_jsx("button", { type: "button", className: "btn btn-outline-secondary", onClick: onBack, children: "Back to My Tickets" }), _jsx("button", { type: "button", className: "btn btn-zen-green", onClick: loadTicketDetail, "data-testid": "retry-btn", children: "Try Again" })] })] })) : ticket ? (_jsxs("div", { className: "d-flex flex-column gap-4", children: [_jsxs("div", { className: "card border-0 shadow-sm rounded-3 p-4 bg-white card-zen-green", children: [_jsxs("div", { className: "d-flex flex-column flex-md-row justify-content-between align-items-md-start gap-3 pb-3 border-bottom", children: [_jsxs("div", { children: [_jsxs("div", { className: "d-flex align-items-center gap-2 mb-2", children: [_jsx("span", { className: "font-monospace fw-bold fs-4 text-zen-green", "data-testid": "ticket-code", children: ticket.ticketNumber }), _jsx("span", { className: "badge bg-light text-muted border", children: "Read-Only" })] }), _jsx("h1", { className: "h3 fw-bold text-dark mb-2", "data-testid": "ticket-summary", children: ticket.summary }), _jsxs("div", { className: "text-muted small d-flex flex-wrap align-items-center gap-3", children: [_jsxs("span", { children: ["Created:", " ", _jsx("strong", { className: "text-dark", "data-testid": "ticket-created-at", children: new Date(ticket.createdAt).toLocaleString(undefined, {
                                                                    dateStyle: "medium",
                                                                    timeStyle: "short",
                                                                }) })] }), _jsx("span", { children: "\u2022" }), _jsxs("span", { children: ["Last Updated:", " ", _jsx("strong", { className: "text-dark", "data-testid": "ticket-updated-at", children: new Date(ticket.updatedAt).toLocaleString(undefined, {
                                                                    dateStyle: "medium",
                                                                    timeStyle: "short",
                                                                }) })] })] })] }), _jsxs("div", { className: "d-flex align-items-center gap-2 flex-wrap", children: [renderPriorityBadge(ticket.requestedPriority), renderStatusPill(ticket.currentStatus)] })] }), _jsxs("div", { className: "row g-3 pt-3", children: [_jsx("div", { className: "col-12 col-md-4", children: _jsxs("div", { className: "p-3 bg-light rounded-3", children: [_jsx("span", { className: "text-muted small d-block mb-1", children: "Category" }), _jsx("strong", { className: "text-dark", "data-testid": "ticket-category", children: ticket.category?.name || "N/A" })] }) }), _jsx("div", { className: "col-12 col-md-4", children: _jsxs("div", { className: "p-3 bg-light rounded-3", children: [_jsx("span", { className: "text-muted small d-block mb-1", children: "Related System" }), _jsx("strong", { className: "text-dark", "data-testid": "ticket-system", children: ticket.relatedSystem?.name || "N/A" })] }) }), _jsx("div", { className: "col-12 col-md-4", children: _jsxs("div", { className: "p-3 bg-light rounded-3", children: [_jsx("span", { className: "text-muted small d-block mb-1", children: "Requester" }), _jsx("strong", { className: "text-dark", children: ticket.requester?.name || "Self" })] }) })] })] }), _jsxs("div", { className: "card border-0 shadow-sm rounded-3 p-4 bg-white", children: [_jsx("h2", { className: "h5 fw-bold text-dark mb-3", children: "Description" }), _jsx("div", { className: "p-3 bg-light rounded-3 text-dark fs-6", style: { whiteSpace: "pre-wrap" }, "data-testid": "ticket-description", children: ticket.description })] }), _jsxs("div", { className: "card border-0 shadow-sm rounded-3 p-4 bg-white", "data-testid": "ticket-attachments-section", children: [_jsxs("div", { className: "d-flex flex-column flex-sm-row justify-content-between align-items-sm-center mb-3 gap-2", children: [_jsxs("h2", { className: "h5 fw-bold text-dark mb-0", children: ["Attachments (", activeAttachments.length, " / 5 max active)"] }), _jsx("span", { className: "text-muted small", children: "Allowed: JPG, PNG, WEBP, PDF (Max 5MB)" })] }), _jsxs("form", { onSubmit: handleUpload, className: "mb-4 p-3 bg-light rounded-3", children: [_jsxs("div", { className: "row g-2 align-items-center", children: [_jsx("div", { className: "col", children: _jsx("input", { type: "file", className: "form-control", id: "attachmentFileInput", accept: ".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf", onChange: handleFileChange, disabled: uploading || activeAttachments.length >= 5, "data-testid": "upload-attachment-input" }) }), _jsx("div", { className: "col-auto", children: _jsx("button", { type: "submit", className: "btn btn-zen-green", disabled: !selectedFile || uploading || activeAttachments.length >= 5 || Boolean(uploadError), "data-testid": "upload-attachment-btn", children: uploading ? "Uploading..." : "Upload Attachment" }) })] }), uploadError && (_jsx("div", { className: "text-danger small mt-2 fw-medium", "data-testid": "upload-error", children: uploadError }))] }), downloadError && (_jsx("div", { className: "alert alert-danger mb-3 py-2", "data-testid": "download-error", children: downloadError })), ticket.attachments && ticket.attachments.length > 0 ? (_jsx("div", { className: "row g-3", children: ticket.attachments.map((att) => {
                                    const isRemoved = Boolean(att.isRemoved);
                                    return (_jsx("div", { className: "col-12 col-md-6", "data-testid": `attachment-${att.id}`, children: _jsxs("div", { className: `d-flex flex-column justify-content-between p-3 border rounded-3 ${isRemoved ? "bg-light opacity-75 border-dashed" : "bg-light"}`, children: [_jsxs("div", { className: "d-flex align-items-center justify-content-between gap-2 mb-2", children: [_jsxs("div", { className: "d-flex align-items-center gap-2 text-truncate me-2", children: [_jsx("span", { className: "fs-4", children: isRemoved ? "🚫" : "📎" }), _jsxs("div", { className: "text-truncate", children: [_jsx("span", { className: `d-block fw-medium text-truncate ${isRemoved ? "text-muted text-decoration-line-through" : "text-dark"}`, children: att.originalFileName }), _jsx("span", { className: "text-muted small", children: formatFileSize(att.fileSize) })] })] }), isRemoved ? (_jsx("span", { className: "badge bg-secondary", "data-testid": `removed-badge-${att.id}`, children: "Soft Removed" })) : (_jsx("span", { className: "badge bg-success bg-opacity-10 text-success border border-success border-opacity-25", children: "Active" }))] }), isRemoved ? (_jsxs("div", { className: "mt-2 pt-2 border-top text-muted small", "data-testid": `removed-metadata-${att.id}`, children: [_jsxs("div", { children: [_jsx("strong", { children: "Reason:" }), " ", _jsx("span", { "data-testid": `removal-reason-${att.id}`, children: att.removalReason || "No reason provided" })] }), att.removedAt && (_jsxs("div", { children: [_jsx("strong", { children: "Removed on:" }), " ", new Date(att.removedAt).toLocaleString()] })), _jsx("div", { className: "mt-2", children: _jsx("button", { type: "button", className: "btn btn-sm btn-outline-secondary w-100", disabled: true, "data-testid": `download-attachment-${att.id}`, children: "Download Blocked" }) })] })) : (
                                                /* Active Actions */
                                                _jsxs("div", { className: "d-flex align-items-center gap-2 mt-2 pt-2 border-top", children: [_jsx("button", { type: "button", className: "btn btn-sm btn-outline-primary flex-grow-1", onClick: () => handleDownload(att), "data-testid": `download-attachment-${att.id}`, children: "Download" }), _jsx("button", { type: "button", className: "btn btn-sm btn-outline-danger", onClick: () => {
                                                                setRemovingAttachment(att);
                                                                setRemovalReason("");
                                                                setRemovalError(null);
                                                            }, "data-testid": `remove-attachment-${att.id}`, children: "Remove" })] }))] }) }, att.id));
                                }) })) : (_jsx("p", { className: "text-muted mb-0", children: "No attachments uploaded yet." }))] })] })) : null, removingAttachment && (_jsx("div", { className: "modal d-block bg-dark bg-opacity-50", tabIndex: -1, "data-testid": "removal-modal", children: _jsx("div", { className: "modal-dialog modal-dialog-centered", children: _jsxs("div", { className: "modal-content shadow-lg border-0 rounded-3", children: [_jsxs("div", { className: "modal-header border-bottom-0 pb-0", children: [_jsx("h5", { className: "modal-title fw-bold text-dark", children: "Remove Attachment" }), _jsx("button", { type: "button", className: "btn-close", onClick: () => setRemovingAttachment(null), "data-testid": "close-removal-modal-btn" })] }), _jsxs("div", { className: "modal-body py-3", children: [_jsxs("p", { className: "text-secondary mb-3", children: ["Are you sure you want to soft-remove ", _jsx("strong", { children: removingAttachment.originalFileName }), "?"] }), _jsxs("div", { className: "mb-3", children: [_jsxs("label", { htmlFor: "removalReasonInput", className: "form-label fw-medium text-dark", children: ["Reason for removal ", _jsx("span", { className: "text-danger", children: "*" })] }), _jsx("textarea", { id: "removalReasonInput", className: "form-control", rows: 3, value: removalReason, onChange: (e) => setRemovalReason(e.target.value), placeholder: "Enter the reason for soft removing this attachment...", "data-testid": "removal-reason-input" })] }), removalError && (_jsx("div", { className: "alert alert-danger mb-0 py-2 small", "data-testid": "removal-error", children: removalError }))] }), _jsxs("div", { className: "modal-footer border-top-0 pt-0", children: [_jsx("button", { type: "button", className: "btn btn-outline-secondary", onClick: () => setRemovingAttachment(null), children: "Cancel" }), _jsx("button", { type: "button", className: "btn btn-danger", onClick: handleConfirmRemoval, disabled: removing, "data-testid": "confirm-remove-btn", children: removing ? "Removing..." : "Confirm Removal" })] })] }) }) }))] }));
}
