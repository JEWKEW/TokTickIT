import React, { useEffect, useState, useCallback } from "react";
import {
  fetchTickets,
  fetchCategories,
  Category,
  Ticket,
  PaginationMeta,
} from "../api.js";

interface MyTicketsListProps {
  userId: number;
  onCreateTicket?: () => void;
}

export default function MyTicketsList({ userId, onCreateTicket }: MyTicketsListProps) {
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
  const [categoryId, setCategoryId] = useState<string>("all");
  const [priority, setPriority] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [sort, setSort] = useState<string>("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);

  // Fetch Categories on mount
  useEffect(() => {
    fetchCategories()
      .then((data) => setCategories(data))
      .catch(() => {});
  }, []);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTickets(
        {
          search,
          categoryId,
          priority,
          status,
          sort,
          order,
          page,
          limit,
        },
        userId
      );
      setTickets(data.items);
      setMeta(data.meta);
    } catch (err: any) {
      setError(err.message || "Failed to load tickets");
    } finally {
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

  const handleSort = (field: string) => {
    if (sort === field) {
      setOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
    } else {
      setSort(field);
      setOrder("asc");
    }
    setPage(1);
  };

  const hasActiveFilters =
    search.trim() !== "" ||
    categoryId !== "all" ||
    priority !== "all" ||
    status !== "all";

  // Badges helper
  const renderPriorityBadge = (p: string) => {
    const pLower = (p || "").toLowerCase();
    let badgeClass = "bg-secondary";
    if (pLower === "low") badgeClass = "bg-success bg-opacity-10 text-success border border-success border-opacity-25";
    else if (pLower === "medium") badgeClass = "bg-info bg-opacity-10 text-info border border-info border-opacity-25";
    else if (pLower === "high") badgeClass = "bg-warning bg-opacity-10 text-warning-emphasis border border-warning border-opacity-25";
    else if (pLower === "urgent") badgeClass = "bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25";

    return (
      <span className={`badge px-2 py-1 ${badgeClass} text-capitalize`}>
        {p}
      </span>
    );
  };

  const renderStatusPill = (st: string) => {
    const sLower = (st || "").toLowerCase();
    let pillClass = "bg-secondary";
    if (sLower === "new" || sLower === "open") pillClass = "bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25";
    else if (sLower === "in_progress" || sLower === "in progress") pillClass = "bg-warning bg-opacity-10 text-warning-emphasis border border-warning border-opacity-25";
    else if (sLower === "resolved") pillClass = "bg-success bg-opacity-10 text-success border border-success border-opacity-25";
    else if (sLower === "closed") pillClass = "bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25";

    return (
      <span className={`badge rounded-pill px-3 py-1 ${pillClass} text-capitalize`}>
        {st}
      </span>
    );
  };

  // Compute pagination range text
  const startItem = meta.totalItems === 0 ? 0 : (meta.currentPage - 1) * meta.limit + 1;
  const endItem = Math.min(meta.currentPage * meta.limit, meta.totalItems);

  return (
    <div className="container py-4">
      {/* Top Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2">
            <h1 className="h3 mb-0 fw-bold text-zen-green">My Tickets</h1>
            <span className="badge bg-zen-green rounded-pill px-3 py-2 fs-6">
              {meta.totalItems}
            </span>
          </div>
          <p className="text-muted small mb-0 mt-1">
            Browse and manage your submitted IT service requests
          </p>
        </div>
        {onCreateTicket && (
          <button
            type="button"
            className="btn btn-zen-green fw-bold px-3 py-2 shadow-sm d-inline-flex align-items-center gap-2"
            onClick={onCreateTicket}
            data-testid="create-ticket-btn"
          >
            <span>+</span> New Ticket
          </button>
        )}
      </div>

      {/* Toolbar & Filters Card */}
      <div className="card border-0 shadow-sm rounded-3 mb-4 p-3 bg-white">
        <div className="row g-3 align-items-center">
          {/* Search bar */}
          <div className="col-12 col-md-4">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0 text-muted">
                🔍
              </span>
              <input
                type="text"
                className="form-control bg-light border-start-0 ps-0"
                placeholder="Search ticket no or summary..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                data-testid="search-input"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div className="col-6 col-md-2">
            <select
              className="form-select bg-light border-0"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
              data-testid="category-filter"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="col-6 col-md-2">
            <select
              className="form-select bg-light border-0"
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setPage(1);
              }}
              data-testid="priority-filter"
            >
              <option value="all">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="col-6 col-md-2">
            <select
              className="form-select bg-light border-0"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              data-testid="status-filter"
            >
              <option value="all">All Statuses</option>
              <option value="New">New</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="col-6 col-md-2 text-end">
            <button
              type="button"
              className="btn btn-outline-secondary w-100 fw-medium"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters && sort === "createdAt" && order === "desc"}
              data-testid="clear-filters-btn"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Main Content States */}
      {loading ? (
        <div
          className="card border-0 shadow-sm rounded-3 p-5 text-center bg-white"
          data-testid="loading-state"
        >
          <div className="spinner-border text-zen-green mx-auto mb-3" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <h5 className="text-muted mb-0">Loading your tickets...</h5>
        </div>
      ) : error ? (
        <div
          className="card border-0 shadow-sm rounded-3 p-4 bg-white"
          data-testid="error-state"
        >
          <div className="alert alert-danger mb-3" role="alert">
            <h5 className="alert-heading mb-1">Failed to fetch tickets</h5>
            <p className="mb-0">{error}</p>
          </div>
          <div className="text-end">
            <button
              type="button"
              className="btn btn-zen-green"
              onClick={loadTickets}
              data-testid="retry-btn"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : tickets.length === 0 && !hasActiveFilters ? (
        <div
          className="card border-0 shadow-sm rounded-3 p-5 text-center bg-white"
          data-testid="empty-state"
        >
          <div className="display-4 text-muted mb-3">🎫</div>
          <h4 className="fw-bold text-dark mb-2">No Tickets Found</h4>
          <p className="text-muted mx-auto mb-4" style={{ maxWidth: 400 }}>
            You haven't submitted any service request tickets yet. Whenever you need support, click below to get started.
          </p>
          {onCreateTicket && (
            <div>
              <button
                type="button"
                className="btn btn-zen-green px-4 py-2 fw-bold"
                onClick={onCreateTicket}
              >
                + Create Your First Ticket
              </button>
            </div>
          )}
        </div>
      ) : tickets.length === 0 && hasActiveFilters ? (
        <div
          className="card border-0 shadow-sm rounded-3 p-5 text-center bg-white"
          data-testid="no-results-state"
        >
          <div className="display-5 text-muted mb-3">🔎</div>
          <h4 className="fw-bold text-dark mb-2">No Matching Tickets</h4>
          <p className="text-muted mx-auto mb-4" style={{ maxWidth: 450 }}>
            No tickets match your active filter or search criteria. Try adjusting your parameters or clearing filters.
          </p>
          <div>
            <button
              type="button"
              className="btn btn-zen-green px-4 py-2 fw-bold"
              onClick={handleClearFilters}
            >
              Clear All Filters
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Ticket Table Card */}
          <div className="card border-0 shadow-sm rounded-3 overflow-hidden mb-4 bg-white">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0" data-testid="tickets-table">
                <thead className="table-light border-bottom">
                  <tr>
                    <th
                      scope="col"
                      className="user-select-none cursor-pointer py-3 ps-4"
                      onClick={() => handleSort("ticketNumber")}
                      style={{ cursor: "pointer" }}
                    >
                      Ticket No {sort === "ticketNumber" ? (order === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th
                      scope="col"
                      className="user-select-none cursor-pointer py-3"
                      onClick={() => handleSort("createdAt")}
                      style={{ cursor: "pointer" }}
                    >
                      Created Date {sort === "createdAt" ? (order === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th
                      scope="col"
                      className="user-select-none cursor-pointer py-3"
                      onClick={() => handleSort("summary")}
                      style={{ cursor: "pointer" }}
                    >
                      Summary {sort === "summary" ? (order === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th
                      scope="col"
                      className="user-select-none cursor-pointer py-3"
                      onClick={() => handleSort("category")}
                      style={{ cursor: "pointer" }}
                    >
                      Category {sort === "category" ? (order === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th
                      scope="col"
                      className="user-select-none cursor-pointer py-3"
                      onClick={() => handleSort("priority")}
                      style={{ cursor: "pointer" }}
                    >
                      Priority {sort === "priority" ? (order === "asc" ? "▲" : "▼") : ""}
                    </th>
                    <th
                      scope="col"
                      className="user-select-none cursor-pointer py-3"
                      onClick={() => handleSort("status")}
                      style={{ cursor: "pointer" }}
                    >
                      Status {sort === "status" ? (order === "asc" ? "▲" : "▼") : ""}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id}>
                      <td className="ps-4 fw-bold font-monospace text-zen-green">
                        {t.ticketNumber}
                      </td>
                      <td className="text-muted small">
                        {new Date(t.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="fw-medium text-dark">{t.summary}</td>
                      <td>
                        <span className="badge bg-light text-dark border">
                          {t.category?.name || "N/A"}
                        </span>
                      </td>
                      <td>{renderPriorityBadge(t.requestedPriority)}</td>
                      <td>{renderStatusPill(t.currentStatus)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Footer */}
            <div className="card-footer bg-white border-top p-3 d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3">
              <div className="text-muted small">
                Showing <strong className="text-dark">{startItem}</strong> -{" "}
                <strong className="text-dark">{endItem}</strong> of{" "}
                <strong className="text-dark">{meta.totalItems}</strong> tickets
              </div>

              <div className="d-flex align-items-center gap-3">
                {/* Limit selector */}
                <div className="d-flex align-items-center gap-2">
                  <span className="text-muted small">Per page:</span>
                  <select
                    className="form-select form-select-sm"
                    style={{ width: "auto" }}
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                    data-testid="limit-select"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                {/* Page Navigation */}
                <div className="btn-group btn-group-sm">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    disabled={!meta.hasPrevPage}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    data-testid="prev-page-btn"
                  >
                    &laquo; Prev
                  </button>
                  <span className="btn btn-light disabled text-dark px-3">
                    Page {meta.currentPage} of {meta.totalPages}
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    disabled={!meta.hasNextPage}
                    onClick={() => setPage((p) => p + 1)}
                    data-testid="next-page-btn"
                  >
                    Next &raquo;
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
