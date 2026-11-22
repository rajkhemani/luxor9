import { NextRequest, NextResponse } from "next/server";
import {
  createDraftWorkflow,
  decideApproval,
  executeApprovedBlueprint,
  getAguiStatus,
  getDemoState,
  getOverview,
  handleChatMessage,
  listAgents,
} from "@/lib/demo-store";

type RouteContext = { params: Promise<{ path: string[] }> };

export async function GET(_req: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const joined = path.join("/");
  const state = getDemoState();

  if (joined === "overview") {
    return NextResponse.json(getOverview(state));
  }
  if (joined === "agui/status") {
    return NextResponse.json(getAguiStatus());
  }
  if (joined === "workflows") {
    return NextResponse.json(state.workflows);
  }
  if (path[0] === "workflows" && path.length === 2) {
    const wf = state.workflows.find((w) => w.id === path[1]);
    if (!wf) return NextResponse.json({ detail: "Workflow not found" }, { status: 404 });
    return NextResponse.json(wf);
  }
  if (path[0] === "workflows" && path.length === 3 && path[2] === "evidence") {
    return NextResponse.json(state.evidenceByWorkflow[path[1]] ?? []);
  }
  if (path[0] === "workflows" && path.length === 3 && path[2] === "claims") {
    return NextResponse.json(state.claimsByWorkflow[path[1]] ?? []);
  }
  if (joined === "approvals") {
    return NextResponse.json(state.approvals);
  }
  if (joined === "agents") {
    return NextResponse.json(listAgents());
  }
  if (joined === "metering") {
    return NextResponse.json(state.metering);
  }

  return NextResponse.json({ detail: `Unknown endpoint /api/v1/${joined}` }, { status: 404 });
}

export async function POST(req: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const joined = path.join("/");
  const state = getDemoState();
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  if (joined === "chat") {
    const message = typeof body.message === "string" ? body.message : "";
    if (!message.trim()) {
      return NextResponse.json({ detail: "Message is required" }, { status: 400 });
    }
    const workflowId = typeof body.workflow_id === "string" ? body.workflow_id : undefined;
    const ctx =
      body.context && typeof body.context === "object"
        ? (body.context as Record<string, unknown>)
        : undefined;
    return NextResponse.json(handleChatMessage(message, workflowId, ctx, state));
  }

  if (path[0] === "approvals" && path.length === 3 && (path[2] === "approve" || path[2] === "reject")) {
    const updated = decideApproval(path[1], path[2], state);
    if (!updated) return NextResponse.json({ detail: "Approval not found" }, { status: 404 });
    return NextResponse.json(updated);
  }

  if (joined === "demo/seed") {
    const wf = createDraftWorkflow(
      "Market-to-launch intelligence for a Dubai Creek Harbour residential tower (GTM demo brief)",
      {
        location: "Dubai",
        product_type: "residential",
        segment: "HNW GCC + South Asia",
        price_band: "AED 2.5M–6M",
        horizon: "Q2 launch",
        demo: true,
      },
      state,
    );
    return NextResponse.json(wf);
  }

  if (joined === "demo/run") {
    const wf = createDraftWorkflow(
      "Market-to-launch intelligence for a Dubai Creek Harbour residential tower (GTM demo brief)",
      { location: "Dubai", product_type: "residential", demo: true },
      state,
    );
    return NextResponse.json(executeApprovedBlueprint(wf, state));
  }

  return NextResponse.json({ detail: `Unknown endpoint /api/v1/${joined}` }, { status: 404 });
}
