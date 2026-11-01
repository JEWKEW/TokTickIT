import { useState, useEffect, useCallback } from "react";
import { getCurrentUser, logout, AuthUser, Requester } from "./api.js";
import Navbar from "./components/Navbar.js";
import Login from "./components/Login.js";
import ChangePassword from "./components/ChangePassword.js";
import CreateTicketForm from "./components/CreateTicketForm.js";
import MyTicketsList from "./components/MyTicketsList.js";
import TicketDetail from "./components/TicketDetail.js";
import StaffTicketQueue from "./components/StaffTicketQueue.js";
import UserManagement from "./components/UserManagement.js";
import RequesterDashboard from "./components/RequesterDashboard.js";
import StaffDashboard from "./components/StaffDashboard.js";

export default function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [activeRequester, setActiveRequester] = useState<Requester | null>(() => {
    const saved = sessionStorage.getItem("selectedRequester");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [loadingAuth, setLoadingAuth] = useState<boolean>(() => {
    return Boolean(sessionStorage.getItem("token") || localStorage.getItem("token"));
  });

  const [currentView, setCurrentView] = useState<string>("dashboard");
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

  const checkAuth = useCallback(async () => {
    const hasToken = Boolean(sessionStorage.getItem("token") || localStorage.getItem("token"));
    if (!hasToken) {
      setLoadingAuth(false);
      return;
    }
    setLoadingAuth(true);
    try {
      const user = await getCurrentUser();
      setAuthUser(user);
      if (user.role === "ADMINISTRATOR") {
        setCurrentView("dashboard");
      } else if (user.role === "IT_STAFF") {
        setCurrentView("dashboard");
      } else {
        setCurrentView("dashboard");
      }
    } catch {
      const saved = sessionStorage.getItem("selectedRequester");
      if (saved) {
        try {
          const req = JSON.parse(saved);
          setActiveRequester(req);
          setAuthUser({
            id: req.id,
            name: req.name,
            email: req.email,
            role: "REQUESTER",
            mustChangePassword: false,
            isActive: true,
          });
        } catch {
          setAuthUser(null);
        }
      } else {
        setAuthUser(null);
      }
    } finally {
      setLoadingAuth(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLoginSuccess = (user: AuthUser) => {
    setAuthUser(user);
    if (user.role === "ADMINISTRATOR") {
      setCurrentView("dashboard");
    } else if (user.role === "IT_STAFF") {
      setCurrentView("dashboard");
    } else {
      setCurrentView("dashboard");
    }
  };

  const handleLogout = async () => {
    sessionStorage.removeItem("selectedRequester");
    sessionStorage.removeItem("x-user-id");
    sessionStorage.removeItem("token");
    localStorage.removeItem("token");
    setAuthUser(null);
    setActiveRequester(null);
    setSelectedTicketId(null);
    setCurrentView("dashboard");
    await logout();
  };

  if (loadingAuth) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light" data-testid="app-loading">
        <div className="text-center">
          <div className="spinner-border text-zen-green mb-3" role="status">
            <span className="visually-hidden">Loading application...</span>
          </div>
          <p className="text-muted fw-medium">Loading TokTickIT...</p>
        </div>
      </div>
    );
  }

  if (!authUser && !activeRequester) {
    return (
      <Login
        onSuccess={handleLoginSuccess}
      />
    );
  }

  if (authUser && authUser.mustChangePassword) {
    return (
      <ChangePassword
        onSuccess={() => {
          setAuthUser((prev) => (prev ? { ...prev, mustChangePassword: false } : null));
        }}
        onLogout={handleLogout}
      />
    );
  }

  const effectiveUser = authUser || (activeRequester ? {
    id: activeRequester.id,
    name: activeRequester.name,
    email: activeRequester.email,
    role: "REQUESTER",
    mustChangePassword: false,
    isActive: true,
  } : null);

  if (!effectiveUser) {
    return (
      <Login
        onSuccess={handleLoginSuccess}
      />
    );
  }

  const role = effectiveUser.role;
  const isRequester = role === "REQUESTER";
  const isStaff = role === "IT_STAFF";
  const isAdmin = role === "ADMINISTRATOR";

  return (
    <div className="min-vh-100 d-flex flex-column bg-light" data-testid="app-authenticated">
      <Navbar
        authUser={effectiveUser}
        activeRequester={activeRequester}
        onChangeRequester={handleLogout}
        onLogout={handleLogout}
        currentView={currentView}
        onNavigate={(view) => {
          setSelectedTicketId(null);
          setCurrentView(view);
        }}
      />

      <main className="flex-grow-1">
        {/* REQUESTER Views */}
        {isRequester && (
          <>
            {currentView === "ticket-detail" && selectedTicketId !== null ? (
              <TicketDetail
                ticketId={selectedTicketId}
                userId={effectiveUser.id}
                userRole={effectiveUser.role}
                onBack={() => {
                  setSelectedTicketId(null);
                  setCurrentView("dashboard");
                }}
              />
            ) : currentView === "dashboard" ? (
              <RequesterDashboard
                userId={effectiveUser.id}
                userName={effectiveUser.name}
                onCreateTicket={() => setCurrentView("create-ticket")}
                onViewTickets={(status) => {
                  sessionStorage.setItem("requesterTicketStatusFilter", status || "all");
                  setCurrentView("my-tickets");
                }}
                onSelectTicket={(ticketId) => { setSelectedTicketId(ticketId); setCurrentView("ticket-detail"); }}
              />
            ) : currentView === "create-ticket" ? (
              <CreateTicketForm
                userId={effectiveUser.id}
                onCancel={() => setCurrentView("dashboard")}
              />
            ) : (
              <MyTicketsList
                userId={effectiveUser.id}
                initialStatus={sessionStorage.getItem("requesterTicketStatusFilter") || "all"}
                onCreateTicket={() => setCurrentView("create-ticket")}
                onSelectTicket={(ticketId) => {
                  setSelectedTicketId(ticketId);
                  setCurrentView("ticket-detail");
                }}
              />
            )}
          </>
        )}

        {/* IT STAFF Views */}
        {isStaff && (
          <>
            {currentView === "ticket-detail" && selectedTicketId !== null ? (
              <TicketDetail
                ticketId={selectedTicketId}
                userId={effectiveUser.id}
                userRole={effectiveUser.role}
                onBack={() => {
                  setSelectedTicketId(null);
                  setCurrentView("queue");
                }}
              />
            ) : currentView === "dashboard" ? (
              <StaffDashboard userId={effectiveUser.id} userName={effectiveUser.name}
                onQueue={(filter) => { sessionStorage.setItem("staffQueueFilter", JSON.stringify(filter || {})); setCurrentView("queue"); }}
                onCreateTicket={() => setCurrentView("create-ticket")}
                onSelectTicket={(ticketId) => { setSelectedTicketId(ticketId); setCurrentView("ticket-detail"); }} />
            ) : currentView === "create-ticket" ? (
              <CreateTicketForm userId={effectiveUser.id} onCancel={() => setCurrentView("dashboard")} />
            ) : (
              <StaffTicketQueue
                userRole={effectiveUser.role}
                tokenOrUserId={effectiveUser.id}
                onSelectTicket={(ticketId) => {
                  setSelectedTicketId(ticketId);
                  setCurrentView("ticket-detail");
                }}
              />
            )}
          </>
        )}

        {/* ADMINISTRATOR Views */}
        {isAdmin && (
          <>
            {currentView === "user-management" ? (
              <UserManagement currentAdminId={effectiveUser.id} />
            ) : currentView === "ticket-detail" && selectedTicketId !== null ? (
              <TicketDetail
                ticketId={selectedTicketId}
                userId={effectiveUser.id}
                userRole={effectiveUser.role}
                onBack={() => {
                  setSelectedTicketId(null);
                  setCurrentView("queue");
                }}
              />
            ) : currentView === "dashboard" ? (
              <StaffDashboard userId={effectiveUser.id} userName={effectiveUser.name}
                onQueue={(filter) => { sessionStorage.setItem("staffQueueFilter", JSON.stringify(filter || {})); setCurrentView("queue"); }}
                onCreateTicket={() => setCurrentView("create-ticket")}
                onSelectTicket={(ticketId) => { setSelectedTicketId(ticketId); setCurrentView("ticket-detail"); }} />
            ) : currentView === "create-ticket" ? (
              <CreateTicketForm userId={effectiveUser.id} onCancel={() => setCurrentView("dashboard")} />
            ) : (
              <StaffTicketQueue
                userRole={effectiveUser.role}
                tokenOrUserId={effectiveUser.id}
                onSelectTicket={(ticketId) => {
                  setSelectedTicketId(ticketId);
                  setCurrentView("ticket-detail");
                }}
              />
            )}
          </>
        )}

      </main>
    </div>
  );
}
