"use client";

import { CopilotChat, CopilotKit } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";

export default function CopilotPage() {
  return (
    <section>
      <h1>LUXOR9 Copilot</h1>
      <p className="muted">
        CopilotKit + AG-UI CMO — draft a blueprint, approve, then parallel market +
        competitor agents run under Trust Engine gates.
      </p>
      <div className="panel" style={{ marginTop: "1rem", minHeight: "28rem", padding: 0 }}>
        <CopilotKit runtimeUrl="/api/copilotkit" agentId="luxor9_cmo">
          <CopilotChat
            labels={{
              chatInputPlaceholder:
                "Describe a Dubai launch brief… then reply approve",
            }}
          />
        </CopilotKit>
      </div>
    </section>
  );
}
