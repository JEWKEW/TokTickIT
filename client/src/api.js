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
