import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from "react";
import { createActionTaken, fetchActionsTaken, updateActionTaken, } from "../api.js";
const emptyDraft = () => ({
    actionDateTime: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
    actionDescription: "",
    result: "",
    followUpRequired: false,
    followUpNote: "",
    attachmentNotes: "",
});
function toLocalInput(value) {
    const date = new Date(value);
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
function asInput(draft) {
    return {
        ...draft,
        actionDateTime: new Date(draft.actionDateTime).toISOString(),
        actionDescription: draft.actionDescription.trim(),
        result: draft.result.trim(),
        followUpNote: draft.followUpRequired ? draft.followUpNote.trim() : null,
        attachmentNotes: draft.attachmentNotes.trim() || null,
    };
}
function draftFromAction(action) {
    return {
        actionDateTime: toLocalInput(action.actionDateTime),
        actionDescription: action.actionDescription,
        result: action.result,
        followUpRequired: action.followUpRequired,
        followUpNote: action.followUpNote || "",
        attachmentNotes: action.attachmentNotes || "",
    };
}
function formatDate(value) {
    return new Date(value).toLocaleString(undefined, {
        year: "numeric", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
    });
}
export default function ActionsTakenPanel({ ticketId, userId, userRole }) {
    const canEdit = userRole === "IT_STAFF" || userRole === "ADMINISTRATOR";
    const [actions, setActions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [draft, setDraft] = useState(emptyDraft);
    const [editing, setEditing] = useState(null);
    const [formOpen, setFormOpen] = useState(false);
    const [formError, setFormError] = useState("");
    const [notice, setNotice] = useState("");
    const [saving, setSaving] = useState(false);
    const savingRef = useRef(false);
    const loadActions = useCallback(async () => {
        setLoading(true);
        setLoadError("");
        try {
            setActions(await fetchActionsTaken(ticketId, userId));
        }
        catch (error) {
            setLoadError(error instanceof Error ? error.message : "Unable to load Actions Taken.");
        }
        finally {
            setLoading(false);
        }
    }, [ticketId, userId]);
    useEffect(() => { void loadActions(); }, [loadActions]);
    const beginEdit = (action) => {
        setEditing(action);
        setFormOpen(true);
        setDraft(draftFromAction(action));
        setFormError("");
        setNotice("");
    };
    const cancelForm = () => {
        setEditing(null);
        setFormOpen(false);
        setDraft(emptyDraft());
        setFormError("");
        setNotice("");
    };
    const submit = async (event) => {
        event.preventDefault();
        if (savingRef.current)
            return;
        setFormError("");
        setNotice("");
        if (!draft.actionDateTime || !Number.isFinite(new Date(draft.actionDateTime).getTime())) {
            setFormError("Enter a valid action date and time.");
            return;
        }
        if (new Date(draft.actionDateTime).getTime() > Date.now()) {
            setFormError("Action date and time cannot be in the future.");
            return;
        }
        if (!draft.actionDescription.trim() || draft.actionDescription.length > 2000) {
            setFormError("Action description is required and must be 2,000 characters or fewer.");
            return;
        }
        if (!draft.result.trim() || draft.result.length > 1000) {
            setFormError("Result is required and must be 1,000 characters or fewer.");
            return;
        }
        if (draft.followUpRequired && !draft.followUpNote.trim()) {
            setFormError("Enter a follow-up note when follow-up is required.");
            return;
        }
        if (draft.followUpNote.length > 1000 || draft.attachmentNotes.length > 500) {
            setFormError("Follow-up note must be at most 1,000 characters and attachment notes at most 500.");
            return;
        }
        savingRef.current = true;
        setSaving(true);
        try {
            const input = asInput(draft);
            if (editing)
                await updateActionTaken(ticketId, editing.id, input, editing.updatedAt, userId);
            else
                await createActionTaken(ticketId, input, userId);
            cancelForm();
            setNotice(editing ? "Action Taken updated." : "Action Taken recorded.");
            await loadActions();
        }
        catch (error) {
            const coded = error;
            if (coded.code === "STALE_UPDATE") {
                setFormError("This Action Taken changed while you were editing. The latest list has been refreshed; review it before retrying.");
                await loadActions();
            }
            else {
                setFormError(error instanceof Error ? error.message : "Could not save Action Taken. Your entries are preserved; try again.");
            }
        }
        finally {
            savingRef.current = false;
            setSaving(false);
        }
    };
    const field = (key, value) => setDraft((previous) => ({ ...previous, [key]: value }));
    return (_jsxs("section", { "aria-labelledby": "actions-taken-heading", "data-testid": "actions-taken-panel", children: [_jsxs("div", { className: "d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3", children: [_jsxs("h2", { id: "actions-taken-heading", className: "h5 mb-0", children: ["Actions Taken ", _jsx("span", { className: "custom-tab-badge", children: actions.length })] }), canEdit && !editing && actions.length > 0 && _jsx("button", { type: "button", className: "btn btn-zen-green btn-sm", onClick: () => { setDraft(emptyDraft()); setFormOpen(true); setFormError(""); setNotice(""); }, children: "Record Action" })] }), notice && _jsx("div", { className: "alert alert-success py-2", role: "status", children: notice }), loadError && _jsxs("div", { className: "alert alert-danger py-2", role: "alert", children: [loadError, " ", _jsx("button", { type: "button", className: "btn btn-link p-0 ms-2", onClick: () => void loadActions(), children: "Retry" })] }), loading ? _jsx("div", { className: "text-muted py-3", role: "status", children: "Loading Actions Taken\u2026" }) : null, !loading && !loadError && actions.length === 0 && _jsx("div", { className: "text-muted py-3", children: "No Actions Taken have been recorded for this Ticket." }), actions.length > 0 && _jsx("div", { className: "d-flex flex-column gap-3 mb-3", children: actions.map((action) => _jsxs("article", { className: "border rounded-3 p-3", "data-testid": `action-taken-${action.id}`, children: [_jsxs("div", { className: "d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2", children: [_jsxs("div", { children: [_jsx("h3", { className: "h6 mb-1", children: formatDate(action.actionDateTime) }), _jsxs("div", { className: "small text-muted", children: ["Performed by ", action.performedBy?.name || "Staff member", action.performedBy?.role ? ` · ${action.performedBy.role.replaceAll("_", " ")}` : ""] })] }), canEdit && _jsx("button", { type: "button", className: "btn btn-outline-zen-green btn-sm", onClick: () => beginEdit(action), children: "Edit" })] }), _jsxs("div", { className: "row g-3", children: [_jsxs("div", { className: "col-12 col-md-6", children: [_jsx("div", { className: "small fw-semibold", children: "Action Description" }), _jsx("p", { className: "mb-0 text-break", children: action.actionDescription })] }), _jsxs("div", { className: "col-12 col-md-6", children: [_jsx("div", { className: "small fw-semibold", children: "Result" }), _jsx("p", { className: "mb-0 text-break", children: action.result })] }), _jsxs("div", { className: "col-12 col-md-6", children: [_jsx("div", { className: "small fw-semibold", children: "Follow-up Required" }), _jsx("p", { className: "mb-0", children: action.followUpRequired ? "Yes" : "No" })] }), action.followUpRequired && _jsxs("div", { className: "col-12 col-md-6", children: [_jsx("div", { className: "small fw-semibold", children: "Follow-up Note" }), _jsx("p", { className: "mb-0 text-break", children: action.followUpNote || "No note provided" })] }), action.attachmentNotes && _jsxs("div", { className: "col-12", children: [_jsx("div", { className: "small fw-semibold", children: "Attachment Notes" }), _jsx("p", { className: "mb-0 text-break", children: action.attachmentNotes })] })] })] }, action.id)) }), canEdit && (editing || formOpen || (!loading && !loadError && actions.length === 0)) && _jsxs("form", { onSubmit: submit, className: "p-3 bg-light rounded-3 border", noValidate: true, children: [_jsx("h3", { className: "h6 mb-3", children: editing ? "Edit Action Taken" : "Record Action Taken" }), formError && _jsx("div", { className: "alert alert-danger py-2", role: "alert", "data-testid": "action-form-error", children: formError }), _jsxs("div", { className: "row g-3", children: [_jsxs("div", { className: "col-12 col-md-6", children: [_jsx("label", { className: "form-label", htmlFor: "actionDateTime", children: "Action date and time" }), _jsx("input", { id: "actionDateTime", type: "datetime-local", className: "form-control", value: draft.actionDateTime, onChange: (e) => field("actionDateTime", e.target.value), required: true })] }), _jsxs("div", { className: "col-12", children: [_jsx("label", { className: "form-label", htmlFor: "actionDescription", children: "Action description" }), _jsx("textarea", { id: "actionDescription", className: "form-control", rows: 3, maxLength: 2000, value: draft.actionDescription, onChange: (e) => field("actionDescription", e.target.value), required: true }), _jsx("div", { className: "form-text", children: "Up to 2,000 characters." })] }), _jsxs("div", { className: "col-12", children: [_jsx("label", { className: "form-label", htmlFor: "actionResult", children: "Result" }), _jsx("textarea", { id: "actionResult", className: "form-control", rows: 2, maxLength: 1000, value: draft.result, onChange: (e) => field("result", e.target.value), required: true })] }), _jsx("div", { className: "col-12", children: _jsxs("div", { className: "form-check", children: [_jsx("input", { id: "followUpRequired", type: "checkbox", className: "form-check-input", checked: draft.followUpRequired, onChange: (e) => field("followUpRequired", e.target.checked) }), _jsx("label", { className: "form-check-label", htmlFor: "followUpRequired", children: "Follow-up required" })] }) }), draft.followUpRequired && _jsxs("div", { className: "col-12", children: [_jsxs("label", { className: "form-label", htmlFor: "followUpNote", children: ["Follow-up note ", _jsx("span", { className: "text-danger", children: "(required)" })] }), _jsx("textarea", { id: "followUpNote", className: "form-control", rows: 2, maxLength: 1000, value: draft.followUpNote, onChange: (e) => field("followUpNote", e.target.value), "aria-required": "true" }), formError.includes("follow-up note") && _jsx("div", { className: "text-danger small mt-1", children: "A follow-up note is required." })] }), _jsxs("div", { className: "col-12", children: [_jsxs("label", { className: "form-label", htmlFor: "attachmentNotes", children: ["Attachment notes ", _jsx("span", { className: "text-muted", children: "(optional)" })] }), _jsx("textarea", { id: "attachmentNotes", className: "form-control", rows: 2, maxLength: 500, value: draft.attachmentNotes, onChange: (e) => field("attachmentNotes", e.target.value) })] })] }), _jsxs("div", { className: "d-flex flex-wrap justify-content-end gap-2 mt-3", children: [editing && _jsx("button", { type: "button", className: "btn btn-outline-secondary", onClick: cancelForm, disabled: saving, children: "Cancel" }), _jsx("button", { type: "submit", className: "btn btn-zen-green", disabled: saving, "aria-disabled": saving, children: saving ? "Saving…" : editing ? "Save Changes" : "Record Action" })] })] })] }));
}
