"use client";

import Link from "next/link";
import { CopilotChat, CopilotKit } from "@copilotkit/react-core/v2";
import "@copilotkit/react-core/v2/styles.css";

const CMO_AGENT_ID = "luxor9_cmo";

/** UI Atelier — safe Adaptive / Live UI experiments under Luxor branding. */
export default function UiAtelierPage() {
  return (
    <section>
      <h1>UI Atelier</h1>
      <p className="muted">
        Experiment with Live UI patterns against the same CMO agent. Nothing here publishes without
        Trust approval — use Command Bridge for production-shaped demos.
      </p>
      <p className="muted">
        Prefer the full workspace? Open <Link href="/stack">Luxor Stack</Link>.
      </p>
      <div className="panel" style={{ marginTop: "1rem", minHeight: "22rem", padding: 0 }}>
        <CopilotKit runtimeUrl="/api/copilotkit" agentId={CMO_AGENT_ID}>
          <CopilotChat
            agentId={CMO_AGENT_ID}
            labels={{
              chatInputPlaceholder: "Ask for a sample Adaptive UI layout for a launch brief…",
            }}
          />
        </CopilotKit>
      </div>
    </section>
  );
}
