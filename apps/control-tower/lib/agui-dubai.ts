import { EventType } from "@ag-ui/client";
import {
  createDraftWorkflow,
  executeApprovedBlueprint,
  getDemoState,
} from "./demo-store";
import {
  evaluateDubaiTurn,
  type DubaiThreadState,
} from "./dubai-genui";

type AguiMessage = {
  id?: string;
  role?: string;
  content?: unknown;
};

type AguiRunPayload = {
  threadId?: string;
  runId?: string;
  messages?: AguiMessage[];
};

const INITIAL_THREAD_STATE: DubaiThreadState = {
  stage: "idle",
  blueprint: null,
  previewPack: null,
  proof: null,
  policyRef: null,
};

const globalForDubaiAgui = globalThis as typeof globalThis & {
  __luxor9DubaiThreads?: Map<string, DubaiThreadState>;
};

function getDubaiThreadMap(): Map<string, DubaiThreadState> {
  if (!globalForDubaiAgui.__luxor9DubaiThreads) {
    globalForDubaiAgui.__luxor9DubaiThreads = new Map<string, DubaiThreadState>();
  }
  return globalForDubaiAgui.__luxor9DubaiThreads;
}

export function resetDubaiAguiThreads(): void {
  getDubaiThreadMap().clear();
}

function extractMessageText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          const text = (part as { text?: unknown }).text;
          return typeof text === "string" ? text : "";
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

function extractLastUserText(messages?: AguiMessage[]): string {
  if (!Array.isArray(messages)) return "";
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i];
    if (msg?.role === "user") {
      const text = extractMessageText(msg.content).trim();
      if (text) return text;
    }
  }
  return "";
}

/**
 * Builds the AG-UI event stream for the `luxor9_dubai` Generative UI agent.
 * Emits TEXT_MESSAGE_*, typed TOOL_CALL_* cards, TOOL_CALL_RESULT, and STATE_SNAPSHOT.
 */
export function buildAguiDubaiEvents(
  payload: AguiRunPayload,
): Array<Record<string, unknown>> {
  const threadId = payload.threadId || "thread_dubai_default";
  const runId = payload.runId || `run_dubai_${Date.now()}`;
  const messageId = `msg_${runId}`;
  const userText = extractLastUserText(payload.messages) || "Launch my new project";

  const threads = getDubaiThreadMap();
  const prevState = threads.get(threadId) || INITIAL_THREAD_STATE;

  const { nextState, replyText, toolCalls } = evaluateDubaiTurn(userText, prevState);
  threads.set(threadId, nextState);

  // Sync approved Dubai runs into the shared Control Tower demo store
  if (nextState.stage === "approved" && nextState.blueprint && nextState.proof) {
    const demoState = getDemoState();
    const wf = createDraftWorkflow(
      `${nextState.blueprint.project}: ${nextState.blueprint.problem}`,
      {
        location: "Dubai",
        product_type: "residential",
        source: nextState.blueprint.sourceLabel,
        proof_id: nextState.proof.proofId,
      },
      demoState,
    );
    executeApprovedBlueprint(wf, demoState);
  }

  const events: Array<Record<string, unknown>> = [
    { type: EventType.RUN_STARTED, threadId, runId },
    { type: EventType.TEXT_MESSAGE_START, messageId, role: "assistant" },
    { type: EventType.TEXT_MESSAGE_CONTENT, messageId, delta: replyText },
    { type: EventType.TEXT_MESSAGE_END, messageId },
  ];

  toolCalls.forEach((tc, index) => {
    const toolCallId = `tc_${runId}_${index}`;
    const argsJson = JSON.stringify(tc.args);
    events.push(
      {
        type: EventType.TOOL_CALL_START,
        toolCallId,
        toolCallName: tc.name,
        parentMessageId: messageId,
      },
      {
        type: EventType.TOOL_CALL_ARGS,
        toolCallId,
        delta: argsJson,
      },
      {
        type: EventType.TOOL_CALL_END,
        toolCallId,
      },
      {
        type: EventType.TOOL_CALL_RESULT,
        messageId: `tool_res_${toolCallId}`,
        toolCallId,
        content: JSON.stringify({ ok: true, kind: tc.args.kind }),
        role: "tool",
      },
    );
  });

  events.push(
    {
      type: EventType.STATE_SNAPSHOT,
      snapshot: nextState,
    },
    { type: EventType.RUN_FINISHED, threadId, runId },
  );

  return events;
}

export function buildAguiDubaiResponse(payload: AguiRunPayload): Response {
  const events = buildAguiDubaiEvents(payload);
  const body = events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join("");
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}

export async function localAguiDubaiFetch(
  _url: string,
  init: RequestInit,
): Promise<Response> {
  let payload: AguiRunPayload = {};
  if (typeof init.body === "string") {
    try {
      payload = JSON.parse(init.body) as AguiRunPayload;
    } catch {
      payload = {};
    }
  }
  return buildAguiDubaiResponse(payload);
}
