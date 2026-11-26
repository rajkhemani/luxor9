import {
  buildProofRecord,
  buildSimpleBlueprint,
  CHAT_PLACEHOLDER,
  detectMissingSources,
  JARGON_FORBIDDEN_WORDS,
  QUICK_EXAMPLES,
  type BlueprintItem,
  type ProofRecord,
} from "./simple-blueprint";

export { CHAT_PLACEHOLDER, JARGON_FORBIDDEN_WORDS, QUICK_EXAMPLES };
export type { BlueprintItem, ProofRecord };

export type DubaiPricingMode = "per_launch" | "monthly_tower";

export type BrochurePreview = {
  headline: string;
  subheadline: string;
  highlights: [string, string, string];
  factNote: string;
};

export type SocialPostPreview = {
  day: number;
  channel: "Instagram" | "LinkedIn";
  angle: string;
  caption: string;
};

export type WhatsAppMessagePreview = {
  timing: string;
  title: string;
  message: string;
};

export type WorkPreviewPack = {
  project: string;
  hasMissingSource: boolean;
  brochure: BrochurePreview;
  socialPosts: SocialPostPreview[];
  whatsappSequence: WhatsAppMessagePreview[];
};

export type SourceGatePayload = {
  kind: "source_gate";
  blueprintId: string;
  project: string;
  missingItems: string[];
  reason: string;
  resolved: boolean;
  resolvedSource?: string;
};

export type SimplePlanPayload = {
  kind: "simple_plan";
  blueprint: BlueprintItem;
  approved: boolean;
};

export type PreviewPackPayload = {
  kind: "preview_pack";
  blueprintId: string;
  pack: WorkPreviewPack;
};

export type ApprovalSealPayload = {
  kind: "approval_seal";
  blueprintId: string;
  project: string;
  problem: string;
  deliverables: [string, string, string];
  timeLabel: string;
  perLaunchPrice: string;
  monthlyTowerPrice: string;
  sourceLabel: string;
  lockedByMissingSource: boolean;
  decision: "pending" | "approved" | "change_requested";
  policyRef: string;
  expiresLabel: string;
};

export type ProofReceiptPayload = {
  kind: "proof_receipt";
  proof: ProofRecord;
  selectedMode: DubaiPricingMode;
  policyRef: string;
};

export type DubaiGenUiPayload =
  | SourceGatePayload
  | SimplePlanPayload
  | PreviewPackPayload
  | ApprovalSealPayload
  | ProofReceiptPayload;

export type DubaiGenUiToolName =
  | "render_source_gate"
  | "render_simple_plan"
  | "render_preview_pack"
  | "render_approval_seal"
  | "render_proof_receipt";

export type DubaiThreadState = {
  stage: "idle" | "source_needed" | "awaiting_approval" | "approved";
  blueprint: BlueprintItem | null;
  previewPack: WorkPreviewPack | null;
  proof: ProofRecord | null;
  policyRef: string | null;
};

export const DUBAI_APPROVAL_PREFIX = "__LUXOR9_APPROVE__:";
export const DUBAI_SOURCE_PREFIX = "__LUXOR9_SOURCE__:";
export const DUBAI_CHANGE_PREFIX = "__LUXOR9_CHANGE__:";

/**
 * Builds grounded brochure, 10 social post outlines, and 3 WhatsApp follow-ups
 * directly from the developer's verified brief. Never invents prices, dates, or offers.
 */
