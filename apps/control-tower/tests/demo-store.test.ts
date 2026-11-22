import { beforeEach, describe, expect, it } from "vitest";
import {
  decideApproval,
  getDemoState,
  getOverview,
  handleChatMessage,
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

  it("interviews before drafting a blueprint, then confirms and executes", () => {
    const start = handleChatMessage("Launch intel for Palm Jebel Ali villas");
    expect(start.workflow.status).toBe("draft");
    expect(start.awaiting).toBe("interview_answer");
    expect(start.workflow.blueprint).toBeNull();
    expect(start.reply).toMatch(/Q:/);

    let body = start;
    const answers = [
      "For our sales and marketing launch team.",
      "Success is an evidence-backed launch pack with gaps flagged.",
      "Constraint: sandbox only, no live ad spend.",
    ];
    for (const answer of answers) {
      body = handleChatMessage(answer, body.workflow.id);
      expect(body.workflow.blueprint).toBeNull();
      expect(body.workflow.status).toBe("draft");
    }
    expect(body.awaiting).toBe("interview_confirm");

    const confirmed = handleChatMessage("yes", body.workflow.id);
    expect(confirmed.awaiting).toBe("blueprint_approval");
    expect(confirmed.workflow.status).toBe("awaiting_blueprint_approval");
    expect(confirmed.workflow.blueprint).not.toBeNull();

    const executed = handleChatMessage("approve", confirmed.workflow.id);
    expect(executed.workflow.status).toBe("awaiting_publish_approval");
    expect(executed.workflow.report).not.toBeNull();

    const state = getDemoState();
    expect(state.evidenceByWorkflow[confirmed.workflow.id]?.length).toBe(2);
    expect(state.claimsByWorkflow[confirmed.workflow.id]?.length).toBe(2);
  });

  it("completes workflow when its pending publish approval is approved", () => {
    const updated = decideApproval("apr_publish_001", "approve");
    expect(updated?.status).toBe("approved");

    const overview = getOverview();
    expect(overview.pending_approvals).toBe(0);
    expect(overview.completed_workflows).toBe(1);
  });
});
