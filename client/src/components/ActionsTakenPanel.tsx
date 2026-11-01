import React, { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  ActionTaken,
  ActionTakenInput,
  createActionTaken,
  fetchActionsTaken,
  updateActionTaken,
} from "../api.js";

interface Props {
  ticketId: number;
  userId: number;
  userRole: string;
}

interface Draft {
  actionDateTime: string;
  actionDescription: string;
  result: string;
  followUpRequired: boolean;
  followUpNote: string;
  attachmentNotes: string;
}

type FieldErrors = Partial<Record<keyof Draft, string>>;

const emptyDraft = (): Draft => ({
  actionDateTime: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
  actionDescription: "",
  result: "",
  followUpRequired: false,
  followUpNote: "",
  attachmentNotes: "",
});

function toLocalInput(value: string) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function asInput(draft: Draft): ActionTakenInput {
  return {
    ...draft,
    actionDateTime: new Date(draft.actionDateTime).toISOString(),
    actionDescription: draft.actionDescription.trim(),
    result: draft.result.trim(),
    followUpNote: draft.followUpRequired ? draft.followUpNote.trim() : null,
    attachmentNotes: draft.attachmentNotes.trim() || null,
  };
}

function draftFromAction(action: ActionTaken): Draft {
  return {
    actionDateTime: toLocalInput(action.actionDateTime),
    actionDescription: action.actionDescription,
    result: action.result,
    followUpRequired: action.followUpRequired,
    followUpNote: action.followUpNote || "",
    attachmentNotes: action.attachmentNotes || "",
  };
}

