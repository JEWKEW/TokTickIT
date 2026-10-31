import { useCallback, useEffect, useState } from "react";
import { DashboardFetchError, fetchStaffDashboard, StaffDashboardData } from "../api.js";

interface Props {
  userId: number;
  userName: string;
  onQueue: (filter?: { status?: string; ownerId?: string; search?: string; itPriority?: string }) => void;
  onCreateTicket: () => void;
  onSelectTicket: (ticketId: number) => void;
}

const statusNames = ["New", "Open", "In Progress", "Waiting for Requester", "Resolved", "Closed", "Reopened", "Cancelled"];
const panelStyle = { background: "var(--zg-surface-card)", border: "1px solid var(--zg-border-color)", borderRadius: 12 };

function statusClass(status: string) {
  if (status === "In Progress" || status === "Resolved") return "pill-status-in-progress";
  if (status === "Waiting for Requester") return "pill-status-pending";
  if (status === "Closed" || status === "Cancelled") return "pill-status-closed";
  return "pill-status-open";
}

export default function StaffDashboard({ userId, userName, onQueue, onCreateTicket, onSelectTicket }: Props) {
  const [data, setData] = useState<StaffDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);
  const load = useCallback(async () => {
    setLoading(true); setError(""); setForbidden(false);
    try { setData(await fetchStaffDashboard(userId)); }
    catch (err) {
      setData(null);
      setForbidden(err instanceof DashboardFetchError && err.status === 403);
      setError(err instanceof Error ? err.message : "Unable to load staff dashboard metrics.");
    } finally { setLoading(false); }
  }, [userId]);
  useEffect(() => { void load(); }, [load]);

  const cards = data ? [
    { label: "New", count: data.metrics.statusCounts.New ?? 0, filter: { status: "New" }, color: "#0284c7", hint: "Awaiting initial triage" },
    { label: "Open", count: data.metrics.statusCounts.Open ?? 0, filter: { status: "Open" }, color: "#0284c7", hint: "In active queue" },
    { label: "In Progress", count: data.metrics.statusCounts["In Progress"] ?? 0, filter: { status: "In Progress" }, color: "#15803d", hint: "Under investigation" },
    { label: "Waiting for Requester", count: data.metrics.statusCounts["Waiting for Requester"] ?? 0, filter: { status: "Waiting for Requester" }, color: "#ea580c", hint: "Pending user response" },
    { label: "My Assigned", count: data.metrics.myAssignedCount, filter: { ownerId: String(userId) }, color: "#006039", hint: "Assigned to me" },
    { label: "Unassigned", count: data.metrics.unassignedCount, filter: { ownerId: "unassigned" }, color: "#475569", hint: "Needs owner assignment" },
  ] : [];

  return <section className="container py-4" style={{ maxWidth: 1200 }} data-testid="staff-dashboard">
    <header className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
      <div><h1 className="h3 fw-bold mb-1">IT Staff Operational Dashboard</h1><p className="text-muted mb-0">Welcome back, {userName}! Here&apos;s what&apos;s happening with your queue today.</p></div>
      <button className="btn btn-outline-success" onClick={() => void load()} disabled={loading} data-testid="staff-dashboard-refresh"><span aria-hidden="true">↻ </span>{loading ? "Refreshing…" : "Refresh"}</button>
    </header>
    {forbidden && <div className="alert alert-warning" role="alert" data-testid="staff-dashboard-forbidden"><strong>403 Forbidden.</strong> This dashboard is for IT Staff and Administrators.</div>}
    {error && !forbidden && <div className="alert alert-danger d-flex justify-content-between align-items-center" role="alert" data-testid="staff-dashboard-error"><span>Unable to load operational metrics. {error}</span><button className="btn btn-sm btn-outline-danger" onClick={() => void load()}>Retry</button></div>}
    {loading ? <div className="py-5 text-center" role="status" data-testid="staff-dashboard-loading"><span className="spinner-border text-zen-green" /><span className="visually-hidden">Loading staff dashboard…</span></div> : data && <>
      {data.adminUserCounts && <div className="small text-muted mb-3" data-testid="staff-active-user-counts">Active accounts: Requesters {data.adminUserCounts.activeRequesters} · IT Staff {data.adminUserCounts.activeStaff} · Administrators {data.adminUserCounts.activeAdmins}</div>}
      <div className="row g-3 mb-4" data-testid="staff-dashboard-metrics">{cards.map((card) => <div className="col-12 col-sm-6 col-lg-4 col-xl-2" key={card.label}>
        <button type="button" className="w-100 h-100 text-start p-3" style={{ ...panelStyle, borderTop: `4px solid ${card.color}` }} onClick={() => onQueue(card.filter)} aria-label={`View ${card.count} ${card.label} tickets`} data-testid={`staff-metric-${card.label.toLowerCase().replaceAll(" ", "-")}`}>
          <span className="d-block text-muted small">{card.label}</span><strong className="fs-2" style={{ color: card.color }}>{card.count}</strong><span className="d-block small text-muted">{card.hint}</span>
        </button>
      </div>)}</div>
      <div className="row g-3 mb-4"><div className="col-12"><section className="p-3" style={panelStyle} aria-labelledby="staff-status-breakdown-title"><h2 id="staff-status-breakdown-title" className="h5">Ticket Status Breakdown</h2><div className="d-flex flex-wrap gap-2">{statusNames.map((status) => <button key={status} type="button" className="btn btn-light border d-flex align-items-center gap-2" onClick={() => onQueue({ status })} data-testid={`staff-status-${status.toLowerCase().replaceAll(" ", "-")}`}><span className={`pill-badge ${statusClass(status)}`}>{status}</span><strong>{data.metrics.statusCounts[status] ?? 0}</strong></button>)}</div>
        <h3 className="h6 mt-3">IT Priority</h3><div className="d-flex flex-wrap gap-2">{Object.entries(data.metrics.priorityCounts).length ? Object.entries(data.metrics.priorityCounts).map(([priority, count]) => <button key={priority} className="btn btn-light border" onClick={() => onQueue({ itPriority: priority })}>{priority}: <strong>{count}</strong></button>) : <span className="text-muted">No IT priorities assigned.</span>}</div>
      </section></div></div>
      <div className="row g-3">
        <div className="col-12 col-lg-7"><section className="p-3 h-100" style={panelStyle}><div className="d-flex justify-content-between align-items-center mb-2"><h2 className="h5 mb-0">My Recent Tickets</h2><button className="btn btn-link" onClick={() => onQueue()}>View all</button></div>
          {!data.recentTickets.length ? <p className="text-muted" data-testid="staff-recent-tickets-empty">No recent Tickets in the queue.</p> : <div className="list-group list-group-flush">{data.recentTickets.map((ticket) => { const urgent = ["high", "urgent"].includes((ticket.itPriority || "").toLowerCase()); return <button key={ticket.id} className="list-group-item list-group-item-action px-1" onClick={() => onSelectTicket(ticket.id)} data-testid={`staff-recent-ticket-${ticket.id}`}><div className="d-flex flex-wrap justify-content-between gap-2"><strong className="text-zen-green font-monospace">{ticket.ticketNumber}</strong><span className={`pill-badge ${statusClass(ticket.currentStatus)}`}>{ticket.currentStatus}</span></div><div className="d-flex justify-content-between gap-2"><span className="text-truncate">{ticket.summary}</span><span className="d-flex align-items-center gap-1">{ticket.itPriority ? <span className={`pill-badge ${urgent ? "pill-priority-high" : "pill-priority-medium"}`}>{urgent ? "! " : ""}{ticket.itPriority}{urgent ? " priority" : ""}</span> : <span className="small text-muted">No priority</span>}{ticket.owner === null && <span className="pill-badge pill-status-pending">Unassigned</span>}</span></div><small className="text-muted">Updated {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(ticket.updatedAt))}</small></button>; })}</div>}
        </section></div>
        <div className="col-12 col-lg-5"><section className="p-3 h-100" style={panelStyle}><h2 className="h5">My Actions Taken History</h2>
          {!data.myRecentActions.length ? <p className="text-muted" data-testid="staff-actions-empty">No Actions Taken recorded yet.</p> : <div className="list-group list-group-flush">{data.myRecentActions.map((action) => <button key={action.id} className="list-group-item list-group-item-action px-1 text-start" onClick={() => onSelectTicket(action.ticketId)} data-testid={`staff-action-${action.id}`}><strong className="text-zen-green font-monospace">{action.ticketNumber}</strong><p className="mb-1 text-truncate">{action.actionDescription}</p><small className="text-muted">{action.result} · {new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(action.actionDateTime))}</small>{action.followUpRequired && <span className="pill-badge pill-status-pending ms-2">Follow-up required</span>}</button>)}</div>}
        </section></div>
      </div>
      <div className="d-flex flex-wrap gap-2 mt-4" aria-label="Quick Actions"><button className="btn btn-zen-green" onClick={onCreateTicket}>＋ Create Ticket</button><button className="btn btn-outline-zen-green" onClick={() => onQueue({ search: "" })}>⌕ Search Tickets</button><button className="btn btn-outline-zen-green" onClick={() => onQueue({ ownerId: String(userId) })}>▣ My Queue</button></div>
    </>}
  </section>;
}
