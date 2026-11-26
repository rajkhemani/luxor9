"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BRAND_ARCHITECTURE,
  BRAND_COLORS,
  BRAND_ESSENCE,
  COPY_SPECIMENS,
  LOGO_VARIANTS,
  MOTION_SCENARIOS,
  POSITIONING_EVALUATION,
  VOCABULARY_GUIDE,
  VOICE_AGENT_PROFILES,
  buildLuxorLogoSvg,
  formatRgb,
  generateCssTokens,
  generateJsonTokens,
  hexToCmyk,
  hexToHsl,
  wcagContrastRatio,
  wcagGrade,
  type ColorGroup,
  type LogoVariantSpec,
} from "@/lib/brand-kit";
import { BRAND_SOUND_SPECS, playBrandSound, type BrandSoundCue } from "@/lib/brand-audio";
import {
  ENTERPRISE_ICONS,
  LogoConstructionBlueprint,
  LogoVariantPreview,
  LuxorKeystoneGlyph,
} from "./LuxorMarkSvg";
import { BrandApplicationsShowcase } from "./BrandApplicationsShowcase";

const PERSONALITY_CALIBRATION = [
  { trait: "Powerful", guard: "Never aggressive", balance: 82, note: "Commanding clarity earned through evidence, not volume." },
  { trait: "Institutional Luxury", guard: "Never ostentatious", balance: 78, note: "Architectural restraint in Obsidian and Mineral Ivory; zero gold-plated clichés." },
  { trait: "Technologically Advanced", guard: "Never sci-fi theatrical", balance: 86, note: "Precision engineering expressed through grids and speed—not neon circuits." },
  { trait: "Commercially Fluent", guard: "Never promotional hype", balance: 80, note: "Speaks the language of absorption, margins, governance, and accountability." },
] as const;

const ARCHETYPE_MIX = [
  { name: "The Ruler", share: "50% · Primary", role: "Governance, order, executive authority, and sovereign approval boundaries.", limit: "Must never drift into rigid bureaucracy or cold indifference." },
  { name: "The Sage", share: "35% · Secondary", role: "Evidence-led truth, source provenance, calm verification, and zero guessing.", limit: "Must never become academic or slow to convert insight into action." },
  { name: "The Creator", share: "15% · Tertiary", role: "Systems architecture, modular infrastructure, and enduring industrial craft.", limit: "Subordinated to reliability; novelty never outranks legibility." },
  { name: "The Magician", share: "0% · Restricted", role: "Explicitly rejected for trust or claims. Permitted only as quiet invisible friction reduction.", limit: "Enterprise boards distrust 'magic'; they authorize verifiable systems." },
] as const;

const TYPOGRAPHY_SCALE = [
  { level: "Display / Monograph", face: "Cormorant Garamond", size: "56px / 3.5rem", weight: "500", lh: "1.06", track: "-0.02em", sample: "Controlled intelligence." },
  { level: "H1 · Page Title", face: "Cormorant Garamond", size: "40px / 2.5rem", weight: "500", lh: "1.14", track: "-0.015em", sample: "Accountable execution at global scale." },
  { level: "H2 · Section Head", face: "Cormorant Garamond", size: "30px / 1.875rem", weight: "500", lh: "1.2", track: "-0.01em", sample: "02 · Visual Identity Architecture" },
  { level: "H3 · Module Title", face: "Plus Jakarta Sans", size: "20px / 1.25rem", weight: "600", lh: "1.3", track: "-0.01em", sample: "Approval Centre & Evidence Ledger" },
  { level: "Body Large", face: "Plus Jakarta Sans", size: "17px / 1.0625rem", weight: "400", lh: "1.6", track: "0", sample: "Turns business intent into controlled action and verifiable evidence." },
  { level: "Body Regular", face: "Plus Jakarta Sans", size: "15px / 0.9375rem", weight: "400", lh: "1.6", track: "0", sample: "Every consequential action binds to tenant, principal, policy version, and expiry." },
  { level: "Navigation / Button", face: "Plus Jakarta Sans", size: "14px / 0.875rem", weight: "600", lh: "1.2", track: "0.01em", sample: "Approve and Build · Download Kit" },
  { level: "Overline / Kicker", face: "Plus Jakarta Sans", size: "12px / 0.75rem", weight: "600", lh: "1.3", track: "0.10em", sample: "INTELLIGENCE INFRASTRUCTURE" },
  { level: "Data & Audit Mono", face: "JetBrains Mono", size: "13px / 0.8125rem", weight: "500", lh: "1.45", track: "0.02em", sample: "AED 2,500.00 · PROOF-CMO003 · 16.4:1 AAA" },
] as const;

const LOGO_MISUSE_RULES = [
  { id: "m1", title: "Never distort proportions", desc: "Do not stretch, skew, or compress the 9X Keystone matrix." },
  { id: "m2", title: "Never apply neon glow or drop shadows", desc: "Preserve razor-sharp architectural edges on all screens." },
  { id: "m3", title: "Never recolour with off-palette gradients", desc: "Only approved Obsidian, Mineral Ivory, Signal Cyan, or monochrome inks." },
  { id: "m4", title: "Never place Cyan wordmark on Mineral Ivory", desc: "Use Deep Signal Teal (#0F766E) on light grounds to preserve WCAG AA." },
  { id: "m5", title: "Never violate the 2X clear space", desc: "Keep borders, imagery, and text outside the minimum perimeter." },
  { id: "m6", title: "Never add AI clichés inside the mark", desc: "No brains, circuits, sparkles, or robots beside the Keystone." },
] as const;

