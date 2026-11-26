import { NextRequest, NextResponse } from "next/server";
import {
  buildProofRecord,
  buildSimpleBlueprint,
  type BlueprintItem,
} from "@/lib/simple-blueprint";
import {
  createDraftWorkflow,
  executeApprovedBlueprint,
  getDemoState,
} from "@/lib/demo-store";

type SimpleBlueprintBody = {
  action?: "draft" | "change" | "approve";
  message?: string;
  previousBlueprint?: BlueprintItem | null;
  blueprint?: BlueprintItem | null;
};

export async function POST(req: NextRequest) {
  let body: SimpleBlueprintBody;
  try {
    body = (await req.json()) as SimpleBlueprintBody;
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const action = body.action ?? "draft";

  if (action === "approve") {
    const bp = body.blueprint;
    if (!bp) {
      return NextResponse.json({ error: "Blueprint is required to approve." }, { status: 400 });
    }
    if (bp.missingSource) {
      return NextResponse.json(
        { error: "Source needed. Please give source before approving." },
        { status: 422 },
      );
    }

    const state = getDemoState();
    const wf = createDraftWorkflow(
      `${bp.project}: ${bp.problem}`,
      {
        location: "UAE",
        product_type: "residential",
        source: bp.sourceLabel,
        price: bp.pricing.perLaunch,
        delivery_time: bp.timeLabel,
      },
      state,
    );
    executeApprovedBlueprint(wf, state);

    const proof = buildProofRecord(bp, wf.id, new Date().toISOString());
    return NextResponse.json({ status: "approved", proof });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) {
    return NextResponse.json({ error: "Please write your problem first." }, { status: 400 });
  }

  const blueprint = buildSimpleBlueprint(
    message,
    action === "change" ? body.previousBlueprint ?? null : null,
  );

  return NextResponse.json({ blueprint });
}
