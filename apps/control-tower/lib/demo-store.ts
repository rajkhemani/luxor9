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

const DEMO_INTERVIEW_QUESTIONS = [
  {
    id: "re_who",
    field: "user",
    prompt:
      "Who is this for inside the developer organisation — sales, marketing, C-suite, or a specific launch war-room?",
    guess: "Sales + marketing launch team for the Dubai project.",
  },
  {
    id: "re_success",
    field: "success",
    prompt: "How will you know this worked — what does success look like in one sentence?",
    guess: "Leadership can approve a blueprint with clear evidence and no silent assumptions.",
  },
  {
    id: "re_constraint",
    field: "constraint",
    prompt: "What is the binding constraint — sandbox-only, brand compliance, budget, or data residency?",
    guess: "Sandbox only — no live ad spend without Trust approval.",
  },
] as const;

function interviewQuestionReply(
  hypothesis: string,
  confidence: number,
  q: (typeof DEMO_INTERVIEW_QUESTIONS)[number],
): string {
  return (
    `HYPOTHESIS: ${hypothesis}\n` +
    `CONFIDENCE: ~${confidence}%\n\n` +
    `Q: ${q.prompt}\n` +
    `GUESS: ${q.guess}`
  );
}

function createInterviewWorkflow(
  objective: string,
  context: Record<string, unknown> = { location: "Dubai", product_type: "residential" },
  state = getDemoState(),
): { reply: string; workflow: Workflow; awaiting: string } {
  const n = state.seq++;
  const id = `wf_cmo_${String(n).padStart(3, "0")}`;
  const q0 = DEMO_INTERVIEW_QUESTIONS[0];
  const hypothesis = `You want governed automation for: ${objective.slice(0, 180)}.`;
  const interview = {
    skill: "interview_me",
    phase: "questioning",
    hypothesis,
    confidence: 30,
    questions_asked: 1,
    pending_field: q0.field,
    asked_ids: [q0.id],
    answers: [] as Array<{ field: string; text: string }>,
    statement: {} as Record<string, string>,
    objective,
    guardrails: { min_questions: 3, confidence_threshold: 95, category: "b2b_real_estate" },
  };
  const wf: Workflow = {
    id,
    tenant_id: "tenant_demo_dubai",
    objective,
    status: "draft",
    pack: "cmo_re",
    context: { ...context, interview },
    report: null,
    blueprint: null,
    created_at: new Date().toISOString(),
  };
  state.workflows.unshift(wf);
  return {
    reply: interviewQuestionReply(hypothesis, 30, q0),
    workflow: wf,
    awaiting: "interview_answer",
  };
}

function attachDemoBlueprint(wf: Workflow, state = getDemoState()): Workflow {
  const n = state.seq++;
  const location = String((wf.context as { location?: string }).location || "Dubai");
  const productType = String((wf.context as { product_type?: string }).product_type || "residential");
  const interview = (wf.context as { interview?: { statement?: Record<string, string> } }).interview;
  const statement = interview?.statement || {};
  const objective = statement.outcome || wf.objective;
  wf.objective = objective;
  wf.status = "awaiting_blueprint_approval";
  wf.context = {
    ...wf.context,
    interview_confirmed: true,
    intent: statement,
  };
  wf.blueprint = {
    id: `bp_${String(n).padStart(3, "0")}`,
    workflow_id: wf.id,
    status: "pending",
    title: `Market-to-Launch Intelligence — ${location}`,
    summary: `Blueprint for a governed CMO workflow covering market research, competitor analysis and launch strategy for ${productType} in ${location}.`,
    plan: {
      objective,
      context: wf.context,
      stages: [
        { id: "market", agent: "market_researcher", goal: "Produce sourced market opportunity findings" },
        { id: "competitor", agent: "competitor_analyst", goal: "Produce competitor positioning analysis" },
        { id: "strategy", agent: "strategy_writer", goal: "Assemble launch strategy with assumptions and risks" },
        { id: "evaluate", agent: "evaluator", goal: "Flag unsupported, conflicting or stale claims" },
      ],
    },
  };
  state.metering.unshift({
    id: `mtr_${Date.now()}_${n}`,
    event_name: "workflow.blueprint.created",
    workflow_id: wf.id,
    units: 1,
  });
  return wf;
}

export function createDraftWorkflow(
  objective: string,
  context: Record<string, unknown> = { location: "Dubai", product_type: "residential" },
  state = getDemoState(),
): Workflow {
  const started = createInterviewWorkflow(objective, context, state);
  return attachDemoBlueprint(started.workflow, state);
}