export function buildWorkPreviewPack(blueprint: BlueprintItem): WorkPreviewPack {
  const project = blueprint.project;
  const bilingual = blueprint.solutionSteps[0].toLowerCase().includes("arabic");
  const factNote = blueprint.missingSource
    ? "Price, handover date, and offer slots stay blank until you share a verified developer source."
    : `Fact check: ${blueprint.sourceLabel} · Service rate card verified.`;

  const brochure: BrochurePreview = {
    headline: bilingual
      ? `${project} — Private Launch Brief (EN / AR)`
      : `${project} — Private Launch Brief`,
    subheadline: `Prepared directly from your brief: ${blueprint.problem}.`,
    highlights: [
      `Clear positioning built only from verified developer facts (${blueprint.sourceLabel})`,
      bilingual
        ? "Matched English and Arabic executive copy ready for print and PDF sharing"
        : "Clean executive brochure structure ready for sales gallery print and WhatsApp PDF",
      blueprint.missingSource
        ? "Unit pricing & handover dates held as [Source needed] until verified"
        : "Transparent enquiry call-to-action routing buyers straight to your sales team",
    ],
    factNote,
  };

  const postAngles: Array<{ channel: "Instagram" | "LinkedIn"; angle: string; caption: string }> = [
    {
      channel: "Instagram",
      angle: "Launch Announcement",
      caption: `Introducing ${project}. Private previews are now open — message our sales desk for the official fact sheet.`,
    },
    {
      channel: "LinkedIn",
      angle: "Developer Vision",
      caption: `Why we designed ${project} for end-users and long-term investors who value architectural clarity.`,
    },
    {
      channel: "Instagram",
      angle: "Architecture & Craft",
      caption: `Quiet geometry, natural daylight, and thoughtful spatial planning at ${project}.`,
    },
    {
      channel: "Instagram",
      angle: "Site Visit Invitation",
      caption: `Walk the gallery in person. Book a private 20-minute viewing with our senior property advisor.`,
    },
    {
      channel: "LinkedIn",
      angle: "Broker Partner Brief",
      caption: `Registered UAE brokers: request the verified ${project} sales kit and official fact sheet directly.`,
    },
    {
      channel: "Instagram",
      angle: "Resident Lifestyle",
      caption: `Everyday calm built into every floor plan — discover how ${project} elevates daily living.`,
    },
    {
      channel: "Instagram",
      angle: "Verified Facts First",
      caption: blueprint.missingSource
        ? `Official pricing and handover schedule will be shared directly from our developer sheet upon confirmation.`
        : `Request our verified developer fact sheet for ${project} with complete unit layouts and viewing slots.`,
    },
    {
      channel: "LinkedIn",
      angle: "Investor Summary",
      caption: `Clear documentation, direct developer communication, and private tour scheduling for ${project}.`,
    },
    {
      channel: "Instagram",
      angle: "Private Viewing Slots",
      caption: `Weekend private gallery appointments for ${project} are now open. Tap to reserve your time.`,
    },
    {
      channel: "Instagram",
      angle: "Final Launch Call",
      caption: `Ready for the brochure PDF? Send a message and receive the verified ${project} dossier immediately.`,
    },
  ];

  const socialPosts: SocialPostPreview[] = postAngles.map((item, idx) => ({
    day: idx + 1,
    channel: item.channel,
    angle: item.angle,
    caption: item.caption,
  }));

  const whatsappSequence: WhatsAppMessagePreview[] = [
    {
      timing: "Within 5 minutes of visit",
      title: "Warm Thank-You + Official Brochure",
      message: `Thank you for visiting ${project} today. Here is your official brochure summary from our team. Reply here if you would like to compare available layouts.`,
    },
    {
      timing: "Day 2",
      title: "Clear Fact Sheet Follow-Up",
      message: blueprint.missingSource
        ? `Hello from ${project}. Once you confirm which unit size interests you, our advisor will send the official developer price sheet directly.`
        : `Hello from ${project}. Checking in to see if you had any questions on the layouts or would like a quick call with our advisor.`,
    },
    {
      timing: "Day 5",
      title: "Private Second Visit or Call",
      message: `We have private viewing slots open this week for ${project}. Would morning or late afternoon work better for a quick walk-through?`,
    },
  ];

  return {
    project,
    hasMissingSource: blueprint.missingSource,
    brochure,
    socialPosts,
    whatsappSequence,
  };
}

