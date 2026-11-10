"use client";

import { CopilotChat, CopilotKit } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";

const CMO_AGENT_ID = "luxor9_cmo";

export default function CopilotPage() {
  return (
    <section>
      <h1>LUXOR9 Copilot</h1>
      <p className="muted">
        Bucket 2 connectivity (AG-UI + CopilotKit): work streams live, you steer mid-run
        (approve / decline blueprint), threads can resume, and parallel CMO specialists
        reflect back coherently. Orchestration stays LangGraph; publish stays Trust Engine.
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
