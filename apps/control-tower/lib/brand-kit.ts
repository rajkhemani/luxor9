/**
 * LUXOR9 Global Brand Identity & Design System — Pure Specification & Math Engine
 * Legal Entity: Luxoranova Fintech Private Limited
 * Primary Positioning: Intelligence Infrastructure
 */

export type ColorGroup =
  | "primary"
  | "secondary"
  | "neutral"
  | "interface-dark"
  | "interface-light"
  | "data-viz"
  | "status";

export type BrandColorSpec = {
  id: string;
  name: string;
  token: string;
  hex: string;
  group: ColorGroup;
  printRef: string;
  ratio: string;
  purpose: string;
  interactionRule: string;
  contrastTargetHex: string;
  contrastNote: string;
};

export type BrandEssenceItem = {
  key: string;
  title: string;
  statement: string;
  distinction: string;
};

export type PositioningPhraseEval = {
  phrase: string;
  verdict: "Primary Tagline" | "Category Descriptor" | "Corporate Proposition" | "Campaign Hook" | "Product Subtitle" | "Internal / Contextual";
  usageRule: string;
};

export type ArchitectureEntity = {
  rank: string;
  name: string;
  tier: "Master Brand" | "Endorsed Platform" | "Core Interface" | "Specialized Surface" | "Vertical Solution" | "Adjacent Concept" | "Internal Runtime";
  publicFacing: boolean;
  lockupRule: string;
  role: string;
};

export type LogoVariantSpec = {
  id: string;
  index: string;
  name: string;
  category: "Core" | "Lockups" | "Digital & Small Scale" | "Production & Finish";
  surface: "dark" | "light" | "metallic";
  minDigitalPx: string;
  minPrintMm: string;
  usage: string;
  variantKind:
    | "primary"
    | "secondary"
    | "wordmark"
    | "symbol"
    | "monogram"
    | "horizontal"
    | "vertical"
    | "compact"
    | "endorsement"
    | "product-tower"
    | "product-generalist"
    | "small-ui"
    | "favicon"
    | "app-icon"
    | "social-avatar"
    | "watermark"
    | "mono-dark"
    | "reversed"
    | "one-color"
    | "embossed";
};

export type ExecutionStateSpec = {
  id: string;
  label: string;
  glyph: string;
  darkBg: string;
  darkFg: string;
  darkBorder: string;
  lightBg: string;
  lightFg: string;
  lightBorder: string;
  meaning: string;
  humanAction: string;
};

export type VoiceAgentProfile = {
  id: string;
  role: string;
  code: string;
  accentHex: string;
  temperament: string;
  paceWpm: string;
  pauseCadence: string;
  formality: string;
  interruptionRule: string;
  uncertaintyPhrase: string;
  escalationProtocol: string;
  sampleUtterance: string;
};

export type MotionScenario = {
  id: string;
  title: string;
  durationMs: number;
  easing: string;
  visualPattern: string;
  reducedMotionFallback: string;
  stateLabel: string;
  detail: string;
};