/**
 * Parses incoming raw tool arguments into a strictly typed DubaiGenUiPayload.
 * Never allows arbitrary HTML or unvalidated shapes to reach the UI.
 */
export function parseDubaiToolPayload(
  toolName: string,
  rawArgs: unknown,
): DubaiGenUiPayload | null {
  let obj: Record<string, unknown> | null = null;
  if (typeof rawArgs === "string") {
    try {
      const parsed = JSON.parse(rawArgs) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        obj = parsed as Record<string, unknown>;
      }
    } catch {
      return null;
    }
  } else if (rawArgs && typeof rawArgs === "object" && !Array.isArray(rawArgs)) {
    obj = rawArgs as Record<string, unknown>;
  }

  if (!obj) return null;

  switch (toolName) {
    case "render_source_gate": {
      if (typeof obj.blueprintId !== "string" || typeof obj.reason !== "string") return null;
      return {
        kind: "source_gate",
        blueprintId: obj.blueprintId,
        project: typeof obj.project === "string" ? obj.project : "Your Project",
        missingItems: Array.isArray(obj.missingItems)
          ? obj.missingItems.filter((v): v is string => typeof v === "string")
          : [],
        reason: obj.reason,
        resolved: Boolean(obj.resolved),
        resolvedSource: typeof obj.resolvedSource === "string" ? obj.resolvedSource : undefined,
      };
    }
    case "render_simple_plan": {
      const bp = obj.blueprint as BlueprintItem | undefined;
      if (!bp || typeof bp.id !== "string" || !Array.isArray(bp.solutionSteps)) return null;
      return {
        kind: "simple_plan",
        blueprint: bp,
        approved: Boolean(obj.approved),
      };
    }
    case "render_preview_pack": {
      const pack = obj.pack as WorkPreviewPack | undefined;
      if (!pack || typeof obj.blueprintId !== "string" || !pack.brochure) return null;
      return {
        kind: "preview_pack",
        blueprintId: obj.blueprintId,
        pack,
      };
    }
    case "render_approval_seal": {
      if (typeof obj.blueprintId !== "string" || typeof obj.project !== "string") return null;
      const decision =
        obj.decision === "approved" || obj.decision === "change_requested"
          ? obj.decision
          : "pending";
      return {
        kind: "approval_seal",
        blueprintId: obj.blueprintId,
        project: obj.project,
        problem: typeof obj.problem === "string" ? obj.problem : "",
        deliverables: Array.isArray(obj.deliverables) && obj.deliverables.length === 3
          ? [String(obj.deliverables[0]), String(obj.deliverables[1]), String(obj.deliverables[2])]
          : ["Brochure", "Posts", "Follow up"],
        timeLabel: typeof obj.timeLabel === "string" ? obj.timeLabel : "Ready in 3 days",
        perLaunchPrice:
          typeof obj.perLaunchPrice === "string" ? obj.perLaunchPrice : "AED 2,500 per launch",
        monthlyTowerPrice:
          typeof obj.monthlyTowerPrice === "string"
            ? obj.monthlyTowerPrice
            : "AED 1,500 per month",
        sourceLabel: typeof obj.sourceLabel === "string" ? obj.sourceLabel : "Provided by developer",
        lockedByMissingSource: Boolean(obj.lockedByMissingSource),
        decision,
        policyRef: typeof obj.policyRef === "string" ? obj.policyRef : "LUX9-UAE-STD",
        expiresLabel: typeof obj.expiresLabel === "string" ? obj.expiresLabel : "Valid for 24 hours",
      };
    }
    case "render_proof_receipt": {
      const proof = obj.proof as ProofRecord | undefined;
      if (!proof || typeof proof.proofId !== "string") return null;
      const selectedMode: DubaiPricingMode =
        obj.selectedMode === "monthly_tower" ? "monthly_tower" : "per_launch";
      return {
        kind: "proof_receipt",
        proof,
        selectedMode,
        policyRef: typeof obj.policyRef === "string" ? obj.policyRef : "LUX9-UAE-STD",
      };
    }
    default:
      return null;
  }
}