const EDITORIAL_PHOTO_SPECS = [
  {
    src: "/brand/luxor_arch_dubai.jpg",
    title: "Architectural Presence · Dubai Blue Hour",
    ratio: "16:9 Landscape · Hero & Monograph Covers",
    lighting: "Directional morning light on warm travertine against obsidian glass; deep shadow geometry.",
    rule: "Use clean 3:2 or 16:9 crops with a measured obsidian contrast scrim (`rgba(11,13,16,0.68)`) when overlaying Mineral Ivory typography.",
  },
  {
    src: "/brand/luxor_exec_boardroom.jpg",
    title: "Executive Environment · Governed Decision Space",
    ratio: "4:3 Editorial · Enterprise Sales & Case Studies",
    lighting: "Natural architectural window light; muted Leica 35mm documentary tone; zero staged stock smiles.",
    rule: "Communicate real operating environments where capital decisions happen—never glossy sci-fi holograms.",
  },
  {
    src: "/brand/luxor_material_detail.jpg",
    title: "Material System · Obsidian, Ivory & Signal Meridian",
    ratio: "4:3 Macro · Print Dividers & Packaging",
    lighting: "Controlled raking studio side-light highlighting matte anodized aluminum, honed limestone, and a single calibrated teal meridian.",
    rule: "Translates the digital colour system into physical architectural permanence.",
  },
] as const;