function continueDemoInterview(
  wf: Workflow,
  message: string,
  state = getDemoState(),
): { reply: string; workflow: Workflow; awaiting: string | null } {
  const ctx = wf.context as {
    interview?: {
      phase: string;
      confidence: number;
      questions_asked: number;
      pending_field: string | null;
      asked_ids: string[];
      answers: Array<{ field: string; text: string }>;
      statement: Record<string, string>;
      hypothesis: string;
      objective: string;
    };
  };
  const interview = ctx.interview;
  if (!interview) {
    const drafted = attachDemoBlueprint(wf, state);
    return {
      reply: `Drafted blueprint "${drafted.blueprint?.title}" (${drafted.id}). Reply "approve" or "decline".`,
      workflow: drafted,
      awaiting: "blueprint_approval",
    };
  }

  const normalized = message.trim().toLowerCase();
  const yes = new Set([
    "yes",
    "yes.",
    "y",
    "confirm",
    "confirmed",
    "looks right",
    "that's right",
    "thats right",
  ]);
  const no = new Set(["no", "no.", "n", "refine", "not quite", "wrong"]);

  if (interview.phase === "restate") {
    if (yes.has(normalized)) {
      interview.phase = "confirmed";
      const drafted = attachDemoBlueprint(wf, state);
      return {
        reply:
          `Confirmed. I drafted a governed blueprint: **${drafted.blueprint?.title}**.\n\n` +
          `${drafted.blueprint?.summary}\n\n` +
          `Reply **approve** to dispatch the CMO hierarchy, or **decline** to cancel.`,
        workflow: drafted,
        awaiting: "blueprint_approval",
      };
    }
    interview.phase = "questioning";
    interview.confidence = Math.max(40, interview.confidence - 15);
  }

  const asked = new Set(interview.asked_ids);
  const currentQ =
    DEMO_INTERVIEW_QUESTIONS.find((q) => q.id === interview.asked_ids[interview.asked_ids.length - 1]) ||
    DEMO_INTERVIEW_QUESTIONS[0];

  if (interview.phase === "questioning" && yes.has(normalized)) {
    interview.answers.push({ field: currentQ.field, text: currentQ.guess });
    interview.statement[currentQ.field] = currentQ.guess;
  } else if (interview.phase === "questioning" && no.has(normalized)) {
    return {
      reply:
        `Understood — that guess was wrong. Give a short substantive answer for: ${currentQ.field}\n\n` +
        `Q: ${currentQ.prompt}\nGUESS: ${currentQ.guess}`,
      workflow: wf,
      awaiting: "interview_answer",
    };
  } else if (message.trim().length < 3) {
    return {
      reply: `I need a short substantive answer before we continue.\n\nPending: ${interview.pending_field}`,
      workflow: wf,
      awaiting: "interview_answer",
    };
  } else {
    interview.answers.push({ field: currentQ.field, text: message.trim() });
    interview.statement[currentQ.field] = message.trim();
  }

  const filled = Object.values(interview.statement).filter((v) => v.trim().length >= 3).length;
  interview.confidence = Math.min(99, 25 + interview.answers.length * 15 + filled * 10);

  const enterRestate = () => {
    interview.phase = "restate";
    interview.pending_field = null;
    interview.statement.outcome ||= interview.objective;
    interview.statement.why_now ||= "Developer requested automation now.";
    interview.statement.out_of_scope ||= "Live spend / CRM writes";
    const s = interview.statement;
    return {
      reply:
        `Here's what I now think you want (confidence ~${interview.confidence}%):\n\n` +
        `- Outcome:      ${s.outcome || "—"}\n` +
        `- User:         ${s.user || "—"}\n` +
        `- Why now:      ${s.why_now || "—"}\n` +
        `- Success:      ${s.success || "—"}\n` +
        `- Constraint:   ${s.constraint || "—"}\n` +
        `- Out of scope: ${s.out_of_scope || "—"}\n\n` +
        `Yes / no / refine?`,
      workflow: wf,
      awaiting: "interview_confirm" as const,
    };
  };

  const minQ = Number(
    (interview as { guardrails?: { min_questions?: number; confidence_threshold?: number; max_questions?: number } })
      .guardrails?.min_questions ?? 3,
  );
  const threshold = Number(
    (interview as { guardrails?: { confidence_threshold?: number } }).guardrails
      ?.confidence_threshold ?? 95,
  );
  const maxQ = Number(
    (interview as { guardrails?: { max_questions?: number } }).guardrails?.max_questions ?? 12,
  );
  if (
    (interview.questions_asked >= minQ && interview.confidence >= threshold) ||
    interview.questions_asked >= maxQ
  ) {
    return enterRestate();
  }

  const nextQ = DEMO_INTERVIEW_QUESTIONS.find((q) => !asked.has(q.id));
  if (!nextQ) {
    return enterRestate();
  }

  interview.asked_ids.push(nextQ.id);
  interview.questions_asked += 1;
  interview.pending_field = nextQ.field;
  interview.phase = "questioning";
  return {
    reply: interviewQuestionReply(interview.hypothesis, interview.confidence, nextQ),
    workflow: wf,
    awaiting: "interview_answer",
  };
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
    // Bare yes after confirm must not auto-approve.
    if (normalized === "yes" || normalized === "y") {
      return {
        reply:
          "Intent is already confirmed and a blueprint is proposed. " +
          'Reply "approve" to dispatch, or "decline" to cancel.',
        workflow: existing,
        awaiting: "blueprint_approval",
      };
    }
  }

  if (existing && existing.status === "draft") {
    return continueDemoInterview(existing, message, state);
  }

  return createInterviewWorkflow(message.trim(), context, state);
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