// ————————————————————————————————————————————————————————————————
// 1. COLOR CONVERSION & WCAG 2.1 CONTRAST MATHEMATICS (Pure & Tested)
// ————————————————————————————————————————————————————————————————

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace("#", "").trim();
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const num = parseInt(full, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

export function formatRgb(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgb(${r}, ${g}, ${b})`;
}

export function hexToHsl(hex: string): string {
  const { r: r255, g: g255, b: b255 } = hexToRgb(hex);
  const r = r255 / 255;
  const g = g255 / 255;
  const b = b255 / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

export function hexToCmyk(hex: string): string {
  const { r: r255, g: g255, b: b255 } = hexToRgb(hex);
  const r = r255 / 255;
  const g = g255 / 255;
  const b = b255 / 255;
  const k = 1 - Math.max(r, g, b);
  if (k >= 0.999) return "0 / 0 / 0 / 100";
  const c = Math.round(((1 - r - k) / (1 - k)) * 100);
  const m = Math.round(((1 - g - k) / (1 - k)) * 100);
  const y = Math.round(((1 - b - k) / (1 - k)) * 100);
  return `${c} / ${m} / ${y} / ${Math.round(k * 100)}`;
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const transform = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * transform(r) + 0.7152 * transform(g) + 0.0722 * transform(b);
}

export function wcagContrastRatio(hexA: string, hexB: string): number {
  const lumA = relativeLuminance(hexA);
  const lumB = relativeLuminance(hexB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

export function wcagGrade(ratio: number): "AAA" | "AA" | "AA Large" | "Fail" {
  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  if (ratio >= 3) return "AA Large";
  return "Fail";
}

// ————————————————————————————————————————————————————————————————
// 2. COMPLETE COLOUR ARCHITECTURE (Obsidian / Mineral Ivory / Signal Cyan)
// ————————————————————————————————————————————————————————————————

export const BRAND_COLORS: BrandColorSpec[] = [
  // Primary Brand Palette
  {
    id: "obsidian",
    name: "Obsidian",
    token: "--lx-obsidian",
    hex: "#0B0D10",
    group: "primary",
    printRef: "Pantone Black 6 C · Rich Black 40/30/30/100",
    ratio: "60% Dark Mode Canvas · 10% Light Mode Anchor",
    purpose: "Foundational institutional ground, authority typography on light surfaces, executive stationery anchor.",
    interactionRule: "Static anchor canvas; never paired with pure #000000 drop shadows on dark backgrounds.",
    contrastTargetHex: "#F3EFE6",
    contrastNote: "Paired with Mineral Ivory for primary dark-mode reading.",
  },
  {
    id: "mineral-ivory",
    name: "Mineral Ivory",
    token: "--lx-mineral-ivory",
    hex: "#F3EFE6",
    group: "primary",
    printRef: "Pantone Warm Gray 1 C · Uncoated Cotton Stock",
    ratio: "60% Light / Print Canvas · Primary Ink on Dark",
    purpose: "Warm architectural parchment canvas for corporate documents, monographs, and primary foreground typography on Obsidian.",
    interactionRule: "Never substitute harsh #FFFFFF where editorial warmth or long-form reading comfort is required.",
    contrastTargetHex: "#0B0D10",
    contrastNote: "Exceeds WCAG AAA against Obsidian.",
  },
  {
    id: "signal-cyan",
    name: "Luxor Signal Cyan",
    token: "--lx-signal-cyan",
    hex: "#2EC4B6",
    group: "primary",
    printRef: "Pantone 3262 C (Spot) · Foil / Precision Rule",
    ratio: "≤ 8% Accent Budget (Dark) · Active Signal Only",
    purpose: "Calibrated operational signal denoting verified action, active focus, live voice capture, and governed meridian highlights.",
    interactionRule: "Reserved strictly for active signals and primary dark-mode CTAs. Use Deep Signal Teal (#0F766E) for text on light surfaces.",
    contrastTargetHex: "#0B0D10",
    contrastNote: "WCAG AAA against Obsidian; never use as small text on Mineral Ivory.",
  },

  // Secondary & Supporting Palette
  {
    id: "deep-signal-teal",
    name: "Deep Signal Teal",
    token: "--lx-signal-deep",
    hex: "#0F766E",
    group: "secondary",
    printRef: "Pantone 3292 C",
    ratio: "≤ 6% Light Mode Interactive Accent",
    purpose: "Light-surface counterpart to Signal Cyan for links, active tabs, and high-contrast interactive controls on Mineral Ivory.",
    interactionRule: "Hover shifts to #115E59; focus uses 2px offset outline.",
    contrastTargetHex: "#F3EFE6",
    contrastNote: "Passes WCAG AA on Mineral Ivory and White.",
  },
  {
    id: "architectural-bronze",
    name: "Architectural Bronze",
    token: "--lx-bronze",
    hex: "#A8895C",
    group: "secondary",
    printRef: "Pantone 872 C (Metallic Foil) / 7557 C",
    ratio: "≤ 4% Institutional Highlight",
    purpose: "Secondary metallic accent reserved for governance seals, founder approval gates, and physical foil debossing.",
    interactionRule: "Never used as body text on light backgrounds; pair with #5C4626 for small light-mode labels.",
    contrastTargetHex: "#0B0D10",
    contrastNote: "WCAG AA Large / UI against Obsidian.",
  },
  {
    id: "obsidian-elevated",
    name: "Obsidian Surface",
    token: "--lx-surface-dark",
    hex: "#14181F",
    group: "interface-dark",
    printRef: "Pantone 433 C",
    ratio: "25% Structural Dark Panels",
    purpose: "Primary structural container and Control Tower panel surface on dark themes (+5% luminance delta from Obsidian).",
    interactionRule: "Separated from canvas by 1px hairline border #262E3B, never heavy drop shadows.",
    contrastTargetHex: "#F3EFE6",
    contrastNote: "AAA text contrast with Mineral Ivory.",
  },
  {
    id: "graphite-border",
    name: "Graphite Rule",
    token: "--lx-border-dark",
    hex: "#262E3B",
    group: "interface-dark",
    printRef: "Pantone 432 C",
    ratio: "Structural Hairlines & Grids",
    purpose: "1px structural dividers, table gridlines, input outlines, and silent framing on dark interfaces.",
    interactionRule: "Hover border elevates to #3C4759; focused border adopts Signal Cyan.",
    contrastTargetHex: "#0B0D10",
    contrastNote: "Subtle structural boundary.",
  },
  {
    id: "muted-slate",
    name: "Ash Slate",
    token: "--lx-muted-dark",
    hex: "#98A2B3",
    group: "interface-dark",
    printRef: "Pantone Cool Gray 7 C",
    ratio: "Secondary Copy on Dark",
    purpose: "Metadata, timestamps, captions, secondary table values, and inactive navigation links on dark surfaces.",
    interactionRule: "Always ≥ 4.5:1 on Obsidian and Obsidian Surface.",
    contrastTargetHex: "#14181F",
    contrastNote: "Passes WCAG AA on dark elevated surfaces.",
  },

  // Light Interface Palette
  {
    id: "alabaster-surface",
    name: "Alabaster Paper",
    token: "--lx-surface-light",
    hex: "#FAF8F3",
    group: "interface-light",
    printRef: "Uncoated 120gsm Natural White",
    ratio: "30% Light Mode Cards & Document Sheets",
    purpose: "Crisp elevated paper surface layered over Mineral Ivory in light-mode portals and printable corporate reports.",
    interactionRule: "Framed by 1px Limestone Rule (#DDD6C9).",
    contrastTargetHex: "#0B0D10",
    contrastNote: "AAA contrast with Obsidian ink.",
  },
  {
    id: "limestone-rule",
    name: "Limestone Rule",
    token: "--lx-border-light",
    hex: "#D6CEC0",
    group: "interface-light",
    printRef: "Pantone Warm Gray 3 C",
    ratio: "Light Structural Hairlines",
    purpose: "Hairline borders, table separators, and corporate letterhead rules on light backgrounds.",
    interactionRule: "Hover border shifts to #B8AEA0; focus uses Deep Signal Teal.",
    contrastTargetHex: "#FAF8F3",
    contrastNote: "Subtle institutional rule.",
  },
  {
    id: "stone-ink",
    name: "Stone Ink",
    token: "--lx-muted-light",
    hex: "#525866",
    group: "interface-light",
    printRef: "Pantone 425 C",
    ratio: "Secondary Copy on Light",
    purpose: "Secondary prose, footnotes, table metadata, and captions on Mineral Ivory and Alabaster surfaces.",
    interactionRule: "Passes WCAG AA across all light surfaces.",
    contrastTargetHex: "#F3EFE6",
    contrastNote: "WCAG AA verified on Mineral Ivory.",
  },

  // Neutral Scale Anchor
  {
    id: "slate-700",
    name: "Charcoal Slate",
    token: "--lx-neutral-700",
    hex: "#333B48",
    group: "neutral",
    printRef: "Pantone 432 U",
    ratio: "Disabled Controls & Secondary Dark Fills",
    purpose: "Mid-dark structural fill for secondary buttons, code containers, and hover surfaces on dark canvas.",
    interactionRule: "Pair with Mineral Ivory text.",
    contrastTargetHex: "#F3EFE6",
    contrastNote: "WCAG AAA with Mineral Ivory.",
  },

  // Status Palette (Always paired with Icon + Label)
  {
    id: "status-verified",
    name: "Verified Emerald",
    token: "--lx-status-success",
    hex: "#1F9D75",
    group: "status",
    printRef: "Pantone 3395 C",
    ratio: "Verified Outcomes & Audit Passes",
    purpose: "Confirmed execution, passed trust gate, and cryptographically logged evidence receipt.",
    interactionRule: "Always paired with check/seal glyph and text label 'Verified' or 'Approved'.",
    contrastTargetHex: "#0B0D10",
    contrastNote: "Passes AA on Obsidian.",
  },
  {
    id: "status-warning",
    name: "Approval Amber",
    token: "--lx-status-warning",
    hex: "#D49B38",
    group: "status",
    printRef: "Pantone 7556 C",
    ratio: "Pending Human Approval & Policy Hold",
    purpose: "Indicates human-in-the-loop approval required, expiring authorization, or intervention needed.",
    interactionRule: "Never flashes aggressively; paired with diamond/hold glyph and explicit status label.",
    contrastTargetHex: "#0B0D10",
    contrastNote: "Passes AAA on Obsidian.",
  },
  {
    id: "status-error",
    name: "Breach Crimson",
    token: "--lx-status-error",
    hex: "#DC5252",
    group: "status",
    printRef: "Pantone 1797 C",
    ratio: "Execution Failure, Policy Denial, Missing Source",
    purpose: "Hard failure, unauthorized attempt, rejected action, or hallucination/missing-source block.",
    interactionRule: "Paired with stop/cross glyph and remediation instruction.",
    contrastTargetHex: "#0B0D10",
    contrastNote: "Passes AA on Obsidian.",
  },
  {
    id: "status-info",
    name: "Telemetry Cobalt",
    token: "--lx-status-info",
    hex: "#4B93C8",
    group: "status",
    printRef: "Pantone 2172 C",
    ratio: "Executing & Informational Context",
    purpose: "Active background workflow execution, scheduled synchronization, and non-blocking system notices.",
    interactionRule: "Paired with pulse/arrow glyph and text state.",
    contrastTargetHex: "#0B0D10",
    contrastNote: "Passes AA on Obsidian.",
  },

  // Data Visualization Palette (Colorblind-differentiated)
  {
    id: "viz-1",
    name: "Series 01 · Signal",
    token: "--lx-viz-1",
    hex: "#2EC4B6",
    group: "data-viz",
    printRef: "Pantone 3262 C",
    ratio: "Primary Metric Series",
    purpose: "Primary KPI series (verified executions, approved workflows).",
    interactionRule: "Use solid 2px strokes with tabular value callouts.",
    contrastTargetHex: "#0B0D10",
    contrastNote: "High luminance separation.",
  },
  {
    id: "viz-2",
    name: "Series 02 · Bronze",
    token: "--lx-viz-2",
    hex: "#C4A574",
    group: "data-viz",
    printRef: "Pantone 7508 C",
    ratio: "Secondary Metric Series",
    purpose: "Secondary comparison series (planned baseline, forecast, governance hold).",
    interactionRule: "Use dashed stroke when representing projections.",
    contrastTargetHex: "#0B0D10",
    contrastNote: "Warm hue separates from Series 01.",
  },
  {
    id: "viz-3",
    name: "Series 03 · Cobalt",
    token: "--lx-viz-3",
    hex: "#5B9BD5",
    group: "data-viz",
    printRef: "Pantone 279 C",
    ratio: "Tertiary Metric Series",
    purpose: "Agent volume, multi-channel sessions, or voice latency series.",
    interactionRule: "Maintain ≥ 15% lightness delta against adjacent series.",
    contrastTargetHex: "#0B0D10",
    contrastNote: "Distinct cool blue channel.",
  },
  {
    id: "viz-4",
    name: "Series 04 · Slate Mist",
    token: "--lx-viz-4",
    hex: "#8A94A6",
    group: "data-viz",
    printRef: "Pantone Cool Gray 7 C",
    ratio: "Benchmark / Prior Period",
    purpose: "Historical comparison, SLA boundary, or neutral residual series.",
    interactionRule: "Render behind active series.",
    contrastTargetHex: "#0B0D10",
    contrastNote: "Subordinate visual weight.",
  },
];

// ————————————————————————————————————————————————————————————————
// 3. BRAND STRATEGY — 17 DISTINCT ESSENCE DIMENSIONS
// ————————————————————————————————————————————————————————————————

export const BRAND_ESSENCE: BrandEssenceItem[] = [
  {
    key: "purpose",
    title: "Brand Purpose",
    statement: "To make institutional intelligence accountable—so enterprises can delegate complex work without surrendering control or truth.",
    distinction: "Why Luxor9 exists beyond commercial revenue.",
  },
  {
    key: "vision",
    title: "Brand Vision",
    statement: "A global standard where every consequential business action executed by software carries verifiable provenance, policy compliance, and human authority.",
    distinction: "The future state of enterprise operations Luxor9 is building toward.",
  },
  {
    key: "mission",
    title: "Brand Mission",
    statement: "To architect and operate governed intelligence infrastructure that converts executive intent into approved workflows and auditable business outcomes.",
    distinction: "What Luxor9 actively builds and delivers every day.",
  },
  {
    key: "promise",
    title: "Brand Promise",
    statement: "Nothing consequential executes without your authorization, and nothing completes without proof.",
    distinction: "The explicit behavioral contract made to every enterprise customer.",
  },
  {
    key: "essence",
    title: "Brand Essence",
    statement: "Accountable Intelligence.",
    distinction: "The indivisible two-word core behind every visual, verbal, and product choice.",
  },
  {
    key: "philosophy",
    title: "Brand Philosophy",
    statement: "KNOW → THINK → ACT → PROVE → LEARN. Intelligence without evidence is speculation; automation without governance is liability.",
    distinction: "The operating logic governing both software architecture and company conduct.",
  },
  {
    key: "values",
    title: "Brand Values",
    statement: "1. Verifiable Truth over Plausible Output · 2. Explicit Authority over Silent Autonomy · 3. Architectural Clarity over Feature Noise · 4. Commercial Rigor over Speculative Hype.",
    distinction: "The four non-negotiable standards that resolve internal trade-offs.",
  },
  {
    key: "personality",
    title: "Brand Personality",
    statement: "Institutional, composed, commercially fluent, and quietly exact—the temperament of a senior chief operating officer paired with a principal systems architect.",
    distinction: "How the brand behaves in human interaction across voice, text, and UI.",
  },
  {
    key: "principles",
    title: "Brand Principles",
    statement: "Never invent a fact; bind every approval to scope and expiry; separate reasoning from authorization; keep the human principal sovereign.",
    distinction: "Operational rules enforced directly inside product design and communications.",
  },
  {
    key: "beliefs",
    title: "Brand Beliefs",
    statement: "Serious businesses do not suffer from a shortage of chat interfaces; they suffer from fractured execution where strategy, approval, and proof live in separate worlds.",
    distinction: "The industry conviction that explains why Luxor9 rejects generic AI tooling.",
  },
  {
    key: "differentiation",
    title: "Brand Differentiation",
    statement: "An independent Trust Boundary + first-class Evidence Ledger built directly into an Enterprise AI Operating System—rather than an unverified prompt wrapper.",
    distinction: "The structural advantage competitors cannot imitate with superficial UI changes.",
  },
  {
    key: "positioning",
    title: "Brand Positioning Statement",
    statement: "For enterprise founders and operating executives—starting with Dubai real estate developers—LUXOR9 is the Intelligence Infrastructure that turns business intent into controlled action and verifiable evidence, unlike unverified AI chatbots or opaque automation agencies.",
    distinction: "Formal strategic frame defining audience, category, benefit, and competitive contrast.",
  },
  {
    key: "narrative",
    title: "Brand Narrative",
    statement: "Modern enterprises already have capable people and ambitious plans, yet launches slip, leads go cold, and claims go unverified because operational systems are disconnected. LUXOR9 closes the fracture between intent and execution under one governed operating layer.",
    distinction: "The external market story told across decks, keynotes, and enterprise sales.",
  },
  {
    key: "story",
    title: "Brand Story",
    statement: "Founded under Luxoranova Fintech Private Limited, LUXOR9 began by confronting a practical commercial reality in high-stakes Dubai real estate launches: one unverified price, delayed campaign, or missed buyer follow-up costs millions. We built infrastructure where speed never compromises authority.",
    distinction: "The grounded origin context rooted in real operational stakes.",
  },
  {
    key: "manifesto",
    title: "Brand Manifesto",
    statement: "The business is working. The system isn't. Enterprises deserve more than chatbots that improvise and dashboards that only report yesterday. Give leaders a system that knows the facts, proposes the plan, waits for the signature, executes with discipline, and hands back the receipt.",
    distinction: "The rallying declaration for internal teams, partners, and flagship keynote openings.",
  },
  {
    key: "ambition",
    title: "Brand Ambition",
    statement: "To establish LUXOR9 as the defining global category standard for governed enterprise execution infrastructure across real estate, commerce, and high-trust capital industries.",
    distinction: "The 10-year institutional scale target.",
  },
  {
    key: "perception",
    title: "Long-Term Perception Objective",
    statement: "When a board, CEO, or regulator sees the LUXOR9 mark on a report, workflow, or approval log, they immediately infer that every number is sourced and every action was authorized.",
    distinction: "The reputational reflex we want to earn over time.",
  },
];

export const POSITIONING_EVALUATION: PositioningPhraseEval[] = [
  {
    phrase: "Intelligence Infrastructure.",
    verdict: "Category Descriptor",
    usageRule: "Primary 2-word category anchor used beneath the LUXOR9 wordmark in corporate profiles, investor decks, and LinkedIn headers.",
  },
  {
    phrase: "Controlled intelligence. Accountable execution.",
    verdict: "Primary Tagline",
    usageRule: "Primary public tagline for homepage heroes, keynote title slides, and brand sign-offs. Never stack with a second tagline.",
  },
  {
    phrase: "Turns intent into controlled action—and every action into verifiable evidence.",
    verdict: "Corporate Proposition",
    usageRule: "Primary explanatory sentence in boilerplate copy, press releases, and executive summaries.",
  },
  {
    phrase: "The business is working. The system isn't.",
    verdict: "Campaign Hook",
    usageRule: "Reserved strictly for Problem / Diagnosis slides, outbound executive campaigns, and editorial openings—never as a permanent logo lockup.",
  },
  {
    phrase: "Enterprise AI Operating System",
    verdict: "Product Subtitle",
    usageRule: "Used in technical documentation, RFP responses, and product architecture diagrams to explain platform scope.",
  },
  {
    phrase: "Founder Execution Infrastructure",
    verdict: "Internal / Contextual",
    usageRule: "Used exclusively in founder-led developer sales pitches and Dubai pilot proposals; do not generalize for corporate-wide procurement.",
  },
  {
    phrase: "Growth Intelligence Infrastructure",
    verdict: "Internal / Contextual",
    usageRule: "Used strictly for CMO / Revenue / Commerce Intelligence OS collateral where commercial growth is the explicit buyer mandate.",
  },
];

export const BRAND_ARCHITECTURE: ArchitectureEntity[] = [
  {
    rank: "01",
    name: "LUXOR9",
    tier: "Master Brand",
    publicFacing: true,
    lockupRule: "Governed Keystone Symbol + LUXOR9 Wordmark. Legal endorsement: 'By Luxoranova Fintech Private Limited' appears solely on legal footers, contracts, invoices, and investor documents.",
    role: "Public corporate master brand and global trust anchor across all industries and white-label deployments.",
  },
  {
    rank: "02",
    name: "LUXOR9 AI GENERALIST",
    tier: "Endorsed Platform",
    publicFacing: true,
    lockupRule: "LUXOR9 (Bold) + hairline separator + AI GENERALIST (Regular, +0.08em tracking). Shares master symbol.",
    role: "Enterprise AI workforce and specialist-agent execution platform.",
  },
  {
    rank: "03",
    name: "LUXOR9 CONTROL TOWER",
    tier: "Core Interface",
    publicFacing: true,
    lockupRule: "LUXOR9 + CONTROL TOWER horizontal product lockup. Never given a separate competing logo icon.",
    role: "Central executive operator experience for orchestration, approvals, evidence review, and governance.",
  },
  {
    rank: "04",
    name: "LUXOR9 MULTI-VOICE AGENT CONTROL TOWER",
    tier: "Specialized Surface",
    publicFacing: true,
    lockupRule: "In UI top bars shorten to 'LUXOR9 · Voice Control Tower'; full name used in product brochures and RFPs.",
    role: "Full-duplex multi-agent voice conference, moderation, live transcription, and voice-gated approval interface.",
  },
  {
    rank: "05",
    name: "LUXOR9 COMMERCE INTELLIGENCE OS",
    tier: "Vertical Solution",
    publicFacing: true,
    lockupRule: "Vertical lockup template: 'LUXOR9 · [Vertical] Intelligence OS'. Designed to scale cleanly to future white-label verticals without diluting master equity.",
    role: "Planned vertical intelligence operating system for enterprise commerce operations.",
  },
  {
    rank: "06",
    name: "LUXOR9 COMMAND SYSTEM",
    tier: "Endorsed Platform",
    publicFacing: true,
    lockupRule: "Descriptor lockup used in architectural whitepapers and executive pitch decks—never competes as a standalone app name alongside Control Tower.",
    role: "Public orchestration, trust-boundary, and executive control architecture concept.",
  },
  {
    rank: "07",
    name: "CLEAR",
    tier: "Adjacent Concept",
    publicFacing: true,
    lockupRule: "Independent typographic identity with optional quiet endorsement line 'Connected with LUXOR9' only after formal integration.",
    role: "Separate product concept maintained at arm's length so neither brand muddies the other's category promise.",
  },
  {
    rank: "08",
    name: "HERMES OS",
    tier: "Internal Runtime",
    publicFacing: false,
    lockupRule: "Internal engineering nomenclature only. Never issued a public logo, marketing sub-brand, or customer-facing sales badge.",
    role: "Replaceable internal runtime execution adapter—never the authority for identity, policy, or approval.",
  },
];

// ————————————————————————————————————————————————————————————————
// 4. 20-VARIANT LOGO FAMILY SPECIFICATIONS
// ————————————————————————————————————————————————————————————————

export const LOGO_VARIANTS: LogoVariantSpec[] = [
  { id: "v01", index: "01", name: "Primary Logo", category: "Core", surface: "dark", minDigitalPx: "120px width", minPrintMm: "28mm width", usage: "Flagship digital headers, dark keynote title slides, executive portals.", variantKind: "primary" },
  { id: "v02", index: "02", name: "Secondary Logo (Light)", category: "Core", surface: "light", minDigitalPx: "120px width", minPrintMm: "28mm width", usage: "Mineral Ivory stationery, corporate proposals, light-mode interfaces.", variantKind: "secondary" },
  { id: "v03", index: "03", name: "Standalone Wordmark", category: "Core", surface: "dark", minDigitalPx: "88px width", minPrintMm: "22mm width", usage: "Editorial mastheads and legal covers where the symbol already appears nearby.", variantKind: "wordmark" },
  { id: "v04", index: "04", name: "Standalone Symbol", category: "Core", surface: "dark", minDigitalPx: "24px height", minPrintMm: "8mm height", usage: "The Governed Keystone mark for app bars, seals, and architectural stamps.", variantKind: "symbol" },
  { id: "v05", index: "05", name: "Architectural Monogram (L9)", category: "Core", surface: "dark", minDigitalPx: "28px width", minPrintMm: "9mm width", usage: "Strictly justified for wax/foil document seals, executive cuffs, and tight badge slots.", variantKind: "monogram" },
  { id: "v06", index: "06", name: "Horizontal Lockup", category: "Lockups", surface: "dark", minDigitalPx: "140px width", minPrintMm: "32mm width", usage: "Standard navigation bars, email signatures, and banner placements.", variantKind: "horizontal" },
  { id: "v07", index: "07", name: "Vertical Stacked Lockup", category: "Lockups", surface: "light", minDigitalPx: "96px width", minPrintMm: "24mm width", usage: "Square report covers, trade signage, and centered monograph title pages.", variantKind: "vertical" },
  { id: "v08", index: "08", name: "Compact Lockup", category: "Lockups", surface: "dark", minDigitalPx: "84px width", minPrintMm: "20mm width", usage: "Mobile navigation bars, collapsed sidebars, and slide footers.", variantKind: "compact" },
  { id: "v09", index: "09", name: "Corporate Endorsement Lockup", category: "Lockups", surface: "light", minDigitalPx: "180px width", minPrintMm: "45mm width", usage: "Contracts, NDAs, invoices, and formal Luxoranova Fintech Private Limited documents.", variantKind: "endorsement" },
  { id: "v10", index: "10", name: "Product Lockup · Control Tower", category: "Lockups", surface: "dark", minDigitalPx: "176px width", minPrintMm: "42mm width", usage: "Control Tower application chrome, release notes, and product collateral.", variantKind: "product-tower" },
  { id: "v11", index: "11", name: "Product Lockup · AI Generalist", category: "Lockups", surface: "light", minDigitalPx: "176px width", minPrintMm: "42mm width", usage: "Enterprise AI Workforce briefings, capabilities decks, and platform headers.", variantKind: "product-generalist" },
  { id: "v12", index: "12", name: "Small-Scale Interface Logo", category: "Digital & Small Scale", surface: "dark", minDigitalPx: "20px height", minPrintMm: "N/A (Screen)", usage: "Optically thickened stroke (+14% weight) for dense data tables and micro-headers.", variantKind: "small-ui" },
  { id: "v13", index: "13", name: "Favicon (16–32px)", category: "Digital & Small Scale", surface: "dark", minDigitalPx: "16×16px", minPrintMm: "N/A (Screen)", usage: "Browser tabs and bookmarks; high-contrast Keystone silhouette on Obsidian tile.", variantKind: "favicon" },
  { id: "v14", index: "14", name: "App Icon (iOS / Android)", category: "Digital & Small Scale", surface: "dark", minDigitalPx: "48×48px", minPrintMm: "N/A (Screen)", usage: "Mobile launcher tile with 22% safe perimeter margin and subtle Obsidian surface.", variantKind: "app-icon" },
  { id: "v15", index: "15", name: "Social Avatar (1:1 Safe Circle)", category: "Digital & Small Scale", surface: "dark", minDigitalPx: "128×128px", minPrintMm: "N/A (Screen)", usage: "LinkedIn, X, and corporate directory avatars engineered for circular crop safety.", variantKind: "social-avatar" },
  { id: "v16", index: "16", name: "Presentation Watermark", category: "Production & Finish", surface: "light", minDigitalPx: "110px width", minPrintMm: "30mm width", usage: "Subtle 10% opacity corner provenance stamp for confidential board decks and PDFs.", variantKind: "watermark" },
  { id: "v17", index: "17", name: "Monochrome Dark", category: "Production & Finish", surface: "light", minDigitalPx: "100px width", minPrintMm: "24mm width", usage: "Laser printing, legal filings, and single-ink Obsidian press applications.", variantKind: "mono-dark" },
  { id: "v18", index: "18", name: "Reversed Mineral Ivory", category: "Production & Finish", surface: "dark", minDigitalPx: "100px width", minPrintMm: "24mm width", usage: "Single-ink knockouts over dark photography, architectural signage, and dark textiles.", variantKind: "reversed" },
  { id: "v19", index: "19", name: "One-Colour Production", category: "Production & Finish", surface: "light", minDigitalPx: "80px width", minPrintMm: "18mm width", usage: "Silk-screen, laser etching, rubber stamps, and monochrome thermal receipts.", variantKind: "one-color" },
  { id: "v20", index: "20", name: "Embossed / Engraved Finish", category: "Production & Finish", surface: "metallic", minDigitalPx: "N/A (Physical)", minPrintMm: "25mm width", usage: "Blind debossing on 600gsm cotton business cards and anodized aluminum office plaques.", variantKind: "embossed" },
];

// ————————————————————————————————————————————————————————————————
// 5. 9-STATE EXECUTION TAXONOMY (Never Color Alone)
// ————————————————————————————————————————————————————————————————

export const EXECUTION_STATES: ExecutionStateSpec[] = [
  { id: "proposed", label: "Proposed", glyph: "◇", darkBg: "rgba(152,162,179,0.12)", darkFg: "#CBD5E1", darkBorder: "#475569", lightBg: "#F1F5F9", lightFg: "#334155", lightBorder: "#CBD5E1", meaning: "Agent drafted a structured plan; zero external side effects.", humanAction: "Review evidence & scope" },
  { id: "pending-approval", label: "Pending Approval", glyph: "◆", darkBg: "rgba(212,155,56,0.14)", darkFg: "#F3C66E", darkBorder: "#D49B38", lightBg: "#FEF7E6", lightFg: "#8A5A0A", lightBorder: "#E5B964", meaning: "Execution paused at Trust Boundary awaiting named principal signature.", humanAction: "Approve or Request Change" },
  { id: "approved", label: "Approved", glyph: "▣", darkBg: "rgba(46,196,182,0.14)", darkFg: "#5EEAD4", darkBorder: "#2EC4B6", lightBg: "#EBF8F6", lightFg: "#0F766E", lightBorder: "#7EDAD0", meaning: "Cryptographically bound to tenant, actor, policy version, and expiry.", humanAction: "Ready to dispatch" },
  { id: "executing", label: "Executing", glyph: "▸", darkBg: "rgba(75,147,200,0.16)", darkFg: "#8CC5EF", darkBorder: "#4B93C8", lightBg: "#EEF6FC", lightFg: "#1D5B8A", lightBorder: "#9BC6E8", meaning: "Authorized workflow step currently running under bounded scope.", humanAction: "Monitor or Interrupt" },
  { id: "completed", label: "Completed", glyph: "■", darkBg: "rgba(148,163,184,0.16)", darkFg: "#E2E8F0", darkBorder: "#64748B", lightBg: "#F3F4F6", lightFg: "#1F2937", lightBorder: "#9CA3AF", meaning: "Action finished; awaiting final automated evidence reconciliation.", humanAction: "Inspect output" },
  { id: "verified", label: "Verified", glyph: "✓", darkBg: "rgba(31,157,117,0.16)", darkFg: "#6EE7B7", darkBorder: "#1F9D75", lightBg: "#ECFDF5", lightFg: "#065F46", lightBorder: "#6EE7B7", meaning: "Outcome reconciled against primary sources and logged to Evidence Ledger.", humanAction: "Audit / Export Proof" },
  { id: "failed", label: "Failed", glyph: "✕", darkBg: "rgba(220,82,82,0.16)", darkFg: "#FCA5A5", darkBorder: "#DC5252", lightBg: "#FEF2F2", lightFg: "#991B1B", lightBorder: "#FCA5A5", meaning: "Adapter or policy precondition failed safely without partial corruption.", humanAction: "Inspect trace & retry" },
  { id: "rejected", label: "Rejected", glyph: "⊘", darkBg: "rgba(185,28,28,0.16)", darkFg: "#F87171", darkBorder: "#B91C1C", lightBg: "#FFF1F2", lightFg: "#9F1239", lightBorder: "#FDA4AF", meaning: "Principal declined execution or Trust Engine blocked policy breach.", humanAction: "Revise intent" },
  { id: "awaiting-intervention", label: "Awaiting Intervention", glyph: "▲", darkBg: "rgba(196,165,116,0.18)", darkFg: "#E5CFA3", darkBorder: "#C4A574", lightBg: "#FBF6EC", lightFg: "#785318", lightBorder: "#D8BC89", meaning: "Missing verified source or conflicting constraint requires human input.", humanAction: "Supply verified source" },
];

// ————————————————————————————————————————————————————————————————
// 6. MULTI-AGENT VOICE PERSONALITY ARCHITECTURE (6 Specialist Profiles)
// ————————————————————————————————————————————————————————————————

export const VOICE_AGENT_PROFILES: VoiceAgentProfile[] = [
  {
    id: "exec-intel",
    role: "Executive Intelligence",
    code: "EX-01",
    accentHex: "#2EC4B6",
    temperament: "Calm, authoritative, boardroom-concise.",
    paceWpm: "138–148 WPM",
    pauseCadence: "450ms before decisions; 250ms between clauses",
    formality: "High · Executive briefing register",
    interruptionRule: "Halts output within <120ms on VAD barge-in; acknowledges with 'Understood — pausing brief.'",
    uncertaintyPhrase: "We do not have a verified source for that figure. Shall I hold execution until you confirm?",
    escalationProtocol: "Routes any financial, legal, or public-publish action directly to Founder Approval Gate.",
    sampleUtterance: "Launch readiness stands at two of three items verified. Brochure copy awaits your price-sheet source before dispatch.",
  },
  {
    id: "market-intel",
    role: "Market Intelligence",
    code: "MK-02",
    accentHex: "#5B9BD5",
    temperament: "Analytical, measured, strictly evidence-led.",
    paceWpm: "140–152 WPM",
    pauseCadence: "400ms before citing source attribution",
    formality: "High · Institutional research register",
    interruptionRule: "Stops mid-metric on barge-in and retains cited source ID in active context.",
    uncertaintyPhrase: "Primary market registry data is unavailable for this tower. I will mark this claim unverified.",
    escalationProtocol: "Flags unverified competitive claims as 'Awaiting Intervention' before copywriting begins.",
    sampleUtterance: "Per DLD Q3 transaction filings, comparable two-bedroom absorption in this corridor averaged 18 days. Source logged.",
  },
  {
    id: "lead-intel",
    role: "Lead Intelligence",
    code: "LD-03",
    accentHex: "#C4A574",
    temperament: "Clear, crisp, commercially aware without hype.",
    paceWpm: "150–162 WPM",
    pauseCadence: "300ms between qualification points",
    formality: "Medium-High · Commercial precision",
    interruptionRule: "Yields immediately on buyer or sales-director speech; never talks over objections.",
    uncertaintyPhrase: "That unit availability has not synced from the inventory ledger yet — let me confirm directly.",
    escalationProtocol: "Escalates high-intent VIP site visits and custom payment-plan requests to Sales Director.",
    sampleUtterance: "Fourteen site-visit inquiries arrived since 09:00. Three match cash-buyer criteria and are queued for immediate callback.",
  },
  {
    id: "sales-ops",
    role: "Sales Operations",
    code: "SO-04",
    accentHex: "#3AA89B",
    temperament: "Confident, consultative, structured.",
    paceWpm: "145–155 WPM",
    pauseCadence: "350ms before stating commercial terms",
    formality: "High · Consultative enterprise tone",
    interruptionRule: "Immediate audio flush on barge-in; summarizes the exact point paused.",
    uncertaintyPhrase: "I cannot quote an off-schedule discount without signed commercial authorization.",
    escalationProtocol: "Requires explicit principal approval prior to issuing formal quotations or CRM updates.",
    sampleUtterance: "Follow-up sequence for the Marina launch is drafted in English and Arabic. Ready for your approval to activate.",
  },
  {
    id: "cust-ops",
    role: "Customer Operations",
    code: "CO-05",
    accentHex: "#6D9EC1",
    temperament: "Warm, composed, quietly helpful.",
    paceWpm: "136–146 WPM",
    pauseCadence: "450ms empathetic beat after client concern",
    formality: "Medium-High · Courteous hospitality rigor",
    interruptionRule: "Soft immediate fade (<90ms) on client interruption; invites full explanation.",
    uncertaintyPhrase: "I want to give you an exact date rather than an estimate — let me verify with the handover desk.",
    escalationProtocol: "Escalates SLA breaches, handover disputes, or legal queries to Customer Operations Lead.",
    sampleUtterance: "Your handover inspection slot is confirmed for Thursday at 11:00 Dubai time. I have sent the checklist receipt.",
  },
  {
    id: "doc-intel",
    role: "Document Intelligence",
    code: "DC-06",
    accentHex: "#98A2B3",
    temperament: "Precise, neutral, methodical.",
    paceWpm: "134–144 WPM",
    pauseCadence: "500ms before reading legal or numerical clauses",
    formality: "Very High · Audit & compliance register",
    interruptionRule: "Hard stop on barge-in; preserves exact document page and clause index.",
    uncertaintyPhrase: "Clause 4.2 conflicts with the attached schedule. Flagged for legal review before sign-off.",
    escalationProtocol: "Blocks export whenever mandatory provenance metadata or signature fields are missing.",
    sampleUtterance: "Parsed 24 pages of the RERA escrow addendum. Three handover dates extracted and cross-checked against the brochure.",
  },
];

// ————————————————————————————————————————————————————————————————
// 7. MOTION & AGENT CHOREOGRAPHY SCENARIOS (8 Required Patterns)
// ————————————————————————————————————————————————————————————————

export const MOTION_SCENARIOS: MotionScenario[] = [
  { id: "agent-active", title: "New Agent Active", durationMs: 220, easing: "cubic-bezier(0.16, 1, 0.3, 1)", visualPattern: "1px hairline border illuminates to Signal Cyan + crisp 4px vertical rise (`translateY(4px -> 0)`).", reducedMotionFallback: "Instant border & label switch to 'Active'.", stateLabel: "EX-01 · Active", detail: "Zero bounce, zero neon bloom. Signals readiness like an instrument gauge coming online." },
  { id: "work-delegated", title: "Delegated Work Received", durationMs: 260, easing: "cubic-bezier(0.22, 1, 0.36, 1)", visualPattern: "Single directional meridian line sweeps left-to-right across card header hairline (transform: scaleX).", reducedMotionFallback: "Static assignment tag 'Assigned · MK-02'.", stateLabel: "Delegated → MK-02", detail: "Expresses directed accountability from Executive Intelligence to specialist." },
  { id: "multi-collab", title: "Multi-Agent Collaboration", durationMs: 320, easing: "cubic-bezier(0.16, 1, 0.3, 1)", visualPattern: "Parallel node indicators synchronize opacity sequentially (60ms stagger) while sharing one evidence rail.", reducedMotionFallback: "Paired role markers visible simultaneously.", stateLabel: "MK-02 + DC-06 Synced", detail: "Communicates coordinated enterprise specialists rather than chaotic chat bubbles." },
  { id: "active-speaker", title: "Active Speaker Focus", durationMs: 140, easing: "cubic-bezier(0.2, 0, 0, 1)", visualPattern: "3-bar calibrated acoustic level meter tracks real RMS voice amplitude; inactive agents dim to 68% opacity.", reducedMotionFallback: "Explicit 'Speaking' marker + crisp focus border.", stateLabel: "SO-04 · Speaking", detail: "Sub-150ms response ensures voice handoffs feel natural and unambiguous." },
  { id: "pending-approval", title: "Pending Founder Approval", durationMs: 380, easing: "cubic-bezier(0.16, 1, 0.3, 1)", visualPattern: "Execution rail halts at vertical Bronze gate rule; Approval panel expands with deliberate settle.", reducedMotionFallback: "Immediate Amber gate banner with 'Approve' / 'Reject' controls.", stateLabel: "◆ Pending Approval", detail: "Motion literally stops to visually dramatize the independent Trust Boundary." },
  { id: "verified-action", title: "Verified Action", durationMs: 200, easing: "cubic-bezier(0.16, 1, 0.3, 1)", visualPattern: "Checkmark stroke draws cleanly (`stroke-dashoffset`) in 180ms and settles in Verified Emerald.", reducedMotionFallback: "Static '✓ Verified' state.", stateLabel: "✓ Verified", detail: "Crisp, quiet closure — no confetti, no playful overshoot." },
  { id: "execution-failure", title: "Execution Failure", durationMs: 160, easing: "cubic-bezier(0.32, 0, 0.67, 0)", visualPattern: "Immediate crisp hairline transition to Breach Crimson + remediation panel appears cleanly (no comical shake).", reducedMotionFallback: "Immediate Crimson error surface with cause and next step.", stateLabel: "✕ Failed · Safe Halt", detail: "Enterprise software never 'wiggles' in failure; it reports clearly and preserves state." },
  { id: "evidence-receipt", title: "Evidence Receipt Created", durationMs: 280, easing: "cubic-bezier(0.16, 1, 0.3, 1)", visualPattern: "Receipt card stamps into Audit Ledger with 6px vertical settle and monospace hash confirmation.", reducedMotionFallback: "Receipt row appended immediately at top of ledger.", stateLabel: "Receipt #EV-9042 Logged", detail: "Reinforces permanence: every action leaves an immutable institutional record." },
];

// ————————————————————————————————————————————————————————————————
// 8. VERBAL IDENTITY & COPY SPECIMENS
// ————————————————————————————————————————————————————————————————

export const VOCABULARY_GUIDE = [
  { preferred: "Intelligence Infrastructure", restricted: "AI Bot / Smart Assistant", note: "Positions Luxor9 as foundational enterprise systems, not a consumer chat widget." },
  { preferred: "Governed Execution", restricted: "Full Autopilot / Magic Automation", note: "Signals human sovereignty and policy enforcement." },
  { preferred: "Evidence Receipt / Provenance", restricted: "Logs / Output Dump", note: "Treats proof as a first-class executive asset." },
  { preferred: "Approval Gate / Authorization", restricted: "Click OK / Auto-approve", note: "Reflects binding scope, actor, policy version, and expiry." },
  { preferred: "Source Needed", restricted: "Estimated / Best Guess", note: "Zero-hallucination standard — never fabricate numbers or dates." },
  { preferred: "Specialist Agent / Workforce", restricted: "AI Persona / Virtual Buddy", note: "Maintains institutional gravity across voice and digital touchpoints." },
] as const;

export const COPY_SPECIMENS = [
  {
    id: "one-sentence",
    label: "One-Sentence Company Description",
    copy: "LUXOR9 is enterprise intelligence infrastructure that turns business intent into controlled action and every action into verifiable evidence.",
  },
  {
    id: "fifty-word",
    label: "50-Word Corporate Description",
    copy: "LUXOR9, developed by Luxoranova Fintech Private Limited, is an Enterprise AI Operating System built for high-stakes commercial operations. Combining specialist AI workflows, a central Control Tower, and an independent trust and evidence layer, LUXOR9 enables executives—starting with Dubai real estate developers—to plan, approve, execute, and verify complex business work with complete accountability.",
  },
  {
    id: "hundred-fifty-word",
    label: "150-Word Institutional Profile",
    copy: "Modern enterprises rarely fail for lack of ambition or software; they stall because strategy, execution, approval, and proof operate in disconnected silos. LUXOR9 solves this operational fracture. Built by Luxoranova Fintech Private Limited, LUXOR9 is governed Intelligence Infrastructure designed to operate across the complete business loop: KNOW → THINK → ACT → PROVE → LEARN. Through the LUXOR9 Control Tower and Multi-Voice Agent Control Tower, business leaders state commercial intent, review source-backed execution blueprints, grant explicit scoped approvals, and receive auditable evidence receipts for every completed action. Unlike unverified chatbots or opaque automation agencies, LUXOR9 treats provenance and human authority as non-negotiable system boundaries—never inventing prices, dates, or claims without verified sources. Launching first for Dubai real estate developers and expanding into enterprise commerce, LUXOR9 delivers controlled intelligence and accountable execution at global institutional standards.",
  },
  {
    id: "founder-intro",
    label: "Founder Introduction",
    copy: "We built LUXOR9 because serious operators should never have to choose between speed and control. In real estate and enterprise commerce, an unverified claim or an unapproved campaign isn't a small bug—it is reputational risk. LUXOR9 gives founders an intelligent workforce that prepares the work, cites its sources, waits for your signature, and proves every outcome.",
  },
  {
    id: "sales-intro",
    label: "Enterprise Sales Opening",
    copy: "Your teams are already working hard, yet launches slip and lead follow-ups fragment across disconnected tools. LUXOR9 sits above that noise as governed Intelligence Infrastructure: you tell the system the business objective, review a source-verified blueprint in minutes, approve with one click, and inspect full execution proof in your Control Tower.",
  },
  {
    id: "error-copy",
    label: "Product Microcopy · Missing Source & Approval",
    copy: "Execution paused — Source needed. Property price and handover date require a verified developer document before brochure generation can proceed. Attach source or revise scope.",
  },
] as const;

// ————————————————————————————————————————————————————————————————
// 9. EXPORTABLE DESIGN TOKENS (CSS + JSON)
// ————————————————————————————————————————————————————————————————

export function generateCssTokens(): string {
  return `/* LUXOR9 Global Design Tokens — v1.0
 * Legal Entity: Luxoranova Fintech Private Limited
 * Primary Positioning: Intelligence Infrastructure
 */
:root {
  /* Primary Brand */
  --lx-obsidian: #0B0D10;
  --lx-mineral-ivory: #F3EFE6;
  --lx-signal-cyan: #2EC4B6;
  --lx-signal-deep: #0F766E;
  --lx-bronze: #A8895C;

  /* Dark Institutional Surfaces */
  --lx-dark-canvas: #0B0D10;
  --lx-dark-surface: #14181F;
  --lx-dark-elevated: #1B212B;
  --lx-dark-border: #262E3B;
  --lx-dark-ink: #F3EFE6;
  --lx-dark-muted: #98A2B3;

  /* Light Editorial & Corporate Surfaces */
  --lx-light-canvas: #F3EFE6;
  --lx-light-surface: #FAF8F3;
  --lx-light-elevated: #FFFFFF;
  --lx-light-border: #D6CEC0;
  --lx-light-ink: #0B0D10;
  --lx-light-muted: #525866;

  /* Status Semantics (Always pair with glyph + text) */
  --lx-status-verified: #1F9D75;
  --lx-status-pending: #D49B38;
  --lx-status-failed: #DC5252;
  --lx-status-executing: #4B93C8;

  /* Typography (2+1 Institutional Rule) */
  --lx-font-display: "Cormorant Garamond", Georgia, serif;
  --lx-font-sans: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif;
  --lx-font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;

  /* Spacing Scale (4px base) */
  --lx-space-1: 4px;
  --lx-space-2: 8px;
  --lx-space-3: 12px;
  --lx-space-4: 16px;
  --lx-space-6: 24px;
  --lx-space-8: 32px;
  --lx-space-12: 48px;
  --lx-space-16: 64px;

  /* Radius Scale (Architectural Precision) */
  --lx-radius-none: 0px;
  --lx-radius-sm: 2px;
  --lx-radius-md: 4px;
  --lx-radius-lg: 8px;

  /* Motion */
  --lx-duration-fast: 160ms;
  --lx-duration-standard: 240ms;
  --lx-duration-deliberate: 380ms;
  --lx-ease-precision: cubic-bezier(0.16, 1, 0.3, 1);
}`;
}

export function generateJsonTokens(): string {
  const payload = {
    brand: "LUXOR9",
    legalEntity: "Luxoranova Fintech Private Limited",
    positioning: "Intelligence Infrastructure",
    philosophy: ["KNOW", "THINK", "ACT", "PROVE", "LEARN"],
    colors: Object.fromEntries(
      BRAND_COLORS.map((c) => [
        c.id,
        {
          name: c.name,
          token: c.token,
          hex: c.hex,
          rgb: formatRgb(c.hex),
          hsl: hexToHsl(c.hex),
          cmyk: hexToCmyk(c.hex),
          printRef: c.printRef,
          contrastRatio: wcagContrastRatio(c.hex, c.contrastTargetHex),
        },
      ]),
    ),
    typography: {
      display: "Cormorant Garamond",
      primarySans: "Plus Jakarta Sans",
      mono: "JetBrains Mono",
      basePx: 16,
      tabularNumerals: true,
    },
    spacing: { unitPx: 4, scale: [4, 8, 12, 16, 24, 32, 48, 64, 96] },
    radii: { sharp: 0, subtle: 2, control: 4, surface: 8 },
    motion: {
      fastMs: 160,
      standardMs: 240,
      deliberateMs: 380,
      easingPrecision: "cubic-bezier(0.16, 1, 0.3, 1)",
    },
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Generates clean, production-ready SVG markup for the Governed Keystone symbol
 * or full horizontal lockup so users can download vector files directly from the Brand Kit.
 */
export function buildLuxorLogoSvg(
  mode: "primary-dark" | "secondary-light" | "symbol-only" | "mono-black",
): string {
  const isDark = mode === "primary-dark" || mode === "symbol-only";
  const fg = mode === "mono-black" ? "#000000" : isDark ? "#F3EFE6" : "#0B0D10";
  const accent = mode === "mono-black" ? "#000000" : mode === "secondary-light" ? "#0F766E" : "#2EC4B6";
  const bg = mode === "primary-dark" ? "#0B0D10" : mode === "secondary-light" ? "#F3EFE6" : "none";

  if (mode === "symbol-only") {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" fill="none">
  <rect width="96" height="96" fill="#0B0D10"/>
  <g transform="translate(20, 20)">
    <path d="M4 4H52V36H20V20H40V14H14V42H52V52H4V4Z" fill="${fg}"/>
    <rect x="36" y="24" width="16" height="6" fill="${accent}"/>
  </g>
</svg>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 96" width="360" height="96" fill="none">
  ${bg !== "none" ? `<rect width="360" height="96" fill="${bg}"/>` : ""}
  <g transform="translate(24, 20)">
    <path d="M4 4H52V36H20V20H40V14H14V42H52V52H4V4Z" fill="${fg}"/>
    <rect x="36" y="24" width="16" height="6" fill="${accent}"/>
  </g>
  <text x="104" y="61" fill="${fg}" font-family="'Plus Jakarta Sans', Helvetica, Arial, sans-serif" font-size="38" font-weight="600" letter-spacing="6">LUXOR</text>
  <text x="275" y="61" fill="${accent}" font-family="'Plus Jakarta Sans', Helvetica, Arial, sans-serif" font-size="38" font-weight="700">9</text>
</svg>`;
}
