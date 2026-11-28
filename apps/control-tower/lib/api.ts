import {
  decideApproval,
  getAguiStatus,
  getDemoState,
  getOverview,
  handleChatMessage,
  listAgents,
} from "./demo-store";
import { buildAuthHeaders, type TokenGetter } from "./auth-headers";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

let tokenGetter: TokenGetter | undefined;

/** Register Clerk getToken (or equivalent) for browser API calls. */
export function setApiTokenGetter(getter: TokenGetter | undefined) {
  tokenGetter = getter;
}

function useLocalServerStore(): boolean {
  return !API_BASE && typeof window === "undefined";
}

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
  const base = API_BASE;
  const authHeaders = await buildAuthHeaders(tokenGetter);
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
        ...(init?.headers || {}),
      },
      cache: "no-store",
    });
  } catch (err) {
    const why = err instanceof Error ? err.message : "network error";
    throw new Error(
      `API unreachable at ${base || "(same-origin)"}${path} (${why}). ` +
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
    if (useLocalServerStore()) return { status: "ok" };
    const healthPath = API_BASE ? `${API_BASE}/health` : "/api/health";
    const res = await fetch(healthPath, { cache: "no-store" });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
    }
    return res.json() as Promise<{ status: string }>;
  },
  aguiStatus: async (): Promise<AguiStatus> =>
    useLocalServerStore() ? getAguiStatus() : api<AguiStatus>("/api/v1/agui/status"),
  overview: async (): Promise<OverviewData> =>
    useLocalServerStore() ? getOverview() : api<OverviewData>("/api/v1/overview"),
  workflows: async (): Promise<Workflow[]> =>
    useLocalServerStore() ? getDemoState().workflows : api<Workflow[]>("/api/v1/workflows"),
  workflow: async (id: string): Promise<Workflow> => {
    if (useLocalServerStore()) {
      const wf = getDemoState().workflows.find((w) => w.id === id);
      if (!wf) throw new Error("HTTP 404: Workflow not found");
      return wf;
    }
    return api<Workflow>(`/api/v1/workflows/${id}`);
  },
  approvals: async () => {
    if (useLocalServerStore()) return getDemoState().approvals;
    return api<
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
    >("/api/v1/approvals");
  },
  approve: async (id: string) => {
    if (useLocalServerStore()) return decideApproval(id, "approve");
    return api(`/api/v1/approvals/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ decision: "approve", reason: "tower" }),
    });
  },
  reject: async (id: string) => {
    if (useLocalServerStore()) return decideApproval(id, "reject");
    return api(`/api/v1/approvals/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ decision: "reject", reason: "tower" }),
    });
  },
  evidence: async (workflowId: string) => {
    if (useLocalServerStore()) return getDemoState().evidenceByWorkflow[workflowId] ?? [];
    return api<
      Array<{
        source_id: string;
        title: string;
        canonical_uri: string;
        source_type: string;
        content_hash: string;
        excerpts: string[];
      }>
    >(`/api/v1/workflows/${workflowId}/evidence`);
  },
  claims: async (workflowId: string) => {
    if (useLocalServerStore()) return getDemoState().claimsByWorkflow[workflowId] ?? [];
    return api<
      Array<{
        id: string;
        claim_text: string;
        claim_type: string;
        status: string;
        confidence: number;
      }>
    >(`/api/v1/workflows/${workflowId}/claims`);
  },
  agents: async (): Promise<Record<string, unknown>> =>
    useLocalServerStore() ? listAgents() : api<Record<string, unknown>>("/api/v1/agents"),
  chat: async (message: string, workflowId?: string) => {
    if (useLocalServerStore()) {
      return handleChatMessage(message, workflowId, { location: "Dubai", product_type: "residential" });
    }
    return api<{ reply: string; workflow: Workflow; awaiting: string | null }>("/api/v1/chat", {
      method: "POST",
      body: JSON.stringify({
        message,
        workflow_id: workflowId,
        context: {
          location: "Dubai",
          product_type: "residential",
          // Interview Me — probe before blueprint (B2B RE templates).
          interview_guardrails: {
            enabled: true,
            category: "b2b_real_estate",
            min_questions: 3,
            confidence_threshold: 95,
            require_explicit_yes: true,
          },
        },
      }),
    });
  },
  metering: async () => {
    if (useLocalServerStore()) return getDemoState().metering;
    return api<Array<{ id: string; event_name: string; workflow_id: string | null; units: number }>>(
      "/api/v1/metering",
    );
  },
};
