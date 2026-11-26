import { describe, expect, it, beforeEach } from "vitest";
import { EventType } from "@ag-ui/client";
import {
  buildWorkPreviewPack,
  containsForbiddenJargon,
  DUBAI_APPROVAL_PREFIX,
  DUBAI_CHANGE_PREFIX,
  DUBAI_SOURCE_PREFIX,
  evaluateDubaiTurn,
  formatDisplayUserMessage,
  formatProofClipboardText,
  parseDubaiToolPayload,
  type DubaiThreadState,
} from "../lib/dubai-genui";
import { buildAguiDubaiEvents, resetDubaiAguiThreads } from "../lib/agui-dubai";

const EMPTY_STATE: DubaiThreadState = {
  stage: "idle",
  blueprint: null,
  previewPack: null,
  proof: null,
  policyRef: null,
};

describe("Dubai Generative UI pure engine", () => {
  it("drafts a simple plan, preview pack, and approval seal for quick launch prompt", () => {
    const res = evaluateDubaiTurn("Launch my new project", EMPTY_STATE);

    expect(res.nextState.stage).toBe("awaiting_approval");
    expect(res.nextState.blueprint?.project).toBe("Example Launch in Dubai");
    expect(res.nextState.blueprint?.missingSource).toBe(false);
    expect(res.toolCalls.map((t) => t.name)).toEqual([
      "render_simple_plan",
      "render_preview_pack",
      "render_approval_seal",
    ]);
    expect(containsForbiddenJargon(res.replyText)).toEqual([]);
  });

  it("triggers Source Needed Gate and locks approval when price or handover date lacks a source", () => {
    const res = evaluateDubaiTurn(
      "Include starting price and handover date for my new tower in Business Bay",
      EMPTY_STATE,
    );

    expect(res.nextState.stage).toBe("source_needed");
    expect(res.nextState.blueprint?.missingSource).toBe(true);
    expect(res.toolCalls.map((t) => t.name)).toEqual([
      "render_source_gate",
      "render_simple_plan",
      "render_preview_pack",
      "render_approval_seal",
    ]);

    const seal = res.toolCalls.find((t) => t.name === "render_approval_seal")?.args;
    expect(seal?.kind === "approval_seal" && seal.lockedByMissingSource).toBe(true);

    // Attempting to approve while source is missing must remain blocked
    const blockedApprove = evaluateDubaiTurn(
      `${DUBAI_APPROVAL_PREFIX}${JSON.stringify({ mode: "per_launch" })}`,
      res.nextState,
    );
    expect(blockedApprove.nextState.stage).toBe("source_needed");
    expect(blockedApprove.toolCalls[0]?.name).toBe("render_source_gate");
  });

  it("unlocks plan and emits proof receipt once verified source is added and approved", () => {
    const draft = evaluateDubaiTurn(
      "Include starting price and handover date for my new tower in Business Bay",
      EMPTY_STATE,
    );
    const sourced = evaluateDubaiTurn(
      `${DUBAI_SOURCE_PREFIX}Developer Q2 Price Sheet & RERA Permit #4021 — AED 1.9M, Q4 2027`,
      draft.nextState,
    );

    expect(sourced.nextState.stage).toBe("awaiting_approval");
    expect(sourced.nextState.blueprint?.missingSource).toBe(false);
    const gate = sourced.toolCalls[0]?.args;
    expect(gate?.kind === "source_gate" && gate.resolved).toBe(true);

    const approved = evaluateDubaiTurn(
      `${DUBAI_APPROVAL_PREFIX}${JSON.stringify({ mode: "monthly_tower" })}`,
      sourced.nextState,
      "2026-11-26T12:00:00.000Z",
    );
    expect(approved.nextState.stage).toBe("approved");
    expect(approved.toolCalls[0]?.name).toBe("render_proof_receipt");
    expect(approved.nextState.proof?.proofId).toMatch(/^PROOF-/);

    const clipboard = formatProofClipboardText(approved.nextState.proof!, "monthly_tower");
    expect(clipboard).toContain("AED 1,500 per month");
    expect(clipboard).toContain("Automation started");
  });

  it("supports inline change requests and updates preview pack without jargon", () => {
    const draft = evaluateDubaiTurn("Launch my new project", EMPTY_STATE);
    const revised = evaluateDubaiTurn(
      `${DUBAI_CHANGE_PREFIX}Add Arabic brochure and 15 posts`,
      draft.nextState,
    );

    expect(revised.nextState.blueprint?.revisionCount).toBe(2);
    expect(revised.nextState.blueprint?.solutionSteps[0]).toContain("Arabic");
    expect(revised.nextState.blueprint?.solutionSteps[1]).toContain("15 posts");

    const preview = buildWorkPreviewPack(revised.nextState.blueprint!);
    expect(preview.socialPosts).toHaveLength(10);
    expect(preview.whatsappSequence).toHaveLength(3);
    expect(preview.brochure.headline).toContain("EN / AR");
    expect(containsForbiddenJargon(preview.brochure.subheadline)).toEqual([]);
  });

  it("strictly validates tool payloads and formats clean user display messages", () => {
    expect(parseDubaiToolPayload("unknown_tool", {})).toBeNull();
    expect(parseDubaiToolPayload("render_source_gate", "not-json")).toBeNull();

    const valid = parseDubaiToolPayload("render_source_gate", {
      blueprintId: "bp_1",
      project: "Dubai Creek",
      missingItems: ["unit price"],
      reason: "Source needed.",
      resolved: false,
    });
    expect(valid?.kind).toBe("source_gate");

    expect(
      formatDisplayUserMessage(`${DUBAI_SOURCE_PREFIX}Developer sheet`),
    ).toBe("Added verified source: Developer sheet");
    expect(
      formatDisplayUserMessage(`${DUBAI_APPROVAL_PREFIX}{"mode":"per_launch"}`),
    ).toContain("Per Launch");
  });
});

describe("AG-UI Dubai SSE event builder", () => {
  beforeEach(() => {
    resetDubaiAguiThreads();
  });

  it("emits complete AG-UI lifecycle including TOOL_CALL_* and STATE_SNAPSHOT events", () => {
    const events = buildAguiDubaiEvents({
      threadId: "thread_test_dubai",
      runId: "run_1",
      messages: [{ id: "m1", role: "user", content: "Launch my new project" }],
    });

    const types = events.map((e) => e.type);
    expect(types[0]).toBe(EventType.RUN_STARTED);
    expect(types).toContain(EventType.TEXT_MESSAGE_CONTENT);
    expect(types).toContain(EventType.TOOL_CALL_START);
    expect(types).toContain(EventType.TOOL_CALL_ARGS);
    expect(types).toContain(EventType.TOOL_CALL_END);
    expect(types).toContain(EventType.TOOL_CALL_RESULT);
    expect(types).toContain(EventType.STATE_SNAPSHOT);
    expect(types[types.length - 1]).toBe(EventType.RUN_FINISHED);
  });
});
