import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useState, useCallback } from "react";
import { fetchTicketById } from "../api.js";
export default function TicketDetail({ ticketId, userId, onBack }) {
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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
                                                                }) })] })] })] }), _jsxs("div", { className: "d-flex align-items-center gap-2 flex-wrap", children: [renderPriorityBadge(ticket.requestedPriority), renderStatusPill(ticket.currentStatus)] })] }), _jsxs("div", { className: "row g-3 pt-3", children: [_jsx("div", { className: "col-12 col-md-4", children: _jsxs("div", { className: "p-3 bg-light rounded-3", children: [_jsx("span", { className: "text-muted small d-block mb-1", children: "Category" }), _jsx("strong", { className: "text-dark", "data-testid": "ticket-category", children: ticket.category?.name || "N/A" })] }) }), _jsx("div", { className: "col-12 col-md-4", children: _jsxs("div", { className: "p-3 bg-light rounded-3", children: [_jsx("span", { className: "text-muted small d-block mb-1", children: "Related System" }), _jsx("strong", { className: "text-dark", "data-testid": "ticket-system", children: ticket.relatedSystem?.name || "N/A" })] }) }), _jsx("div", { className: "col-12 col-md-4", children: _jsxs("div", { className: "p-3 bg-light rounded-3", children: [_jsx("span", { className: "text-muted small d-block mb-1", children: "Requester" }), _jsx("strong", { className: "text-dark", children: ticket.requester?.name || "Self" })] }) })] })] }), _jsxs("div", { className: "card border-0 shadow-sm rounded-3 p-4 bg-white", children: [_jsx("h2", { className: "h5 fw-bold text-dark mb-3", children: "Description" }), _jsx("div", { className: "p-3 bg-light rounded-3 text-dark fs-6", style: { whiteSpace: "pre-wrap" }, "data-testid": "ticket-description", children: ticket.description })] }), ticket.attachments && ticket.attachments.length > 0 && (_jsxs("div", { className: "card border-0 shadow-sm rounded-3 p-4 bg-white", "data-testid": "ticket-attachments-section", children: [_jsxs("h2", { className: "h5 fw-bold text-dark mb-3", children: ["Attachments (", ticket.attachments.length, ")"] }), _jsx("div", { className: "row g-3", children: ticket.attachments.map((att) => (_jsx("div", { className: "col-12 col-md-6", "data-testid": `attachment-${att.id}`, children: _jsx("div", { className: "d-flex align-items-center justify-content-between p-3 border rounded-3 bg-light", children: _jsxs("div", { className: "d-flex align-items-center gap-2 text-truncate me-2", children: [_jsx("span", { className: "fs-4", children: "\uD83D\uDCCE" }), _jsxs("div", { className: "text-truncate", children: [_jsx("span", { className: "d-block fw-medium text-dark text-truncate", children: att.originalFileName }), _jsx("span", { className: "text-muted small", children: formatFileSize(att.fileSize) })] })] }) }) }, att.id))) })] }))] })) : null] }));
}
