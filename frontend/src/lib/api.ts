export type User = { id: string; name: string; email: string; role: "Admin" | "User" };
export type Project = {
  _id: string;
  title: string;
  description: string;
  requirement: string;
  status: "Draft" | "Planning" | "Active" | "Completed" | "Archived";
  createdAt: string;
};
export type AgentExecution = {
  _id: string;
  agentName: string;
  output: unknown;
  executionTime: number;
  status: "queued" | "running" | "completed" | "failed";
  error?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";

export function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("token");
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    }
  });

  const payload = await response.json();
  if (!response.ok || !payload.success) {
    if (response.status === 401 && typeof window !== "undefined") {
      window.localStorage.removeItem("token");
      window.localStorage.removeItem("user");
      window.location.href = "/login";
    }
    throw new Error(payload.message || "Request failed");
  }
  return payload.data as T;
}

export function exportUrl(projectId: string, type: "pdf" | "docx" | "sprint-xlsx") {
  return `${API_URL}/projects/${projectId}/export/${type}`;
}