/**
 * Formats a clean, shareable plain-text receipt for WhatsApp or executive email.
 */
export function formatProofClipboardText(
  proof: ProofRecord,
  selectedMode: DubaiPricingMode = "per_launch",
): string {
  const pricingChoice =
    selectedMode === "monthly_tower"
      ? "Monthly Tower — AED 1,500 per month"
      : "Per Launch — AED 2,500 per launch";
  return [
    `LUXOR9 Proof Receipt (${proof.proofId})`,
    `Status: Automation started`,
    `Started: ${proof.startedAtIso}`,
    `Planned: ${proof.plannedSummary}`,
    `Approved deliverables: ${proof.approvedBuildList.join(", ")}`,
    `Selected plan: ${pricingChoice}`,
    `Delivery: ${proof.approvedTime}`,
    `Source: ${proof.sourceLabel}`,
  ].join("\n");
}

/**
 * Checks that developer-facing copy never leaks internal architecture jargon.
 */
export function containsForbiddenJargon(text: string): string[] {
  const lower = text.toLowerCase();
  return JARGON_FORBIDDEN_WORDS.filter((word) => lower.includes(word));
}

/**
 * Cleanly parses structured command messages sent from inline interactive cards
 * (Approve, Save Source, Ask to Change) while keeping chat history human-readable.
 */
export function parseDeveloperCommand(rawMessage: string):
  | { type: "approve"; mode: DubaiPricingMode; deliverables?: string[] }
  | { type: "source"; sourceText: string }
  | { type: "change"; changeText: string }
  | { type: "chat"; text: string } {
  const trimmed = rawMessage.trim();
  if (trimmed.startsWith(DUBAI_APPROVAL_PREFIX)) {
    const body = trimmed.slice(DUBAI_APPROVAL_PREFIX.length);
    try {
      const parsed = JSON.parse(body) as { mode?: string; deliverables?: string[] };
      return {
        type: "approve",
        mode: parsed.mode === "monthly_tower" ? "monthly_tower" : "per_launch",
        deliverables: Array.isArray(parsed.deliverables) ? parsed.deliverables : undefined,
      };
    } catch {
      return { type: "approve", mode: "per_launch" };
    }
  }
  if (trimmed.startsWith(DUBAI_SOURCE_PREFIX)) {
    return { type: "source", sourceText: trimmed.slice(DUBAI_SOURCE_PREFIX.length).trim() };
  }
  if (trimmed.startsWith(DUBAI_CHANGE_PREFIX)) {
    return { type: "change", changeText: trimmed.slice(DUBAI_CHANGE_PREFIX.length).trim() };
  }
  const lower = trimmed.toLowerCase();
  if (lower === "approve" || lower === "approve and build") {
    return { type: "approve", mode: "per_launch" };
  }
  return { type: "chat", text: trimmed };
}

/**
 * Formats an internal command message into clean human prose for display in the chat stream.
 */
export function formatDisplayUserMessage(rawMessage: string): string {
  const cmd = parseDeveloperCommand(rawMessage);
  if (cmd.type === "approve") {
    const planText =
      cmd.mode === "monthly_tower" ? "Monthly Tower (AED 1,500/mo)" : "Per Launch (AED 2,500)";
    return `Approved plan and started build (${planText}).`;
  }
  if (cmd.type === "source") {
    return `Added verified source: ${cmd.sourceText}`;
  }
  if (cmd.type === "change") {
    return `Requested change: ${cmd.changeText}`;
  }
  return cmd.text;
}

/**
 * Pure turn evaluator used by the AG-UI Dubai adapter.
 */
