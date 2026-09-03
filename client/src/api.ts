const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export interface Category {
  id: number;
  name: string;
}

export interface RelatedSystem {
  id: number;
  name: string;
}

export interface Attachment {
  id: number;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  isRemoved?: boolean;
  removalReason?: string | null;
  removedAt?: string | null;
  createdAt?: string;
}

export interface Ticket {
  id: number;
  ticketNumber: string;
  summary: string;
  description: string;
  requestedPriority: string;
  currentStatus: string;
  requesterId: number;
  categoryId: number;
  relatedSystemId: number;
  category?: Category;
  relatedSystem?: RelatedSystem;
  requester?: Requester;
  attachments?: Attachment[];
  createdAt: string;
  updatedAt: string;
}

export interface SystemStatus {
  online: boolean;
  categories: Category[];
}

export async function checkSystem(): Promise<SystemStatus> {
  try {
    const healthRes = await fetch(`${API_URL}/api/health`);
    if (!healthRes.ok) {
      throw new Error("Unable to connect to TokTickIT API");
    }
    const categoriesRes = await fetch(`${API_URL}/api/categories`);
    if (!categoriesRes.ok) {
      throw new Error("Unable to connect to TokTickIT API");
    }
    const categories: Category[] = await categoriesRes.json();
    return { online: true, categories };
  } catch (error) {
    throw new Error("Unable to connect to TokTickIT API");
  }
}

export interface Requester {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
}

export async function fetchRequesters(): Promise<Requester[]> {
  try {
    const res = await fetch(`${API_URL}/api/requesters`);
    if (!res.ok) {
      throw new Error("Unable to retrieve requesters");
    }
    return await res.json();
  } catch (error: any) {
    throw new Error(error.message || "Unable to retrieve requesters");
  }
}

export async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_URL}/api/categories`);
    if (!res.ok) {
      throw new Error("Unable to retrieve categories");
    }
    return await res.json();
  } catch (error: any) {
    throw new Error(error.message || "Unable to retrieve categories");
  }
}

export async function fetchRelatedSystems(): Promise<RelatedSystem[]> {
  try {
    const res = await fetch(`${API_URL}/api/related-systems`);
    if (!res.ok) {
      throw new Error("Unable to retrieve related systems");
    }
    return await res.json();
  } catch (error: any) {
    throw new Error(error.message || "Unable to retrieve related systems");
  }
}

export async function createTicket(formData: FormData, userId: number): Promise<Ticket> {
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

export interface TicketFilterParams {
  search?: string;
  categoryId?: number | string;
  priority?: string;
  status?: string;
  sort?: string;
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  currentPage: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedTickets {
  items: Ticket[];
  meta: PaginationMeta;
}

export async function fetchTickets(
  params: TicketFilterParams = {},
  userId: number
): Promise<PaginatedTickets> {
  const queryParams = new URLSearchParams();
  if (params.search) queryParams.set("search", params.search);
  if (params.categoryId && params.categoryId !== "all") queryParams.set("categoryId", String(params.categoryId));
  if (params.priority && params.priority !== "all") queryParams.set("priority", params.priority);
  if (params.status && params.status !== "all") queryParams.set("status", params.status);
  if (params.sort) queryParams.set("sort", params.sort);
  if (params.order) queryParams.set("order", params.order);
  if (params.page) queryParams.set("page", String(params.page));
  if (params.limit) queryParams.set("limit", String(params.limit));

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

export async function fetchTicketById(
  id: number,
  userId: number
): Promise<Ticket> {
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

export async function uploadAttachment(
  ticketId: number,
  files: File | File[],
  userId: number
): Promise<Attachment[]> {
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

export async function downloadAttachment(
  attachmentId: number,
  userId: number,
  originalFileName: string
): Promise<void> {
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
    } catch (_) {}
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

export async function removeAttachment(
  attachmentId: number,
  removalReason: string,
  userId: number
): Promise<void> {
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