function formatDate(value: string) {
  return new Date(value).toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

export default function ActionsTakenPanel({ ticketId, userId, userRole }: Props) {
  const canEdit = userRole === "IT_STAFF" || userRole === "ADMINISTRATOR";
  const [actions, setActions] = useState<ActionTaken[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editing, setEditing] = useState<ActionTaken | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const loadActions = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setActions(await fetchActionsTaken(ticketId, userId));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load Actions Taken.");
    } finally {
      setLoading(false);
    }
  }, [ticketId, userId]);

  useEffect(() => { void loadActions(); }, [loadActions]);

  const beginEdit = (action: ActionTaken) => {
    setEditing(action);
    setFormOpen(true);
    setDraft(draftFromAction(action));
    setFormError("");
    setFieldErrors({});
    setNotice("");
  };

  const cancelForm = () => {
    setEditing(null);
    setFormOpen(false);
    setDraft(emptyDraft());
    setFormError("");
    setFieldErrors({});
    setNotice("");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (savingRef.current) return;
    setFormError("");
    setFieldErrors({});
    setNotice("");
    if (!draft.actionDateTime || !Number.isFinite(new Date(draft.actionDateTime).getTime())) {
      const message = "Enter a valid action date and time.";
      setFormError(message); setFieldErrors({ actionDateTime: message }); return;
    }
    if (new Date(draft.actionDateTime).getTime() > Date.now()) {
      const message = "Action date and time cannot be in the future.";
      setFormError(message); setFieldErrors({ actionDateTime: message }); return;
    }
    if (!draft.actionDescription.trim() || draft.actionDescription.length > 2000) {
      const message = "Action description is required and must be 2,000 characters or fewer.";
      setFormError(message); setFieldErrors({ actionDescription: message }); return;
    }
    if (!draft.result.trim() || draft.result.length > 1000) {
      const message = "Result is required and must be 1,000 characters or fewer.";
      setFormError(message); setFieldErrors({ result: message }); return;
    }
    if (draft.followUpRequired && !draft.followUpNote.trim()) {
      const message = "Enter a follow-up note when follow-up is required.";
      setFormError(message); setFieldErrors({ followUpNote: message }); return;
    }
    if (draft.followUpNote.length > 1000 || draft.attachmentNotes.length > 500) {
      setFormError("Follow-up note must be at most 1,000 characters and attachment notes at most 500."); return;
    }

    savingRef.current = true;
    setSaving(true);
    try {
      const input = asInput(draft);
      if (editing) await updateActionTaken(ticketId, editing.id, input, editing.updatedAt, userId);
      else await createActionTaken(ticketId, input, userId);
      cancelForm();
      setNotice(editing ? "Action Taken updated." : "Action Taken recorded.");
      await loadActions();
    } catch (error) {
      const coded = error as Error & { code?: string };
      if (coded.code === "STALE_UPDATE") {
        setFormError("This Action Taken changed while you were editing. The latest list has been refreshed; review it before retrying.");
        await loadActions();
      } else {
        setFormError(error instanceof Error ? error.message : "Could not save Action Taken. Your entries are preserved; try again.");
      }
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const field = (key: keyof Draft, value: string | boolean) => {
    setDraft((previous) => ({ ...previous, [key]: value }));
    if (fieldErrors[key] && formError === fieldErrors[key]) setFormError("");
    setFieldErrors((previous) => {
      if (!previous[key]) return previous;
      const next = { ...previous };
      delete next[key];
      return next;
    });
  };

  return (
    <section aria-labelledby="actions-taken-heading" data-testid="actions-taken-panel">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
        <h2 id="actions-taken-heading" className="h5 mb-0">Actions Taken <span className="custom-tab-badge">{actions.length}</span></h2>
        {canEdit && !editing && actions.length > 0 && <button type="button" className="btn btn-zen-green btn-sm" onClick={() => { setDraft(emptyDraft()); setFormOpen(true); setFormError(""); setFieldErrors({}); setNotice(""); }}>Record Action</button>}
      </div>

      {notice && <div className="alert alert-success py-2" role="status">{notice}</div>}
      {loadError && <div className="alert alert-danger py-2" role="alert">{loadError} <button type="button" className="btn btn-link p-0 ms-2" onClick={() => void loadActions()}>Retry</button></div>}
      {loading ? <div className="text-muted py-3" role="status">Loading Actions Taken…</div> : null}
      {!loading && !loadError && actions.length === 0 && <div className="text-muted py-3">No Actions Taken have been recorded for this Ticket.</div>}

      {actions.length > 0 && <div className="d-flex flex-column gap-3 mb-3">
        {actions.map((action) => <article key={action.id} className="border rounded-3 p-3" data-testid={`action-taken-${action.id}`}>
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
            <div><h3 className="h6 mb-1">{formatDate(action.actionDateTime)}</h3><div className="small text-muted">Performed by {action.performedBy?.name || "Staff member"}{action.performedBy?.role ? ` · ${action.performedBy.role.replaceAll("_", " ")}` : ""}</div></div>
            {canEdit && <button type="button" className="btn btn-outline-zen-green btn-sm" onClick={() => beginEdit(action)}>Edit</button>}
          </div>
          <div className="row g-3">
            <div className="col-12 col-md-6"><div className="small fw-semibold">Action Description</div><p className="mb-0 text-break">{action.actionDescription}</p></div>
            <div className="col-12 col-md-6"><div className="small fw-semibold">Result</div><p className="mb-0 text-break">{action.result}</p></div>
            <div className="col-12 col-md-6"><div className="small fw-semibold">Follow-up Required</div><p className="mb-0">{action.followUpRequired ? "Yes" : "No"}</p></div>
            {action.followUpRequired && <div className="col-12 col-md-6"><div className="small fw-semibold">Follow-up Note</div><p className="mb-0 text-break">{action.followUpNote || "No note provided"}</p></div>}
            {action.attachmentNotes && <div className="col-12"><div className="small fw-semibold">Attachment Notes</div><p className="mb-0 text-break">{action.attachmentNotes}</p></div>}
          </div>
        </article>)}
      </div>}

      {canEdit && (editing || formOpen || (!loading && !loadError && actions.length === 0)) && <form onSubmit={submit} className="p-3 bg-light rounded-3 border" noValidate aria-labelledby="actions-taken-form-heading">
        <h3 id="actions-taken-form-heading" className="h6 mb-3">{editing ? "Edit Action Taken" : "Record Action Taken"}</h3>
        {formError && <div className="alert alert-danger py-2" role="alert" data-testid="action-form-error">{Object.keys(fieldErrors).length ? "Please correct the highlighted field below." : formError}</div>}
        <div className="row g-3">
          <div className="col-12 col-md-6"><label className="form-label" htmlFor="actionDateTime">Action date and time</label><input id="actionDateTime" type="datetime-local" className="form-control" value={draft.actionDateTime} onChange={(e) => field("actionDateTime", e.target.value)} required aria-invalid={fieldErrors.actionDateTime ? "true" : undefined} aria-describedby={fieldErrors.actionDateTime ? "actionDateTime-error" : undefined} />{fieldErrors.actionDateTime && <div id="actionDateTime-error" className="text-danger small mt-1">{fieldErrors.actionDateTime}</div>}</div>
          <div className="col-12"><label className="form-label" htmlFor="actionDescription">Action description</label><textarea id="actionDescription" className="form-control" rows={3} maxLength={2000} value={draft.actionDescription} onChange={(e) => field("actionDescription", e.target.value)} required aria-invalid={fieldErrors.actionDescription ? "true" : undefined} aria-describedby={fieldErrors.actionDescription ? "actionDescription-error actionDescription-help" : "actionDescription-help"} />{fieldErrors.actionDescription && <div id="actionDescription-error" className="text-danger small mt-1">{fieldErrors.actionDescription}</div>}<div id="actionDescription-help" className="form-text">Up to 2,000 characters.</div></div>
          <div className="col-12"><label className="form-label" htmlFor="actionResult">Result</label><textarea id="actionResult" className="form-control" rows={2} maxLength={1000} value={draft.result} onChange={(e) => field("result", e.target.value)} required aria-invalid={fieldErrors.result ? "true" : undefined} aria-describedby={fieldErrors.result ? "actionResult-error" : undefined} />{fieldErrors.result && <div id="actionResult-error" className="text-danger small mt-1">{fieldErrors.result}</div>}</div>
          <div className="col-12"><div className="form-check"><input id="followUpRequired" type="checkbox" className="form-check-input" checked={draft.followUpRequired} onChange={(e) => field("followUpRequired", e.target.checked)} /><label className="form-check-label" htmlFor="followUpRequired">Follow-up required</label></div></div>
          {draft.followUpRequired && <div className="col-12"><label className="form-label" htmlFor="followUpNote">Follow-up note <span className="text-danger">(required)</span></label><textarea id="followUpNote" className="form-control" rows={2} maxLength={1000} value={draft.followUpNote} onChange={(e) => field("followUpNote", e.target.value)} aria-required="true" aria-invalid={fieldErrors.followUpNote ? "true" : undefined} aria-describedby={fieldErrors.followUpNote ? "followUpNote-error" : undefined} />{fieldErrors.followUpNote && <div id="followUpNote-error" className="text-danger small mt-1">{fieldErrors.followUpNote}</div>}</div>}
          <div className="col-12"><label className="form-label" htmlFor="attachmentNotes">Attachment notes <span className="text-muted">(optional)</span></label><textarea id="attachmentNotes" className="form-control" rows={2} maxLength={500} value={draft.attachmentNotes} onChange={(e) => field("attachmentNotes", e.target.value)} /></div>
        </div>
        <div className="d-flex flex-wrap justify-content-end gap-2 mt-3">
          {editing && <button type="button" className="btn btn-outline-secondary" onClick={cancelForm} disabled={saving}>Cancel</button>}
          <button type="submit" className="btn btn-zen-green" disabled={saving} aria-disabled={saving}>{saving ? "Saving…" : editing ? "Save Changes" : "Record Action"}</button>
        </div>
      </form>}
    </section>
  );
}
