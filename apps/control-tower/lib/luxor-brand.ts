/**
 * Luxor9 public brand map.
 * Internal dependency package names stay as upstream requires;
 * nothing in this file's `label` / `blurb` fields may expose vendor step names.
 */

export type CapabilityStatus = "live" | "wired" | "shell" | "planned";

export type LuxorCapability = {
  id: string;
  label: string;
  blurb: string;
  status: CapabilityStatus;
  href?: string;
  /** Upstream concept this replaces — never shown in UI */
  upstreamRef: string;
};

/** Forbidden substrings in user-visible copy (case-insensitive). */
export const FORBIDDEN_VISIBLE_TERMS = [
  "copilotkit",
  "openbot",
  "openduet",
  "openmuse",
  "opendots",
  "open kit",
  "openkit",
  "langgraph",
  "generative ui",
  "gemini",
  "mcb",
  "mcp client",
  "channels sdk",
  "ai mock",
  "scene creator",
  "multi-agent canvas",
  "generative ui playground",
] as const;

export const LUXOR_CAPABILITIES: LuxorCapability[] = [
  {
    id: "command-bridge",
    label: "Command Bridge",
    blurb: "Live governed chat with the CMO workforce — stream, steer, approve.",
    status: "live",
    href: "/command",
    upstreamRef: "Copilot / CopilotKit chat",
  },
  {
    id: "coworker-hub",
    label: "Coworker Hub",
    blurb: "Self-hostable multi-bot workspace shell on the same AG-UI CMO endpoint.",
    status: "shell",
    href: "/stack#coworker-hub",
    upstreamRef: "OpenBot",
  },
  {
    id: "pulse-skin",
    label: "Pulse Skin",
    blurb: "Compact proactive coworker skin for quick check-ins.",
    status: "shell",
    href: "/stack#pulse-skin",
    upstreamRef: "OpenDots",
  },
  {
    id: "ember-skin",
    label: "Ember Skin",
    blurb: "Creative briefing skin for campaign and narrative work.",
    status: "shell",
    href: "/stack#ember-skin",
    upstreamRef: "OpenMuse",
  },
  {
    id: "adaptive-ui",
    label: "Adaptive UI",
    blurb: "Agent-driven interface blocks that stay Trust-gated.",
    status: "wired",
    href: "/stack#adaptive-ui",
    upstreamRef: "Intelligent / generative UI",
  },
  {
    id: "duo-skin",
    label: "Duo Skin",
    blurb: "Side-by-side human + agent planning surface.",
    status: "shell",
    href: "/stack#duo-skin",
    upstreamRef: "OpenDuet",
  },
  {
    id: "channel-bridge",
    label: "Channel Bridge",
    blurb: "Client for tool/channel servers (org-managed connectors).",
    status: "planned",
    href: "/stack#channel-bridge",
    upstreamRef: "MCB / MCP client",
  },
  {
    id: "signal-tags",
    label: "Signal Tags",
    blurb: "Label workflows, evidence, and publish packs for retrieval.",
    status: "planned",
    href: "/stack#signal-tags",
    upstreamRef: "open tag",
  },
  {
    id: "sandbox-ai",
    label: "Sandbox AI",
    blurb: "Deterministic stub model path for zero-cost demos.",
    status: "live",
    href: "/chat",
    upstreamRef: "AI mock",
  },
  {
    id: "luxor-channels",
    label: "Luxor Channels",
    blurb: "Connector toolkit for Slack/Teams-style delivery (post-revenue).",
    status: "planned",
    href: "/stack#luxor-channels",
    upstreamRef: "channels SDK",
  },
  {
    id: "live-ui",
    label: "Live UI",
    blurb: "Structured generative components streamed with agent turns.",
    status: "wired",
    href: "/stack#live-ui",
    upstreamRef: "generative UI",
  },
  {
    id: "agent-canvas",
    label: "Agent Canvas",
    blurb: "Multi-specialist board for market, competitor, strategy, evaluator.",
    status: "wired",
    href: "/agents",
    upstreamRef: "open multi-agent canvas",
  },
  {
    id: "field-research",
    label: "Field Research",
    blurb: "CMO research hierarchy with evidence and claim status.",
    status: "live",
    href: "/workflows",
    upstreamRef: "open research",
  },
  {
    id: "brief-spec",
    label: "Brief Spec",
    blurb: "Turn a developer brief into an approvable blueprint.",
    status: "live",
    href: "/chat",
    upstreamRef: "specify",
  },
  {
    id: "scene-lab",
    label: "Scene Lab",
    blurb: "Storyboard / scene drafts for marketing proof packs.",
    status: "planned",
    href: "/stack#scene-lab",
    upstreamRef: "scene creator",
  },
  {
    id: "fast-model",
    label: "Fast Model Lane",
    blurb: "Optional cloud model provider slot (free-tier friendly).",
    status: "planned",
    href: "/stack#fast-model",
    upstreamRef: "open Gemini",
  },
  {
    id: "ui-atelier",
    label: "UI Atelier",
    blurb: "Safe studio for Adaptive / Live UI experiments.",
    status: "shell",
    href: "/atelier",
    upstreamRef: "generative UI playground",
  },
  {
    id: "luxor-kit",
    label: "Luxor Kit",
    blurb: "Connectivity kit: runtime + AG-UI + Tower surfaces.",
    status: "live",
    href: "/stack",
    upstreamRef: "open kit / CopilotKit",
  },
  {
    id: "bridge-demo",
    label: "Bridge Demo",
    blurb: "One-click demo seed against Sandbox AI + Trust gates.",
    status: "live",
    href: "/stack#bridge-demo",
    upstreamRef: "MCB demo",
  },
  {
    id: "orchestrator",
    label: "Orchestrator Graph",
    blurb: "Python hierarchy: orchestrator → CMO → parallel specialists.",
    status: "live",
    href: "/agents",
    upstreamRef: "canvas with LangGraph + Python",
  },
];

export function statusLabel(status: CapabilityStatus): string {
  switch (status) {
    case "live":
      return "Live";
    case "wired":
      return "Wired";
    case "shell":
      return "Shell";
    case "planned":
      return "Planned";
  }
}

export function assertNoForbiddenVisibleCopy(text: string): string[] {
  const lower = text.toLowerCase();
  return FORBIDDEN_VISIBLE_TERMS.filter((term) => lower.includes(term));
}
