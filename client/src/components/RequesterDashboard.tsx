import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { fetchRequesterDashboard, RequesterDashboardData } from "../api.js";

interface Props {
  userId: number;
  userName: string;
  onCreateTicket: () => void;
  onViewTickets: (status?: string) => void;
  onSelectTicket: (ticketId: number) => void;
}

const cardStyle: CSSProperties = { background: "var(--zg-surface-card)", border: "1px solid var(--zg-border-color)", borderRadius: 12 };
const dateLabel = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

function statusClass(status: string) {
  const normalized = status.toLowerCase().trim();
  if (normalized === "in progress" || normalized === "in_progress") return "pill-status-in-progress";
  if (normalized === "resolved") return "pill-status-resolved";
  if (normalized === "waiting for requester" || normalized === "pending") return "pill-status-pending";
  if (normalized === "closed" || normalized === "cancelled") return normalized === "cancelled" ? "pill-status-cancelled" : "pill-status-closed";
  return "pill-status-open";
}

export default function RequesterDashboard({ userId, userName, onCreateTicket, onViewTickets, onSelectTicket }: Props) {
  const [data, setData] = useState<RequesterDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setData(await fetchRequesterDashboard(userId)); }
    catch (err) { setError(err instanceof Error ? err.message : "Unable to load your dashboard."); }
    finally { setLoading(false); }
  }, [userId]);
  useEffect(() => { void load(); }, [load]);

  const metrics = [
    { label: "My Open Tickets", value: data?.metrics.openCount, status: "open-tickets", color: "#0284c7" },
    { label: "In Progress", value: data?.metrics.inProgressCount, status: "In Progress", color: "#15803d" },
    { label: "Resolved", value: data?.metrics.resolvedCount, status: "Resolved", color: "#15803d" },
    { label: "Closed", value: data?.metrics.closedCount, status: "Closed", color: "#475569" },
  ];
  const recentTickets = data ? [...new Map([...data.recentlyUpdated, ...data.recentlyResolved].map((ticket) => [ticket.id, ticket] as const)).values()]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5) : [];
  return <section className="container py-4" style={{ maxWidth: 1120 }} data-testid="requester-dashboard">
    <header className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
      <div><h1 className="h3 fw-bold mb-1">Welcome, {userName}!</h1><p className="text-muted mb-0">Here&apos;s the latest on your requests.</p></div>
    </header>
    {error && <div className="alert alert-danger d-flex justify-content-between align-items-center" role="alert" data-testid="dashboard-error"><span>{error}</span><button className="btn btn-sm btn-outline-danger" onClick={() => void load()}>Retry</button></div>}
    {loading ? <div className="py-5 text-center" role="status" data-testid="dashboard-loading"><span className="spinner-border text-zen-green" /><span className="visually-hidden">Loading dashboard…</span></div> : data && <>
      <div className="row g-3 mb-4" data-testid="dashboard-metrics">{metrics.map((metric) => <div className="col-12 col-sm-6 col-lg-3" key={metric.label}>
        <button type="button" className="w-100 text-start p-3 h-100" style={{ ...cardStyle, borderTop: `4px solid ${metric.color}` }} onClick={() => onViewTickets(metric.status)} aria-label={`View ${metric.value} ${metric.label}`} data-testid={`metric-${metric.label.toLowerCase().replaceAll(" ", "-")}`}>
          <span className="d-block text-muted small">{metric.label}</span><strong className="fs-2" style={{ color: metric.color }}>{metric.value}</strong><span className="d-block small text-zen-green">View tickets →</span>
        </button>
      </div>)}</div>
      <div className="row g-3">
        <div className="col-12 col-lg-7"><div className="p-3 h-100" style={cardStyle}><div className="d-flex justify-content-between align-items-center mb-2"><h2 className="h5 mb-0">My Recent Tickets</h2><button className="btn btn-link" onClick={() => onViewTickets()}>View all</button></div>
          {recentTickets.length === 0 ? <p className="text-muted mb-0" data-testid="dashboard-empty">No tickets to show yet.</p> : <div className="list-group list-group-flush">{recentTickets.map((ticket) => <button className="list-group-item list-group-item-action px-1" key={ticket.id} onClick={() => onSelectTicket(ticket.id)} data-testid={`recent-ticket-${ticket.id}`}><div className="d-flex justify-content-between gap-2"><strong className="text-zen-green font-monospace">{ticket.ticketNumber}</strong><span className={`pill-badge ${statusClass(ticket.currentStatus)}`}>{ticket.currentStatus}</span></div><div className="text-truncate">{ticket.summary}</div><small className="text-muted">{dateLabel(ticket.updatedAt)}</small></button>)}</div>}
        </div></div>
        <div className="col-12 col-lg-5"><div className="p-3 h-100" style={cardStyle}><h2 className="h5 mb-3">Quick Actions</h2>
          <button type="button" className="btn btn-outline-success w-100 d-flex align-items-center gap-3 text-start p-3 mb-3" onClick={onCreateTicket} data-testid="dashboard-create-ticket"><span className="fs-3" aria-hidden="true">＋</span><span><strong className="d-block">Create Ticket</strong><small className="text-muted">Submit a new request</small></span></button>
          <button type="button" className="btn btn-outline-success w-100 d-flex align-items-center gap-3 text-start p-3" onClick={() => onViewTickets()} data-testid="dashboard-view-tickets"><span className="fs-4" aria-hidden="true">▣</span><span><strong className="d-block">View My Tickets</strong><small className="text-muted">Track existing requests</small></span></button>
        </div></div>
      </div>
    </>}
  </section>;
}
