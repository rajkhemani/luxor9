import type { AguiStatus, OverviewData, Workflow } from "./api";

export type ApprovalItem = {
  id: string;
  workflow_id: string;
  action: string;
  status: "pending" | "approved" | "rejected";
  resource_type: string;
  resource_id: string;
  payload: Record<string, unknown>;
  expires_at: string;
};

export type EvidenceItem = {
  source_id: string;
  title: string;
  canonical_uri: string;
  source_type: string;
  content_hash: string;
  excerpts: string[];
};

export type ClaimItem = {
  id: string;
  claim_text: string;
  claim_type: string;
  status: "VERIFIED" | "UNVERIFIED" | "CONFLICTING";
  confidence: number;
};

export type MeteringItem = {
  id: string;
  event_name: string;
  workflow_id: string | null;
  units: number;
};

type DemoState = {
  seq: number;
  workflows: Workflow[];
  approvals: ApprovalItem[];
  evidenceByWorkflow: Record<string, EvidenceItem[]>;
  claimsByWorkflow: Record<string, ClaimItem[]>;
  metering: MeteringItem[];
};

const CMO_PACK = {
  pack: "cmo_re",
  name: "LUXOR9 CMO — Real Estate",
  executive: {
    agent_key: "cmo_executive",
    name: "CMO Executive",
    level: "executive",
  },
  specialists: [
    { agent_key: "market_researcher", name: "Market Researcher", topic: "market intelligence" },
    { agent_key: "competitor_analyst", name: "Competitor Analyst", topic: "competitor intelligence" },
    { agent_key: "strategy_writer", name: "Strategy Writer", topic: "launch strategy" },
    { agent_key: "evaluator", name: "Evaluator", topic: "evaluation" },
  ],
};

function createInitialState(): DemoState {
  const seedWorkflowId = "wf_dubai_creek_001";
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const seedWorkflow: Workflow = {
    id: seedWorkflowId,
    tenant_id: "tenant_demo_dubai",
    objective:
      "Market-to-launch intelligence for a Dubai Creek Harbour residential tower (synthetic demo brief)",
    status: "awaiting_publish_approval",
    pack: "cmo_re",
    context: {
      location: "Dubai",
      product_type: "residential",
      segment: "HNW GCC + South Asia",
      price_band: "AED 2.5M–6M",
      horizon: "Q2 launch",
      demo: true,
    },
    blueprint: {
      id: "bp_dubai_creek_001",
      workflow_id: seedWorkflowId,
      status: "approved",
      title: "Market-to-Launch Intelligence — Dubai",
      summary:
        "Blueprint for a governed CMO workflow covering market research, competitor analysis and launch strategy for residential in Dubai.",
      plan: {
        stages: [
          { id: "market", agent: "market_researcher", goal: "Produce sourced market opportunity findings" },
          { id: "competitor", agent: "competitor_analyst", goal: "Produce competitor positioning analysis" },
          { id: "strategy", agent: "strategy_writer", goal: "Assemble launch strategy with assumptions and risks" },
          { id: "evaluate", agent: "evaluator", goal: "Flag unsupported, conflicting or stale claims" },
        ],
        human_gates: [
          { id: "blueprint_approval", description: "Customer approves blueprint" },
          { id: "campaign_publish", description: "Approver required before sandbox campaign publish" },
        ],
      },
    },
    report: {
      positioning: "Premium waterfront living in Dubai Creek Harbour",
      assumptions: [
        "Demand remains resilient in target waterfront submarket",
        "Competitor launches do not flood the AED 2.5M–6M price band in the next quarter",
      ],
      risks: ["Interest rate sensitivity", "Supply surge in adjacent communities"],
      opportunities: [
        "Differentiate on lifestyle amenities and post-handover payment plans",
        "Target GCC and South Asian HNW investor segments",
      ],
    },
    created_at: new Date().toISOString(),
  };

  return {
    seq: 2,
    workflows: [seedWorkflow],
    approvals: [
      {
        id: "apr_publish_001",
        workflow_id: seedWorkflowId,
        action: "campaign.publish.sandbox",
        status: "pending",
        resource_type: "campaign_pack",
        resource_id: "creek_harbour_q2",
        payload: { channel: "sandbox_preview", pack: "cmo_re" },
        expires_at: expiresAt,
      },
    ],
    evidenceByWorkflow: {
      [seedWorkflowId]: [
        {
          source_id: "src_dld_001",
          title: "Dubai Waterfront Residential Transaction Benchmark (Synthetic)",
          canonical_uri: "https://example.invalid/luxor9/synthetic/dld-waterfront-q1",
          source_type: "market_benchmark",
          content_hash: "a94f3c8e21b7d01944c8e210",
          excerpts: [
            "Waterfront 2–3BR transactions in Dubai Creek Harbour averaged AED 2,450/sqft across Q1 synthetic baseline.",
          ],
        },
        {
          source_id: "src_comp_002",
          title: "Adjacent Harbour Launches Positioning Snapshot (Synthetic)",
          canonical_uri: "https://example.invalid/luxor9/synthetic/competitor-positioning",
          source_type: "competitor_brief",
          content_hash: "7bc1920fe84a551c39a2b814",
          excerpts: [
            "Peer developments emphasize 60/40 construction-linked schedules and marina promenade access.",
          ],
        },
      ],
    },
    claimsByWorkflow: {
      [seedWorkflowId]: [
        {
          id: "clm_001",
          claim_text:
            "Waterfront 2–3BR transactions in Dubai Creek Harbour averaged AED 2,450/sqft across Q1 synthetic baseline.",
          claim_type: "market",
          status: "VERIFIED",
          confidence: 0.78,
        },
        {
          id: "clm_002",
          claim_text:
            "Peer developments emphasize 60/40 construction-linked schedules and marina promenade access.",
          claim_type: "competitor",
          status: "VERIFIED",
          confidence: 0.74,
        },
        {
          id: "clm_003",
          claim_text: "Absorptions will exceed 70% in launch month",
          claim_type: "strategy",
          status: "UNVERIFIED",
          confidence: 0.35,
        },
      ],
    },
    metering: [
      { id: "mtr_001", event_name: "workflow.blueprint.created", workflow_id: seedWorkflowId, units: 1 },
      { id: "mtr_002", event_name: "cmo.specialists.executed", workflow_id: seedWorkflowId, units: 4 },
      { id: "mtr_003", event_name: "trust.approval.requested", workflow_id: seedWorkflowId, units: 1 },
    ],
  };
}

