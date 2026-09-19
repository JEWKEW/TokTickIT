import React, { useState, useEffect, useCallback } from "react";
import {
  Ticket,
  PaginationMeta,
  Category,
  fetchTicketQueue,
  fetchCategories,
} from "../api.js";

interface StaffTicketQueueProps {
  userId: number;
  onSelectTicket: (ticketId: number) => void;
}

export default function StaffTicketQueue({
  userId,
  onSelectTicket,
}: StaffTicketQueueProps) {
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
        userId
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

  function renderStatusBadge(status: string) {
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
    return <span className={badgeClass}>{status}</span>;
  }

  function renderPriorityBadge(priority?: string) {
    if (!priority) return <span className="text-muted small">N/A</span>;
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
    return <span className={badgeClass}>{priority}</span>;
  }

  return (
    <div className="container-fluid py-4" data-testid="ticket-queue-container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h1 className="h4 text-zen-green mb-1 fw-bold">IT Staff Ticket Queue</h1>
          <p className="text-muted small mb-0">
            Manage incoming tickets, claim ownership, update priorities, and handle workflows.
          </p>
        </div>
        <span className="badge bg-success fs-6" data-testid="total-tickets-count">
          Total: {meta.totalItems}
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="card shadow-sm border-0 mb-4 bg-white rounded-3">
        <div className="card-body">
          <div className="row g-3">
            {/* Search Input */}
            <div className="col-12 col-md-4">
              <label htmlFor="queue-search" className="form-label small fw-bold text-muted">
                Search
              </label>
              <input
                id="queue-search"
                type="text"
                className="form-control form-control-sm"
                placeholder="Search by ticket number or summary..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                data-testid="queue-search-input"
              />
            </div>

            {/* Status Filter */}
            <div className="col-6 col-md-2">
              <label htmlFor="status-filter" className="form-label small fw-bold text-muted">
                Status
              </label>
              <select
                id="status-filter"
                className="form-select form-select-sm"
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
            <div className="col-6 col-md-2">
              <label htmlFor="priority-filter" className="form-label small fw-bold text-muted">
                Priority
              </label>
              <select
                id="priority-filter"
                className="form-select form-select-sm"
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

            {/* Owner Filter */}
            <div className="col-6 col-md-2">
              <label htmlFor="owner-filter" className="form-label small fw-bold text-muted">
                Owner
              </label>
              <select
                id="owner-filter"
                className="form-select form-select-sm"
                value={ownerFilter}
                onChange={(e) => {
                  setOwnerFilter(e.target.value);
                  setPage(1);
                }}
                data-testid="owner-filter-select"
              >
                <option value="all">All Owners</option>
                <option value="unassigned">Unassigned</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="col-6 col-md-2">
              <label htmlFor="category-filter" className="form-label small fw-bold text-muted">
                Category
              </label>
              <select
                id="category-filter"
                className="form-select form-select-sm"
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
          </div>

          <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
            <span className="text-muted small">
              Showing {tickets.length > 0 ? (meta.currentPage - 1) * meta.limit + 1 : 0} to{" "}
              {Math.min(meta.currentPage * meta.limit, meta.totalItems)} of {meta.totalItems} tickets
            </span>
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={handleClearFilters}
              data-testid="clear-filters-btn"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="alert alert-danger py-2 mb-3" data-testid="queue-error">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="text-center py-5" data-testid="queue-loading">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading queue...</span>
          </div>
          <p className="text-muted mt-2 small">Loading tickets...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="card shadow-sm border-0 text-center py-5" data-testid="empty-queue-msg">
          <div className="card-body">
            <h3 className="h6 text-muted mb-2">No tickets found</h3>
            <p className="text-muted small mb-0">
              Try adjusting your search criteria or clearing filters.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table View (≥992px) */}
          <div className="card shadow-sm border-0 d-none d-lg-block mb-3">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" data-testid="ticket-table">
                <thead className="table-light">
                  <tr>
                    <th
                      style={{ cursor: "pointer" }}
                      onClick={() => handleSort("ticketNumber")}
                      data-testid="sort-ticketNumber"
                    >
                      Ticket No. {sortBy === "ticketNumber" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th
                      style={{ cursor: "pointer" }}
                      onClick={() => handleSort("createdAt")}
                      data-testid="sort-createdAt"
                    >
                      Created Date {sortBy === "createdAt" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th
                      style={{ cursor: "pointer" }}
                      onClick={() => handleSort("summary")}
                      data-testid="sort-summary"
                    >
                      Summary {sortBy === "summary" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th>Category</th>
                    <th>Req. Priority</th>
                    <th
                      style={{ cursor: "pointer" }}
                      onClick={() => handleSort("itPriority")}
                      data-testid="sort-itPriority"
                    >
                      IT Priority {sortBy === "itPriority" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th
                      style={{ cursor: "pointer" }}
                      onClick={() => handleSort("status")}
                      data-testid="sort-status"
                    >
                      Status {sortBy === "status" ? (sortOrder === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th>Owner</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} data-testid={`ticket-row-${ticket.id}`}>
                      <td>
                        <strong className="text-zen-green" data-testid={`ticket-code-${ticket.id}`}>
                          {ticket.ticketNumber}
                        </strong>
                      </td>
                      <td className="small text-muted">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <div className="fw-medium text-dark">{ticket.summary}</div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {ticket.category?.name || "N/A"}
                        </span>
                      </td>
                      <td>{renderPriorityBadge(ticket.requestedPriority)}</td>
                      <td>{renderPriorityBadge(ticket.itPriority || ticket.requestedPriority)}</td>
                      <td>{renderStatusBadge(ticket.currentStatus)}</td>
                      <td>
                        {ticket.owner ? (
                          <span className="small text-dark fw-semibold">
                            👤 {ticket.owner.name}
                          </span>
                        ) : (
                          <span className="badge bg-light text-muted border">Unassigned</span>
                        )}
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-outline-success"
                          onClick={() => onSelectTicket(ticket.id)}
                          data-testid={`view-ticket-btn-${ticket.id}`}
                        >
                          View Ticket
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View (<992px) */}
          <div className="d-lg-none">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="card shadow-sm border-0 mb-3"
                data-testid={`ticket-card-${ticket.id}`}
              >
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <strong className="text-zen-green">{ticket.ticketNumber}</strong>
                    {renderStatusBadge(ticket.currentStatus)}
                  </div>
                  <h3 className="h6 fw-bold mb-2">{ticket.summary}</h3>
                  <div className="row g-2 mb-3 small text-muted">
                    <div className="col-6">
                      Category: <strong>{ticket.category?.name || "N/A"}</strong>
                    </div>
                    <div className="col-6">
                      IT Priority: {renderPriorityBadge(ticket.itPriority || ticket.requestedPriority)}
                    </div>
                    <div className="col-6">
                      Created: {new Date(ticket.createdAt).toLocaleDateString()}
                    </div>
                    <div className="col-6">
                      Owner: {ticket.owner ? ticket.owner.name : "Unassigned"}
                    </div>
                  </div>
                  <button
                    className="btn btn-success btn-sm w-100"
                    onClick={() => onSelectTicket(ticket.id)}
                    data-testid={`mobile-view-btn-${ticket.id}`}
                  >
                    Open Ticket
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          <div className="d-flex justify-content-between align-items-center mt-3">
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={!meta.hasPrevPage}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              data-testid="pagination-prev"
            >
              &laquo; Previous
            </button>
            <span className="small text-muted" data-testid="pagination-page-info">
              Page {meta.currentPage} of {meta.totalPages}
            </span>
            <button
              className="btn btn-outline-secondary btn-sm"
              disabled={!meta.hasNextPage}
              onClick={() => setPage((p) => p + 1)}
              data-testid="pagination-next"
            >
              Next &raquo;
            </button>
          </div>
        </>
      )}
    </div>
  );
}
