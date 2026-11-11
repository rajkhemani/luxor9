export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export type Workflow = {
  id: string;
  tenant_id: string;
  objective: string;
  status: string;
  pack: string;
  context: Record<string, unknown>;
  report: Record<string, unknown> | null;
  blueprint: {
    id: string;
    workflow_id: string;
    status: string;
    title: string;
    summary: string;
    plan: Record<string, unknown>;
  } | null;
  created_at?: string;
};

export type OverviewData = {
  active_workflows: number;
  pending_approvals: number;
  completed_workflows: number;
  open_exceptions: number;
  recent_workflows: Workflow[];
};

export type AguiStatus = {
  enabled: boolean;
  agents?: Array<{ name: string; path: string }>;
  connectivity?: Record<string, unknown>;
  coworker_hub?: string;
  duo_skin?: string;
  intelligence?: string;
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "X-Demo-User": "user_demo_admin",
        ...(init?.headers || {}),
      },
      cache: "no-store",
    });
  } catch (err) {
    const why = err instanceof Error ? err.message : "network error";
    throw new Error(
      `API unreachable at ${API_BASE}${path} (${why}). ` +
        "Start make api-dev and ensure API_CORS_ORIGINS includes this page origin " +
        "(localhost and 127.0.0.1).",
    );
  }
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export const client = {
  health: async (): Promise<{ status: string }> => {
    const res = await fetch(`${API_BASE}/health`, { cache: "no-store" });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
    }
    return res.json() as Promise<{ status: string }>;
  },
  aguiStatus: () => api<AguiStatus>("/api/v1/agui/status"),
  overview: () => api<OverviewData>("/api/v1/overview"),
  workflows: () => api<Workflow[]>("/api/v1/workflows"),
  workflow: (id: string) => api<Workflow>(`/api/v1/workflows/${id}`),
  approvals: () =>
    api<
      Array<{
        id: string;
        workflow_id: string;
        action: string;
        status: string;
        resource_type: string;
        resource_id: string;
        payload: Record<string, unknown>;
        expires_at: string;
      }>
    >("/api/v1/approvals"),
  approve: (id: string) =>
    api(`/api/v1/approvals/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ decision: "approve", reason: "tower" }),
    }),
  reject: (id: string) =>
    api(`/api/v1/approvals/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ decision: "reject", reason: "tower" }),
    }),
  evidence: (workflowId: string) =>
    api<
      Array<{
        source_id: string;
        title: string;
        canonical_uri: string;
        source_type: string;
        content_hash: string;
        excerpts: string[];
      }>
    >(`/api/v1/workflows/${workflowId}/evidence`),
  claims: (workflowId: string) =>
    api<
      Array<{
        id: string;
        claim_text: string;
        claim_type: string;
        status: string;
        confidence: number;
      }>
    >(`/api/v1/workflows/${workflowId}/claims`),
  agents: () => api<Record<string, unknown>>("/api/v1/agents"),
  chat: (message: string, workflowId?: string) =>
    api<{ reply: string; workflow: Workflow; awaiting: string | null }>("/api/v1/chat", {
      method: "POST",
      body: JSON.stringify({
        message,
        workflow_id: workflowId,
        context: { location: "Dubai", product_type: "residential" },
      }),
    }),
  metering: () =>
    api<Array<{ id: string; event_name: string; workflow_id: string | null; units: number }>>(
      "/api/v1/metering"
    ),
};
