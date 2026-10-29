import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from "react";
import { fetchRequesterDashboard } from "../api.js";
const cardStyle = { background: "var(--zg-surface-card)", border: "1px solid var(--zg-border-color)", borderRadius: 12 };
const dateLabel = (value) => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
function statusClass(status) {
    const normalized = status.toLowerCase().trim();
    if (normalized === "in progress" || normalized === "in_progress")
        return "pill-status-in-progress";
    if (normalized === "resolved")
        return "pill-status-resolved";
    if (normalized === "waiting for requester" || normalized === "pending")
        return "pill-status-pending";
    if (normalized === "closed" || normalized === "cancelled")
        return normalized === "cancelled" ? "pill-status-cancelled" : "pill-status-closed";
    return "pill-status-open";
}
export default function RequesterDashboard({ userId, userName, onCreateTicket, onViewTickets, onSelectTicket }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            setData(await fetchRequesterDashboard(userId));
        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Unable to load your dashboard.");
        }
        finally {
            setLoading(false);
        }
    }, [userId]);
    useEffect(() => { void load(); }, [load]);
    const metrics = [
        { label: "My Open Tickets", value: data?.metrics.openCount, status: "open-tickets", color: "#0284c7" },
        { label: "In Progress", value: data?.metrics.inProgressCount, status: "In Progress", color: "#15803d" },
        { label: "Resolved", value: data?.metrics.resolvedCount, status: "Resolved", color: "#15803d" },
        { label: "Closed", value: data?.metrics.closedCount, status: "Closed", color: "#475569" },
    ];
    const recentTickets = data ? [...new Map([...data.recentlyUpdated, ...data.recentlyResolved].map((ticket) => [ticket.id, ticket])).values()]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5) : [];
    return _jsxs("section", { className: "container py-4", style: { maxWidth: 1120 }, "data-testid": "requester-dashboard", children: [_jsx("header", { className: "d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4", children: _jsxs("div", { children: [_jsxs("h1", { className: "h3 fw-bold mb-1", children: ["Welcome, ", userName, "!"] }), _jsx("p", { className: "text-muted mb-0", children: "Here's the latest on your requests." })] }) }), error && _jsxs("div", { className: "alert alert-danger d-flex justify-content-between align-items-center", role: "alert", "data-testid": "dashboard-error", children: [_jsx("span", { children: error }), _jsx("button", { className: "btn btn-sm btn-outline-danger", onClick: () => void load(), children: "Retry" })] }), loading ? _jsxs("div", { className: "py-5 text-center", role: "status", "data-testid": "dashboard-loading", children: [_jsx("span", { className: "spinner-border text-zen-green" }), _jsx("span", { className: "visually-hidden", children: "Loading dashboard\u2026" })] }) : data && _jsxs(_Fragment, { children: [_jsx("div", { className: "row g-3 mb-4", "data-testid": "dashboard-metrics", children: metrics.map((metric) => _jsx("div", { className: "col-12 col-sm-6 col-lg-3", children: _jsxs("button", { type: "button", className: "w-100 text-start p-3 h-100", style: { ...cardStyle, borderTop: `4px solid ${metric.color}` }, onClick: () => onViewTickets(metric.status), "aria-label": `View ${metric.value} ${metric.label}`, "data-testid": `metric-${metric.label.toLowerCase().replaceAll(" ", "-")}`, children: [_jsx("span", { className: "d-block text-muted small", children: metric.label }), _jsx("strong", { className: "fs-2", style: { color: metric.color }, children: metric.value }), _jsx("span", { className: "d-block small text-zen-green", children: "View tickets \u2192" })] }) }, metric.label)) }), _jsxs("div", { className: "row g-3", children: [_jsx("div", { className: "col-12 col-lg-7", children: _jsxs("div", { className: "p-3 h-100", style: cardStyle, children: [_jsxs("div", { className: "d-flex justify-content-between align-items-center mb-2", children: [_jsx("h2", { className: "h5 mb-0", children: "My Recent Tickets" }), _jsx("button", { className: "btn btn-link", onClick: () => onViewTickets(), children: "View all" })] }), recentTickets.length === 0 ? _jsx("p", { className: "text-muted mb-0", "data-testid": "dashboard-empty", children: "No tickets to show yet." }) : _jsx("div", { className: "list-group list-group-flush", children: recentTickets.map((ticket) => _jsxs("button", { className: "list-group-item list-group-item-action px-1", onClick: () => onSelectTicket(ticket.id), "data-testid": `recent-ticket-${ticket.id}`, children: [_jsxs("div", { className: "d-flex justify-content-between gap-2", children: [_jsx("strong", { className: "text-zen-green font-monospace", children: ticket.ticketNumber }), _jsx("span", { className: `pill-badge ${statusClass(ticket.currentStatus)}`, children: ticket.currentStatus })] }), _jsx("div", { className: "text-truncate", children: ticket.summary }), _jsx("small", { className: "text-muted", children: dateLabel(ticket.updatedAt) })] }, ticket.id)) })] }) }), _jsx("div", { className: "col-12 col-lg-5", children: _jsxs("div", { className: "p-3 h-100", style: cardStyle, children: [_jsx("h2", { className: "h5 mb-3", children: "Quick Actions" }), _jsxs("button", { type: "button", className: "btn btn-outline-success w-100 d-flex align-items-center gap-3 text-start p-3 mb-3", onClick: onCreateTicket, "data-testid": "dashboard-create-ticket", children: [_jsx("span", { className: "fs-3", "aria-hidden": "true", children: "\uFF0B" }), _jsxs("span", { children: [_jsx("strong", { className: "d-block", children: "Create Ticket" }), _jsx("small", { className: "text-muted", children: "Submit a new request" })] })] }), _jsxs("button", { type: "button", className: "btn btn-outline-success w-100 d-flex align-items-center gap-3 text-start p-3", onClick: () => onViewTickets(), "data-testid": "dashboard-view-tickets", children: [_jsx("span", { className: "fs-4", "aria-hidden": "true", children: "\u25A3" }), _jsxs("span", { children: [_jsx("strong", { className: "d-block", children: "View My Tickets" }), _jsx("small", { className: "text-muted", children: "Track existing requests" })] })] })] }) })] })] })] });
}