const globalForDemo = globalThis as typeof globalThis & { __luxor9DemoState?: DemoState };

export function getDemoState(): DemoState {
  if (!globalForDemo.__luxor9DemoState) {
    globalForDemo.__luxor9DemoState = createInitialState();
  }
  return globalForDemo.__luxor9DemoState;
}

export function resetDemoState(): DemoState {
  globalForDemo.__luxor9DemoState = createInitialState();
  return globalForDemo.__luxor9DemoState;
}

export function getOverview(state = getDemoState()): OverviewData {
  const active = state.workflows.filter(
    (w) => w.status !== "completed" && w.status !== "declined" && w.status !== "failed",
  ).length;
  const completed = state.workflows.filter((w) => w.status === "completed").length;
  const pendingApprovals = state.approvals.filter((a) => a.status === "pending").length;
  const openExceptions = Object.values(state.claimsByWorkflow)
    .flat()
    .filter((c) => c.status !== "VERIFIED").length;

  return {
    active_workflows: active,
    pending_approvals: pendingApprovals,
    completed_workflows: completed,
    open_exceptions: openExceptions,
    recent_workflows: state.workflows.slice(0, 10),
  };
}

export function getAguiStatus(): AguiStatus {
  return {
    enabled: true,
    agents: [{ name: "luxor9_cmo", path: "/api/v1/agui/cmo" }],
    connectivity: {
      protocol: "ag-ui",
      bucket: 2,
      mode: "sandbox_in_memory",
      capabilities: {
        live_stream: true,
        human_in_the_loop: true,
        recursive_subagents: "CMO → parallel market + competitor → strategy → evaluator",
      },
    },
    coworker_hub: "Register this AG-UI URL as a Coworker Hub bot (bucket-2 shell)",
    duo_skin: "Same bot — Duo Skin proactive layout optional later",
    intelligence: "Bucket 3 — Luxor Intelligence, Phase 2",
  };
}

export function listAgents() {
  return {
    orchestrator: {
      agent_key: "orchestrator",
      name: "Luxor9 Orchestrator",
      level: "orchestrator",
    },
    packs: [CMO_PACK],
    roadmap_stubs: [
      { pack: "cfo", status: "roadmap" },
      { pack: "coo", status: "roadmap" },
    ],
  };
}

