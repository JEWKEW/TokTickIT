import { useState } from "react";
import { checkSystem, Category } from "./api.js";

// UI states you must handle for Issue 4: idle, loading, success, error.
type UiState = "idle" | "loading" | "success" | "error";

export default function App() {
  const [state, setState] = useState<UiState>("idle");
  const [categories, setCategories] = useState<Category[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>("");

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
    <div className="container py-5" style={{ maxWidth: 640 }}>
      <h1 className="h3 mb-4">
        TokTickIT <span className="text-success">IT Service Desk</span>
      </h1>

      <button className="btn btn-success" onClick={handleCheck} disabled={state === "loading"}>
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
  );
}
