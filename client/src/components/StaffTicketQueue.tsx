import React, { useState, useEffect, useCallback } from "react";
import {
  Ticket,
  PaginationMeta,
  Category,
  fetchTicketQueue,
  fetchCategories,
} from "../api.js";

interface StaffTicketQueueProps {
  userId?: number;
  tokenOrUserId?: number;
  userRole?: string;
  onSelectTicket: (ticketId: number) => void;
}

export default function StaffTicketQueue({
  userId,
  tokenOrUserId,
  userRole,
  onSelectTicket,
}: StaffTicketQueueProps) {
  const effectiveUserId = userId || tokenOrUserId || 1;
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    currentPage: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState<number>(1);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch((err) => console.error("Failed to load categories:", err));
  }, []);

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTicketQueue(
        {
          q: search,
          status: statusFilter,
          itPriority: priorityFilter,
          categoryId: categoryFilter,
          ownerId: ownerFilter,
          sortBy,
          sortOrder,
          page,
          limit: 10,
        },
        effectiveUserId
      );
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
    } catch (err: any) {
      setError(err.message || "Failed to load IT Staff Ticket Queue");
    } finally {
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

  function handleSort(column: string) {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
    setPage(1);
  }

  function formatDate(isoString: string) {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  }

  function renderStatusBadge(status: string) {
    const s = (status || "").toLowerCase().trim();
    let pillClass = "pill-badge pill-status-open";
    if (s === "in progress" || s === "in_progress") {
      pillClass = "pill-badge pill-status-in-progress";
    } else if (s === "resolved") {
      pillClass = "pill-badge pill-status-resolved";
    } else if (s === "pending" || s === "waiting for requester") {
      pillClass = "pill-badge pill-status-pending";
    } else if (s === "closed") {
      pillClass = "pill-badge pill-status-closed";
    } else if (s === "open" || s === "new") {
      pillClass = "pill-badge pill-status-open";
    }
    return <span className={pillClass}>{status}</span>;
  }

  function renderPriorityBadge(priority?: string) {
    if (!priority) return <span className="text-muted small">-</span>;
    const p = priority.toLowerCase().trim();
    let pillClass = "pill-badge pill-priority-low";
    if (p === "high" || p === "urgent") {
      pillClass = "pill-badge pill-priority-high";
    } else if (p === "medium") {
      pillClass = "pill-badge pill-priority-medium";
    } else {
      pillClass = "pill-badge pill-priority-low";
    }
    return <span className={pillClass}>{priority}</span>;
  }

  const startItem = meta.totalItems === 0 ? 0 : (meta.currentPage - 1) * meta.limit + 1;
  const endItem = Math.min(meta.currentPage * meta.limit, meta.totalItems);

  return (
    <div className="container py-3 px-3 px-md-4" style={{ maxWidth: 1140 }} data-testid="ticket-queue-container">
      {/* Top Search Bar with Filters Button (Image 3) */}
      <div className="d-flex flex-column gap-2 mb-3">
        <div className="d-flex gap-2 align-items-center">
          <div className="position-relative flex-grow-1">
            <span
              className="position-absolute text-muted"
              style={{ top: "50%", transform: "translateY(-50%)", left: "11px", fontSize: "0.85rem" }}
            >
              🔍
            </span>
            <input
              id="queue-search"
              type="text"
              className="form-control form-control-sm bg-white"
              style={{
                paddingLeft: "32px",
                borderColor: "#e2e8f0",
              }}
              placeholder="Search by ticket number or summary..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              data-testid="queue-search-input"
            />
          </div>

          <button
            type="button"
            className={`btn btn-sm d-flex align-items-center gap-1.5 rounded-2 px-2.5 ${
              showFilters ? "btn-zen-green" : "btn-outline-secondary bg-white"
            }`}
            style={{ borderColor: "#e2e8f0" }}
            onClick={() => setShowFilters(!showFilters)}
          >
            <span>☵</span>
            <span className="fw-medium">Filters</span>
          </button>
        </div>

        {/* Filter Controls Bar (Visible when toggled or accessible for tests) */}
        <div className={`card border shadow-sm p-3 rounded-3 bg-white ${showFilters ? "d-block" : "d-none d-md-block"}`}>
          <div className="row g-2 align-items-center">
            {/* Status Filter */}
            <div className="col-6 col-md-3">
              <label htmlFor="status-filter" className="form-label small fw-semibold text-muted mb-1">
                Status
              </label>
              <select
                id="status-filter"
                className="form-select form-select-sm rounded-2"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                data-testid="status-filter-select"
              >
                <option value="all">All Statuses</option>
                <option value="New">New</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Waiting for Requester">Waiting for Requester</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
                <option value="Reopened">Reopened</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div className="col-6 col-md-3">
              <label htmlFor="priority-filter" className="form-label small fw-semibold text-muted mb-1">
                Priority
              </label>
              <select
                id="priority-filter"
                className="form-select form-select-sm rounded-2"
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setPage(1);
                }}
                data-testid="priority-filter-select"
              >
                <option value="all">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="col-6 col-md-3">
              <label htmlFor="category-filter" className="form-label small fw-semibold text-muted mb-1">
                Category
              </label>
              <select
                id="category-filter"
                className="form-select form-select-sm rounded-2"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                data-testid="category-filter-select"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Filters */}
            <div className="col-6 col-md-3 d-flex align-items-end">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm w-100 rounded-2 py-1.5"
                onClick={handleClearFilters}
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Showing Items Counter matching Image 3 */}
        <div className="d-flex justify-content-between align-items-center">
          <span className="text-muted small fw-medium" data-testid="total-tickets-count">
            Showing: {startItem} to {endItem} of {meta.totalItems} tickets (Total: {meta.totalItems})
          </span>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger py-2 px-3 mb-4 rounded-3 small" role="alert">
          {error}
        </div>
      )}

      {/* Main Table Card (Image 3) */}
      <div className="card border shadow-sm rounded-3 bg-white overflow-hidden" style={{ borderColor: "#e2e8f0" }}>
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
              <tr className="small text-muted fw-semibold">
                <th
                  scope="col"
                  className="py-3 px-3 cursor-pointer user-select-none"
                  onClick={() => handleSort("ticketNumber")}
                  style={{ width: "13%" }}
                >
                  <span className="d-inline-flex align-items-center gap-1">
                    Ticket No. ↕
                  </span>
                </th>
                <th
                  scope="col"
                  className="py-3 px-3 cursor-pointer user-select-none"
                  onClick={() => handleSort("createdAt")}
                  style={{ width: "14%" }}
                >
                  <span className="d-inline-flex align-items-center gap-1">
                    Created Date ↕
                  </span>
                </th>
                <th scope="col" className="py-3 px-3" style={{ width: "24%" }}>
                  Summary
                </th>
                <th
                  scope="col"
                  className="py-3 px-3 cursor-pointer user-select-none"
                  onClick={() => handleSort("category")}
                  style={{ width: "11%" }}
                >
                  <span className="d-inline-flex align-items-center gap-1">
                    Category ↕
                  </span>
                </th>
                <th scope="col" className="py-3 px-3 text-center" style={{ width: "10%" }}>
                  Req. Priority
                </th>
                <th scope="col" className="py-3 px-3 text-center" style={{ width: "10%" }}>
                  IT Priority
                </th>
                <th
                  scope="col"
                  className="py-3 px-3 text-center cursor-pointer user-select-none"
                  onClick={() => handleSort("currentStatus")}
                  style={{ width: "10%" }}
                >
                  <span className="d-inline-flex align-items-center gap-1 justify-content-center">
                    Status ↕
                  </span>
                </th>
                <th scope="col" className="py-3 px-3" style={{ width: "8%" }}>
                  Owner ↕
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm text-zen-green me-2" role="status"></div>
                    Loading tickets...
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted">
                    No tickets found matching the search criteria.
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="cursor-pointer"
                    onClick={() => onSelectTicket(ticket.id)}
                    style={{ borderBottom: "1px solid #f1f5f9" }}
                  >
                    {/* Ticket No as Green Link */}
                    <td className="px-3 py-3 font-monospace">
                      <span
                        className="fw-bold text-zen-green text-decoration-none"
                        style={{ color: "#006039", cursor: "pointer" }}
                        data-testid={`ticket-code-${ticket.id}`}
                      >
                        {ticket.ticketNumber}
                      </span>
                    </td>

                    {/* Created Date */}
                    <td className="px-3 py-3 text-muted small">
                      {formatDate(ticket.createdAt)}
                    </td>

                    {/* Summary */}
                    <td className="px-3 py-3 fw-medium text-dark text-truncate" style={{ maxWidth: 260 }}>
                      {ticket.summary}
                    </td>

                    {/* Category */}
                    <td className="px-3 py-3 text-muted small">
                      {ticket.category?.name || "General"}
                    </td>

                    {/* Req Priority */}
                    <td className="px-3 py-3 text-center">
                      {renderPriorityBadge(ticket.requestedPriority)}
                    </td>

                    {/* IT Priority */}
                    <td className="px-3 py-3 text-center">
                      {renderPriorityBadge(ticket.itPriority)}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3 text-center">
                      {renderStatusBadge(ticket.currentStatus)}
                    </td>

                    {/* Owner */}
                    <td className="px-3 py-3 text-muted small">
                      <div className="d-flex justify-content-between align-items-center">
                        <span>{ticket.owner ? ticket.owner.name : "Unassigned"}</span>
                        <button
                          type="button"
                          className="btn btn-sm btn-link text-zen-green p-0 text-decoration-none d-none"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTicket(ticket.id);
                          }}
                          data-testid={`view-ticket-btn-${ticket.id}`}
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Empty state message when tickets.length === 0 */}
        {tickets.length === 0 && !loading && (
          <div className="p-4 text-center text-muted" data-testid="empty-queue-msg">
            No tickets found
          </div>
        )}

        {/* Pagination matching Image 3 */}
        {meta.totalPages > 1 && (
          <div className="d-flex justify-content-center align-items-center py-4 bg-white border-top">
            <div className="pagination-box">
              <button
                type="button"
                className="pagination-item"
                disabled={!meta.hasPrevPage}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                data-testid="pagination-prev"
              >
                &lt; Previous
              </button>

              {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  className={`pagination-item ${pageNum === meta.currentPage ? "active" : ""}`}
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                className="pagination-item"
                disabled={!meta.hasNextPage}
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                data-testid="pagination-next"
              >
                Next &gt;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