export function createDraftWorkflow(
  objective: string,
  context: Record<string, unknown> = { location: "Dubai", product_type: "residential" },
  state = getDemoState(),
): Workflow {
  const n = state.seq++;
  const id = `wf_cmo_${String(n).padStart(3, "0")}`;
  const location = String(context.location || "Dubai");
  const productType = String(context.product_type || "residential");

  const wf: Workflow = {
    id,
    tenant_id: "tenant_demo_dubai",
    objective,
    status: "awaiting_blueprint_approval",
    pack: "cmo_re",
    context,
    report: null,
    blueprint: {
      id: `bp_${String(n).padStart(3, "0")}`,
      workflow_id: id,
      status: "pending",
      title: `Market-to-Launch Intelligence — ${location}`,
      summary: `Blueprint for a governed CMO workflow covering market research, competitor analysis and launch strategy for ${productType} in ${location}.`,
      plan: {
        objective,
        context,
        stages: [
          { id: "market", agent: "market_researcher", goal: "Produce sourced market opportunity findings" },
          { id: "competitor", agent: "competitor_analyst", goal: "Produce competitor positioning analysis" },
          { id: "strategy", agent: "strategy_writer", goal: "Assemble launch strategy with assumptions and risks" },
          { id: "evaluate", agent: "evaluator", goal: "Flag unsupported, conflicting or stale claims" },
        ],
      },
    },
    created_at: new Date().toISOString(),
  };

  state.workflows.unshift(wf);
  state.metering.unshift({
    id: `mtr_${Date.now()}_${n}`,
    event_name: "workflow.blueprint.created",
    workflow_id: id,
    units: 1,
  });
  return wf;
}

export function executeApprovedBlueprint(wf: Workflow, state = getDemoState()): Workflow {
  if (wf.blueprint) {
    wf.blueprint.status = "approved";
  }
  wf.status = "awaiting_publish_approval";
  wf.report = {
    objective: wf.objective,
    positioning: "Differentiated luxury residential launch with verified market comps",
    assumptions: [
      "Demand remains resilient in target submarket",
      "Competitor launches do not flood the same price band in the next quarter",
    ],
    risks: ["Interest rate sensitivity", "Supply surge in adjacent communities"],
    opportunities: [
      "Differentiate on lifestyle amenities and payment plans",
      "Target GCC and South Asian HNW segments",
    ],
  };

  state.evidenceByWorkflow[wf.id] = [
    {
      source_id: `src_mkt_${wf.id}`,
      title: `Market Intelligence Brief — ${wf.objective.slice(0, 48)}`,
      canonical_uri: `https://example.invalid/luxor9/synthetic/${wf.id}/market`,
      source_type: "market_benchmark",
      content_hash: "c41e90ab721f58d3104c",
      excerpts: ["Synthetic market baseline confirms steady end-user absorption in prime Dubai corridors."],
    },
    {
      source_id: `src_cmp_${wf.id}`,
      title: `Competitor Landscape — ${wf.objective.slice(0, 48)}`,
      canonical_uri: `https://example.invalid/luxor9/synthetic/${wf.id}/competitors`,
      source_type: "competitor_brief",
      content_hash: "91ab4f2083ce7712d9e1",
      excerpts: ["Adjacent projects compete on payment plan flexibility and handover timelines."],
    },
  ];

  state.claimsByWorkflow[wf.id] = [
    {
      id: `clm_${wf.id}_1`,
      claim_text: "Synthetic market baseline confirms steady end-user absorption in prime Dubai corridors.",
      claim_type: "market",
      status: "VERIFIED",
      confidence: 0.75,
    },
    {
      id: `clm_${wf.id}_2`,
      claim_text: "Absorptions will exceed 70% in launch month",
      claim_type: "strategy",
      status: "UNVERIFIED",
      confidence: 0.35,
    },
  ];

  state.approvals.unshift({
    id: `apr_${wf.id}`,
    workflow_id: wf.id,
    action: "campaign.publish.sandbox",
    status: "pending",
    resource_type: "campaign_pack",
    resource_id: wf.id,
    payload: { objective: wf.objective, channel: "sandbox_preview" },
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  });

  state.metering.unshift(
    { id: `mtr_exec_${wf.id}`, event_name: "cmo.specialists.executed", workflow_id: wf.id, units: 4 },
    { id: `mtr_apr_${wf.id}`, event_name: "trust.approval.requested", workflow_id: wf.id, units: 1 },
  );
  return wf;
}

