import { HttpAgent } from "@ag-ui/client";
import {
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { auth } from "@clerk/nextjs/server";
import { localAguiCmoFetch } from "@/lib/agui-demo";
import { localAguiDubaiFetch } from "@/lib/agui-dubai";
import { isClerkEnabled } from "@/lib/auth-mode";

const aguiUrl = process.env.AGUI_CMO_URL;

async function authorizedAguiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  if (isClerkEnabled()) {
    const session = await auth();
    const token = await session.getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }
  return fetch(input, { ...init, headers });
}

const cmoAgent = aguiUrl
  ? new HttpAgent({ url: aguiUrl, fetch: authorizedAguiFetch })
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
