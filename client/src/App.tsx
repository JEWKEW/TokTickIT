import { useState } from "react";
import { checkSystem, Category, Requester } from "./api.js";
import Navbar from "./components/Navbar.js";
import RequesterSelection from "./components/RequesterSelection.js";
import CreateTicketForm from "./components/CreateTicketForm.js";
import MyTicketsList from "./components/MyTicketsList.js";

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
          <div>
            <MyTicketsList
              userId={activeRequester.id}
              onCreateTicket={() => setCurrentView("create-ticket")}
            />

            <div className="container pb-5" style={{ maxWidth: 768 }}>
              <div className="card shadow-sm p-4 border-0 mb-4 bg-white rounded-3">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h2 className="h6 text-zen-green mb-1 fw-bold">
                      System Diagnostics
                    </h2>
                    <p className="text-muted small mb-0">
                      Active Context: <strong>{activeRequester.name}</strong> ({activeRequester.email})
                    </p>
                  </div>
                </div>

                <div className="border-top pt-3">
                  <button
                    className="btn btn-outline-success btn-sm mb-2 fw-medium"
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
                      <div className="alert alert-success py-2 px-3 small">
                        System Status: Online
                      </div>
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

                  {state === "error" && (
                    <div className="mt-3 alert alert-danger py-2 px-3 small">
                      <div>System Status: Offline</div>
                      <div className="mt-1">{errorMsg}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
