"use client";

import { CopilotChat, CopilotKit } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { COMMAND_PLACEHOLDERS } from "@/lib/marketing-copy";

const CMO_AGENT_ID = "luxor9_cmo";

function CommandBridgeInner() {
  const params = useSearchParams();
  const bottleneck = params.get("bottleneck");
  const preset = params.get("preset");
  const brief = params.get("brief");

  const placeholder = useMemo(() => {
    if (brief) return brief;
    if (preset && preset in COMMAND_PLACEHOLDERS) {
      return COMMAND_PLACEHOLDERS[preset as keyof typeof COMMAND_PLACEHOLDERS];
    }
    return COMMAND_PLACEHOLDERS.default;
  }, [brief, preset]);

  return (
    <>
      {preset || bottleneck ? (
        <div className="panel" style={{ marginTop: "1rem" }}>
          <p className="muted" style={{ margin: 0 }}>
            Landing blueprint loaded
            {bottleneck ? ` · ${bottleneck}` : ""}
            {preset ? ` · preset ${preset}` : ""}.
          </p>
          {brief ? <p style={{ margin: "0.65rem 0 0" }}>{brief}</p> : null}
          <p className="muted" style={{ margin: "0.65rem 0 0" }}>
            Paste or adapt the brief below in chat to start. Consequential actions still require
            Trust approval.
          </p>
        </div>
      ) : null}
      <div className="panel" style={{ marginTop: "1rem", minHeight: "28rem", padding: 0 }}>
        <CopilotKit runtimeUrl="/api/copilotkit" agentId={CMO_AGENT_ID}>
          <CopilotChat
            agentId={CMO_AGENT_ID}
            labels={{
              chatInputPlaceholder: placeholder,
            }}
          />
        </CopilotKit>
      </div>
    </>
  );
}

/** Command Bridge — Luxor9-branded live agent surface (upstream kit kept internal). */
export default function CommandBridgePage() {
  return (
    <section>
      <h1>Command Bridge</h1>
      <p className="muted">
        Live CMO workforce stream with mid-run steering. Blueprint approve / decline stays on the
        Trust Engine; orchestration stays on the Luxor Orchestrator Graph.
      </p>
      <Suspense
        fallback={
          <div className="panel" style={{ marginTop: "1rem", minHeight: "28rem" }}>
            <p className="muted">Loading Command Bridge…</p>
          </div>
        }
      >
        <CommandBridgeInner />
      </Suspense>
    </section>
  );
}