export function handleChatMessage(
  message: string,
  workflowId?: string,
  context?: Record<string, unknown>,
  state = getDemoState(),
): { reply: string; workflow: Workflow; awaiting: string | null } {
  const normalized = message.trim().toLowerCase();
  const existing = workflowId ? state.workflows.find((w) => w.id === workflowId) : undefined;

  if (existing && existing.status === "awaiting_blueprint_approval") {
    if (normalized === "approve" || normalized.startsWith("approve")) {
      const updated = executeApprovedBlueprint(existing, state);
      return {
        reply:
          `Blueprint approved for ${updated.id}. Parallel CMO specialists (Market Researcher, Competitor Analyst, Strategy Writer, Evaluator) completed execution.\n` +
          `2 evidence records and 2 claims were recorded (1 VERIFIED, 1 UNVERIFIED). A sandbox campaign publish approval is now waiting in the Approval centre.`,
        workflow: updated,
        awaiting: "publish_approval",
      };
    }
    if (normalized === "decline" || normalized.startsWith("decline") || normalized === "reject") {
      if (existing.blueprint) existing.blueprint.status = "declined";
      existing.status = "declined";
      return {
        reply: `Blueprint declined for ${existing.id}. No specialist agents were executed.`,
        workflow: existing,
        awaiting: null,
      };
    }
  }

  const wf = createDraftWorkflow(message.trim(), context, state);
  return {
    reply:
      `Drafted blueprint "${wf.blueprint?.title}" (${wf.id}).\n` +
      `Stages: Market Researcher + Competitor Analyst (parallel) → Strategy Writer → Evaluator.\n` +
      `Reply "approve" or click Approve blueprint to execute, or "decline" to cancel.`,
    workflow: wf,
    awaiting: "blueprint_approval",
  };
}

/** Mock of D-012: read-only live API response shown for display only (no outbound send). */
export type DubaiApproveLiveDisplay = {
  decision: "D-012";
  mode: "preview_mock";
  read_only: true;
  outbound_send: false;
  fetched_at: string;
  workflow_id: string;
  note: string;
  display: {
    objective: string;
    status: string;
    active_workflows: number;
    pending_approvals: number;
    open_exceptions: number;
  };
  evidence: EvidenceItem[];
  claims: ClaimItem[];
  approval: ApprovalItem | null;
};

export function previewDubaiApproveLiveRead(
  workflowId = "wf_dubai_creek_001",
  state = getDemoState(),
): DubaiApproveLiveDisplay {
  const wf = state.workflows.find((w) => w.id === workflowId) ?? state.workflows[0];
  const overview = getOverview(state);
  const evidence = state.evidenceByWorkflow[wf?.id ?? workflowId] ?? [];
  const claims = state.claimsByWorkflow[wf?.id ?? workflowId] ?? [];
  const approval =
    state.approvals.find((a) => a.workflow_id === (wf?.id ?? workflowId) && a.status === "pending") ??
    state.approvals.find((a) => a.workflow_id === (wf?.id ?? workflowId)) ??
    null;

  return {
    decision: "D-012",
    mode: "preview_mock",
    read_only: true,
    outbound_send: false,
    fetched_at: new Date().toISOString(),
    workflow_id: wf?.id ?? workflowId,
    note:
      "Preview mock of D-012 — read-only live call returning real data for display only. No CRM/ERP write, no paid ads, no customer message. Not wired to the cloud backend yet.",
    display: {
      objective: wf?.objective ?? "Dubai demo workflow",
      status: wf?.status ?? "unknown",
      active_workflows: overview.active_workflows,
      pending_approvals: overview.pending_approvals,
      open_exceptions: overview.open_exceptions,
    },
    evidence,
    claims,
    approval,
  };
}

export function decideApproval(
  id: string,
  decision: "approve" | "reject",
  state = getDemoState(),
): ApprovalItem | null {
  const item = state.approvals.find((a) => a.id === id);
  if (!item) return null;
  item.status = decision === "approve" ? "approved" : "rejected";

  const wf = state.workflows.find((w) => w.id === item.workflow_id);
  if (wf) {
    wf.status = decision === "approve" ? "completed" : "rejected";
  }

  state.metering.unshift({
    id: `mtr_dec_${id}_${Date.now()}`,
    event_name: decision === "approve" ? "trust.approval.approved" : "trust.approval.rejected",
    workflow_id: item.workflow_id,
    units: 1,
  });

  return item;
}
