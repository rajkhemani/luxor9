import { HttpAgent } from "@ag-ui/client";
import {
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { localAguiCmoFetch } from "@/lib/agui-demo";
import { localAguiDubaiFetch } from "@/lib/agui-dubai";

const aguiUrl = process.env.AGUI_CMO_URL;

const cmoAgent = aguiUrl
  ? new HttpAgent({ url: aguiUrl })
  : new HttpAgent({
      url: "http://local-demo/api/v1/agui/cmo",
      fetch: localAguiCmoFetch,
    });

const dubaiAgent = new HttpAgent({
  url: "http://local-demo/api/v1/agui/dubai",
  fetch: localAguiDubaiFetch,
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- bridge duplicate @ag-ui AbstractAgent typings
const agents: any = {
  // Canonical CMO agent id used by Control Tower /command
  luxor9_cmo: cmoAgent,
  // Dedicated Generative UI agent used by /dubai
  luxor9_dubai: dubaiAgent,
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
