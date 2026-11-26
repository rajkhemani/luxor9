import { EventType } from "@ag-ui/client";
import { handleChatMessage } from "./demo-store";

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

const globalForAgui = globalThis as typeof globalThis & {
  __luxor9AguiThreads?: Map<string, string>;
};

function getThreadMap(): Map<string, string> {
  if (!globalForAgui.__luxor9AguiThreads) {
    globalForAgui.__luxor9AguiThreads = new Map<string, string>();
  }
  return globalForAgui.__luxor9AguiThreads;
}

export function resetAguiThreads(): void {
  getThreadMap().clear();
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

export function buildAguiCmoEvents(payload: AguiRunPayload): Array<Record<string, unknown>> {
  const threadId = payload.threadId || "thread_demo_default";
  const runId = payload.runId || `run_${Date.now()}`;
  const messageId = `msg_${runId}`;
  const userText =
    extractLastUserText(payload.messages) ||
    "Dubai real-estate market-to-launch intelligence";

  const threads = getThreadMap();
  const activeWorkflowId = threads.get(threadId);

  const result = handleChatMessage(userText, activeWorkflowId, {
    location: "Dubai",
    product_type: "residential",
  });

  if (result.workflow.status === "awaiting_blueprint_approval") {
    threads.set(threadId, result.workflow.id);
  } else {
    threads.delete(threadId);
  }

  return [
    { type: EventType.RUN_STARTED, threadId, runId },
    { type: EventType.TEXT_MESSAGE_START, messageId, role: "assistant" },
    { type: EventType.TEXT_MESSAGE_CONTENT, messageId, delta: result.reply },
    { type: EventType.TEXT_MESSAGE_END, messageId },
    { type: EventType.RUN_FINISHED, threadId, runId },
  ];
}

export function buildAguiCmoResponse(payload: AguiRunPayload): Response {
  const events = buildAguiCmoEvents(payload);
  const body = events.map((event) => `data: ${JSON.stringify(event)}\n\n`).join("");
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}

export async function localAguiCmoFetch(
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
  return buildAguiCmoResponse(payload);
}
