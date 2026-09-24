import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useEffect, useCallback } from "react";
import { fetchAdminUsers, createAdminUser, updateAdminUser, resetUserPassword, } from "../api.js";
export default function UserManagement({ userId, currentAdminId }) {
    const effectiveUserId = userId || currentAdminId || 1;
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    // Pagination
    const [page, setPage] = useState(1);
    const pageSize = 10;
    // Create User Drawer State (Image 2)
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createData, setCreateData] = useState({
        name: "",
        email: "",
        role: "IT_STAFF",
        isActive: true,
        initialPassword: "",
    });
    const [createError, setCreateError] = useState("");
    const [createSaving, setCreateSaving] = useState(false);
    // Edit User Drawer State (Image 2)
    const [editingUser, setEditingUser] = useState(null);
    const [editData, setEditData] = useState({
        name: "",
        email: "",
        role: "IT_STAFF",
        isActive: true,
    });
    const [editError, setEditError] = useState("");
    const [editSaving, setEditSaving] = useState(false);
    // Reset Password State
    const [isResetOpen, setIsResetOpen] = useState(false);
    const [resetPasswordInput, setResetPasswordInput] = useState("");
    const [resetError, setResetError] = useState("");
    const [resetSuccess, setResetSuccess] = useState("");
    const [resetSaving, setResetSaving] = useState(false);
    const loadUsers = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const data = await fetchAdminUsers({ q: searchQuery, role: roleFilter }, effectiveUserId);
            setUsers(data);
        }
        catch (err) {
            setError(err.message || "Failed to load user list");
        }
        finally {
            setLoading(false);
        }
    }, [searchQuery, roleFilter, userId]);
    useEffect(() => {
        loadUsers();
    }, [loadUsers]);
    const handleOpenCreate = () => {
        setEditingUser(null);
        setCreateData({
            name: "",
            email: "",
            role: "IT_STAFF",
            isActive: true,
            initialPassword: "",
        });
        setCreateError("");
        setIsCreateOpen(true);
    };
    const handleCloseCreate = () => {
        setIsCreateOpen(false);
        setCreateError("");
    };
    const handleCreateSubmit = async (e) => {
        e.preventDefault();
        setCreateError("");
        if (!createData.name.trim() || !createData.email.trim() || !createData.initialPassword) {
            setCreateError("All fields are required");
            return;
        }
        setCreateSaving(true);
        try {
            await createAdminUser(createData, userId);
            setIsCreateOpen(false);
            loadUsers();
        }
        catch (err) {
            setCreateError(err.message || "Failed to create user");
        }
        finally {
            setCreateSaving(false);
        }
    };
    const handleOpenEdit = (user) => {
        setIsCreateOpen(false);
        setEditingUser(user);
        setEditData({
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
        });
        setEditError("");
        setIsResetOpen(false);
        setResetPasswordInput("");
        setResetError("");
        setResetSuccess("");
    };
    const handleCloseEdit = () => {
        setEditingUser(null);
        setEditError("");
    };
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        if (!editingUser)
            return;
        setEditError("");
        setEditSaving(true);
        try {
            await updateAdminUser(editingUser.id, editData, userId);
            setEditingUser(null);
            loadUsers();
        }
        catch (err) {
            setEditError(err.message || "Failed to update user");
        }
        finally {
            setEditSaving(false);
        }
    };
    const handleResetPasswordSubmit = async (e) => {
        e.preventDefault();
        if (!editingUser)
            return;
        setResetError("");
        setResetSuccess("");
        if (!resetPasswordInput) {
            setResetError("Initial password is required");
            return;
        }
        setResetSaving(true);
        try {
            await resetUserPassword(editingUser.id, resetPasswordInput, userId);
            setResetSuccess("Initial password set successfully");
            setResetPasswordInput("");
            setIsResetOpen(false);
            loadUsers();
        }
        catch (err) {
            setResetError(err.message || "Failed to reset password");
        }
        finally {
            setResetSaving(false);
        }
    };
    const renderRoleBadge = (role, id) => {
        switch (role) {
            case "ADMINISTRATOR":
                return (_jsxs("span", { className: "pill-badge pill-role-admin", "data-testid": `user-role-${id}`, children: ["Administrator", _jsx("span", { className: "d-none", children: "ADMINISTRATOR" })] }));
            case "IT_STAFF":
                return (_jsx("span", { className: "pill-badge pill-role-staff", "data-testid": `user-role-${id}`, children: "IT Staff" }));
            case "REQUESTER":
            default:
                return (_jsx("span", { className: "pill-badge pill-role-requester", "data-testid": `user-role-${id}`, children: "Requester" }));
        }
    };
    // Pagination calculation
    const totalPages = Math.ceil(users.length / pageSize) || 1;
    const paginatedUsers = users.slice((page - 1) * pageSize, page * pageSize);
    return (_jsxs("div", { className: "container py-4 px-3 px-md-4 user-mgmt-page", style: { maxWidth: 1180 }, "data-testid": "user-management-container", children: [error && (_jsx("div", { className: "alert alert-danger py-2 px-3 mb-3 rounded-2 small", "data-testid": "user-mgmt-error", children: error })), _jsx("div", { className: "row g-3", children: _jsxs("div", { className: "col-12", children: [_jsxs("div", { className: "d-flex justify-content-between align-items-center mb-3", children: [_jsxs("div", { children: [_jsx("h1", { className: "h4 fw-bold text-dark mb-0", children: "Users" }), _jsxs("span", { className: "text-muted", style: { fontSize: "0.85rem" }, "data-testid": "total-users-count", children: ["Total Users: ", users.length] })] }), _jsxs("button", { className: "btn btn-zen-green d-flex align-items-center gap-2 fw-semibold px-3 py-2 shadow-sm rounded-2", onClick: handleOpenCreate, "data-testid": "create-user-btn", children: [_jsx("span", { children: "+" }), _jsx("span", { children: "Create User" })] })] }), _jsxs("div", { className: "d-flex gap-2 align-items-center mb-2.5", children: [_jsxs("div", { className: "position-relative flex-grow-1", children: [_jsx("span", { className: "position-absolute text-muted", style: { top: "50%", transform: "translateY(-50%)", left: "11px", fontSize: "0.85rem" }, children: "\uD83D\uDD0D" }), _jsx("input", { type: "text", className: "form-control form-control-sm bg-white", style: {
                                                paddingLeft: "32px",
                                                borderColor: "#e2e8f0",
                                            }, placeholder: "Search users...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), "data-testid": "user-search-input" })] }), _jsxs("button", { type: "button", className: `btn btn-sm d-flex align-items-center gap-1.5 rounded-2 px-2.5 ${showFilters ? "btn-zen-green" : "btn-outline-secondary bg-white"}`, style: { borderColor: "#e2e8f0" }, onClick: () => setShowFilters(!showFilters), children: [_jsx("span", { children: "\u2635" }), _jsx("span", { className: "fw-medium", children: "Filters" })] })] }), _jsx("div", { className: `card border shadow-sm p-2.5 rounded-2 bg-white mb-2.5 ${showFilters ? "d-block" : "d-none"}`, children: _jsxs("div", { className: "row g-2 align-items-center", children: [_jsx("div", { className: "col-12 col-sm-8", children: _jsxs("select", { id: "role-filter", className: "form-select form-select-sm", value: roleFilter, onChange: (e) => setRoleFilter(e.target.value), "data-testid": "role-filter-select", children: [_jsx("option", { value: "", children: "All Roles" }), _jsx("option", { value: "REQUESTER", children: "Requester" }), _jsx("option", { value: "IT_STAFF", children: "IT Staff" }), _jsx("option", { value: "ADMINISTRATOR", children: "Administrator" })] }) }), _jsx("div", { className: "col-12 col-sm-4", children: _jsx("button", { type: "button", className: "btn btn-outline-secondary btn-sm w-100 py-1", onClick: () => {
                                                setSearchQuery("");
                                                setRoleFilter("");
                                            }, children: "Reset Filters" }) })] }) }), _jsxs("div", { className: "card border shadow-sm rounded-3 bg-white overflow-hidden", style: { borderColor: "#e2e8f0" }, children: [_jsx("div", { className: "table-responsive", children: _jsxs("table", { className: "table table-hover align-middle mb-0", children: [_jsx("thead", { style: { backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }, children: _jsxs("tr", { className: "small text-muted fw-semibold", children: [_jsx("th", { scope: "col", style: { width: "45%" }, children: "Name \u2195" }), _jsx("th", { scope: "col", className: "text-center", style: { width: "25%" }, children: "Role \u2195" }), _jsx("th", { scope: "col", className: "text-center", style: { width: "20%" }, children: "Status \u2195" }), _jsx("th", { scope: "col", className: "text-end", style: { width: "10%" }, children: "Actions" })] }) }), _jsx("tbody", { children: loading ? (_jsx("tr", { children: _jsxs("td", { colSpan: 4, className: "text-center py-4 text-muted small", children: [_jsx("div", { className: "spinner-border spinner-border-sm text-zen-green me-2", role: "status" }), "Loading users..."] }) })) : paginatedUsers.length === 0 ? (_jsx("tr", { children: _jsx("td", { colSpan: 4, className: "text-center py-4 text-muted small", children: "No users found." }) })) : (paginatedUsers.map((u) => {
                                                    const isEditing = editingUser?.id === u.id;
                                                    return (_jsxs(React.Fragment, { children: [_jsxs("tr", { className: `cursor-pointer ${isEditing ? "user-row-editing" : ""}`, onClick: () => (isEditing ? handleCloseEdit() : handleOpenEdit(u)), style: {
                                                                    border: "none",
                                                                    borderBottom: isEditing ? "none" : "1px solid #f1f5f9",
                                                                    backgroundColor: isEditing ? "#f0fdf4" : undefined,
                                                                }, children: [_jsxs("td", { style: isEditing ? { borderBottom: "none", boxShadow: "none" } : undefined, children: [_jsx("div", { className: "fw-semibold text-dark user-row-title", "data-testid": `user-name-${u.id}`, children: u.name }), _jsx("div", { className: "user-row-email", "data-testid": `user-email-${u.id}`, children: u.email })] }), _jsx("td", { className: "text-center", style: isEditing ? { borderBottom: "none", boxShadow: "none" } : undefined, children: renderRoleBadge(u.role, u.id) }), _jsx("td", { className: "text-center", style: isEditing ? { borderBottom: "none", boxShadow: "none" } : undefined, children: _jsx("span", { className: `pill-badge ${u.isActive ? "pill-active-true" : "pill-active-false"}`, "data-testid": `user-status-${u.id}`, children: u.isActive ? "Active" : "Inactive" }) }), _jsx("td", { className: "text-end", style: isEditing ? { borderBottom: "none", boxShadow: "none" } : undefined, onClick: (e) => e.stopPropagation(), children: _jsxs("button", { type: "button", className: `btn btn-sm rounded-2 py-1 px-2.5 d-inline-flex align-items-center gap-1.5 ${isEditing
                                                                                ? "btn-zen-green text-white"
                                                                                : "btn-outline-secondary bg-white text-muted"}`, style: { fontSize: "0.82rem", borderColor: isEditing ? "#006039" : "#e2e8f0" }, onClick: () => (isEditing ? handleCloseEdit() : handleOpenEdit(u)), "data-testid": `edit-user-btn-${u.id}`, title: "Edit User", children: [_jsx("span", { children: "Edit" }), _jsx("span", { style: { fontSize: "0.65rem" }, children: isEditing ? "▲" : "▼" })] }) })] }), isEditing && (_jsx("tr", { className: "edit-dropdown-row", style: { border: "none" }, children: _jsx("td", { colSpan: 4, className: "p-0 border-0", style: { border: "none", borderTop: "none", boxShadow: "none" }, children: _jsxs("div", { className: "p-3 p-md-4 my-2 mx-2 bg-white rounded-3 shadow-sm border", style: { borderColor: "#e2e8f0" }, "data-testid": "edit-user-modal", children: [_jsxs("div", { className: "d-flex justify-content-between align-items-center pb-2 border-bottom mb-3", children: [_jsxs("div", { className: "d-flex align-items-center gap-2", children: [_jsx("span", { className: "badge bg-zen-green rounded-pill px-2 py-1 small", children: "Editing" }), _jsxs("h2", { className: "h5 fw-bold text-dark mb-0", children: ["Edit User \u2014 ", u.name] })] }), _jsx("button", { type: "button", className: "btn-close", onClick: handleCloseEdit, "aria-label": "Close" })] }), editError && (_jsx("div", { className: "alert alert-danger py-2 px-3 mb-3 small rounded-2", children: editError })), _jsxs("form", { onSubmit: handleEditSubmit, children: [_jsxs("div", { className: "row g-3", children: [_jsxs("div", { className: "col-12 col-md-6", children: [_jsxs("label", { className: "form-label small fw-semibold text-dark mb-1", children: ["Full Name ", _jsx("span", { className: "text-danger", children: "*" })] }), _jsx("input", { type: "text", className: "form-control rounded-2", value: editData.name, onChange: (e) => setEditData({ ...editData, name: e.target.value }), required: true, "data-testid": "edit-user-name" })] }), _jsxs("div", { className: "col-12 col-md-6", children: [_jsxs("label", { className: "form-label small fw-semibold text-dark mb-1", children: ["Email Address ", _jsx("span", { className: "text-danger", children: "*" })] }), _jsx("input", { type: "email", className: "form-control rounded-2 bg-light text-muted", value: editData.email, disabled: true })] }), _jsxs("div", { className: "col-12 col-md-6", children: [_jsxs("label", { className: "form-label small fw-semibold text-dark mb-1", children: ["Role ", _jsx("span", { className: "text-danger", children: "*" })] }), _jsxs("select", { className: "form-select rounded-2", value: editData.role, onChange: (e) => setEditData({ ...editData, role: e.target.value }), required: true, children: [_jsx("option", { value: "IT_STAFF", children: "IT Staff" }), _jsx("option", { value: "REQUESTER", children: "Requester" }), _jsx("option", { value: "ADMINISTRATOR", children: "Administrator" })] })] }), _jsxs("div", { className: "col-12 col-md-6", children: [_jsx("label", { className: "form-label small fw-semibold text-dark mb-1 d-block", children: "Active" }), _jsxs("div", { className: "switch-container", onClick: () => setEditData({ ...editData, isActive: !editData.isActive }), style: { cursor: "pointer" }, children: [_jsx("div", { className: `switch-pill ${editData.isActive ? "checked" : ""}`, children: _jsx("div", { className: "switch-thumb" }) }), _jsx("span", { className: "small fw-semibold text-muted", children: editData.isActive ? "Yes" : "No" })] })] })] }), _jsxs("div", { className: "d-flex flex-wrap gap-2 mt-4 pt-2 border-top", children: [_jsx("button", { type: "submit", className: "btn btn-zen-green px-4 py-2 fw-semibold rounded-2 shadow-sm", disabled: editSaving, "data-testid": "save-edit-user-btn", children: editSaving ? "Saving..." : "Save User" }), _jsx("button", { type: "button", className: "btn btn-outline-danger px-3 py-2 rounded-2", onClick: () => setEditData({ ...editData, isActive: !editData.isActive }), children: editData.isActive ? "Deactivate User" : "Activate User" }), _jsx("button", { type: "button", className: "btn btn-outline-secondary px-3 py-2 rounded-2", onClick: handleCloseEdit, children: "Cancel" })] }), _jsx("div", { className: "border-top pt-3 mt-3", children: !isResetOpen ? (_jsxs("button", { type: "button", className: "btn btn-sm btn-link text-zen-green p-0 text-decoration-none fw-semibold d-inline-flex align-items-center gap-1", onClick: () => setIsResetOpen(true), "data-testid": "reset-password-btn", children: [_jsx("span", { children: "\uD83D\uDD11" }), " Set / Reset User Password"] })) : (_jsxs("div", { className: "p-3 bg-light rounded-3 mt-2 border", style: { maxWidth: 450 }, children: [_jsx("div", { className: "fw-semibold text-dark small mb-2", children: "Set New Initial Password" }), resetError && _jsx("div", { className: "text-danger small mb-2", children: resetError }), resetSuccess && _jsx("div", { className: "text-success small mb-2", children: resetSuccess }), _jsx("input", { type: "password", className: "form-control form-control-sm mb-2", placeholder: "New initial password", value: resetPasswordInput, onChange: (e) => setResetPasswordInput(e.target.value), "data-testid": "reset-password-input" }), _jsxs("div", { className: "d-flex gap-2", children: [_jsx("button", { type: "button", className: "btn btn-sm btn-zen-green", onClick: handleResetPasswordSubmit, disabled: resetSaving, "data-testid": "confirm-reset-password-btn", children: resetSaving ? "Saving..." : "Update Password" }), _jsx("button", { type: "button", className: "btn btn-sm btn-outline-secondary", onClick: () => setIsResetOpen(false), children: "Cancel" })] })] })) })] })] }) }) }))] }, u.id));
                                                })) })] }) }), totalPages > 1 && (_jsx("div", { className: "d-flex justify-content-center align-items-center py-4 bg-white border-top", children: _jsxs("div", { className: "pagination-box", children: [_jsx("button", { type: "button", className: "pagination-item", disabled: page <= 1, onClick: () => setPage((p) => Math.max(1, p - 1)), children: "< Prev" }), Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (_jsx("button", { type: "button", className: `pagination-item ${pageNum === page ? "active" : ""}`, onClick: () => setPage(pageNum), children: pageNum }, pageNum))), _jsx("button", { type: "button", className: "pagination-item", disabled: page >= totalPages, onClick: () => setPage((p) => Math.min(totalPages, p + 1)), children: "Next >" })] }) }))] })] }) }), isCreateOpen && (_jsx("div", { className: "modal show d-block", tabIndex: -1, style: { backgroundColor: "rgba(0, 0, 0, 0.45)", zIndex: 1050 }, children: _jsx("div", { className: "modal-dialog modal-dialog-centered", style: { maxWidth: 480 }, children: _jsxs("div", { className: "modal-content shadow border-0 rounded-3 p-4 bg-white", "data-testid": "create-user-modal", children: [_jsxs("div", { className: "d-flex justify-content-between align-items-center pb-2 border-bottom mb-3", children: [_jsx("h2", { className: "h5 fw-bold text-dark mb-0", children: "Create New User" }), _jsx("button", { type: "button", className: "btn-close", onClick: handleCloseCreate, "aria-label": "Close" })] }), createError && (_jsx("div", { className: "alert alert-danger py-2 px-3 mb-3 small rounded-2", "data-testid": "user-form-error", children: createError })), _jsxs("form", { onSubmit: handleCreateSubmit, children: [_jsxs("div", { className: "mb-3", children: [_jsxs("label", { className: "form-label small fw-semibold text-dark mb-1", children: ["Full Name ", _jsx("span", { className: "text-danger", children: "*" })] }), _jsx("input", { type: "text", className: "form-control rounded-2", placeholder: "e.g. Alex Thompson", value: createData.name, onChange: (e) => setCreateData({ ...createData, name: e.target.value }), required: true, "data-testid": "create-user-name" })] }), _jsxs("div", { className: "mb-3", children: [_jsxs("label", { className: "form-label small fw-semibold text-dark mb-1", children: ["Email Address ", _jsx("span", { className: "text-danger", children: "*" })] }), _jsx("input", { type: "email", className: "form-control rounded-2", placeholder: "e.g. alex@toktickit.com", value: createData.email, onChange: (e) => setCreateData({ ...createData, email: e.target.value }), required: true, "data-testid": "create-user-email" })] }), _jsxs("div", { className: "mb-3", children: [_jsxs("label", { className: "form-label small fw-semibold text-dark mb-1", children: ["Role ", _jsx("span", { className: "text-danger", children: "*" })] }), _jsxs("select", { className: "form-select rounded-2", value: createData.role, onChange: (e) => setCreateData({ ...createData, role: e.target.value }), required: true, "data-testid": "create-user-role", children: [_jsx("option", { value: "REQUESTER", children: "Requester" }), _jsx("option", { value: "IT_STAFF", children: "IT Staff" }), _jsx("option", { value: "ADMINISTRATOR", children: "Administrator" })] })] }), _jsxs("div", { className: "mb-4", children: [_jsxs("label", { className: "form-label small fw-semibold text-dark mb-1", children: ["Initial Password ", _jsx("span", { className: "text-danger", children: "*" })] }), _jsx("input", { type: "password", className: "form-control rounded-2", placeholder: "Initial password for user", value: createData.initialPassword, onChange: (e) => setCreateData({ ...createData, initialPassword: e.target.value }), required: true, "data-testid": "create-user-password" })] }), _jsxs("div", { className: "d-flex flex-column gap-2", children: [_jsx("button", { type: "submit", className: "btn btn-zen-green w-100 py-2.5 fw-semibold rounded-2 shadow-sm", disabled: createSaving, "data-testid": "save-create-user-btn", children: createSaving ? "Saving..." : "Save User" }), _jsx("button", { type: "button", className: "btn btn-outline-secondary w-100 py-2 rounded-2", onClick: handleCloseCreate, children: "Cancel" })] })] })] }) }) }))] }));
}
