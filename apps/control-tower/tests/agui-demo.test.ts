import { beforeEach, describe, expect, it } from "vitest";
import { EventType } from "@ag-ui/client";
import { buildAguiCmoEvents, buildAguiCmoResponse, resetAguiThreads } from "../lib/agui-demo";
import { getDemoState, resetDemoState } from "../lib/demo-store";

describe("agui-demo", () => {
  beforeEach(() => {
    resetDemoState();
    resetAguiThreads();
  });

  it("drafts a governed blueprint and streams valid AG-UI events", () => {
    const events = buildAguiCmoEvents({
      threadId: "thread_001",
      runId: "run_001",
      messages: [{ role: "user", content: "Launch brief for Dubai Marina penthouses" }],
    });

    expect(events.map((e) => e.type)).toEqual([
      EventType.RUN_STARTED,
      EventType.TEXT_MESSAGE_START,
      EventType.TEXT_MESSAGE_CONTENT,
      EventType.TEXT_MESSAGE_END,
      EventType.RUN_FINISHED,
    ]);

    const content = String(events[2].delta);
    expect(content).toContain("Drafted blueprint");
    expect(getDemoState().workflows.length).toBe(2);
  });

  it("approves the active blueprint on the next turn in the same thread", async () => {
    buildAguiCmoEvents({
      threadId: "thread_002",
      runId: "run_001",
      messages: [{ role: "user", content: "Palm Jebel Ali villa launch" }],
    });

    const response = buildAguiCmoResponse({
      threadId: "thread_002",
      runId: "run_002",
      messages: [
        { role: "user", content: "Palm Jebel Ali villa launch" },
        { role: "user", content: "approve" },
      ],
    });

    expect(response.headers.get("content-type")).toContain("text/event-stream");
    const sse = await response.text();
    expect(sse).toContain("Blueprint approved");
    expect(getDemoState().approvals.length).toBe(2);
  });

  it("declines a pending blueprint when user replies decline", () => {
    buildAguiCmoEvents({
      threadId: "thread_003",
      runId: "run_001",
      messages: [{ role: "user", content: "Downtown tower brief" }],
    });

    const events = buildAguiCmoEvents({
      threadId: "thread_003",
      runId: "run_002",
      messages: [{ role: "user", content: "decline" }],
    });

    expect(String(events[2].delta)).toContain("Blueprint declined");
    expect(getDemoState().workflows[0].status).toBe("declined");
  });
});