function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function BrandKitPortal() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [logoCategory, setLogoCategory] = useState<"All" | LogoVariantSpec["category"]>("All");
  const [showGrid, setShowGrid] = useState(true);
  const [showClearSpace, setShowClearSpace] = useState(true);
  const [showKerning, setShowKerning] = useState(true);

  const [colorFilter, setColorFilter] = useState<"all" | ColorGroup>("all");
  const [wcagFg, setWcagFg] = useState("#F3EFE6");
  const [wcagBg, setWcagBg] = useState("#0B0D10");

  const [specimenText, setSpecimenText] = useState(
    "Controlled intelligence. Accountable execution. AED 2,500,000 verified.",
  );
  const [useTabular, setUseTabular] = useState(true);

  const [activeMotionId, setActiveMotionId] = useState<string>("pending-approval");
  const [reducedMotionPreview, setReducedMotionPreview] = useState(false);

  const [soundMuted, setSoundMuted] = useState(false);
  const [lastPlayedCue, setLastPlayedCue] = useState<string | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [essenceExpanded, setEssenceExpanded] = useState(false);

  const filteredLogos =
    logoCategory === "All"
      ? LOGO_VARIANTS
      : LOGO_VARIANTS.filter((l) => l.category === logoCategory);

  const filteredColors =
    colorFilter === "all"
      ? BRAND_COLORS
      : BRAND_COLORS.filter((c) => c.group === colorFilter);

  const liveRatio = wcagContrastRatio(wcagFg, wcagBg);
  const liveGrade = wcagGrade(liveRatio);

  const activeMotion =
    MOTION_SCENARIOS.find((m) => m.id === activeMotionId) ?? MOTION_SCENARIOS[0];

  const visibleEssence = essenceExpanded ? BRAND_ESSENCE : BRAND_ESSENCE.slice(0, 6);

  async function handleCopyText(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      setCopiedId(null);
    }
  }

  function handlePlayCue(cue: BrandSoundCue) {
    const played = playBrandSound(cue, soundMuted);
    setLastPlayedCue(played ? cue : "muted");
    setTimeout(() => setLastPlayedCue(null), 1400);
  }

  return (
    <div className={`bk-shell ${theme === "light" ? "is-light" : "is-dark"}`}>
      {/* STRICT 3-ZONE TOP BAR CONTRACT */}
      <header className="bk-topbar">
        <div className="bk-topbar-inner">
          {/* Zone 1: Single-line Brand Wordmark */}
          <a href="#top" className="bk-brand-mark" aria-label="LUXOR9 Brand Identity Home">
            <LuxorKeystoneGlyph
              fg={theme === "dark" ? "#F3EFE6" : "#0B0D10"}
              accent={theme === "dark" ? "#2EC4B6" : "#0F766E"}
              size={22}
              thickened
            />
            <span>
              LUXOR<span className="bk-brand-nine">9</span>
            </span>
          </a>

          {/* Zone 2: 5 Concise Single-Line Chapter Links */}
          <nav className="bk-nav" aria-label="Brand kit chapters">
            <a href="#strategy">Strategy</a>
            <a href="#visual">Visual</a>
            <a href="#motion-sound">Motion &amp; Sound</a>
            <a href="#product-os">Product OS</a>
            <a href="#applications">Applications</a>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <button
            type="button"
            className="bk-btn-primary bk-top-cta"
            onClick={() => setDownloadModalOpen(true)}
          >
            Download Kit
          </button>
        </div>
      </header>

      <main id="top" className="bk-main">
        {/* INSTITUTIONAL MONOGRAPH HERO */}
        <section className="bk-hero">
          <div className="bk-hero-copy">
            <p className="bk-kicker">
              Global Brand Identity &amp; Design System · Luxoranova Fintech Private Limited
            </p>
            <h1 className="bk-h1">
              Controlled intelligence. Accountable execution.
            </h1>
            <p className="bk-hero-lead">
              The complete institutional brand architecture, microscopic logo engineering, colour
              mathematics, typography, motion choreography, acoustic identity, and Control Tower
              product design system for <strong>LUXOR9 — Intelligence Infrastructure</strong>.
            </p>

            {/* Operating Loop Ribbon */}
            <div className="bk-loop-bar" aria-label="LUXOR9 Operating Philosophy">
              {["KNOW", "THINK", "ACT", "PROVE", "LEARN"].map((step, idx) => (
                <span key={step} className="bk-loop-step">
                  <span>{step}</span>
                  {idx < 4 && <span className="bk-loop-arrow" aria-hidden="true">→</span>}
                </span>
              ))}
            </div>

            {/* Workspace Toolbar (Mode Switch + App Links placed below top bar per contract) */}
            <div className="bk-hero-toolbar">
              <div className="bk-segmented" role="group" aria-label="Surface theme preview">
                <button
                  type="button"
                  className={`bk-seg-btn ${theme === "dark" ? "is-active" : ""}`}
                  onClick={() => setTheme("dark")}
                >
                  Obsidian Dark
                </button>
                <button
                  type="button"
                  className={`bk-seg-btn ${theme === "light" ? "is-active" : ""}`}
                  onClick={() => setTheme("light")}
                >
                  Mineral Ivory Light
                </button>
              </div>

              <div className="bk-utility-links">
                <Link href="/simple" className="bk-link-inline">
                  Dubai Simple App ↗
                </Link>
                <span aria-hidden="true" className="bk-sep">·</span>
                <Link href="/tower" className="bk-link-inline">
                  Control Tower ↗
                </Link>
                <span aria-hidden="true" className="bk-sep">·</span>
                <Link href="/voice" className="bk-link-inline">
                  Voice Bridge ↗
                </Link>
              </div>
            </div>
          </div>

          <figure className="bk-hero-media">
            <div className="bk-media-frame">
              <img
                src="/brand/luxor_arch_dubai.jpg"
                alt="Monolithic obsidian glass and warm mineral ivory limestone architecture in Dubai representing LUXOR9 institutional permanence"
                referrerPolicy="no-referrer"
              />
            </div>
            <figcaption className="bk-caption">
              Fig. 01 · Material Anchor: Obsidian Glass, Mineral Ivory Limestone &amp; Precision Daylight
            </figcaption>
          </figure>
        </section>

        {/* CHAPTER 01 — BRAND STRATEGY & ARCHITECTURE */}
        <section id="strategy" className="bk-section">
          <header className="bk-section-head">
            <p className="bk-kicker">01 · Brand Strategy &amp; Architecture</p>
            <h2 className="bk-h2">Strategic Foundation, Archetypes &amp; Portfolio Hierarchy</h2>
            <p className="bk-lead">
              Built to turn business intent into controlled action, and every action into verifiable
              evidence—structured across 17 distinct strategic dimensions with zero overlap.
            </p>
          </header>

          {/* 17 Distinct Brand Essence Pillars */}
          <div className="bk-subsection">
            <div className="bk-subhead-row">
              <h3 className="bk-h3">Brand Essence Architecture (17 Distinct Dimensions)</h3>
              <button
                type="button"
                className="bk-btn-secondary bk-btn-sm"
                onClick={() => setEssenceExpanded((prev) => !prev)}
              >
                {essenceExpanded ? "Show Core 6" : "Show All 17 Dimensions"}
              </button>
            </div>
            <div className="bk-essence-grid">
              {visibleEssence.map((item, idx) => (
                <article key={item.key} className="bk-essence-card">
                  <div className="bk-essence-top">
                    <span className="bk-mono-index">{String(idx + 1).padStart(2, "0")}</span>
                    <h4 className="bk-h4">{item.title}</h4>
                  </div>
                  <p className="bk-essence-statement">{item.statement}</p>
                  <p className="bk-essence-distinction">{item.distinction}</p>
                </article>
              ))}
            </div>
          </div>

          {/* Personality Calibration & Archetype System */}
          <div className="bk-two-col bk-subsection">
            <div className="bk-surface-panel">
              <h3 className="bk-h3" style={{ marginTop: 0 }}>Personality Calibration</h3>
              <p className="bk-body-sm">
                Twelve behavioural attributes governed by four hard equilibrium boundaries.
              </p>
              <div className="bk-cal-list">
                {PERSONALITY_CALIBRATION.map((row) => (
                  <div key={row.trait} className="bk-cal-row">
                    <div className="bk-cal-head">
                      <strong>{row.trait}</strong>
                      <span className="bk-meta-text">{row.guard}</span>
                    </div>
                    <div className="bk-cal-track" aria-hidden="true">
                      <div className="bk-cal-fill" style={{ width: `${row.balance}%` }} />
                    </div>
                    <p className="bk-cal-note">{row.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bk-surface-panel">
              <h3 className="bk-h3" style={{ marginTop: 0 }}>Brand Archetype Matrix</h3>
              <p className="bk-body-sm">
                Deliberate Ruler–Sage–Creator balance; Magician explicitly restricted from trust surfaces.
              </p>
              <div className="bk-archetype-list">
                {ARCHETYPE_MIX.map((arc) => (
                  <div key={arc.name} className="bk-archetype-item">
                    <div className="bk-cal-head">
                      <strong>{arc.name}</strong>
                      <span className="bk-mono-tag">{arc.share}</span>
                    </div>
                    <p className="bk-body-sm" style={{ margin: "4px 0 2px" }}>{arc.role}</p>
                    <p className="bk-cal-note">Guardrail: {arc.limit}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Strategic Positioning Evaluation Matrix */}
          <div className="bk-subsection">
            <h3 className="bk-h3">Positioning Language Governance</h3>
            <div className="bk-table-wrap">
              <table className="bk-table">
                <thead>
                  <tr>
                    <th>Candidate Phrase</th>
                    <th>Assigned Role</th>
                    <th>Governance Rule</th>
                  </tr>
                </thead>
                <tbody>
                  {POSITIONING_EVALUATION.map((row) => (
                    <tr key={row.phrase}>
                      <td><strong>{row.phrase}</strong></td>
                      <td><span className="bk-mono-tag">{row.verdict}</span></td>
                      <td>{row.usageRule}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 8-Entity Product & Brand Architecture */}
          <div className="bk-subsection">
            <div className="bk-subhead-row">
              <h3 className="bk-h3">Product &amp; Portfolio Hierarchy (White-Label Ready)</h3>
              <span className="bk-meta-text">Disciplined master-brand endorsement · HERMES OS remains internal</span>
            </div>
            <div className="bk-table-wrap">
              <table className="bk-table">
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Entity</th>
                    <th>Tier</th>
                    <th>Visibility</th>
                    <th>Naming &amp; Lockup Rule</th>
                  </tr>
                </thead>
                <tbody>
                  {BRAND_ARCHITECTURE.map((ent) => (
                    <tr key={ent.name}>
                      <td className="bk-mono-cell">{ent.rank}</td>
                      <td>
                        <strong>{ent.name}</strong>
                        <div className="bk-table-sub">{ent.role}</div>
                      </td>
                      <td>{ent.tier}</td>
                      <td className="bk-mono-cell">{ent.publicFacing ? "Public" : "Internal Only"}</td>
                      <td>{ent.lockupRule}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* CHAPTER 02 — LOGO ARCHITECTURE & MICROSCOPIC ENGINEERING */}
        <section id="visual" className="bk-section">
          <header className="bk-section-head">
            <p className="bk-kicker">02 · Visual Identity · Logo Architecture</p>
            <h2 className="bk-h2">The Governed Keystone &amp; 20-Variant Identity Family</h2>
            <p className="bk-lead">
              An ownable 9X architectural mark fusing an L-foundation and precision 9-chamber
              aperture bisected by the Luxor Signal Meridian—representing intent entering a governed
              boundary and exiting as verified evidence.
            </p>
          </header>

          {/* Interactive X-Unit Construction Blueprint */}
          <div className="bk-subsection">
            <div className="bk-subhead-row">
              <h3 className="bk-h3">Microscopic X-Unit Construction Blueprint</h3>
              <div className="bk-toggle-row">
                <button
                  type="button"
                  className={`bk-seg-btn ${showGrid ? "is-active" : ""}`}
                  onClick={() => setShowGrid((v) => !v)}
                >
                  9X Matrix
                </button>
                <button
                  type="button"
                  className={`bk-seg-btn ${showClearSpace ? "is-active" : ""}`}
                  onClick={() => setShowClearSpace((v) => !v)}
                >
                  2X Clear Space
                </button>
                <button
                  type="button"
                  className={`bk-seg-btn ${showKerning ? "is-active" : ""}`}
                  onClick={() => setShowKerning((v) => !v)}
                >
                  Baseline &amp; Kerning
                </button>
              </div>
            </div>

            <div className="bk-blueprint-frame">
              <LogoConstructionBlueprint
                showGrid={showGrid}
                showClearSpace={showClearSpace}
                showKerning={showKerning}
              />
            </div>

            <div className="bk-spec-strip">
              <div>
                <span className="bk-spec-label">Base Unit (1X)</span>
                <strong>Primary stroke thickness (1/9 symbol height)</strong>
              </div>
              <div>
                <span className="bk-spec-label">Symbol : Wordmark Gap</span>
                <strong>3.5X horizontal isolation · Optical track +180</strong>
              </div>
              <div>
                <span className="bk-spec-label">Minimum Clear Space</span>
                <strong>2X all four sides · Zero intrusion</strong>
              </div>
              <div>
                <span className="bk-spec-label">Minimum Scale</span>
                <strong>Digital: 24px symbol / 120px full · Print: 8mm / 28mm</strong>
              </div>
            </div>
          </div>

          {/* All 20 Logo Variants */}
          <div className="bk-subsection">
            <div className="bk-subhead-row">
              <h3 className="bk-h3">Complete 20-Variant Logo Family</h3>
              <div className="bk-segmented" role="group" aria-label="Filter logo variants">
                {(["All", "Core", "Lockups", "Digital & Small Scale", "Production & Finish"] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={`bk-seg-btn ${logoCategory === cat ? "is-active" : ""}`}
                    onClick={() => setLogoCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="bk-logo-grid">
              {filteredLogos.map((spec) => (
                <article key={spec.id} className="bk-logo-card">
                  <div className={`bk-logo-stage is-${spec.surface}`}>
                    <LogoVariantPreview spec={spec} />
                  </div>
                  <div className="bk-logo-meta">
                    <div className="bk-cal-head">
                      <strong>
                        <span className="bk-mono-index">{spec.index}</span> {spec.name}
                      </strong>
                      <span className="bk-meta-text">{spec.category}</span>
                    </div>
                    <p className="bk-body-sm" style={{ margin: "4px 0 6px" }}>{spec.usage}</p>
                    <div className="bk-logo-specs">
                      <span>Digital ≥ {spec.minDigitalPx}</span>
                      <span aria-hidden="true">·</span>
                      <span>Print ≥ {spec.minPrintMm}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Incorrect Usage / Misuse Restrictions */}
          <div className="bk-subsection">
            <h3 className="bk-h3">Logo Integrity &amp; Incorrect Usage Restrictions</h3>
            <div className="bk-misuse-grid">
              {LOGO_MISUSE_RULES.map((rule) => (
                <div key={rule.id} className="bk-misuse-card">
                  <span className="bk-misuse-mark">✕ PROHIBITED</span>
                  <strong>{rule.title}</strong>
                  <p className="bk-body-sm" style={{ margin: "4px 0 0" }}>{rule.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CHAPTER 03 — COLOUR, TYPOGRAPHY, GRID, ICONOGRAPHY & IMAGERY */}
        <section className="bk-section">
          <header className="bk-section-head">
            <p className="bk-kicker">03 · Visual System · Colour, Type, Grid &amp; Photography</p>
            <h2 className="bk-h2">Obsidian, Mineral Ivory &amp; Signal Cyan Architecture</h2>
            <p className="bk-lead">
              Production-verified HEX, RGB, HSL, CMYK, and Pantone print references with live WCAG
              2.1 contrast calculation, a 2+1 institutional type hierarchy, and architectural photography.
            </p>
          </header>

          {/* Colour Palette + Live WCAG Tester */}
          <div className="bk-subsection">
            <div className="bk-subhead-row">
              <h3 className="bk-h3">Production Colour Architecture</h3>
              <div className="bk-segmented" role="group" aria-label="Filter colour groups">
                {(
                  [
                    ["all", "All Tokens"],
                    ["primary", "Primary"],
                    ["secondary", "Secondary"],
                    ["interface-dark", "Dark UI"],
                    ["interface-light", "Light UI"],
                    ["status", "Status"],
                    ["data-viz", "Data Viz"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className={`bk-seg-btn ${colorFilter === key ? "is-active" : ""}`}
                    onClick={() => setColorFilter(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bk-color-grid">
              {filteredColors.map((c) => {
                const ratio = wcagContrastRatio(c.hex, c.contrastTargetHex);
                const grade = wcagGrade(ratio);
                return (
                  <article key={c.id} className="bk-color-card">
                    <div
                      className="bk-color-swatch"
                      style={{ background: c.hex, color: wcagContrastRatio(c.hex, "#F3EFE6") > 4.5 ? "#F3EFE6" : "#0B0D10" }}
                    >
                      <span className="bk-swatch-hex">{c.hex}</span>
                      <button
                        type="button"
                        className="bk-swatch-copy"
                        onClick={() => void handleCopyText(c.id, c.hex)}
                      >
                        {copiedId === c.id ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <div className="bk-color-body">
                      <div className="bk-cal-head">
                        <strong>{c.name}</strong>
                        <span className="bk-mono-tag">
                          {ratio}:1 · {grade}
                        </span>
                      </div>
                      <p className="bk-mono-line">{c.token}</p>
                      <dl className="bk-color-specs">
                        <div><dt>RGB</dt><dd>{formatRgb(c.hex)}</dd></div>
                        <div><dt>HSL</dt><dd>{hexToHsl(c.hex)}</dd></div>
                        <div><dt>CMYK</dt><dd>{hexToCmyk(c.hex)}</dd></div>
                        <div><dt>Print</dt><dd>{c.printRef}</dd></div>
                      </dl>
                      <p className="bk-body-sm" style={{ margin: "6px 0 0" }}>{c.purpose}</p>
                      <p className="bk-cal-note">Ratio: {c.ratio}</p>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Live WCAG Contrast Lab */}
            <div className="bk-wcag-lab">
              <div className="bk-wcag-controls">
                <h4 className="bk-h4" style={{ margin: "0 0 8px" }}>Interactive WCAG 2.1 Contrast Verifier</h4>
                <div className="bk-wcag-selects">
                  <label className="bk-input-label">
                    Foreground Token
                    <select
                      className="bk-select"
                      value={wcagFg}
                      onChange={(e) => setWcagFg(e.target.value)}
                    >
                      {BRAND_COLORS.map((c) => (
                        <option key={`fg-${c.id}`} value={c.hex}>
                          {c.name} ({c.hex})
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="bk-input-label">
                    Background Surface
                    <select
                      className="bk-select"
                      value={wcagBg}
                      onChange={(e) => setWcagBg(e.target.value)}
                    >
                      {BRAND_COLORS.map((c) => (
                        <option key={`bg-${c.id}`} value={c.hex}>
                          {c.name} ({c.hex})
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
              <div
                className="bk-wcag-preview"
                style={{ background: wcagBg, color: wcagFg }}
              >
                <span className="bk-wcag-ratio">
                  {liveRatio}:1 — WCAG {liveGrade}
                </span>
                <p style={{ margin: "6px 0 0", fontSize: "1rem", fontWeight: 500 }}>
                  LUXOR9 · Controlled intelligence. Accountable execution.
                </p>
              </div>
            </div>
          </div>

          {/* 2+1 Typography System & Interactive Scale Tester */}
          <div className="bk-subsection">
            <div className="bk-subhead-row">
              <h3 className="bk-h3">2+1 Institutional Typography System</h3>
              <label className="bk-check-label">
                <input
                  type="checkbox"
                  checked={useTabular}
                  onChange={(e) => setUseTabular(e.target.checked)}
                />
                <span>Tabular Numerals (`tabular-nums`)</span>
              </label>
            </div>

            <div className="bk-type-families">
              <div className="bk-surface-panel">
                <span className="bk-mono-tag">DISPLAY &amp; MONOGRAPH · SERIF</span>
                <p className="bk-type-hero-serif">Cormorant Garamond</p>
                <p className="bk-body-sm">
                  Used for institutional titles, manifestos, boardroom decks, and architectural
                  monograph headings. Open Font License (OFL).
                </p>
              </div>
              <div className="bk-surface-panel">
                <span className="bk-mono-tag">PRIMARY CORPORATE &amp; UI · SANS</span>
                <p className="bk-type-hero-sans">Plus Jakarta Sans</p>
                <p className="bk-body-sm">
                  Primary workhorse for UI, product workflows, corporate documents, and mobile
                  legibility. Crisp geometry with humanist clarity.
                </p>
              </div>
              <div className="bk-surface-panel">
                <span className="bk-mono-tag">EVIDENCE &amp; TELEMETRY · MONO</span>
                <p className="bk-type-hero-mono">JetBrains Mono</p>
                <p className="bk-body-sm">
                  Strictly reserved for proof IDs, AED figures, timestamps, policy versions, and
                  tabular audit ledgers.
                </p>
              </div>
            </div>

            <div className="bk-type-tester">
              <label htmlFor="bk-type-input" className="bk-input-label">
                Live Type Specimen Tester
              </label>
              <input
                id="bk-type-input"
                type="text"
                className="bk-input"
                value={specimenText}
                onChange={(e) => setSpecimenText(e.target.value)}
              />
              <div className="bk-type-scale-list">
                {TYPOGRAPHY_SCALE.map((row) => (
                  <div key={row.level} className="bk-type-row">
                    <div className="bk-type-meta">
                      <strong>{row.level}</strong>
                      <span className="bk-mono-line">
                        {row.face} · {row.size} · w{row.weight} · lh {row.lh}
                      </span>
                    </div>
                    <div
                      className="bk-type-sample"
                      style={{
                        fontFamily:
                          row.face === "Cormorant Garamond"
                            ? "var(--font-cormorant), Georgia, serif"
                            : row.face === "JetBrains Mono"
                              ? "var(--font-jetbrains), monospace"
                              : "var(--font-jakarta), sans-serif",
                        fontWeight: Number(row.weight),
                        letterSpacing: row.track,
                        fontVariantNumeric: useTabular ? "tabular-nums" : "normal",
                      }}
                    >
                      {row.level === "Data & Audit Mono" ? row.sample : specimenText}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Layout Grid, Spacing, Surfaces & Unified Iconography */}
          <div className="bk-two-col bk-subsection">
            <div className="bk-surface-panel">
              <h3 className="bk-h3" style={{ marginTop: 0 }}>Grid, Spacing &amp; Surface Grammar</h3>
              <dl className="bk-spec-dl">
                <div><dt>Desktop Grid</dt><dd>12 columns · 1440px viewport · 1200px max · 24px gutter · 48px margin</dd></div>
                <div><dt>Tablet / Mobile</dt><dd>8 columns (768–1024px) · 4 columns (&lt;768px, 16px gutter, 16px margin)</dd></div>
                <div><dt>Spacing Tokens</dt><dd>4px base unit: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96px</dd></div>
                <div><dt>Radius Scale</dt><dd>Sharp architectural restraint: 0px (rules) · 2px (tags) · 4px (controls) · 8px (cards)</dd></div>
                <div><dt>Elevation Rule</dt><dd>Single-level surface hierarchy via 1px hairline borders; avoid shadow stacking</dd></div>
              </dl>
            </div>

            <div className="bk-surface-panel">
              <h3 className="bk-h3" style={{ marginTop: 0 }}>Unified Iconography (24×24 · 1.5px Stroke)</h3>
              <div className="bk-icon-grid">
                {ENTERPRISE_ICONS.map((ic) => (
                  <div key={ic.id} className="bk-icon-cell">
                    <svg
                      width="22"
                      height="22"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="square"
                      strokeLinejoin="miter"
                      aria-hidden="true"
                    >
                      {ic.paths}
                    </svg>
                    <span>{ic.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Imagery & Editorial Photography Direction */}
          <div className="bk-subsection">
            <h3 className="bk-h3">Photography, Material &amp; Imagery Direction</h3>
            <div className="bk-photo-grid">
              {EDITORIAL_PHOTO_SPECS.map((ph) => (
                <figure key={ph.src} className="bk-photo-card">
                  <div className="bk-photo-frame">
                    <img src={ph.src} alt={ph.title} referrerPolicy="no-referrer" />
                  </div>
                  <figcaption className="bk-photo-body">
                    <strong>{ph.title}</strong>
                    <span className="bk-mono-line">{ph.ratio}</span>
                    <p className="bk-body-sm" style={{ margin: "6px 0 4px" }}>{ph.lighting}</p>
                    <p className="bk-cal-note">{ph.rule}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* CHAPTER 04 — MOTION, SOUND, VOICE & VERBAL IDENTITY */}
        <section id="motion-sound" className="bk-section">
          <header className="bk-section-head">
            <p className="bk-kicker">04 · Motion, Acoustic Identity &amp; Verbal System</p>
            <h2 className="bk-h2">Precision Choreography, Playable Sound &amp; Brand Voice</h2>
            <p className="bk-lead">
              Every transition, acoustic cue, spoken agent voice, and corporate sentence expresses
              calibrated authority—never theatrical noise or generic chatbot chatter.
            </p>
          </header>

          {/* Interactive Agent Choreography Simulator */}
          <div className="bk-subsection">
            <div className="bk-subhead-row">
              <h3 className="bk-h3">Agent-State Motion Choreography (8 Required Scenarios)</h3>
              <label className="bk-check-label">
                <input
                  type="checkbox"
                  checked={reducedMotionPreview}
                  onChange={(e) => setReducedMotionPreview(e.target.checked)}
                />
                <span>Simulate `prefers-reduced-motion`</span>
              </label>
            </div>

            <div className="bk-motion-layout">
              <div className="bk-motion-list" role="tablist" aria-label="Motion scenarios">
                {MOTION_SCENARIOS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    role="tab"
                    aria-selected={activeMotionId === m.id}
                    className={`bk-motion-btn ${activeMotionId === m.id ? "is-active" : ""}`}
                    onClick={() => setActiveMotionId(m.id)}
                  >
                    <strong>{m.title}</strong>
                    <span className="bk-mono-tag">{m.durationMs}ms</span>
                  </button>
                ))}
              </div>

              <div className="bk-surface-panel bk-motion-stage">
                <div className="bk-panel-top">
                  <span className="bk-mono-tag">
                    {activeMotion.durationMs}ms · {activeMotion.easing}
                  </span>
                  <span className="bk-mono-tag">{activeMotion.stateLabel}</span>
                </div>

                <div
                  key={`${activeMotion.id}-${reducedMotionPreview ? "rm" : "full"}`}
                  className={`bk-motion-demo is-${activeMotion.id} ${reducedMotionPreview ? "is-reduced" : ""}`}
                >
                  <LuxorKeystoneGlyph
                    fg={theme === "dark" ? "#F3EFE6" : "#0B0D10"}
                    accent={
                      activeMotion.id === "execution-failure"
                        ? "#DC5252"
                        : activeMotion.id === "pending-approval"
                          ? "#D49B38"
                          : "#2EC4B6"
                    }
                    size={28}
                  />
                  <div>
                    <strong>{activeMotion.title}</strong>
                    <p className="bk-body-sm" style={{ margin: "2px 0 0" }}>
                      {reducedMotionPreview
                        ? activeMotion.reducedMotionFallback
                        : activeMotion.visualPattern}
                    </p>
                  </div>
                </div>

                <p className="bk-body-sm" style={{ marginBottom: 0 }}>{activeMotion.detail}</p>
              </div>
            </div>
          </div>

          {/* Real Playable Web Audio Sonic Identity */}
          <div className="bk-subsection">
            <div className="bk-subhead-row">
              <h3 className="bk-h3">Playable Acoustic &amp; Sonic Identity (Web Audio Synthesizer)</h3>
              <button
                type="button"
                className={`bk-seg-btn ${soundMuted ? "is-active" : ""}`}
                onClick={() => setSoundMuted((m) => !m)}
              >
                {soundMuted ? "Muted Mode: ON" : "Muted Mode: OFF"}
              </button>
            </div>
            <div className="bk-sound-grid">
              {BRAND_SOUND_SPECS.map((s) => (
                <article key={s.id} className="bk-sound-card">
                  <div className="bk-cal-head">
                    <strong>{s.name}</strong>
                    <button
                      type="button"
                      className="bk-btn-secondary bk-btn-xs"
                      onClick={() => handlePlayCue(s.id)}
                    >
                      {lastPlayedCue === s.id ? "Playing" : "Play Tone"}
                    </button>
                  </div>
                  <p className="bk-mono-line">{s.durationMs}ms · {s.pitchHz}</p>
                  <p className="bk-body-sm" style={{ margin: "4px 0 2px" }}>{s.character}</p>
                  <p className="bk-cal-note">Trigger: {s.trigger}</p>
                </article>
              ))}
            </div>
          </div>

          {/* 6 Specialist Voice Agent Profiles */}
          <div className="bk-subsection">
            <h3 className="bk-h3">Multi-Agent Voice Personality Architecture (6 Profiles)</h3>
            <div className="bk-voice-grid">
              {VOICE_AGENT_PROFILES.map((vp) => (
                <article key={vp.id} className="bk-voice-card">
                  <div className="bk-cal-head">
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <span className="bk-agent-code" style={{ borderColor: vp.accentHex, color: vp.accentHex }}>
                        {vp.code}
                      </span>
                      <strong>{vp.role}</strong>
                    </div>
                    <span className="bk-mono-tag">{vp.paceWpm}</span>
                  </div>
                  <p className="bk-body-sm" style={{ margin: "6px 0" }}>{vp.temperament}</p>
                  <dl className="bk-voice-dl">
                    <div><dt>Pauses</dt><dd>{vp.pauseCadence}</dd></div>
                    <div><dt>Barge-In</dt><dd>{vp.interruptionRule}</dd></div>
                    <div><dt>Uncertainty</dt><dd>“{vp.uncertaintyPhrase}”</dd></div>
                    <div><dt>Escalation</dt><dd>{vp.escalationProtocol}</dd></div>
                  </dl>
                </article>
              ))}
            </div>
          </div>

          {/* Verbal Identity & Ready-to-Copy Corporate Specimens */}
          <div className="bk-subsection">
            <h3 className="bk-h3">Verbal Identity, Vocabulary Rules &amp; Copy Specimens</h3>
            <div className="bk-table-wrap" style={{ marginBottom: "1.5rem" }}>
              <table className="bk-table">
                <thead>
                  <tr>
                    <th>Preferred LUXOR9 Terminology</th>
                    <th>Restricted / Avoid</th>
                    <th>Strategic Rationale</th>
                  </tr>
                </thead>
                <tbody>
                  {VOCABULARY_GUIDE.map((v) => (
                    <tr key={v.preferred}>
                      <td><strong>{v.preferred}</strong></td>
                      <td className="bk-restricted">{v.restricted}</td>
                      <td>{v.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bk-copy-grid">
              {COPY_SPECIMENS.map((item) => (
                <article key={item.id} className="bk-surface-panel">
                  <div className="bk-panel-top">
                    <span className="bk-panel-label">{item.label}</span>
                    <button
                      type="button"
                      className="bk-link-inline"
                      onClick={() => void handleCopyText(item.id, item.copy)}
                    >
                      {copiedId === item.id ? "Copied" : "Copy"}
                    </button>
                  </div>
                  <p className="bk-body-sm" style={{ margin: 0 }}>{item.copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* CHAPTERS 05 & 06 — PRODUCT OS & CORPORATE APPLICATIONS */}
        <BrandApplicationsShowcase theme={theme} soundMuted={soundMuted} />
      </main>

      {/* QUIET INSTITUTIONAL FOOTER */}
      <footer className="bk-footer">
        <div className="bk-footer-inner">
          <div>
            <strong>LUXOR9</strong> · Intelligence Infrastructure
            <span className="bk-sep">·</span>
            <span>Luxoranova Fintech Private Limited</span>
          </div>
          <div className="bk-footer-links">
            <Link href="/simple">Simple Developer App</Link>
            <Link href="/tower">Control Tower</Link>
            <Link href="/voice">Voice Bridge</Link>
            <button type="button" className="bk-link-inline" onClick={() => setDownloadModalOpen(true)}>
              Export Brand Assets
            </button>
          </div>
        </div>
      </footer>

      {/* DOWNLOAD BRAND KIT MODAL */}
      {downloadModalOpen && (
        <div
          className="bk-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="bk-export-title"
          onClick={() => setDownloadModalOpen(false)}
        >
          <div className="bk-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bk-modal-head">
              <div>
                <h3 id="bk-export-title" className="bk-h3" style={{ margin: 0 }}>
                  Export LUXOR9 Brand Kit Assets
                </h3>
                <p className="bk-body-sm" style={{ margin: "4px 0 0" }}>
                  Production SVG vectors and design tokens ready for engineering and print.
                </p>
              </div>
              <button
                type="button"
                className="bk-btn-secondary bk-btn-sm"
                onClick={() => setDownloadModalOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="bk-export-list">
              <div className="bk-export-row">
                <div>
                  <strong>Design Tokens (CSS Variables)</strong>
                  <span className="bk-mono-line">luxor9-tokens.css · Light/Dark/Type/Motion</span>
                </div>
                <div className="bk-export-btns">
                  <button
                    type="button"
                    className="bk-btn-secondary bk-btn-xs"
                    onClick={() => void handleCopyText("css-tok", generateCssTokens())}
                  >
                    {copiedId === "css-tok" ? "Copied" : "Copy"}
                  </button>
                  <button
                    type="button"
                    className="bk-btn-primary bk-btn-xs"
                    onClick={() => downloadFile("luxor9-tokens.css", generateCssTokens(), "text/css")}
                  >
                    Download
                  </button>
                </div>
              </div>

              <div className="bk-export-row">
                <div>
                  <strong>Design Tokens (JSON Specification)</strong>
                  <span className="bk-mono-line">luxor9-tokens.json · HEX/RGB/HSL/CMYK/WCAG</span>
                </div>
                <div className="bk-export-btns">
                  <button
                    type="button"
                    className="bk-btn-secondary bk-btn-xs"
                    onClick={() => void handleCopyText("json-tok", generateJsonTokens())}
                  >
                    {copiedId === "json-tok" ? "Copied" : "Copy"}
                  </button>
                  <button
                    type="button"
                    className="bk-btn-primary bk-btn-xs"
                    onClick={() =>
                      downloadFile("luxor9-tokens.json", generateJsonTokens(), "application/json")
                    }
                  >
                    Download
                  </button>
                </div>
              </div>

              <div className="bk-export-row">
                <div>
                  <strong>Primary Logo SVG (Obsidian Dark)</strong>
                  <span className="bk-mono-line">luxor9-primary-dark.svg · Vector Master</span>
                </div>
                <button
                  type="button"
                  className="bk-btn-primary bk-btn-xs"
                  onClick={() =>
                    downloadFile(
                      "luxor9-primary-dark.svg",
                      buildLuxorLogoSvg("primary-dark"),
                      "image/svg+xml",
                    )
                  }
                >
                  Download SVG
                </button>
              </div>

              <div className="bk-export-row">
                <div>
                  <strong>Secondary Logo SVG (Mineral Ivory Light)</strong>
                  <span className="bk-mono-line">luxor9-secondary-light.svg · Print &amp; Web</span>
                </div>
                <button
                  type="button"
                  className="bk-btn-primary bk-btn-xs"
                  onClick={() =>
                    downloadFile(
                      "luxor9-secondary-light.svg",
                      buildLuxorLogoSvg("secondary-light"),
                      "image/svg+xml",
                    )
                  }
                >
                  Download SVG
                </button>
              </div>

              <div className="bk-export-row">
                <div>
                  <strong>Standalone Keystone Symbol SVG</strong>
                  <span className="bk-mono-line">luxor9-keystone-symbol.svg · 9X Matrix</span>
                </div>
                <button
                  type="button"
                  className="bk-btn-primary bk-btn-xs"
                  onClick={() =>
                    downloadFile(
                      "luxor9-keystone-symbol.svg",
                      buildLuxorLogoSvg("symbol-only"),
                      "image/svg+xml",
                    )
                  }
                >
                  Download SVG
                </button>
              </div>

              <div className="bk-export-row">
                <div>
                  <strong>One-Colour Production SVG (Spot Black)</strong>
                  <span className="bk-mono-line">luxor9-mono-production.svg · Laser / Foil</span>
                </div>
                <button
                  type="button"
                  className="bk-btn-primary bk-btn-xs"
                  onClick={() =>
                    downloadFile(
                      "luxor9-mono-production.svg",
                      buildLuxorLogoSvg("mono-black"),
                      "image/svg+xml",
                    )
                  }
                >
                  Download SVG
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
