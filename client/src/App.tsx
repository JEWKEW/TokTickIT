import { useState } from "react";
import { checkSystem, Category, Requester } from "./api.js";
import Navbar from "./components/Navbar.js";
import RequesterSelection from "./components/RequesterSelection.js";
import CreateTicketForm from "./components/CreateTicketForm.js";

type UiState = "idle" | "loading" | "success" | "error";
type ViewState = "dashboard" | "create-ticket";

export default function App() {
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

  const [currentView, setCurrentView] = useState<ViewState>("dashboard");
  const [state, setState] = useState<UiState>("idle");
  const [categories, setCategories] = useState<Category[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>("");

  function handleSelectRequester(requester: Requester) {
    setActiveRequester(requester);
    sessionStorage.setItem("selectedRequester", JSON.stringify(requester));
    sessionStorage.setItem("x-user-id", requester.id.toString());
    setCurrentView("dashboard");
  }

  function handleChangeRequester() {
    setActiveRequester(null);
    sessionStorage.removeItem("selectedRequester");
    sessionStorage.removeItem("x-user-id");
    setState("idle");
    setCategories([]);
    setErrorMsg("");
    setCurrentView("dashboard");
  }

  async function handleCheck() {
    setState("loading");
    setErrorMsg("");
    try {
      const status = await checkSystem();
      setCategories(status.categories);
      setState("success");
    } catch (err: any) {
      setErrorMsg(err.message || "Unable to connect to TokTickIT API");
      setState("error");
    }
  }

  return (
    <div className="min-vh-100 d-flex flex-column">
      <Navbar
        activeRequester={activeRequester}
        onChangeRequester={handleChangeRequester}
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
      />

      <main className="flex-grow-1 bg-light">
        {!activeRequester ? (
          <RequesterSelection onSelectRequester={handleSelectRequester} />
        ) : currentView === "create-ticket" ? (
          <CreateTicketForm
            userId={activeRequester.id}
            onCancel={() => setCurrentView("dashboard")}
          />
        ) : (
          <div className="container py-5" style={{ maxWidth: 768 }}>
            <div className="card shadow-sm p-4 border-0 mb-4 bg-white rounded-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h1 className="h4 text-zen-green mb-1 fw-bold">
                    Requester Portal Dashboard
                  </h1>
                  <p className="text-muted small mb-0">
                    Active Context: <strong>{activeRequester.name}</strong> ({activeRequester.email})
                  </p>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <button
                    type="button"
                    className="btn btn-zen-green btn-sm fw-bold px-3"
                    onClick={() => setCurrentView("create-ticket")}
                    data-testid="create-ticket-btn"
                  >
                    + New Ticket
                  </button>
                  <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 border border-success border-opacity-25 rounded-pill">
                    Simulated Session
                  </span>
                </div>
              </div>

              <div className="border-top pt-4 mt-2">
                <button
                  className="btn btn-zen-green mb-3"
                  onClick={handleCheck}
                  disabled={state === "loading"}
                  data-testid="check-system-btn"
                >
                  {state === "loading" ? "Loading…" : "Check System"}
                </button>

                {state === "loading" && (
                  <div className="mt-3 text-muted">Loading…</div>
                )}

                {state === "success" && (
                  <div className="mt-3">
                    <div className="alert alert-success">
                      System Status: Online
                    </div>
                    <div className="mt-3">
                      <h2 className="h6 fw-bold">Supported Request Categories:</h2>
                      <ol className="list-group list-group-numbered mt-2">
                        {categories.map((category) => (
                          <li key={category.id} className="list-group-item">
                            {category.name}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}

                {state === "error" && (
                  <div className="mt-3 alert alert-danger">
                    <div>System Status: Offline</div>
                    <div className="mt-1">{errorMsg}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
