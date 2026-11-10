"use client";

import { CopilotChat, CopilotKit } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";

const CMO_AGENT_ID = "luxor9_cmo";

/** Command Bridge — Luxor9-branded live agent surface (upstream kit kept internal). */
export default function CommandBridgePage() {
  return (
    <section>
      <h1>Command Bridge</h1>
      <p className="muted">
        Live CMO workforce stream with mid-run steering. Blueprint approve / decline stays on the
        Trust Engine; orchestration stays on the Luxor Orchestrator Graph.
      </p>
      <div className="panel" style={{ marginTop: "1rem", minHeight: "28rem", padding: 0 }}>
        <CopilotKit runtimeUrl="/api/copilotkit" agentId={CMO_AGENT_ID}>
          <CopilotChat
            agentId={CMO_AGENT_ID}
            labels={{
              chatInputPlaceholder:
                "Describe a Dubai launch brief… then reply approve to dispatch",
            }}
          />
        </CopilotKit>
      </div>
    </section>
  );
}
