import { HttpAgent } from "@ag-ui/client";
import {
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";

const aguiUrl =
  process.env.AGUI_CMO_URL ?? "http://127.0.0.1:8000/api/v1/agui/cmo";

const cmoAgent = new HttpAgent({ url: aguiUrl });

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- bridge duplicate @ag-ui AbstractAgent typings
const agents: any = {
  // Canonical CMO agent id used by Control Tower /copilot
  luxor9_cmo: cmoAgent,
  // CopilotKit falls back to "default" if a chat omits agentId — keep both.
  default: cmoAgent,
};

const runtime = new CopilotRuntime({ agents });

const handler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
});

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
