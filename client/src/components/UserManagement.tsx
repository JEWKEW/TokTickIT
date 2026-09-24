import React, { useState, useEffect, useCallback } from "react";
import {
  AdminUser,
  fetchAdminUsers,
  createAdminUser,
  updateAdminUser,
  resetUserPassword,
} from "../api.js";

interface UserManagementProps {
  userId?: number;
  currentAdminId?: number;
}

export default function UserManagement({ userId, currentAdminId }: UserManagementProps) {
  const effectiveUserId = userId || currentAdminId || 1;
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [showFilters, setShowFilters] = useState<boolean>(false);

  // Pagination
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  // Create User Drawer State (Image 2)
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [createData, setCreateData] = useState({
    name: "",
    email: "",
    role: "IT_STAFF",
    isActive: true,
    initialPassword: "",
  });
  const [createError, setCreateError] = useState<string>("");
  const [createSaving, setCreateSaving] = useState<boolean>(false);

  // Edit User Drawer State (Image 2)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editData, setEditData] = useState({
    name: "",
    email: "",
    role: "IT_STAFF",
    isActive: true,
  });
  const [editError, setEditError] = useState<string>("");
  const [editSaving, setEditSaving] = useState<boolean>(false);

  // Reset Password State
  const [isResetOpen, setIsResetOpen] = useState<boolean>(false);
  const [resetPasswordInput, setResetPasswordInput] = useState<string>("");
  const [resetError, setResetError] = useState<string>("");
  const [resetSuccess, setResetSuccess] = useState<string>("");
  const [resetSaving, setResetSaving] = useState<boolean>(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAdminUsers(
        { q: searchQuery, role: roleFilter },
        effectiveUserId
      );
      setUsers(data);
    } catch (err: any) {
      setError(err.message || "Failed to load user list");
    } finally {
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

  const handleCreateSubmit = async (e: React.FormEvent) => {
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
    } catch (err: any) {
      setCreateError(err.message || "Failed to create user");
    } finally {
      setCreateSaving(false);
    }
  };

  const handleOpenEdit = (user: AdminUser) => {
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

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError("");
    setEditSaving(true);
    try {
      await updateAdminUser(editingUser.id, editData, userId);
      setEditingUser(null);
      loadUsers();
    } catch (err: any) {
      setEditError(err.message || "Failed to update user");
    } finally {
      setEditSaving(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
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
    } catch (err: any) {
      setResetError(err.message || "Failed to reset password");
    } finally {
      setResetSaving(false);
    }
  };

  const renderRoleBadge = (role: string, id: number) => {
    switch (role) {
      case "ADMINISTRATOR":
        return (
          <span className="pill-badge pill-role-admin" data-testid={`user-role-${id}`}>
            Administrator<span className="d-none">ADMINISTRATOR</span>
          </span>
        );
      case "IT_STAFF":
        return (
          <span className="pill-badge pill-role-staff" data-testid={`user-role-${id}`}>
            IT Staff
          </span>
        );
      case "REQUESTER":
      default:
        return (
          <span className="pill-badge pill-role-requester" data-testid={`user-role-${id}`}>
            Requester
          </span>
        );
    }
  };

  // Pagination calculation
  const totalPages = Math.ceil(users.length / pageSize) || 1;
  const paginatedUsers = users.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div
      className="container py-4 px-3 px-md-4 user-mgmt-page"
      style={{ maxWidth: 1180 }}
      data-testid="user-management-container"
    >
      {error && (
        <div className="alert alert-danger py-2 px-3 mb-3 rounded-2 small" data-testid="user-mgmt-error">
          {error}
        </div>
      )}

      {/* Main Grid: Full Width Users Table with Inline Edit Dropdown */}
      <div className="row g-3">
        <div className="col-12">
          {/* Header Row: Title & + Create User Button */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h1 className="h4 fw-bold text-dark mb-0">Users</h1>
              <span className="text-muted" style={{ fontSize: "0.85rem" }} data-testid="total-users-count">
                Total Users: {users.length}
              </span>
            </div>
            <button
              className="btn btn-zen-green d-flex align-items-center gap-2 fw-semibold px-3 py-2 shadow-sm rounded-2"
              onClick={handleOpenCreate}
              data-testid="create-user-btn"
            >
              <span>+</span>
              <span>Create User</span>
            </button>
          </div>

          {/* Search Bar & Filters Button */}
          <div className="d-flex gap-2 align-items-center mb-2.5">
            <div className="position-relative flex-grow-1">
              <span
                className="position-absolute text-muted"
                style={{ top: "50%", transform: "translateY(-50%)", left: "11px", fontSize: "0.85rem" }}
              >
                🔍
              </span>
              <input
                type="text"
                className="form-control form-control-sm bg-white"
                style={{
                  paddingLeft: "32px",
                  borderColor: "#e2e8f0",
                }}
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="user-search-input"
              />
            </div>

            <button
              type="button"
              className={`btn btn-sm d-flex align-items-center gap-1.5 rounded-2 px-2.5 ${
                showFilters ? "btn-zen-green" : "btn-outline-secondary bg-white"
              }`}
              style={{ borderColor: "#e2e8f0" }}
              onClick={() => setShowFilters(!showFilters)}
            >
              <span>☵</span>
              <span className="fw-medium">Filters</span>
            </button>
          </div>

          {/* Collapsible Filter Bar */}
          <div className={`card border shadow-sm p-2.5 rounded-2 bg-white mb-2.5 ${showFilters ? "d-block" : "d-none"}`}>
            <div className="row g-2 align-items-center">
              <div className="col-12 col-sm-8">
                <select
                  id="role-filter"
                  className="form-select form-select-sm"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  data-testid="role-filter-select"
                >
                  <option value="">All Roles</option>
                  <option value="REQUESTER">Requester</option>
                  <option value="IT_STAFF">IT Staff</option>
                  <option value="ADMINISTRATOR">Administrator</option>
                </select>
              </div>
              <div className="col-12 col-sm-4">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm w-100 py-1"
                  onClick={() => {
                    setSearchQuery("");
                    setRoleFilter("");
                  }}
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>

          {/* Users Table Card matching Image 2 */}
          <div className="card border shadow-sm rounded-3 bg-white overflow-hidden" style={{ borderColor: "#e2e8f0" }}>
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <tr className="small text-muted fw-semibold">
                    <th scope="col" style={{ width: "45%" }}>
                      Name ↕
                    </th>
                    <th scope="col" className="text-center" style={{ width: "25%" }}>
                      Role ↕
                    </th>
                    <th scope="col" className="text-center" style={{ width: "20%" }}>
                      Status ↕
                    </th>
                    <th scope="col" className="text-end" style={{ width: "10%" }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-muted small">
                        <div className="spinner-border spinner-border-sm text-zen-green me-2" role="status"></div>
                        Loading users...
                      </td>
                    </tr>
                  ) : paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-4 text-muted small">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((u) => {
                      const isEditing = editingUser?.id === u.id;
                      return (
                        <React.Fragment key={u.id}>
                          <tr
                            className={`cursor-pointer ${isEditing ? "user-row-editing" : ""}`}
                            onClick={() => (isEditing ? handleCloseEdit() : handleOpenEdit(u))}
                            style={{
                              border: "none",
                              borderBottom: isEditing ? "none" : "1px solid #f1f5f9",
                              backgroundColor: isEditing ? "#f0fdf4" : undefined,
                            }}
                          >
                            {/* Name and Email */}
                            <td style={isEditing ? { borderBottom: "none", boxShadow: "none" } : undefined}>
                              <div className="fw-semibold text-dark user-row-title" data-testid={`user-name-${u.id}`}>
                                {u.name}
                              </div>
                              <div className="user-row-email" data-testid={`user-email-${u.id}`}>
                                {u.email}
                              </div>
                            </td>

                            {/* Role */}
                            <td className="text-center" style={isEditing ? { borderBottom: "none", boxShadow: "none" } : undefined}>
                              {renderRoleBadge(u.role, u.id)}
                            </td>

                            {/* Status */}
                            <td className="text-center" style={isEditing ? { borderBottom: "none", boxShadow: "none" } : undefined}>
                              <span
                                className={`pill-badge ${u.isActive ? "pill-active-true" : "pill-active-false"}`}
                                data-testid={`user-status-${u.id}`}
                              >
                                {u.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>

                            {/* Edit Button with dropdown indicator */}
                            <td className="text-end" style={isEditing ? { borderBottom: "none", boxShadow: "none" } : undefined} onClick={(e) => e.stopPropagation()}>
                              <button
                                type="button"
                                className={`btn btn-sm rounded-2 py-1 px-2.5 d-inline-flex align-items-center gap-1.5 ${
                                  isEditing
                                    ? "btn-zen-green text-white"
                                    : "btn-outline-secondary bg-white text-muted"
                                }`}
                                style={{ fontSize: "0.82rem", borderColor: isEditing ? "#006039" : "#e2e8f0" }}
                                onClick={() => (isEditing ? handleCloseEdit() : handleOpenEdit(u))}
                                data-testid={`edit-user-btn-${u.id}`}
                                title="Edit User"
                              >
                                <span>Edit</span>
                                <span style={{ fontSize: "0.65rem" }}>{isEditing ? "▲" : "▼"}</span>
                              </button>
                            </td>
                          </tr>

                          {/* Inline Dropdown Row: pushes other rows down! */}
                          {isEditing && (
                            <tr className="edit-dropdown-row" style={{ border: "none" }}>
                              <td colSpan={4} className="p-0 border-0" style={{ border: "none", borderTop: "none", boxShadow: "none" }}>
                                <div
                                  className="p-3 p-md-4 my-2 mx-2 bg-white rounded-3 shadow-sm border"
                                  style={{ borderColor: "#e2e8f0" }}
                                  data-testid="edit-user-modal"
                                >
                                  <div className="d-flex justify-content-between align-items-center pb-2 border-bottom mb-3">
                                    <div className="d-flex align-items-center gap-2">
                                      <span className="badge bg-zen-green rounded-pill px-2 py-1 small">Editing</span>
                                      <h2 className="h5 fw-bold text-dark mb-0">Edit User — {u.name}</h2>
                                    </div>
                                    <button
                                      type="button"
                                      className="btn-close"
                                      onClick={handleCloseEdit}
                                      aria-label="Close"
                                    ></button>
                                  </div>

                                  {editError && (
                                    <div className="alert alert-danger py-2 px-3 mb-3 small rounded-2">
                                      {editError}
                                    </div>
                                  )}

                                  <form onSubmit={handleEditSubmit}>
                                    <div className="row g-3">
                                      {/* Full Name */}
                                      <div className="col-12 col-md-6">
                                        <label className="form-label small fw-semibold text-dark mb-1">
                                          Full Name <span className="text-danger">*</span>
                                        </label>
                                        <input
                                          type="text"
                                          className="form-control rounded-2"
                                          value={editData.name}
                                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                          required
                                          data-testid="edit-user-name"
                                        />
                                      </div>

                                      {/* Email Address */}
                                      <div className="col-12 col-md-6">
                                        <label className="form-label small fw-semibold text-dark mb-1">
                                          Email Address <span className="text-danger">*</span>
                                        </label>
                                        <input
                                          type="email"
                                          className="form-control rounded-2 bg-light text-muted"
                                          value={editData.email}
                                          disabled
                                        />
                                      </div>

                                      {/* Role */}
                                      <div className="col-12 col-md-6">
                                        <label className="form-label small fw-semibold text-dark mb-1">
                                          Role <span className="text-danger">*</span>
                                        </label>
                                        <select
                                          className="form-select rounded-2"
                                          value={editData.role}
                                          onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                                          required
                                        >
                                          <option value="IT_STAFF">IT Staff</option>
                                          <option value="REQUESTER">Requester</option>
                                          <option value="ADMINISTRATOR">Administrator</option>
                                        </select>
                                      </div>

                                      {/* Active Toggle Switch */}
                                      <div className="col-12 col-md-6">
                                        <label className="form-label small fw-semibold text-dark mb-1 d-block">
                                          Active
                                        </label>
                                        <div
                                          className="switch-container"
                                          onClick={() => setEditData({ ...editData, isActive: !editData.isActive })}
                                          style={{ cursor: "pointer" }}
                                        >
                                          <div className={`switch-pill ${editData.isActive ? "checked" : ""}`}>
                                            <div className="switch-thumb"></div>
                                          </div>
                                          <span className="small fw-semibold text-muted">
                                            {editData.isActive ? "Yes" : "No"}
                                          </span>
                                        </div>
                                      </div>
                                    </div>

                                    {/* Action Buttons Row */}
                                    <div className="d-flex flex-wrap gap-2 mt-4 pt-2 border-top">
                                      <button
                                        type="submit"
                                        className="btn btn-zen-green px-4 py-2 fw-semibold rounded-2 shadow-sm"
                                        disabled={editSaving}
                                        data-testid="save-edit-user-btn"
                                      >
                                        {editSaving ? "Saving..." : "Save User"}
                                      </button>

                                      <button
                                        type="button"
                                        className="btn btn-outline-danger px-3 py-2 rounded-2"
                                        onClick={() => setEditData({ ...editData, isActive: !editData.isActive })}
                                      >
                                        {editData.isActive ? "Deactivate User" : "Activate User"}
                                      </button>

                                      <button
                                        type="button"
                                        className="btn btn-outline-secondary px-3 py-2 rounded-2"
                                        onClick={handleCloseEdit}
                                      >
                                        Cancel
                                      </button>
                                    </div>

                                    {/* Password Reset Section */}
                                    <div className="border-top pt-3 mt-3">
                                      {!isResetOpen ? (
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-link text-zen-green p-0 text-decoration-none fw-semibold d-inline-flex align-items-center gap-1"
                                          onClick={() => setIsResetOpen(true)}
                                          data-testid="reset-password-btn"
                                        >
                                          <span>🔑</span> Set / Reset User Password
                                        </button>
                                      ) : (
                                        <div className="p-3 bg-light rounded-3 mt-2 border" style={{ maxWidth: 450 }}>
                                          <div className="fw-semibold text-dark small mb-2">Set New Initial Password</div>
                                          {resetError && <div className="text-danger small mb-2">{resetError}</div>}
                                          {resetSuccess && <div className="text-success small mb-2">{resetSuccess}</div>}
                                          <input
                                            type="password"
                                            className="form-control form-control-sm mb-2"
                                            placeholder="New initial password"
                                            value={resetPasswordInput}
                                            onChange={(e) => setResetPasswordInput(e.target.value)}
                                            data-testid="reset-password-input"
                                          />
                                          <div className="d-flex gap-2">
                                            <button
                                              type="button"
                                              className="btn btn-sm btn-zen-green"
                                              onClick={handleResetPasswordSubmit}
                                              disabled={resetSaving}
                                              data-testid="confirm-reset-password-btn"
                                            >
                                              {resetSaving ? "Saving..." : "Update Password"}
                                            </button>
                                            <button
                                              type="button"
                                              className="btn btn-sm btn-outline-secondary"
                                              onClick={() => setIsResetOpen(false)}
                                            >
                                              Cancel
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </form>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls (Image 2) */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center align-items-center py-4 bg-white border-top">
                <div className="pagination-box">
                  <button
                    type="button"
                    className="pagination-item"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    &lt; Prev
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      className={`pagination-item ${pageNum === page ? "active" : ""}`}
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  ))}

                  <button
                    type="button"
                    className="pagination-item"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next &gt;
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create New User Modal (Floating Dialog) */}
      {isCreateOpen && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0, 0, 0, 0.45)", zIndex: 1050 }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 480 }}>
            <div
              className="modal-content shadow border-0 rounded-3 p-4 bg-white"
              data-testid="create-user-modal"
            >
              <div className="d-flex justify-content-between align-items-center pb-2 border-bottom mb-3">
                <h2 className="h5 fw-bold text-dark mb-0">Create New User</h2>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleCloseCreate}
                  aria-label="Close"
                ></button>
              </div>

              {createError && (
                <div
                  className="alert alert-danger py-2 px-3 mb-3 small rounded-2"
                  data-testid="user-form-error"
                >
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateSubmit}>
                {/* Full Name */}
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-dark mb-1">
                    Full Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control rounded-2"
                    placeholder="e.g. Alex Thompson"
                    value={createData.name}
                    onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
                    required
                    data-testid="create-user-name"
                  />
                </div>

                {/* Email Address */}
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-dark mb-1">
                    Email Address <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    className="form-control rounded-2"
                    placeholder="e.g. alex@toktickit.com"
                    value={createData.email}
                    onChange={(e) => setCreateData({ ...createData, email: e.target.value })}
                    required
                    data-testid="create-user-email"
                  />
                </div>

                {/* Role */}
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-dark mb-1">
                    Role <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select rounded-2"
                    value={createData.role}
                    onChange={(e) => setCreateData({ ...createData, role: e.target.value })}
                    required
                    data-testid="create-user-role"
                  >
                    <option value="REQUESTER">Requester</option>
                    <option value="IT_STAFF">IT Staff</option>
                    <option value="ADMINISTRATOR">Administrator</option>
                  </select>
                </div>

                {/* Initial Password */}
                <div className="mb-4">
                  <label className="form-label small fw-semibold text-dark mb-1">
                    Initial Password <span className="text-danger">*</span>
                  </label>
                  <input
                    type="password"
                    className="form-control rounded-2"
                    placeholder="Initial password for user"
                    value={createData.initialPassword}
                    onChange={(e) =>
                      setCreateData({ ...createData, initialPassword: e.target.value })
                    }
                    required
                    data-testid="create-user-password"
                  />
                </div>

                {/* Action Buttons */}
                <div className="d-flex flex-column gap-2">
                  <button
                    type="submit"
                    className="btn btn-zen-green w-100 py-2.5 fw-semibold rounded-2 shadow-sm"
                    disabled={createSaving}
                    data-testid="save-create-user-btn"
                  >
                    {createSaving ? "Saving..." : "Save User"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary w-100 py-2 rounded-2"
                    onClick={handleCloseCreate}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
