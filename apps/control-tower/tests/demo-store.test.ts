import { beforeEach, describe, expect, it } from "vitest";
import {
  decideApproval,
  getDemoState,
  getOverview,
  handleChatMessage,
  previewDubaiApproveLiveRead,
  resetDemoState,
} from "../lib/demo-store";

describe("control tower in-memory demo store", () => {
  beforeEach(() => {
    resetDemoState();
  });

  it("seeds an active Dubai Creek Harbour workflow with pending publish approval", () => {
    const overview = getOverview();
    expect(overview.active_workflows).toBe(1);
    expect(overview.pending_approvals).toBe(1);
    expect(overview.completed_workflows).toBe(0);
    expect(overview.open_exceptions).toBe(1);
    expect(overview.recent_workflows[0]?.id).toBe("wf_dubai_creek_001");
  });

  it("transitions chat brief through blueprint approval to pending publish approval", () => {
    const draft = handleChatMessage("Launch intel for Palm Jebel Ali villas");
    expect(draft.workflow.status).toBe("awaiting_blueprint_approval");
    expect(draft.awaiting).toBe("blueprint_approval");

    const executed = handleChatMessage("approve", draft.workflow.id);
    expect(executed.workflow.status).toBe("awaiting_publish_approval");
    expect(executed.workflow.report).not.toBeNull();

    const state = getDemoState();
    expect(state.evidenceByWorkflow[draft.workflow.id]?.length).toBe(2);
    expect(state.claimsByWorkflow[draft.workflow.id]?.length).toBe(2);
  });

  it("completes workflow when its pending publish approval is approved", () => {
    const updated = decideApproval("apr_publish_001", "approve");
    expect(updated?.status).toBe("approved");

    const overview = getOverview();
    expect(overview.pending_approvals).toBe(0);
    expect(overview.completed_workflows).toBe(1);
  });

  it("builds a D-012 display-only live-read preview payload from the Dubai seed", () => {
    const payload = previewDubaiApproveLiveRead();
    expect(payload.decision).toBe("D-012");
    expect(payload.read_only).toBe(true);
    expect(payload.outbound_send).toBe(false);
    expect(payload.mode).toBe("preview_mock");
    expect(payload.workflow_id).toBe("wf_dubai_creek_001");
    expect(payload.evidence.length).toBeGreaterThan(0);
    expect(payload.claims.some((c) => c.status === "UNVERIFIED")).toBe(true);
    expect(payload.display.objective).toContain("Dubai");
  });
});
