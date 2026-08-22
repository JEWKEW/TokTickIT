import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { fetchCategories, fetchRelatedSystems, createTicket, } from "../api.js";
export const CreateTicketForm = ({ userId, onSuccess, onCancel, }) => {
    const [categories, setCategories] = useState([]);
    const [relatedSystems, setRelatedSystems] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    // Form State
    const [categoryId, setCategoryId] = useState("");
    const [relatedSystemId, setRelatedSystemId] = useState("");
    const [requestedPriority, setRequestedPriority] = useState("Medium");
    const [summary, setSummary] = useState("");
    const [description, setDescription] = useState("");
    const [files, setFiles] = useState([]);
    // Validation & Submission State
    const [fieldErrors, setFieldErrors] = useState({});
    const [apiError, setApiError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [createdTicket, setCreatedTicket] = useState(null);
    useEffect(() => {
        async function loadDropdowns() {
            try {
                setLoadingData(true);
                const [cats, systems] = await Promise.all([
                    fetchCategories(),
                    fetchRelatedSystems(),
                ]);
                setCategories(cats);
                setRelatedSystems(systems);
                if (cats.length > 0)
                    setCategoryId(cats[0].id.toString());
                if (systems.length > 0)
                    setRelatedSystemId(systems[0].id.toString());
            }
            catch (err) {
                setApiError(err.message || "Failed to load options");
            }
            finally {
                setLoadingData(false);
            }
        }
        loadDropdowns();
    }, []);
    function handleFileChange(e) {
        if (e.target.files) {
            const selected = Array.from(e.target.files);
            if (files.length + selected.length > 3) {
                setFieldErrors((prev) => ({
                    ...prev,
                    files: "Maximum 3 files allowed as attachments.",
                }));
                return;
            }
            setFieldErrors((prev) => ({ ...prev, files: "" }));
            setFiles((prev) => [...prev, ...selected].slice(0, 3));
        }
    }
    function handleRemoveFile(index) {
        setFiles((prev) => prev.filter((_, i) => i !== index));
        setFieldErrors((prev) => ({ ...prev, files: "" }));
    }
    function validate() {
        const errors = {};
        if (!categoryId) {
            errors.categoryId = "Please select a Category";
        }
        if (!relatedSystemId) {
            errors.relatedSystemId = "Please select a Related System";
        }
        if (!summary.trim()) {
            errors.summary = "Summary is required";
        }
        else if (summary.length > 100) {
            errors.summary = "Summary must not exceed 100 characters";
        }
        if (!description.trim()) {
            errors.description = "Description is required";
        }
        else if (description.length > 1000) {
            errors.description = "Description must not exceed 1000 characters";
        }
        if (files.length > 3) {
            errors.files = "Maximum 3 files allowed as attachments";
        }
        for (const f of files) {
            if (f.size > 5 * 1024 * 1024) {
                errors.files = `File ${f.name} exceeds 5MB size limit`;
            }
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    }
    async function handleSubmit(e) {
        e.preventDefault();
        setApiError("");
        if (!validate()) {
            return;
        }
        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append("categoryId", categoryId);
            formData.append("relatedSystemId", relatedSystemId);
            formData.append("requestedPriority", requestedPriority);
            formData.append("summary", summary.trim());
            formData.append("description", description.trim());
            files.forEach((file) => {
                formData.append("files", file);
            });
            const newTicket = await createTicket(formData, userId);
            setCreatedTicket(newTicket);
            if (onSuccess) {
                onSuccess(newTicket);
            }
        }
        catch (err) {
            // Preserve input values on API failure!
            setApiError(err.message || "Failed to submit ticket. Please try again.");
        }
        finally {
            setSubmitting(false);
        }
    }
    function handleReset() {
        setCreatedTicket(null);
        setSummary("");
        setDescription("");
        setFiles([]);
        setRequestedPriority("Medium");
        setFieldErrors({});
        setApiError("");
    }
    if (createdTicket) {
        return (_jsx("div", { className: "container py-4", style: { maxWidth: 768 }, "data-testid": "success-confirmation", children: _jsxs("div", { className: "card shadow-sm border-0 rounded-4 overflow-hidden", children: [_jsxs("div", { className: "card-header bg-success text-white p-4 text-center", children: [_jsx("span", { className: "fs-1 d-block mb-2", children: "\uD83C\uDF89" }), _jsx("h2", { className: "h4 fw-bold mb-1", children: "Ticket Submitted Successfully!" }), _jsxs("p", { className: "small mb-0 opacity-75", children: ["Your request has been logged and assigned default status ", _jsx("strong", { children: "'New'" }), "."] })] }), _jsxs("div", { className: "card-body p-4 text-center", children: [_jsxs("div", { className: "p-3 bg-light rounded-3 mb-4 border", "data-testid": "ticket-number-display", children: [_jsx("span", { className: "text-muted d-block small mb-1 fw-semibold text-uppercase", children: "Ticket Number" }), _jsx("span", { className: "fs-3 fw-bold text-zen-green text-monospace", "data-testid": "new-ticket-number", children: createdTicket.ticketNumber })] }), _jsx("div", { className: "text-start bg-white p-3 rounded-3 border mb-4", children: _jsxs("div", { className: "row g-2", children: [_jsxs("div", { className: "col-12", children: [_jsx("strong", { children: "Summary:" }), " ", createdTicket.summary] }), _jsxs("div", { className: "col-6", children: [_jsx("strong", { children: "Priority:" }), " ", _jsx("span", { className: "badge bg-warning text-dark px-2 py-1", children: createdTicket.requestedPriority })] }), _jsxs("div", { className: "col-6", children: [_jsx("strong", { children: "Status:" }), " ", _jsx("span", { className: "badge bg-info text-dark px-2 py-1", children: createdTicket.currentStatus })] })] }) }), _jsxs("div", { className: "d-flex gap-3 justify-content-center", children: [_jsx("button", { type: "button", className: "btn btn-zen-green px-4 py-2 fw-semibold", onClick: handleReset, "data-testid": "create-another-btn", children: "Create Another Ticket" }), onCancel && (_jsx("button", { type: "button", className: "btn btn-outline-secondary px-4 py-2", onClick: onCancel, children: "Return to Dashboard" }))] })] })] }) }));
    }
    return (_jsx("div", { className: "container py-4", style: { maxWidth: 768 }, "data-testid": "create-ticket-page", children: _jsxs("div", { className: "card shadow-sm border-0 rounded-4 overflow-hidden", children: [_jsxs("div", { className: "card-header bg-zen-green text-white p-4", children: [_jsx("h2", { className: "h4 fw-bold mb-1", children: "Create IT Support Ticket" }), _jsx("p", { className: "small text-white-50 mb-0", children: "Submit a new ticket for IT support, access requests, or system issues." })] }), _jsxs("div", { className: "card-body p-4", children: [apiError && (_jsxs("div", { className: "alert alert-danger mb-4 d-flex align-items-center gap-2", role: "alert", "data-testid": "api-error-banner", children: [_jsx("span", { children: "\u26A0\uFE0F" }), _jsx("div", { children: apiError })] })), loadingData ? (_jsxs("div", { className: "text-center py-5", children: [_jsx("div", { className: "spinner-border text-zen-green", role: "status", children: _jsx("span", { className: "visually-hidden", children: "Loading options..." }) }), _jsx("p", { className: "mt-2 text-muted small", children: "Loading ticket form options..." })] })) : (_jsxs("form", { onSubmit: handleSubmit, noValidate: true, children: [_jsxs("div", { className: "row g-3 mb-3", children: [_jsxs("div", { className: "col-md-6", children: [_jsxs("label", { htmlFor: "category-select", className: "form-label fw-semibold text-zen-green", children: ["Category ", _jsx("span", { className: "text-danger", children: "*" })] }), _jsxs("select", { id: "category-select", className: `form-select ${fieldErrors.categoryId ? "is-invalid" : ""}`, value: categoryId, onChange: (e) => {
                                                        setCategoryId(e.target.value);
                                                        setFieldErrors((prev) => ({ ...prev, categoryId: "" }));
                                                    }, "data-testid": "category-dropdown", children: [_jsx("option", { value: "", children: "-- Select Category --" }), categories.map((c) => (_jsx("option", { value: c.id.toString(), children: c.name }, c.id)))] }), fieldErrors.categoryId && (_jsx("div", { className: "invalid-feedback", children: fieldErrors.categoryId }))] }), _jsxs("div", { className: "col-md-6", children: [_jsxs("label", { htmlFor: "system-select", className: "form-label fw-semibold text-zen-green", children: ["Related System ", _jsx("span", { className: "text-danger", children: "*" })] }), _jsxs("select", { id: "system-select", className: `form-select ${fieldErrors.relatedSystemId ? "is-invalid" : ""}`, value: relatedSystemId, onChange: (e) => {
                                                        setRelatedSystemId(e.target.value);
                                                        setFieldErrors((prev) => ({ ...prev, relatedSystemId: "" }));
                                                    }, "data-testid": "related-system-dropdown", children: [_jsx("option", { value: "", children: "-- Select Related System --" }), relatedSystems.map((s) => (_jsx("option", { value: s.id.toString(), children: s.name }, s.id)))] }), fieldErrors.relatedSystemId && (_jsx("div", { className: "invalid-feedback", children: fieldErrors.relatedSystemId }))] })] }), _jsxs("div", { className: "mb-3", children: [_jsxs("label", { className: "form-label fw-semibold text-zen-green d-block", children: ["Requested Priority ", _jsx("span", { className: "text-danger", children: "*" })] }), _jsx("div", { className: "btn-group w-100", role: "group", "aria-label": "Requested Priority", children: ["Low", "Medium", "High", "Urgent"].map((p) => (_jsx("button", { type: "button", className: `btn ${requestedPriority === p
                                                    ? "btn-zen-green fw-bold"
                                                    : "btn-outline-secondary"}`, onClick: () => setRequestedPriority(p), "data-testid": `priority-${p.toLowerCase()}`, children: p }, p))) })] }), _jsxs("div", { className: "mb-3", children: [_jsxs("div", { className: "d-flex justify-content-between align-items-center mb-1", children: [_jsxs("label", { htmlFor: "summary-input", className: "form-label fw-semibold text-zen-green mb-0", children: ["Summary ", _jsx("span", { className: "text-danger", children: "*" })] }), _jsxs("span", { className: `small ${summary.length > 100 ? "text-danger fw-bold" : "text-muted"}`, "data-testid": "summary-char-counter", children: [summary.length, "/100"] })] }), _jsx("input", { type: "text", id: "summary-input", className: `form-control ${fieldErrors.summary ? "is-invalid" : ""}`, placeholder: "Brief summary of your request (max 100 characters)", maxLength: 100, value: summary, onChange: (e) => {
                                                setSummary(e.target.value);
                                                setFieldErrors((prev) => ({ ...prev, summary: "" }));
                                            }, "data-testid": "summary-input" }), fieldErrors.summary && (_jsx("div", { className: "invalid-feedback", children: fieldErrors.summary }))] }), _jsxs("div", { className: "mb-3", children: [_jsxs("div", { className: "d-flex justify-content-between align-items-center mb-1", children: [_jsxs("label", { htmlFor: "description-input", className: "form-label fw-semibold text-zen-green mb-0", children: ["Description ", _jsx("span", { className: "text-danger", children: "*" })] }), _jsxs("span", { className: `small ${description.length > 1000 ? "text-danger fw-bold" : "text-muted"}`, "data-testid": "description-char-counter", children: [description.length, "/1000"] })] }), _jsx("textarea", { id: "description-input", rows: 4, className: `form-control ${fieldErrors.description ? "is-invalid" : ""}`, placeholder: "Detailed description of your issue or request (max 1000 characters)", maxLength: 1000, value: description, onChange: (e) => {
                                                setDescription(e.target.value);
                                                setFieldErrors((prev) => ({ ...prev, description: "" }));
                                            }, "data-testid": "description-input" }), fieldErrors.description && (_jsx("div", { className: "invalid-feedback", children: fieldErrors.description }))] }), _jsxs("div", { className: "mb-4", children: [_jsxs("label", { className: "form-label fw-semibold text-zen-green", children: ["File Attachments ", _jsx("span", { className: "text-muted fw-normal", children: "(Optional, max 3 files up to 5MB each)" })] }), _jsx("input", { type: "file", id: "file-attachment-input", className: `form-control ${fieldErrors.files ? "is-invalid" : ""}`, multiple: true, onChange: handleFileChange, disabled: files.length >= 3, "data-testid": "file-input" }), fieldErrors.files && (_jsx("div", { className: "invalid-feedback d-block", children: fieldErrors.files })), files.length > 0 && (_jsx("div", { className: "mt-3 d-flex flex-wrap gap-2", "data-testid": "file-list", children: files.map((file, idx) => (_jsxs("div", { className: "badge bg-light text-dark border p-2 d-flex align-items-center gap-2 rounded-3", children: [_jsxs("span", { children: ["\uD83D\uDCCE ", file.name, " (", (file.size / 1024).toFixed(1), " KB)"] }), _jsx("button", { type: "button", className: "btn-close btn-close-sm", "aria-label": "Remove", onClick: () => handleRemoveFile(idx), "data-testid": `remove-file-${idx}` })] }, idx))) }))] }), _jsxs("div", { className: "d-flex justify-content-end gap-2 pt-2 border-top", children: [onCancel && (_jsx("button", { type: "button", className: "btn btn-outline-secondary px-4", onClick: onCancel, disabled: submitting, "data-testid": "cancel-btn", children: "Cancel" })), _jsx("button", { type: "submit", className: "btn btn-zen-green px-5 fw-bold", disabled: submitting, "data-testid": "submit-ticket-btn", children: submitting ? (_jsxs(_Fragment, { children: [_jsx("span", { className: "spinner-border spinner-border-sm me-2", role: "status", "aria-hidden": "true" }), "Submitting..."] })) : ("Submit Ticket") })] })] }))] })] }) }));
};
export default CreateTicketForm;