export function evaluateDubaiTurn(
  rawMessage: string,
  previousState: DubaiThreadState,
  nowIso = new Date().toISOString(),
): {
  nextState: DubaiThreadState;
  replyText: string;
  toolCalls: Array<{ name: DubaiGenUiToolName; args: DubaiGenUiPayload }>;
} {
  const cmd = parseDeveloperCommand(rawMessage);

  // 1. Approval command
  if (cmd.type === "approve" && previousState.blueprint) {
    const bp = previousState.blueprint;
    if (bp.missingSource) {
      const gate: SourceGatePayload = {
        kind: "source_gate",
        blueprintId: bp.id,
        project: bp.project,
        missingItems: bp.missingItems,
        reason:
          bp.missingSourceReason ||
          "Source needed. Please give source before approving. We never guess.",
        resolved: false,
      };
      return {
        nextState: { ...previousState, stage: "source_needed" },
        replyText:
          "Hold on — a verified source is still required before we can start building. Please add your source below.",
        toolCalls: [{ name: "render_source_gate", args: gate }],
      };
    }

    const approvedBlueprint: BlueprintItem =
      cmd.deliverables && cmd.deliverables.length === 3
        ? {
            ...bp,
            buildList: [cmd.deliverables[0], cmd.deliverables[1], cmd.deliverables[2]],
          }
        : bp;

    const workflowId = `wf_dubai_${Date.now().toString(36)}`;
    const proof = buildProofRecord(approvedBlueprint, workflowId, nowIso);
    const policyRef = previousState.policyRef || `LUX9-UAE-${proof.proofId.slice(-4)}`;

    const receiptPayload: ProofReceiptPayload = {
      kind: "proof_receipt",
      proof,
      selectedMode: cmd.mode,
      policyRef,
    };

    return {
      nextState: {
        stage: "approved",
        blueprint: approvedBlueprint,
        previewPack: previousState.previewPack,
        proof,
        policyRef,
      },
      replyText:
        "Automation started. Your approved plan is locked in and your proof receipt is ready below.",
      toolCalls: [{ name: "render_proof_receipt", args: receiptPayload }],
    };
  }

  // 2. Inline source resolution command
  if (cmd.type === "source" && previousState.blueprint) {
    const sourceText = cmd.sourceText.trim();
    const formattedSource = /^source\s*[:=-]/i.test(sourceText)
      ? sourceText
      : `Source: ${sourceText}`;

    const revised = buildSimpleBlueprint(formattedSource, previousState.blueprint);
    // Double-check explicit verification when the developer supplies a source note
    const explicitCheck = detectMissingSources(`${previousState.blueprint.originalMessage}\n${formattedSource}`);
    const finalBlueprint: BlueprintItem = {
      ...revised,
      missingSource: explicitCheck.missingSource && sourceText.length < 4,
      missingItems: explicitCheck.missingSource && sourceText.length < 4 ? explicitCheck.missingItems : [],
      missingSourceReason:
        explicitCheck.missingSource && sourceText.length < 4 ? explicitCheck.reason : null,
      sourceLabel:
        sourceText.length >= 4
          ? `Provided by developer (${sourceText.slice(0, 72)})`
          : revised.sourceLabel,
      sourceDetails:
        sourceText.length >= 4
          ? [
              `Developer source: ${sourceText}`,
              `Service fee: ${revised.pricing.priceSource}`,
              `Delivery time: ${revised.timeSource}`,
            ]
          : revised.sourceDetails,
    };

    const previewPack = buildWorkPreviewPack(finalBlueprint);
    const policyRef = previousState.policyRef || `LUX9-UAE-${finalBlueprint.id.slice(-4).toUpperCase()}`;

    const toolCalls: Array<{ name: DubaiGenUiToolName; args: DubaiGenUiPayload }> = [
      {
        name: "render_source_gate",
        args: {
          kind: "source_gate",
          blueprintId: finalBlueprint.id,
          project: finalBlueprint.project,
          missingItems: [],
          reason: "Developer source recorded and attached to this plan.",
          resolved: true,
          resolvedSource: sourceText,
        },
      },
      {
        name: "render_simple_plan",
        args: { kind: "simple_plan", blueprint: finalBlueprint, approved: false },
      },
      {
        name: "render_preview_pack",
        args: { kind: "preview_pack", blueprintId: finalBlueprint.id, pack: previewPack },
      },
      {
        name: "render_approval_seal",
        args: {
          kind: "approval_seal",
          blueprintId: finalBlueprint.id,
          project: finalBlueprint.project,
          problem: finalBlueprint.problem,
          deliverables: finalBlueprint.buildList,
          timeLabel: finalBlueprint.timeLabel,
          perLaunchPrice: finalBlueprint.pricing.perLaunch,
          monthlyTowerPrice: finalBlueprint.pricing.monthlyTower,
          sourceLabel: finalBlueprint.sourceLabel,
          lockedByMissingSource: finalBlueprint.missingSource,
          decision: "pending",
          policyRef,
          expiresLabel: "Valid for 24 hours",
        },
      },
    ];

    return {
      nextState: {
        stage: "awaiting_approval",
        blueprint: finalBlueprint,
        previewPack,
        proof: null,
        policyRef,
      },
      replyText:
        "Source saved. Your updated plan, sample previews, and approval card are ready below.",
      toolCalls,
    };
  }

  // 3. Draft or Revise blueprint
  const isRevision =
    cmd.type === "change" ||
    (previousState.blueprint !== null && previousState.stage !== "approved");
  const textToProcess = cmd.type === "change" ? cmd.changeText : cmd.type === "chat" ? cmd.text : "";

  const blueprint = buildSimpleBlueprint(
    textToProcess || "Launch my new project",
    isRevision ? previousState.blueprint : null,
  );
  const previewPack = buildWorkPreviewPack(blueprint);
  const policyRef = `LUX9-UAE-${blueprint.id.slice(-4).toUpperCase()}`;

  const toolCalls: Array<{ name: DubaiGenUiToolName; args: DubaiGenUiPayload }> = [];

  if (blueprint.missingSource) {
    toolCalls.push({
      name: "render_source_gate",
      args: {
        kind: "source_gate",
        blueprintId: blueprint.id,
        project: blueprint.project,
        missingItems: blueprint.missingItems,
        reason:
          blueprint.missingSourceReason ||
          "Source needed. Please give source. Do not guess.",
        resolved: false,
      },
    });
  }

  toolCalls.push(
    {
      name: "render_simple_plan",
      args: { kind: "simple_plan", blueprint, approved: false },
    },
    {
      name: "render_preview_pack",
      args: { kind: "preview_pack", blueprintId: blueprint.id, pack: previewPack },
    },
    {
      name: "render_approval_seal",
      args: {
        kind: "approval_seal",
        blueprintId: blueprint.id,
        project: blueprint.project,
        problem: blueprint.problem,
        deliverables: blueprint.buildList,
        timeLabel: blueprint.timeLabel,
        perLaunchPrice: blueprint.pricing.perLaunch,
        monthlyTowerPrice: blueprint.pricing.monthlyTower,
        sourceLabel: blueprint.sourceLabel,
        lockedByMissingSource: blueprint.missingSource,
        decision: "pending",
        policyRef,
        expiresLabel: "Valid for 24 hours",
      },
    },
  );

  const replyText = blueprint.missingSource
    ? "Your draft plan is below, but a verified source is needed before we can proceed. LUXOR9 will not guess prices, dates, or offers."
    : isRevision
      ? `Updated your simple plan (Revision ${blueprint.revisionCount}). Review the changes below, then tap Approve and Build.`
      : "Your simple plan is ready. Review the steps, sample previews, pricing, and source below, then tap Approve and Build.";

  return {
    nextState: {
      stage: blueprint.missingSource ? "source_needed" : "awaiting_approval",
      blueprint,
      previewPack,
      proof: null,
      policyRef,
    },
    replyText,
    toolCalls,
  };
}
