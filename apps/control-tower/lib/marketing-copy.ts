/**
 * Central marketing strings for the /home landing page.
 * Keep all user-visible copy here so forbidden-vendor tests can scan it.
 */

export const MARKETING_DOCTRINE = "Control AI execution. Prove every outcome.";

export const HERO_COPY = {
  brand: "LUXOR9",
  headline: MARKETING_DOCTRINE,
  support:
    "Route intelligence through policy, execution, verification, and evidence — for real-estate teams who must own the record.",
  primaryCta: "Open Command Bridge",
  secondaryCta: "See the accountable route",
  micro:
    "Demonstration traces are labeled. Production evidence requires your Trust policy.",
};

export const PROBLEM_COPY = {
  eyebrow: "Without an accountable route",
  headline: "Your organization does not need another AI tool.",
  support:
    "It needs a system that knows what can happen next, what must be authorized, and what has to be proven afterward.",
  fractures: [
    "Data Unbound",
    "AI Unbound",
    "People Unbound",
    "Tools Unbound",
    "Policy Unbound",
    "Workflows Unbound",
    "Evidence Unbound",
  ],
};

export const ROUTE_STATES = [
  {
    id: "fragmented",
    code: "01",
    title: "FRAGMENTED",
    line: "Signals exist without one accountable route.",
  },
  {
    id: "routed",
    code: "02",
    title: "ROUTED",
    line: "One intent receives a controlled direction.",
  },
  {
    id: "authorized",
    code: "03",
    title: "AUTHORIZED",
    line: "Policy resolves before the route can cross.",
  },
  {
    id: "executed",
    code: "04",
    title: "EXECUTED",
    line: "An approved tool receives a bounded run.",
  },
  {
    id: "verified",
    code: "05",
    title: "VERIFIED",
    line: "Checks resolve the action and outcome.",
  },
  {
    id: "recorded",
    code: "06",
    title: "RECORDED",
    line: "Execution becomes an attributable evidence record.",
  },
] as const;

export const VALUE_PILLARS = [
  {
    title: "Contracts",
    headline: "Policy before action",
    body: "Trust Engine authorizes consequential side effects. Model text never does.",
  },
  {
    title: "Evidence",
    headline: "Proof is part of execution",
    body: "Claims, sources, and traces bind to the workflow — not a slide afterward.",
  },
  {
    title: "Data",
    headline: "Your operating context",
    body: "Briefs, locations, and launch constraints stay in your tenancy boundary.",
  },
] as const;

export const PRODUCT_SURFACES = [
  {
    id: "tower",
    title: "Control Tower",
    blurb:
      "Overview of workflows, exceptions, and approvals — the operator’s truth panel.",
    href: "/",
    cta: "Enter Tower",
  },
  {
    id: "command",
    title: "Command Bridge",
    blurb: "Live governed chat with the CMO workforce — stream, steer, approve.",
    href: "/command",
    cta: "Open Command Bridge",
  },
  {
    id: "stack",
    title: "Luxor Stack",
    blurb:
      "Branded constellation of skins, Live UI, research, and Orchestrator Graph.",
    href: "/stack",
    cta: "Explore Stack",
  },
  {
    id: "api",
    title: "Intelligence API",
    blurb:
      "FastAPI contracts for overview, trust, evidence, AG-UI status, and demo seed.",
    href: "#live-overview-strip",
    cta: "See live pulse",
  },
] as const;

export const THEATER_EVENTS = [
  {
    t: "00:00.000",
    event: "Intent received",
    line: "Objective normalized into an executable instruction.",
  },
  {
    t: "00:00.086",
    event: "Context retrieved",
    line: "Memory, records, operating conditions assembled.",
  },
  {
    t: "00:00.142",
    event: "Risk classified",
    line: "Impact, sensitivity, approval requirements set.",
  },
  {
    t: "00:00.211",
    event: "Agent selected",
    line: "Bounded capability assigned.",
  },
  {
    t: "00:00.294",
    event: "Tool authorized",
    line: "Permissions checked before external touch.",
  },
  {
    t: "00:00.418",
    event: "Action executed",
    line: "Approved operation against the workflow.",
  },
  {
    t: "00:00.604",
    event: "Output verified",
    line: "Result, policy, provenance, integrity resolve.",
  },
  {
    t: "00:00.642",
    event: "Evidence recorded",
    line: "Durable trace written for review and learning.",
  },
] as const;

export const GATE_CHECKS = [
  "Factual integrity",
  "Evidence",
  "Permission",
  "Policy",
  "Execution",
  "Risk",
  "Outcome",
] as const;

export const PROOF_QUESTIONS = [
  { q: "Who initiated this action?", a: "Bound" },
  { q: "Why was it executed?", a: "Bound" },
  { q: "Which data and model were used?", a: "Bound" },
  { q: "What policy authorized it?", a: "Bound" },
  { q: "Where is the evidence?", a: "Recorded" },
] as const;

export const FAQ_ITEMS = [
  {
    q: "Is this another chatbot?",
    a: "No. Chat is an entry surface. Trust Engine, approvals, evidence, and Control Tower complete the loop.",
  },
  {
    q: "Do model outputs publish on their own?",
    a: "No. Consequential side effects require Trust authorization and human approval binding.",
  },
  {
    q: "What is live vs planned?",
    a: "Statuses come from the Luxor Stack map — Live, Wired, Shell, Planned — not marketing fiction.",
  },
  {
    q: "Can we run a demo without production keys?",
    a: "Yes. Sandbox AI and demo seed paths support zero-cost demonstration. Traces are labeled as demonstration.",
  },
  {
    q: "Where does this plug into our stack?",
    a: "Control Tower (Next.js) + Intelligence API (FastAPI) + AG-UI Command Bridge. See Luxor Stack.",
  },
] as const;

export const FINAL_CTA = {
  headline: "Put the next launch on an accountable route.",
  support:
    "Open Command Bridge with a Dubai brief — or enter Control Tower to inspect live workflows.",
  primary: "Open Command Bridge",
  secondary: "Enter Control Tower",
  tertiary: "Explore Luxor Stack",
};

export const RE_BOTTLENECKS = [
  "Launch brief chaos",
  "Approval latency",
  "Evidence gaps",
  "Channel publish risk",
] as const;

/** Flattened corpus for forbidden-term scanning. */
export function allMarketingVisibleText(): string {
  return [
    HERO_COPY.brand,
    HERO_COPY.headline,
    HERO_COPY.support,
    HERO_COPY.primaryCta,
    HERO_COPY.secondaryCta,
    HERO_COPY.micro,
    PROBLEM_COPY.eyebrow,
    PROBLEM_COPY.headline,
    PROBLEM_COPY.support,
    ...PROBLEM_COPY.fractures,
    ...ROUTE_STATES.flatMap((s) => [s.title, s.line]),
    ...VALUE_PILLARS.flatMap((p) => [p.title, p.headline, p.body]),
    ...PRODUCT_SURFACES.flatMap((p) => [p.title, p.blurb, p.cta]),
    ...THEATER_EVENTS.flatMap((e) => [e.event, e.line]),
    ...GATE_CHECKS,
    ...PROOF_QUESTIONS.flatMap((p) => [p.q, p.a]),
    ...FAQ_ITEMS.flatMap((f) => [f.q, f.a]),
    FINAL_CTA.headline,
    FINAL_CTA.support,
    FINAL_CTA.primary,
    FINAL_CTA.secondary,
    FINAL_CTA.tertiary,
    ...RE_BOTTLENECKS,
  ].join("\n");
}
