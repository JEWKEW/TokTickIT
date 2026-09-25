import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from "react";
import { fetchTicketQueue, fetchCategories, } from "../api.js";
export default function StaffTicketQueue({ userId, tokenOrUserId, userRole, onSelectTicket, }) {
    const effectiveUserId = userId || tokenOrUserId || 1;
    const [tickets, setTickets] = useState([]);
    const [meta, setMeta] = useState({
        currentPage: 1,
        limit: 10,
        totalItems: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
    });
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // Filters state
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [ownerFilter, setOwnerFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState("desc");
    const [page, setPage] = useState(1);
    const [showFilters, setShowFilters] = useState(false);
    useEffect(() => {
        fetchCategories()
            .then(setCategories)
            .catch((err) => console.error("Failed to load categories:", err));
    }, []);
    const loadQueue = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchTicketQueue({
                q: search,
                status: statusFilter,
                itPriority: priorityFilter,
                categoryId: categoryFilter,
                ownerId: ownerFilter,
                sortBy,
                sortOrder,
                page,
                limit: 10,
            }, effectiveUserId);
            const fetchedItems = data?.items || [];
            const fetchedMeta = data?.meta || {
                currentPage: page,
                limit: 10,
                pageSize: 10,
                totalItems: fetchedItems.length,
                totalPages: Math.ceil(fetchedItems.length / 10) || 1,
                hasNextPage: false,
                hasPrevPage: false,
            };
            setTickets(fetchedItems);
            setMeta({
                ...fetchedMeta,
                totalItems: typeof fetchedMeta.totalItems === "number" ? fetchedMeta.totalItems : fetchedItems.length,
            });
        }
        catch (err) {
            setError(err.message || "Failed to load IT Staff Ticket Queue");
        }
        finally {
            setLoading(false);
        }
    }, [
        search,
        statusFilter,
        priorityFilter,
        ownerFilter,
        categoryFilter,
        sortBy,
        sortOrder,
        page,
        userId,
    ]);
    useEffect(() => {
        loadQueue();
    }, [loadQueue]);
    function handleClearFilters() {
        setSearch("");
        setStatusFilter("all");
        setPriorityFilter("all");
        setOwnerFilter("all");
        setCategoryFilter("all");
        setSortBy("createdAt");
        setSortOrder("desc");
        setPage(1);
    }
    function handleSort(column) {
        if (sortBy === column) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        }
        else {
            setSortBy(column);
            setSortOrder("desc");
        }
        setPage(1);
    }
    function formatDate(isoString) {
        try {
            const d = new Date(isoString);
            return d.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        }
        catch {
            return isoString;
        }
    }
    function renderStatusBadge(status) {
        const s = (status || "").toLowerCase().trim();
        let pillClass = "pill-badge pill-status-open";
        if (s === "in progress" || s === "in_progress") {
            pillClass = "pill-badge pill-status-in-progress";
        }
        else if (s === "resolved") {
            pillClass = "pill-badge pill-status-resolved";
        }
        else if (s === "pending" || s === "waiting for requester") {
            pillClass = "pill-badge pill-status-pending";
        }
        else if (s === "closed") {
            pillClass = "pill-badge pill-status-closed";
        }
        else if (s === "open" || s === "new") {
            pillClass = "pill-badge pill-status-open";
        }
        return _jsx("span", { className: pillClass, children: status });
    }
    function renderPriorityBadge(priority) {
        if (!priority)
            return _jsx("span", { className: "text-muted small", children: "-" });
        const p = priority.toLowerCase().trim();
        let pillClass = "pill-badge pill-priority-low";
        if (p === "high" || p === "urgent") {
            pillClass = "pill-badge pill-priority-high";
        }
        else if (p === "medium") {
            pillClass = "pill-badge pill-priority-medium";
        }
        else {
            pillClass = "pill-badge pill-priority-low";
        }
        return _jsx("span", { className: pillClass, children: priority });
    }
    const startItem = meta.totalItems === 0 ? 0 : (meta.currentPage - 1) * meta.limit + 1;
    const endItem = Math.min(meta.currentPage * meta.limit, meta.totalItems);
    return (_jsxs("div", { className: "container py-3 px-3 px-md-4", style: { maxWidth: 1140 }, "data-testid": "ticket-queue-container", children: [_jsxs("div", { className: "d-flex flex-column gap-2 mb-3", children: [_jsxs("div", { className: "d-flex gap-2 align-items-center", children: [_jsxs("div", { className: "position-relative flex-grow-1", children: [_jsx("span", { className: "position-absolute text-muted", style: { top: "50%", transform: "translateY(-50%)", left: "11px", fontSize: "0.85rem" }, children: "\uD83D\uDD0D" }), _jsx("input", { id: "queue-search", type: "text", className: "form-control form-control-sm bg-white", style: {
                                            paddingLeft: "32px",
                                            borderColor: "#e2e8f0",
                                        }, placeholder: "Search by ticket number or summary...", value: search, onChange: (e) => {
                                            setSearch(e.target.value);
                                            setPage(1);
                                        }, "data-testid": "queue-search-input" })] }), _jsxs("button", { type: "button", className: `btn btn-sm d-flex align-items-center gap-1.5 rounded-2 px-2.5 ${showFilters ? "btn-zen-green" : "btn-outline-secondary bg-white"}`, style: { borderColor: "#e2e8f0" }, onClick: () => setShowFilters(!showFilters), children: [_jsx("span", { children: "\u2635" }), _jsx("span", { className: "fw-medium", children: "Filters" })] })] }), _jsx("div", { className: `card border shadow-sm p-3 rounded-3 bg-white ${showFilters ? "d-block" : "d-none d-md-block"}`, children: _jsxs("div", { className: "row g-2 align-items-center", children: [_jsxs("div", { className: "col-6 col-md-3", children: [_jsx("label", { htmlFor: "status-filter", className: "form-label small fw-semibold text-muted mb-1", children: "Status" }), _jsxs("select", { id: "status-filter", className: "form-select form-select-sm rounded-2", value: statusFilter, onChange: (e) => {
                                                setStatusFilter(e.target.value);
                                                setPage(1);
                                            }, "data-testid": "status-filter-select", children: [_jsx("option", { value: "all", children: "All Statuses" }), _jsx("option", { value: "New", children: "New" }), _jsx("option", { value: "Open", children: "Open" }), _jsx("option", { value: "In Progress", children: "In Progress" }), _jsx("option", { value: "Waiting for Requester", children: "Waiting for Requester" }), _jsx("option", { value: "Resolved", children: "Resolved" }), _jsx("option", { value: "Closed", children: "Closed" }), _jsx("option", { value: "Reopened", children: "Reopened" }), _jsx("option", { value: "Cancelled", children: "Cancelled" })] })] }), _jsxs("div", { className: "col-6 col-md-3", children: [_jsx("label", { htmlFor: "priority-filter", className: "form-label small fw-semibold text-muted mb-1", children: "Priority" }), _jsxs("select", { id: "priority-filter", className: "form-select form-select-sm rounded-2", value: priorityFilter, onChange: (e) => {
                                                setPriorityFilter(e.target.value);
                                                setPage(1);
                                            }, "data-testid": "priority-filter-select", children: [_jsx("option", { value: "all", children: "All Priorities" }), _jsx("option", { value: "Low", children: "Low" }), _jsx("option", { value: "Medium", children: "Medium" }), _jsx("option", { value: "High", children: "High" }), _jsx("option", { value: "Urgent", children: "Urgent" })] })] }), _jsxs("div", { className: "col-6 col-md-3", children: [_jsx("label", { htmlFor: "category-filter", className: "form-label small fw-semibold text-muted mb-1", children: "Category" }), _jsxs("select", { id: "category-filter", className: "form-select form-select-sm rounded-2", value: categoryFilter, onChange: (e) => {
                                                setCategoryFilter(e.target.value);
                                                setPage(1);
                                            }, "data-testid": "category-filter-select", children: [_jsx("option", { value: "all", children: "All Categories" }), categories.map((cat) => (_jsx("option", { value: cat.id, children: cat.name }, cat.id)))] })] }), _jsx("div", { className: "col-6 col-md-3 d-flex align-items-end", children: _jsx("button", { type: "button", className: "btn btn-outline-secondary btn-sm w-100 rounded-2 py-1.5", onClick: handleClearFilters, children: "Reset Filters" }) })] }) }), _jsx("div", { className: "d-flex justify-content-between align-items-center", children: _jsxs("span", { className: "text-muted small fw-medium", "data-testid": "total-tickets-count", children: ["Showing: ", startItem, " to ", endItem, " of ", meta.totalItems, " tickets (Total: ", meta.totalItems, ")"] }) })] }), error && (_jsx("div", { className: "alert alert-danger py-2 px-3 mb-4 rounded-3 small", role: "alert", children: error })), _jsxs("div", { className: "card border shadow-sm rounded-3 bg-white overflow-hidden", style: { borderColor: "#e2e8f0" }, children: [_jsx("div", { className: "table-responsive", children: _jsxs("table", { className: "table table-hover align-middle mb-0", children: [_jsx("thead", { style: { backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }, children: _jsxs("tr", { className: "small text-muted fw-semibold", children: [_jsx("th", { scope: "col", className: "py-3 px-3 cursor-pointer user-select-none", onClick: () => handleSort("ticketNumber"), style: { width: "13%" }, children: _jsx("span", { className: "d-inline-flex align-items-center gap-1", children: "Ticket No. \u2195" }) }), _jsx("th", { scope: "col", className: "py-3 px-3 cursor-pointer user-select-none", onClick: () => handleSort("createdAt"), style: { width: "14%" }, children: _jsx("span", { className: "d-inline-flex align-items-center gap-1", children: "Created Date \u2195" }) }), _jsx("th", { scope: "col", className: "py-3 px-3", style: { width: "24%" }, children: "Summary" }), _jsx("th", { scope: "col", className: "py-3 px-3 cursor-pointer user-select-none", onClick: () => handleSort("category"), style: { width: "11%" }, children: _jsx("span", { className: "d-inline-flex align-items-center gap-1", children: "Category \u2195" }) }), _jsx("th", { scope: "col", className: "py-3 px-3 text-center", style: { width: "10%" }, children: "Req. Priority" }), _jsx("th", { scope: "col", className: "py-3 px-3 text-center", style: { width: "10%" }, children: "IT Priority" }), _jsx("th", { scope: "col", className: "py-3 px-3 text-center cursor-pointer user-select-none", onClick: () => handleSort("currentStatus"), style: { width: "10%" }, children: _jsx("span", { className: "d-inline-flex align-items-center gap-1 justify-content-center", children: "Status \u2195" }) }), _jsx("th", { scope: "col", className: "py-3 px-3", style: { width: "8%" }, children: "Owner \u2195" })] }) }), _jsx("tbody", { children: loading ? (_jsx("tr", { children: _jsxs("td", { colSpan: 8, className: "text-center py-5 text-muted", children: [_jsx("div", { className: "spinner-border spinner-border-sm text-zen-green me-2", role: "status" }), "Loading tickets..."] }) })) : tickets.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 8, className: "text-center py-5 text-muted", children: "No tickets found matching the search criteria." }) })) : (tickets.map((ticket) => (_jsxs("tr", { className: "cursor-pointer", onClick: () => onSelectTicket(ticket.id), style: { borderBottom: "1px solid #f1f5f9" }, children: [_jsx("td", { className: "px-3 py-3 font-monospace", children: _jsx("span", { className: "fw-bold text-zen-green text-decoration-none", style: { color: "#006039", cursor: "pointer" }, "data-testid": `ticket-code-${ticket.id}`, children: ticket.ticketNumber }) }), _jsx("td", { className: "px-3 py-3 text-muted small", children: formatDate(ticket.createdAt) }), _jsx("td", { className: "px-3 py-3 fw-medium text-dark text-truncate", style: { maxWidth: 260 }, children: ticket.summary }), _jsx("td", { className: "px-3 py-3 text-muted small", children: ticket.category?.name || "General" }), _jsx("td", { className: "px-3 py-3 text-center", children: renderPriorityBadge(ticket.requestedPriority) }), _jsx("td", { className: "px-3 py-3 text-center", children: renderPriorityBadge(ticket.itPriority) }), _jsx("td", { className: "px-3 py-3 text-center", children: renderStatusBadge(ticket.currentStatus) }), _jsx("td", { className: "px-3 py-3 text-muted small", children: _jsxs("div", { className: "d-flex justify-content-between align-items-center", children: [_jsx("span", { children: ticket.owner ? ticket.owner.name : "Unassigned" }), _jsx("button", { type: "button", className: "btn btn-sm btn-link text-zen-green p-0 text-decoration-none d-none", onClick: (e) => {
                                                                e.stopPropagation();
                                                                onSelectTicket(ticket.id);
                                                            }, "data-testid": `view-ticket-btn-${ticket.id}`, children: "View" })] }) })] }, ticket.id)))) })] }) }), tickets.length === 0 && !loading && (_jsx("div", { className: "p-4 text-center text-muted", "data-testid": "empty-queue-msg", children: "No tickets found" })), meta.totalPages > 1 && (_jsx("div", { className: "d-flex justify-content-center align-items-center py-4 bg-white border-top", children: _jsxs("div", { className: "pagination-box", children: [_jsx("button", { type: "button", className: "pagination-item", disabled: !meta.hasPrevPage, onClick: () => setPage((p) => Math.max(1, p - 1)), "data-testid": "pagination-prev", children: "< Previous" }), Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((pageNum) => (_jsx("button", { type: "button", className: `pagination-item ${pageNum === meta.currentPage ? "active" : ""}`, onClick: () => setPage(pageNum), children: pageNum }, pageNum))), _jsx("button", { type: "button", className: "pagination-item", disabled: !meta.hasNextPage, onClick: () => setPage((p) => Math.min(meta.totalPages, p + 1)), "data-testid": "pagination-next", children: "Next >" })] }) }))] })] }));
}
