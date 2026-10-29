const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";
export async function checkSystem() {
    try {
        const healthRes = await fetch(`${API_URL}/api/health`);
        if (!healthRes.ok) {
            throw new Error("Unable to connect to TokTickIT API");
        }
        const categoriesRes = await fetch(`${API_URL}/api/categories`);
        if (!categoriesRes.ok) {
            throw new Error("Unable to connect to TokTickIT API");
        }
        const categories = await categoriesRes.json();
        return { online: true, categories };
    }
    catch (error) {
        throw new Error("Unable to connect to TokTickIT API");
    }
}
export async function fetchRequesters() {
    try {
        const res = await fetch(`${API_URL}/api/requesters`);
        if (!res.ok) {
            throw new Error("Unable to retrieve requesters");
        }
        return await res.json();
    }
    catch (error) {
        throw new Error(error.message || "Unable to retrieve requesters");
    }
}
export async function fetchCategories() {
    try {
        const res = await fetch(`${API_URL}/api/categories`);
        if (!res.ok) {
            throw new Error("Unable to retrieve categories");
        }
        return await res.json();
    }
    catch (error) {
        throw new Error(error.message || "Unable to retrieve categories");
    }
}
export async function fetchRelatedSystems() {
    try {
        const res = await fetch(`${API_URL}/api/related-systems`);
        if (!res.ok) {
            throw new Error("Unable to retrieve related systems");
        }
        return await res.json();
    }
    catch (error) {
        throw new Error(error.message || "Unable to retrieve related systems");
    }
}
export async function createTicket(formData, userId) {
    const res = await fetch(`${API_URL}/api/tickets`, {
        method: "POST",
        headers: {
            "x-user-id": userId.toString(),
        },
        body: formData,
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to create ticket");
    }
    return data.data;
}
export async function fetchTickets(params = {}, userId) {
    const queryParams = new URLSearchParams();
    if (params.search)
        queryParams.set("search", params.search);
    if (params.categoryId && params.categoryId !== "all")
        queryParams.set("categoryId", String(params.categoryId));
    if (params.priority && params.priority !== "all")
        queryParams.set("priority", params.priority);
    if (params.status && params.status !== "all")
        queryParams.set("status", params.status);
    if (params.sort)
        queryParams.set("sort", params.sort);
    if (params.order)
        queryParams.set("order", params.order);
    if (params.page)
        queryParams.set("page", String(params.page));
    if (params.limit)
        queryParams.set("limit", String(params.limit));
    const url = `${API_URL}/api/tickets?${queryParams.toString()}`;
    const res = await fetch(url, {
        method: "GET",
        headers: {
            "x-user-id": userId.toString(),
            "Content-Type": "application/json",
        },
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to retrieve tickets");
    }
    return data.data;
}
export async function fetchTicketById(id, userId) {
    const url = `${API_URL}/api/tickets/${id}`;
    const res = await fetch(url, {
        method: "GET",
        headers: {
            "x-user-id": userId.toString(),
            "Content-Type": "application/json",
        },
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to retrieve ticket details");
    }
    return data.data;
}
export async function uploadAttachment(ticketId, files, userId) {
    const formData = new FormData();
    const fileArray = Array.isArray(files) ? files : [files];
    fileArray.forEach((file) => {
        formData.append("files", file);
    });
    const res = await fetch(`${API_URL}/api/tickets/${ticketId}/attachments`, {
        method: "POST",
        headers: {
            "x-user-id": userId.toString(),
        },
        body: formData,
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to upload attachment");
    }
    return data.data;
}
export async function downloadAttachment(attachmentId, userId, originalFileName) {
    const url = `${API_URL}/api/attachments/${attachmentId}/download`;
    const res = await fetch(url, {
        method: "GET",
        headers: {
            "x-user-id": userId.toString(),
        },
    });
    if (!res.ok) {
        let errorMsg = "Failed to download attachment";
        try {
            const data = await res.json();
            errorMsg = data?.error?.message || errorMsg;
        }
        catch (_) { }
        throw new Error(errorMsg);
    }
    const blob = await res.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = originalFileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
}
export async function removeAttachment(attachmentId, removalReason, userId) {
    const url = `${API_URL}/api/attachments/${attachmentId}`;
    const res = await fetch(url, {
        method: "DELETE",
        headers: {
            "x-user-id": userId.toString(),
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ removalReason }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to remove attachment");
    }
}
export async function indicateTicketResolved(ticketId, userId) {
    const url = `${API_URL}/api/tickets/${ticketId}/indicate-resolved`;
    const res = await fetch(url, {
        method: "PATCH",
        headers: {
            "x-user-id": userId.toString(),
            "Content-Type": "application/json",
        },
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to indicate problem resolved");
    }
    return data.data;
}
export async function fetchPublicComments(ticketId, userId) {
    const url = `${API_URL}/api/tickets/${ticketId}/comments`;
    const res = await fetch(url, {
        method: "GET",
        headers: {
            "x-user-id": userId.toString(),
            "Content-Type": "application/json",
        },
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to retrieve public comments");
    }
    return data.data;
}
export async function postPublicComment(ticketId, content, userId) {
    const url = `${API_URL}/api/tickets/${ticketId}/comments`;
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "x-user-id": userId.toString(),
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to post public comment");
    }
    return data.data;
}
export async function fetchTicketQueue(params = {}, tokenOrUserId) {
    const queryParams = new URLSearchParams();
    const searchVal = params.q || params.search;
    if (searchVal)
        queryParams.set("q", searchVal);
    if (params.status && params.status !== "all")
        queryParams.set("status", params.status);
    if (params.requestedPriority && params.requestedPriority !== "all")
        queryParams.set("requestedPriority", params.requestedPriority);
    const itPrio = params.itPriority || params.priority;
    if (itPrio && itPrio !== "all")
        queryParams.set("itPriority", itPrio);
    if (params.categoryId && params.categoryId !== "all")
        queryParams.set("categoryId", String(params.categoryId));
    if (params.ownerId !== undefined && params.ownerId !== "" && params.ownerId !== "all")
        queryParams.set("ownerId", String(params.ownerId));
    const sortVal = params.sortBy || params.sort;
    if (sortVal)
        queryParams.set("sortBy", sortVal);
    const orderVal = params.sortOrder || params.order;
    if (orderVal)
        queryParams.set("sortOrder", orderVal);
    if (params.page)
        queryParams.set("page", String(params.page));
    if (params.limit)
        queryParams.set("limit", String(params.limit));
    const url = `${API_URL}/api/tickets/queue?${queryParams.toString()}`;
    const headers = {
        "Content-Type": "application/json",
    };
    if (typeof tokenOrUserId === "number") {
        headers["x-user-id"] = tokenOrUserId.toString();
    }
    else if (typeof tokenOrUserId === "string" && tokenOrUserId) {
        if (tokenOrUserId.startsWith("Bearer ") || tokenOrUserId.length > 20) {
            headers["Authorization"] = tokenOrUserId.startsWith("Bearer ") ? tokenOrUserId : `Bearer ${tokenOrUserId}`;
        }
        else {
            headers["x-user-id"] = tokenOrUserId;
        }
    }
    else {
        const savedToken = sessionStorage.getItem("token") || localStorage.getItem("token");
        const savedUserId = sessionStorage.getItem("x-user-id");
        if (savedToken) {
            headers["Authorization"] = `Bearer ${savedToken}`;
        }
        else if (savedUserId) {
            headers["x-user-id"] = savedUserId;
        }
    }
    const res = await fetch(url, {
        method: "GET",
        headers,
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to retrieve IT Staff ticket queue");
    }
    return data.data;
}
function buildAuthHeaders(tokenOrUserId) {
    const headers = {
        "Content-Type": "application/json",
    };
    if (typeof tokenOrUserId === "number") {
        headers["x-user-id"] = tokenOrUserId.toString();
    }
    else if (typeof tokenOrUserId === "string" && tokenOrUserId) {
        if (tokenOrUserId.startsWith("Bearer ") || tokenOrUserId.length > 20) {
            headers["Authorization"] = tokenOrUserId.startsWith("Bearer ") ? tokenOrUserId : `Bearer ${tokenOrUserId}`;
        }
        else {
            headers["x-user-id"] = tokenOrUserId;
        }
    }
    else {
        const savedToken = sessionStorage.getItem("token") || localStorage.getItem("token");
        const savedUserId = sessionStorage.getItem("x-user-id");
        if (savedToken) {
            headers["Authorization"] = `Bearer ${savedToken}`;
        }
        else if (savedUserId) {
            headers["x-user-id"] = savedUserId;
        }
    }
    return headers;
}
export async function assignTicketOwner(ticketId, ownerId, tokenOrUserId) {
    const url = `${API_URL}/api/tickets/${ticketId}/assign`;
    const res = await fetch(url, {
        method: "PATCH",
        headers: buildAuthHeaders(tokenOrUserId),
        body: JSON.stringify({ ownerId }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to assign ticket owner");
    }
    return data.data;
}
export async function updateITPriority(ticketId, itPriority, tokenOrUserId) {
    const url = `${API_URL}/api/tickets/${ticketId}/it-priority`;
    const res = await fetch(url, {
        method: "PATCH",
        headers: buildAuthHeaders(tokenOrUserId),
        body: JSON.stringify({ itPriority }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to update IT Priority");
    }
    return data.data;
}
export async function updateTicketStatus(ticketId, status, tokenOrUserId) {
    const url = `${API_URL}/api/tickets/${ticketId}/status`;
    const res = await fetch(url, {
        method: "PATCH",
        headers: buildAuthHeaders(tokenOrUserId),
        body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to update ticket status");
    }
    return data.data;
}
export async function fetchInternalNotes(ticketId, tokenOrUserId) {
    const url = `${API_URL}/api/tickets/${ticketId}/internal-notes`;
    const res = await fetch(url, {
        method: "GET",
        headers: buildAuthHeaders(tokenOrUserId),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to retrieve internal notes");
    }
    return data.data;
}
export async function postInternalNote(ticketId, content, tokenOrUserId) {
    const url = `${API_URL}/api/tickets/${ticketId}/internal-notes`;
    const res = await fetch(url, {
        method: "POST",
        headers: buildAuthHeaders(tokenOrUserId),
        body: JSON.stringify({ content }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to post internal note");
    }
    return data.data;
}
export async function fetchAdminUsers(params, tokenOrUserId) {
    const query = new URLSearchParams();
    if (params?.q)
        query.append("q", params.q);
    if (params?.role)
        query.append("role", params.role);
    const queryString = query.toString() ? `?${query.toString()}` : "";
    const url = `${API_URL}/api/admin/users${queryString}`;
    const res = await fetch(url, {
        method: "GET",
        headers: buildAuthHeaders(tokenOrUserId),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to retrieve user list");
    }
    return data.data;
}
export async function createAdminUser(userData, tokenOrUserId) {
    const url = `${API_URL}/api/admin/users`;
    const res = await fetch(url, {
        method: "POST",
        headers: buildAuthHeaders(tokenOrUserId),
        body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to create user account");
    }
    return data.data;
}
export async function updateAdminUser(userId, updateData, tokenOrUserId) {
    const url = `${API_URL}/api/admin/users/${userId}`;
    const res = await fetch(url, {
        method: "PATCH",
        headers: buildAuthHeaders(tokenOrUserId),
        body: JSON.stringify(updateData),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to update user profile");
    }
    return data.data;
}
export async function resetUserPassword(userId, initialPassword, tokenOrUserId) {
    const url = `${API_URL}/api/admin/users/${userId}/reset-password`;
    const res = await fetch(url, {
        method: "POST",
        headers: buildAuthHeaders(tokenOrUserId),
        body: JSON.stringify({ initialPassword }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to reset user password");
    }
    return data.data.user || data.data;
}
export async function login(email, password) {
    const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Invalid email or password");
    }
    if (data.data?.token) {
        sessionStorage.setItem("token", data.data.token);
        sessionStorage.setItem("x-user-id", data.data.user.id.toString());
    }
    return data.data;
}
export async function getCurrentUser(tokenOrUserId) {
    const headers = buildAuthHeaders(tokenOrUserId);
    const res = await fetch(`${API_URL}/api/auth/me`, {
        method: "GET",
        headers,
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Authentication required");
    }
    return data.data;
}
export async function changePassword(currentPassword, newPassword, confirmNewPassword, tokenOrUserId) {
    const headers = buildAuthHeaders(tokenOrUserId);
    const res = await fetch(`${API_URL}/api/auth/change-password`, {
        method: "POST",
        headers,
        body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || "Failed to change password");
    }
    return data.data;
}
export async function logout(tokenOrUserId) {
    const headers = buildAuthHeaders(tokenOrUserId);
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("x-user-id");
    sessionStorage.removeItem("selectedRequester");
    localStorage.removeItem("token");
    try {
        await fetch(`${API_URL}/api/auth/logout`, {
            method: "POST",
            headers,
        });
    }
    catch (_) {
        // Ignore network error on logout
    }
}
