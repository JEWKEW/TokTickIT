import { useState, useEffect, useCallback } from "react";
import { getCurrentUser, logout, AuthUser, Category, Requester, checkSystem } from "./api.js";
import Navbar from "./components/Navbar.js";
import Login from "./components/Login.js";
import ChangePassword from "./components/ChangePassword.js";
import CreateTicketForm from "./components/CreateTicketForm.js";
import MyTicketsList from "./components/MyTicketsList.js";
import TicketDetail from "./components/TicketDetail.js";
import StaffTicketQueue from "./components/StaffTicketQueue.js";
import UserManagement from "./components/UserManagement.js";

type UiState = "idle" | "loading" | "success" | "error";

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

  const [diagState, setDiagState] = useState<UiState>("idle");
  const [categories, setCategories] = useState<Category[]>([]);
  const [diagError, setDiagError] = useState<string>("");

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
        setCurrentView("user-management");
      } else if (user.role === "IT_STAFF") {
        setCurrentView("queue");
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
      setCurrentView("user-management");
    } else if (user.role === "IT_STAFF") {
      setCurrentView("queue");
    } else {
      setCurrentView("dashboard");
    }
  };

  const handleSelectDevRequester = (requester: Requester) => {
    setActiveRequester(requester);
    sessionStorage.setItem("selectedRequester", JSON.stringify(requester));
    sessionStorage.setItem("x-user-id", requester.id.toString());
    setAuthUser({
      id: requester.id,
      name: requester.name,
      email: requester.email,
      role: "REQUESTER",
      mustChangePassword: false,
      isActive: true,
    });
    setCurrentView("dashboard");
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

  async function handleCheckSystem() {
    setDiagState("loading");
    setDiagError("");
    try {
      const status = await checkSystem();
      setCategories(status.categories);
      setDiagState("success");
    } catch (err: any) {
      setDiagError(err.message || "Unable to connect to TokTickIT API");
      setDiagState("error");
    }
  }

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
        onSelectDevRequester={handleSelectDevRequester}
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
        onSelectDevRequester={handleSelectDevRequester}
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
            ) : currentView === "create-ticket" ? (
              <CreateTicketForm
                userId={effectiveUser.id}
                onCancel={() => setCurrentView("dashboard")}
              />
            ) : (
              <MyTicketsList
                userId={effectiveUser.id}
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

        {/* System Diagnostics Footer */}
        <div className="container pb-5 mt-4 d-none" style={{ maxWidth: 768 }}>
          <div className="card shadow-sm p-4 border-0 mb-4 bg-white rounded-3">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h2 className="h6 text-zen-green mb-1 fw-bold">System Diagnostics</h2>
                <p className="text-muted small mb-0">
                  Authenticated User: <strong>{effectiveUser.name}</strong> ({effectiveUser.email}) &bull; Role: <strong>{effectiveUser.role}</strong>
                </p>
              </div>
            </div>

            <div className="border-top pt-3">
              <button
                className="btn btn-outline-success btn-sm mb-2 fw-medium"
                onClick={handleCheckSystem}
                disabled={diagState === "loading"}
                data-testid="check-system-btn"
              >
                {diagState === "loading" ? "Loading…" : "Check System"}
              </button>

              {diagState === "loading" && <div className="mt-3 text-muted">Loading…</div>}

              {diagState === "success" && (
                <div className="mt-3">
                  <div className="alert alert-success py-2 px-3 small">System Status: Online</div>
                  <div className="mt-2">
                    <h3 className="h6 fw-bold small">Supported Request Categories:</h3>
                    <ol className="list-group list-group-numbered mt-1 small">
                      {categories.map((category) => (
                        <li key={category.id} className="list-group-item py-1">
                          {category.name}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}

              {diagState === "error" && (
                <div className="mt-3 alert alert-danger py-2 px-3 small">
                  <div>System Status: Offline</div>
                  <div className="mt-1">{diagError}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
