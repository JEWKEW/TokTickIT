import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from "react";
import { fetchTicketQueue, fetchCategories, } from "../api.js";
export default function StaffTicketQueue({ userId, onSelectTicket, }) {
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
            }, userId);
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
    function renderStatusBadge(status) {
        let badgeClass = "badge bg-secondary";
        switch (status) {
            case "New":
                badgeClass = "badge bg-info text-dark";
                break;
            case "Open":
                badgeClass = "badge bg-primary";
                break;
            case "In Progress":
                badgeClass = "badge bg-warning text-dark";
                break;
            case "Waiting for Requester":
                badgeClass = "badge bg-secondary";
                break;
            case "Resolved":
                badgeClass = "badge bg-success";
                break;
            case "Closed":
                badgeClass = "badge bg-dark";
                break;
            case "Reopened":
                badgeClass = "badge bg-danger";
                break;
            case "Cancelled":
                badgeClass = "badge bg-light text-dark border";
                break;
        }
        return _jsx("span", { className: badgeClass, children: status });
    }
    function renderPriorityBadge(priority) {
        if (!priority)
            return _jsx("span", { className: "text-muted small", children: "N/A" });
        let badgeClass = "badge bg-secondary";
        switch (priority) {
            case "Urgent":
                badgeClass = "badge bg-danger";
                break;
            case "High":
                badgeClass = "badge bg-danger text-wrap";
                break;
            case "Medium":
                badgeClass = "badge bg-warning text-dark";
                break;
            case "Low":
                badgeClass = "badge bg-info text-dark";
                break;
        }
        return _jsx("span", { className: badgeClass, children: priority });
    }
    return (_jsxs("div", { className: "container-fluid py-4", "data-testid": "ticket-queue-container", children: [_jsxs("div", { className: "d-flex justify-content-between align-items-center mb-3", children: [_jsxs("div", { children: [_jsx("h1", { className: "h4 text-zen-green mb-1 fw-bold", children: "IT Staff Ticket Queue" }), _jsx("p", { className: "text-muted small mb-0", children: "Manage incoming tickets, claim ownership, update priorities, and handle workflows." })] }), _jsxs("span", { className: "badge bg-success fs-6", "data-testid": "total-tickets-count", children: ["Total: ", meta.totalItems] })] }), _jsx("div", { className: "card shadow-sm border-0 mb-4 bg-white rounded-3", children: _jsxs("div", { className: "card-body", children: [_jsxs("div", { className: "row g-3", children: [_jsxs("div", { className: "col-12 col-md-4", children: [_jsx("label", { htmlFor: "queue-search", className: "form-label small fw-bold text-muted", children: "Search" }), _jsx("input", { id: "queue-search", type: "text", className: "form-control form-control-sm", placeholder: "Search by ticket number or summary...", value: search, onChange: (e) => {
                                                setSearch(e.target.value);
                                                setPage(1);
                                            }, "data-testid": "queue-search-input" })] }), _jsxs("div", { className: "col-6 col-md-2", children: [_jsx("label", { htmlFor: "status-filter", className: "form-label small fw-bold text-muted", children: "Status" }), _jsxs("select", { id: "status-filter", className: "form-select form-select-sm", value: statusFilter, onChange: (e) => {
                                                setStatusFilter(e.target.value);
                                                setPage(1);
                                            }, "data-testid": "status-filter-select", children: [_jsx("option", { value: "all", children: "All Statuses" }), _jsx("option", { value: "New", children: "New" }), _jsx("option", { value: "Open", children: "Open" }), _jsx("option", { value: "In Progress", children: "In Progress" }), _jsx("option", { value: "Waiting for Requester", children: "Waiting for Requester" }), _jsx("option", { value: "Resolved", children: "Resolved" }), _jsx("option", { value: "Closed", children: "Closed" }), _jsx("option", { value: "Reopened", children: "Reopened" }), _jsx("option", { value: "Cancelled", children: "Cancelled" })] })] }), _jsxs("div", { className: "col-6 col-md-2", children: [_jsx("label", { htmlFor: "priority-filter", className: "form-label small fw-bold text-muted", children: "Priority" }), _jsxs("select", { id: "priority-filter", className: "form-select form-select-sm", value: priorityFilter, onChange: (e) => {
                                                setPriorityFilter(e.target.value);
                                                setPage(1);
                                            }, "data-testid": "priority-filter-select", children: [_jsx("option", { value: "all", children: "All Priorities" }), _jsx("option", { value: "Low", children: "Low" }), _jsx("option", { value: "Medium", children: "Medium" }), _jsx("option", { value: "High", children: "High" }), _jsx("option", { value: "Urgent", children: "Urgent" })] })] }), _jsxs("div", { className: "col-6 col-md-2", children: [_jsx("label", { htmlFor: "owner-filter", className: "form-label small fw-bold text-muted", children: "Owner" }), _jsxs("select", { id: "owner-filter", className: "form-select form-select-sm", value: ownerFilter, onChange: (e) => {
                                                setOwnerFilter(e.target.value);
                                                setPage(1);
                                            }, "data-testid": "owner-filter-select", children: [_jsx("option", { value: "all", children: "All Owners" }), _jsx("option", { value: "unassigned", children: "Unassigned" })] })] }), _jsxs("div", { className: "col-6 col-md-2", children: [_jsx("label", { htmlFor: "category-filter", className: "form-label small fw-bold text-muted", children: "Category" }), _jsxs("select", { id: "category-filter", className: "form-select form-select-sm", value: categoryFilter, onChange: (e) => {
                                                setCategoryFilter(e.target.value);
                                                setPage(1);
                                            }, "data-testid": "category-filter-select", children: [_jsx("option", { value: "all", children: "All Categories" }), categories.map((cat) => (_jsx("option", { value: cat.id, children: cat.name }, cat.id)))] })] })] }), _jsxs("div", { className: "d-flex justify-content-between align-items-center mt-3 pt-2 border-top", children: [_jsxs("span", { className: "text-muted small", children: ["Showing ", tickets.length > 0 ? (meta.currentPage - 1) * meta.limit + 1 : 0, " to", " ", Math.min(meta.currentPage * meta.limit, meta.totalItems), " of ", meta.totalItems, " tickets"] }), _jsx("button", { className: "btn btn-outline-secondary btn-sm", onClick: handleClearFilters, "data-testid": "clear-filters-btn", children: "Clear Filters" })] })] }) }), error && (_jsx("div", { className: "alert alert-danger py-2 mb-3", "data-testid": "queue-error", children: error })), loading ? (_jsxs("div", { className: "text-center py-5", "data-testid": "queue-loading", children: [_jsx("div", { className: "spinner-border text-success", role: "status", children: _jsx("span", { className: "visually-hidden", children: "Loading queue..." }) }), _jsx("p", { className: "text-muted mt-2 small", children: "Loading tickets..." })] })) : tickets.length === 0 ? (_jsx("div", { className: "card shadow-sm border-0 text-center py-5", "data-testid": "empty-queue-msg", children: _jsxs("div", { className: "card-body", children: [_jsx("h3", { className: "h6 text-muted mb-2", children: "No tickets found" }), _jsx("p", { className: "text-muted small mb-0", children: "Try adjusting your search criteria or clearing filters." })] }) })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "card shadow-sm border-0 d-none d-lg-block mb-3", children: _jsx("div", { className: "table-responsive", children: _jsxs("table", { className: "table table-hover align-middle mb-0", "data-testid": "ticket-table", children: [_jsx("thead", { className: "table-light", children: _jsxs("tr", { children: [_jsxs("th", { style: { cursor: "pointer" }, onClick: () => handleSort("ticketNumber"), "data-testid": "sort-ticketNumber", children: ["Ticket No. ", sortBy === "ticketNumber" ? (sortOrder === "asc" ? "▲" : "▼") : ""] }), _jsxs("th", { style: { cursor: "pointer" }, onClick: () => handleSort("createdAt"), "data-testid": "sort-createdAt", children: ["Created Date ", sortBy === "createdAt" ? (sortOrder === "asc" ? "▲" : "▼") : ""] }), _jsxs("th", { style: { cursor: "pointer" }, onClick: () => handleSort("summary"), "data-testid": "sort-summary", children: ["Summary ", sortBy === "summary" ? (sortOrder === "asc" ? "▲" : "▼") : ""] }), _jsx("th", { children: "Category" }), _jsx("th", { children: "Req. Priority" }), _jsxs("th", { style: { cursor: "pointer" }, onClick: () => handleSort("itPriority"), "data-testid": "sort-itPriority", children: ["IT Priority ", sortBy === "itPriority" ? (sortOrder === "asc" ? "▲" : "▼") : ""] }), _jsxs("th", { style: { cursor: "pointer" }, onClick: () => handleSort("status"), "data-testid": "sort-status", children: ["Status ", sortBy === "status" ? (sortOrder === "asc" ? "▲" : "▼") : ""] }), _jsx("th", { children: "Owner" }), _jsx("th", { className: "text-end", children: "Actions" })] }) }), _jsx("tbody", { children: tickets.map((ticket) => (_jsxs("tr", { "data-testid": `ticket-row-${ticket.id}`, children: [_jsx("td", { children: _jsx("strong", { className: "text-zen-green", "data-testid": `ticket-code-${ticket.id}`, children: ticket.ticketNumber }) }), _jsx("td", { className: "small text-muted", children: new Date(ticket.createdAt).toLocaleDateString() }), _jsx("td", { children: _jsx("div", { className: "fw-medium text-dark", children: ticket.summary }) }), _jsx("td", { children: _jsx("span", { className: "badge bg-light text-dark border", children: ticket.category?.name || "N/A" }) }), _jsx("td", { children: renderPriorityBadge(ticket.requestedPriority) }), _jsx("td", { children: renderPriorityBadge(ticket.itPriority || ticket.requestedPriority) }), _jsx("td", { children: renderStatusBadge(ticket.currentStatus) }), _jsx("td", { children: ticket.owner ? (_jsxs("span", { className: "small text-dark fw-semibold", children: ["\uD83D\uDC64 ", ticket.owner.name] })) : (_jsx("span", { className: "badge bg-light text-muted border", children: "Unassigned" })) }), _jsx("td", { className: "text-end", children: _jsx("button", { className: "btn btn-sm btn-outline-success", onClick: () => onSelectTicket(ticket.id), "data-testid": `view-ticket-btn-${ticket.id}`, children: "View Ticket" }) })] }, ticket.id))) })] }) }) }), _jsx("div", { className: "d-lg-none", children: tickets.map((ticket) => (_jsx("div", { className: "card shadow-sm border-0 mb-3", "data-testid": `ticket-card-${ticket.id}`, children: _jsxs("div", { className: "card-body", children: [_jsxs("div", { className: "d-flex justify-content-between align-items-center mb-2", children: [_jsx("strong", { className: "text-zen-green", children: ticket.ticketNumber }), renderStatusBadge(ticket.currentStatus)] }), _jsx("h3", { className: "h6 fw-bold mb-2", children: ticket.summary }), _jsxs("div", { className: "row g-2 mb-3 small text-muted", children: [_jsxs("div", { className: "col-6", children: ["Category: ", _jsx("strong", { children: ticket.category?.name || "N/A" })] }), _jsxs("div", { className: "col-6", children: ["IT Priority: ", renderPriorityBadge(ticket.itPriority || ticket.requestedPriority)] }), _jsxs("div", { className: "col-6", children: ["Created: ", new Date(ticket.createdAt).toLocaleDateString()] }), _jsxs("div", { className: "col-6", children: ["Owner: ", ticket.owner ? ticket.owner.name : "Unassigned"] })] }), _jsx("button", { className: "btn btn-success btn-sm w-100", onClick: () => onSelectTicket(ticket.id), "data-testid": `mobile-view-btn-${ticket.id}`, children: "Open Ticket" })] }) }, ticket.id))) }), _jsxs("div", { className: "d-flex justify-content-between align-items-center mt-3", children: [_jsx("button", { className: "btn btn-outline-secondary btn-sm", disabled: !meta.hasPrevPage, onClick: () => setPage((p) => Math.max(1, p - 1)), "data-testid": "pagination-prev", children: "\u00AB Previous" }), _jsxs("span", { className: "small text-muted", "data-testid": "pagination-page-info", children: ["Page ", meta.currentPage, " of ", meta.totalPages] }), _jsx("button", { className: "btn btn-outline-secondary btn-sm", disabled: !meta.hasNextPage, onClick: () => setPage((p) => p + 1), "data-testid": "pagination-next", children: "Next \u00BB" })] })] }))] }));
}
