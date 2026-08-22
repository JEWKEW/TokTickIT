import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState, useCallback } from "react";
import { fetchTickets, fetchCategories } from "../api.js";

export default function MyTicketsList({ userId, onCreateTicket }) {
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

    const [search, setSearch] = useState("");
    const [categoryId, setCategoryId] = useState("all");
    const [priority, setPriority] = useState("all");
    const [status, setStatus] = useState("all");
    const [sort, setSort] = useState("createdAt");
    const [order, setOrder] = useState("desc");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);

    useEffect(() => {
        fetchCategories()
            .then((data) => setCategories(data))
            .catch(() => { });
    }, []);

    const loadTickets = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchTickets({
                search,
                categoryId,
                priority,
                status,
                sort,
                order,
                page,
                limit,
            }, userId);
            setTickets(data.items);
            setMeta(data.meta);
        }
        catch (err) {
            setError(err.message || "Failed to load tickets");
        }
        finally {
            setLoading(false);
        }
    }, [userId, search, categoryId, priority, status, sort, order, page, limit]);

    useEffect(() => {
        loadTickets();
    }, [loadTickets]);

    const handleClearFilters = () => {
        setSearch("");
        setCategoryId("all");
        setPriority("all");
        setStatus("all");
        setSort("createdAt");
        setOrder("desc");
        setPage(1);
        setLimit(10);
    };

    const handleSort = (field) => {
        if (sort === field) {
            setOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
        }
        else {
            setSort(field);
            setOrder("asc");
        }
        setPage(1);
    };

    const hasActiveFilters = search.trim() !== "" ||
        categoryId !== "all" ||
        priority !== "all" ||
        status !== "all";

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
        return (_jsx("span", { className: `badge px-2 py-1 ${badgeClass} text-capitalize`, children: p }));
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
        return (_jsx("span", { className: `badge rounded-pill px-3 py-1 ${pillClass} text-capitalize`, children: st }));
    };

    const startItem = meta.totalItems === 0 ? 0 : (meta.currentPage - 1) * meta.limit + 1;
    const endItem = Math.min(meta.currentPage * meta.limit, meta.totalItems);

    return (_jsxs("div", { className: "container py-4", children: [
        _jsxs("div", { className: "d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4", children: [
            _jsxs("div", { children: [
                _jsxs("div", { className: "d-flex align-items-center gap-2", children: [
                    _jsx("h1", { className: "h3 mb-0 fw-bold text-zen-green", children: "My Tickets" }),
                    _jsx("span", { className: "badge bg-zen-green rounded-pill px-3 py-2 fs-6", children: meta.totalItems })
                ] }),
                _jsx("p", { className: "text-muted small mb-0 mt-1", children: "Browse and manage your submitted IT service requests" })
            ] }),
            onCreateTicket && (_jsxs("button", { type: "button", className: "btn btn-zen-green fw-bold px-3 py-2 shadow-sm d-inline-flex align-items-center gap-2", onClick: onCreateTicket, "data-testid": "create-ticket-btn", children: [_jsx("span", { children: "+" }), " New Ticket"] }))
        ] }),
        _jsx("div", { className: "card border-0 shadow-sm rounded-3 mb-4 p-3 bg-white", children: _jsxs("div", { className: "row g-3 align-items-center", children: [
            _jsx("div", { className: "col-12 col-md-4", children: _jsxs("div", { className: "input-group", children: [
                _jsx("span", { className: "input-group-text bg-light border-end-0 text-muted", children: "🔍" }),
                _jsx("input", { type: "text", className: "form-control bg-light border-start-0 ps-0", placeholder: "Search ticket no or summary...", value: search, onChange: (e) => {
                    setSearch(e.target.value);
                    setPage(1);
                }, "data-testid": "search-input" })
            ] }) }),
            _jsx("div", { className: "col-6 col-md-2", children: _jsxs("select", { className: "form-select bg-light border-0", value: categoryId, onChange: (e) => {
                setCategoryId(e.target.value);
                setPage(1);
            }, "data-testid": "category-filter", children: [
                _jsx("option", { value: "all", children: "All Categories" }),
                categories.map((c) => (_jsx("option", { value: c.id, children: c.name }, c.id)))
            ] }) }),
            _jsx("div", { className: "col-6 col-md-2", children: _jsxs("select", { className: "form-select bg-light border-0", value: priority, onChange: (e) => {
                setPriority(e.target.value);
                setPage(1);
            }, "data-testid": "priority-filter", children: [
                _jsx("option", { value: "all", children: "All Priorities" }),
                _jsx("option", { value: "Low", children: "Low" }),
                _jsx("option", { value: "Medium", children: "Medium" }),
                _jsx("option", { value: "High", children: "High" }),
                _jsx("option", { value: "Urgent", children: "Urgent" })
            ] }) }),
            _jsx("div", { className: "col-6 col-md-2", children: _jsxs("select", { className: "form-select bg-light border-0", value: status, onChange: (e) => {
                setStatus(e.target.value);
                setPage(1);
            }, "data-testid": "status-filter", children: [
                _jsx("option", { value: "all", children: "All Statuses" }),
                _jsx("option", { value: "New", children: "New" }),
                _jsx("option", { value: "In Progress", children: "In Progress" }),
                _jsx("option", { value: "Resolved", children: "Resolved" }),
                _jsx("option", { value: "Closed", children: "Closed" })
            ] }) }),
            _jsx("div", { className: "col-6 col-md-2 text-end", children: _jsx("button", { type: "button", className: "btn btn-outline-secondary w-100 fw-medium", onClick: handleClearFilters, disabled: !hasActiveFilters && sort === "createdAt" && order === "desc", "data-testid": "clear-filters-btn", children: "Clear Filters" }) })
        ] }) }),
        loading ? (_jsxs("div", { className: "card border-0 shadow-sm rounded-3 p-5 text-center bg-white", "data-testid": "loading-state", children: [
            _jsx("div", { className: "spinner-border text-zen-green mx-auto mb-3", role: "status", children: _jsx("span", { className: "visually-hidden", children: "Loading..." }) }),
            _jsx("h5", { className: "text-muted mb-0", children: "Loading your tickets..." })
        ] })) : error ? (_jsxs("div", { className: "card border-0 shadow-sm rounded-3 p-4 bg-white", "data-testid": "error-state", children: [
            _jsxs("div", { className: "alert alert-danger mb-3", role: "alert", children: [
                _jsx("h5", { className: "alert-heading mb-1", children: "Failed to fetch tickets" }),
                _jsx("p", { className: "mb-0", children: error })
            ] }),
            _jsx("div", { className: "text-end", children: _jsx("button", { type: "button", className: "btn btn-zen-green", onClick: loadTickets, "data-testid": "retry-btn", children: "Try Again" }) })
        ] })) : tickets.length === 0 && !hasActiveFilters ? (_jsxs("div", { className: "card border-0 shadow-sm rounded-3 p-5 text-center bg-white", "data-testid": "empty-state", children: [
            _jsx("div", { className: "display-4 text-muted mb-3", children: "🎫" }),
            _jsx("h4", { className: "fw-bold text-dark mb-2", children: "No Tickets Found" }),
            _jsx("p", { className: "text-muted mx-auto mb-4", style: { maxWidth: 400 }, children: "You haven't submitted any service request tickets yet. Whenever you need support, click below to get started." }),
            onCreateTicket && (_jsx("div", { children: _jsx("button", { type: "button", className: "btn btn-zen-green px-4 py-2 fw-bold", onClick: onCreateTicket, children: "+ Create Your First Ticket" }) }))
        ] })) : tickets.length === 0 && hasActiveFilters ? (_jsxs("div", { className: "card border-0 shadow-sm rounded-3 p-5 text-center bg-white", "data-testid": "no-results-state", children: [
            _jsx("div", { className: "display-5 text-muted mb-3", children: "🔎" }),
            _jsx("h4", { className: "fw-bold text-dark mb-2", children: "No Matching Tickets" }),
            _jsx("p", { className: "text-muted mx-auto mb-4", style: { maxWidth: 450 }, children: "No tickets match your active filter or search criteria. Try adjusting your parameters or clearing filters." }),
            _jsx("div", { children: _jsx("button", { type: "button", className: "btn btn-zen-green px-4 py-2 fw-bold", onClick: handleClearFilters, children: "Clear All Filters" }) })
        ] })) : (_jsx(_Fragment, { children: _jsxs("div", { className: "card border-0 shadow-sm rounded-3 overflow-hidden mb-4 bg-white", children: [
            _jsx("div", { className: "table-responsive", children: _jsxs("table", { className: "table table-hover align-middle mb-0", "data-testid": "tickets-table", children: [
                _jsx("thead", { className: "table-light border-bottom", children: _jsxs("tr", { children: [
                    _jsxs("th", { scope: "col", className: "user-select-none cursor-pointer py-3 ps-4", onClick: () => handleSort("ticketNumber"), style: { cursor: "pointer" }, children: ["Ticket No ", sort === "ticketNumber" ? (order === "asc" ? "▲" : "▼") : ""] }),
                    _jsxs("th", { scope: "col", className: "user-select-none cursor-pointer py-3", onClick: () => handleSort("createdAt"), style: { cursor: "pointer" }, children: ["Created Date ", sort === "createdAt" ? (order === "asc" ? "▲" : "▼") : ""] }),
                    _jsxs("th", { scope: "col", className: "user-select-none cursor-pointer py-3", onClick: () => handleSort("summary"), style: { cursor: "pointer" }, children: ["Summary ", sort === "summary" ? (order === "asc" ? "▲" : "▼") : ""] }),
                    _jsxs("th", { scope: "col", className: "user-select-none cursor-pointer py-3", onClick: () => handleSort("category"), style: { cursor: "pointer" }, children: ["Category ", sort === "category" ? (order === "asc" ? "▲" : "▼") : ""] }),
                    _jsxs("th", { scope: "col", className: "user-select-none cursor-pointer py-3", onClick: () => handleSort("priority"), style: { cursor: "pointer" }, children: ["Priority ", sort === "priority" ? (order === "asc" ? "▲" : "▼") : ""] }),
                    _jsxs("th", { scope: "col", className: "user-select-none cursor-pointer py-3", onClick: () => handleSort("status"), style: { cursor: "pointer" }, children: ["Status ", sort === "status" ? (order === "asc" ? "▲" : "▼") : ""] })
                ] }) }),
                _jsx("tbody", { children: tickets.map((t) => (_jsxs("tr", { children: [
                    _jsx("td", { className: "ps-4 fw-bold font-monospace text-zen-green", children: t.ticketNumber }),
                    _jsx("td", { className: "text-muted small", children: new Date(t.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                    }) }),
                    _jsx("td", { className: "fw-medium text-dark", children: t.summary }),
                    _jsx("td", { children: _jsx("span", { className: "badge bg-light text-dark border", children: t.category?.name || "N/A" }) }),
                    _jsx("td", { children: renderPriorityBadge(t.requestedPriority) }),
                    _jsx("td", { children: renderStatusPill(t.currentStatus) })
                ] }, t.id))) })
            ] }) }),
            _jsxs("div", { className: "card-footer bg-white border-top p-3 d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3", children: [
                _jsxs("div", { className: "text-muted small", children: ["Showing ", _jsx("strong", { className: "text-dark", children: startItem }), " - ", _jsx("strong", { className: "text-dark", children: endItem }), " of ", _jsx("strong", { className: "text-dark", children: meta.totalItems }), " tickets"] }),
                _jsxs("div", { className: "d-flex align-items-center gap-3", children: [
                    _jsxs("div", { className: "d-flex align-items-center gap-2", children: [
                        _jsx("span", { className: "text-muted small", children: "Per page:" }),
                        _jsxs("select", { className: "form-select form-select-sm", style: { width: "auto" }, value: limit, onChange: (e) => {
                            setLimit(Number(e.target.value));
                            setPage(1);
                        }, "data-testid": "limit-select", children: [
                            _jsx("option", { value: 10, children: "10" }),
                            _jsx("option", { value: 25, children: "25" }),
                            _jsx("option", { value: 50, children: "50" })
                        ] })
                    ] }),
                    _jsxs("div", { className: "btn-group btn-group-sm", children: [
                        _jsx("button", { type: "button", className: "btn btn-outline-secondary", disabled: !meta.hasPrevPage, onClick: () => setPage((p) => Math.max(1, p - 1)), "data-testid": "prev-page-btn", children: "« Prev" }),
                        _jsxs("span", { className: "btn btn-light disabled text-dark px-3", children: ["Page ", meta.currentPage, " of ", meta.totalPages] }),
                        _jsx("button", { type: "button", className: "btn btn-outline-secondary", disabled: !meta.hasNextPage, onClick: () => setPage((p) => p + 1), "data-testid": "next-page-btn", children: "Next »" })
                    ] })
                ] })
            ] })
        ] }) }))
    ] }));
}
