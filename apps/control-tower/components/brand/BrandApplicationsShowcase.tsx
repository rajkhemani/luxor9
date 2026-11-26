"use client";

import { useState } from "react";
import { EXECUTION_STATES, VOICE_AGENT_PROFILES } from "@/lib/brand-kit";
import { playBrandSound } from "@/lib/brand-audio";
import { LuxorKeystoneGlyph } from "./LuxorMarkSvg";

const CONTROL_TOWER_MODULES = [
  { id: "01", name: "Executive Overview", role: "Live posture of active intents, pending approvals, and verified outcomes." },
  { id: "02", name: "Intelligence Console", role: "Conversational intent intake bound to tenant context and source checks." },
  { id: "03", name: "Agent Workforce", role: "Registry of active specialist roles, scope boundaries, and policy bindings." },
  { id: "04", name: "Workflow Orchestration", role: "Durable step state transitions from brief to verified completion." },
  { id: "05", name: "Approval Centre", role: "Sovereign human authorization queue bound to principal, scope, and expiry." },
  { id: "06", name: "Evidence Centre", role: "First-class provenance records linking claims, sources, and final assets." },
  { id: "07", name: "Audit Ledger", role: "Immutable chronological trail of intents, signatures, and adapter calls." },
  { id: "08", name: "Knowledge & Sources", role: "Developer-supplied PDFs, price schedules, RERA filings, and approved facts." },
  { id: "09", name: "Voice Console", role: "Full-duplex executive voice channel with configurable VAD barge-in." },
  { id: "10", name: "Multi-Agent Conference", role: "Moderated multi-specialist session with active speaker queue and handoffs." },
  { id: "11", name: "Risk & Governance", role: "Tenant isolation rules, policy versions, and external execution boundaries." },
  { id: "12", name: "Performance & Monitoring", role: "Cycle times, approval turnaround, and verifiable output completion rates." },
  { id: "13", name: "Settings & Administration", role: "Tenant principals, RBAC roles, white-label branding, and API controls." },
] as const;

const PITCH_SLIDES = [
  {
    index: "01 / 06",
    kicker: "CORPORATE TITLE SLIDE",
    headline: "LUXOR9",
    subhead: "Controlled intelligence. Accountable execution.",
    body: "Intelligence Infrastructure by Luxoranova Fintech Private Limited · Enterprise AI Operating System · Dubai Developer Edition.",
    dark: true,
  },
  {
    index: "02 / 06",
    kicker: "THE OPERATIONAL FRACTURE",
    headline: "The business is working. The system isn't.",
    subhead: "Strategy, approvals, creative output, and buyer follow-ups live in disconnected silos.",
    body: "When a launch slips or an unverified unit price enters market collateral, enterprises pay in delayed absorption and reputational risk.",
    dark: false,
  },
  {
    index: "03 / 06",
    kicker: "OPERATING ARCHITECTURE",
    headline: "KNOW → THINK → ACT → PROVE → LEARN",
    subhead: "One governed loop from executive intent to verified business outcome.",
    body: "Intent → Work → Evidence → Review → Decision → Outcome → Learning. Every step persists inside an independent Trust Boundary.",
    dark: true,
  },
  {
    index: "04 / 06",
    kicker: "THE CONTROL TOWER",
    headline: "No silent autonomy. Every action leaves proof.",
    subhead: "Human sovereignty built directly into software execution.",
    body: "No agent can approve its own action. Approvals bind to tenant, named principal, exact resource, policy version, and expiry.",
    dark: false,
  },
  {
    index: "05 / 06",
    kicker: "FIRST COMMERCIAL VERTICAL",
    headline: "Dubai Real Estate Developer Edition",
    subhead: "Evidence-backed market-to-launch execution in days, not weeks.",
    body: "Source-checked brochures, launch campaign packs, and instant site-visit follow-up — zero invented prices, handover dates, or offers.",
    dark: true,
  },
  {
    index: "06 / 06",
    kicker: "NEXT STEP · PILOT ENGAGEMENT",
    headline: "Begin with one high-value launch workflow.",
    subhead: "Scoped pilot · Verified sources · Measurable operational proof.",
    body: "Luxoranova Fintech Private Limited · Enterprise Inquiries · Controlled deployment within tenant-isolated infrastructure.",
    dark: false,
  },
] as const;

const WEBSITE_PAGES = [
  { page: "Homepage", role: "Establish institutional authority ('Controlled intelligence. Accountable execution.') and demonstrate the 5-stage operating loop." },
  { page: "Platform", role: "Present LUXOR9 Control Tower, AI Generalist workforce, and Multi-Voice Agent Control Tower without exposing internal runtime jargon." },
  { page: "How It Works", role: "Visual walkthrough of Intent → Blueprint → Source Verification → Human Approval → Verified Evidence Receipt." },
  { page: "Solutions · Real Estate", role: "Vertical showcase for Dubai real estate developers: launch readiness, source-verified collateral, and buyer follow-up." },
  { page: "Trust & Governance", role: "Explain independent authorization boundaries, tenant isolation, audit ledgers, and zero-hallucination policy." },
  { page: "Contact & Pilot", role: "Direct enterprise scoping request with transparent timeline and no inflated claims." },
] as const;

export function BrandApplicationsShowcase({
  theme,
  soundMuted,
}: {
  theme: "dark" | "light";
  soundMuted: boolean;
}) {
  // Interactive Component Specimen state
  const [specimenState, setSpecimenState] = useState<"default" | "loading" | "error" | "disabled">("default");
  const [approvalStatus, setApprovalStatus] = useState<"pending" | "approved" | "rejected">("pending");

  // Multi-Voice Conference interactive simulator
  const [micActive, setMicActive] = useState(true);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string>("exec-intel");
  const [interruptedBanner, setInterruptedBanner] = useState<string | null>(null);
  const [voiceApprovalState, setVoiceApprovalState] = useState<"pending" | "approved">("pending");

  // Corporate Applications tabs
  const [corpTab, setCorpTab] = useState<"stationery" | "pitch" | "documents" | "website">("stationery");
  const [slideIdx, setSlideIdx] = useState(0);
  const [copiedSig, setCopiedSig] = useState(false);

  const activeSpeaker =
    VOICE_AGENT_PROFILES.find((a) => a.id === activeSpeakerId) ?? VOICE_AGENT_PROFILES[0];
  const queueAgents = VOICE_AGENT_PROFILES.filter((a) => a.id !== activeSpeakerId).slice(0, 3);

  function handleInterrupt() {
    setInterruptedBanner(`Human barge-in captured (<110ms) · ${activeSpeaker.role} yielded floor.`);
    playBrandSound("warning", soundMuted);
  }

  function handleHandoff(agentId: string) {
    setActiveSpeakerId(agentId);
    setInterruptedBanner(null);
    playBrandSound("notification", soundMuted);
  }

  function handleVoiceApprove() {
    setVoiceApprovalState("approved");
    playBrandSound("confirmation", soundMuted);
  }

  async function handleCopySignature() {
    const html = `<strong>Aarav Nair</strong> · Principal Solutions Architect<br/><strong>LUXOR9</strong> | Intelligence Infrastructure<br/><span style="color:#525866">Luxoranova Fintech Private Limited · Dubai &amp; Global</span>`;
    try {
      await navigator.clipboard.writeText(html);
      setCopiedSig(true);
      setTimeout(() => setCopiedSig(false), 2000);
    } catch {
      setCopiedSig(false);
    }
  }

  const currentSlide = PITCH_SLIDES[slideIdx];

  return (
    <div className="bk-stack-xl">
      {/* SECTION 8 — DIGITAL PRODUCT BRAND SYSTEM */}
      <section id="product-os" className="bk-section">
        <header className="bk-section-head">
          <p className="bk-kicker">05 · Digital Product Design System</p>
          <h2 className="bk-h2">Control Tower, Multi-Voice Conference &amp; Governed States</h2>
          <p className="bk-lead">
            Institutional software grammar engineered so authority, operational state, and provenance
            are legible in under two seconds—without relying on colour alone or cartoon agent mascots.
          </p>
        </header>

        {/* 9-State Governed Execution Taxonomy */}
        <div className="bk-subsection">
          <div className="bk-subhead-row">
            <h3 className="bk-h3">9-State Governed Execution Taxonomy</h3>
            <span className="bk-meta-text">Every state pairs geometric symbol + explicit text label + accessible contrast</span>
          </div>
          <div className="bk-state-grid">
            {EXECUTION_STATES.map((st) => {
              const style =
                theme === "dark"
                  ? { background: st.darkBg, color: st.darkFg, borderColor: st.darkBorder }
                  : { background: st.lightBg, color: st.lightFg, borderColor: st.lightBorder };
              return (
                <div key={st.id} className="bk-state-card">
                  <div className="bk-state-indicator" style={style}>
                    <span className="bk-state-glyph" aria-hidden="true">
                      {st.glyph}
                    </span>
                    <span>{st.label}</span>
                  </div>
                  <p className="bk-body-sm">{st.meaning}</p>
                  <p className="bk-state-action">Operator: {st.humanAction}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Interactive Core Application Component Lab */}
        <div className="bk-subsection">
          <div className="bk-subhead-row">
            <h3 className="bk-h3">Core Application Component Specimen Lab</h3>
            <div className="bk-segmented" role="group" aria-label="Component state preview">
              {(["default", "loading", "error", "disabled"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  className={`bk-seg-btn ${specimenState === st ? "is-active" : ""}`}
                  onClick={() => setSpecimenState(st)}
                >
                  {st.charAt(0).toUpperCase() + st.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="bk-two-col">
            {/* Controls & Form Specimen */}
            <div className="bk-surface-panel">
              <p className="bk-panel-label">Action Controls &amp; Bound Inputs</p>
              <div className="bk-btn-row">
                <button
                  type="button"
                  className="bk-btn-primary"
                  disabled={specimenState === "disabled" || specimenState === "loading"}
                  onClick={() => playBrandSound("confirmation", soundMuted)}
                >
                  {specimenState === "loading" ? "Verifying Scope..." : "Approve Execution"}
                </button>
                <button
                  type="button"
                  className="bk-btn-secondary"
                  disabled={specimenState === "disabled"}
                >
                  Request Revision
                </button>
                <button
                  type="button"
                  className="bk-btn-danger"
                  disabled={specimenState === "disabled"}
                  onClick={() => playBrandSound("error", soundMuted)}
                >
                  Halt Run
                </button>
              </div>

              <div className="bk-field-group">
                <label className="bk-input-label" htmlFor="bk-spec-input">
                  Verified Source Reference
                </label>
                <input
                  id="bk-spec-input"
                  type="text"
                  className={`bk-input ${specimenState === "error" ? "is-error" : ""}`}
                  defaultValue="RERA Escrow Schedule v2.4 · Provided by Developer"
                  disabled={specimenState === "disabled"}
                  readOnly={specimenState === "loading"}
                />
                {specimenState === "error" && (
                  <p className="bk-input-error" role="alert">
                    ✕ Source needed. Attach verified price sheet before enabling publish action.
                  </p>
                )}
              </div>
            </div>

            {/* Interactive Approval Gate & Evidence Receipt */}
            <div className="bk-surface-panel">
              <div className="bk-panel-top">
                <p className="bk-panel-label">Trust-Gated Approval &amp; Evidence Panel</p>
                <span className="bk-mono-tag">POL-v2.4 · EXP 24H</span>
              </div>
              <p className="bk-body-sm" style={{ marginTop: 0 }}>
                <strong>Action:</strong> Publish 10 launch social posts for Marina Tower Phase II
                <br />
                <strong>Principal:</strong> Managing Director (Tenant Scoped) · <strong>Source:</strong> Developer Brief #DB-104
              </p>

              <div className="bk-approval-bar">
                <span className="bk-approval-status">
                  {approvalStatus === "pending" && "◆ Pending Approval"}
                  {approvalStatus === "approved" && "✓ Approved · Receipt #EV-9042 Logged"}
                  {approvalStatus === "rejected" && "⊘ Rejected · No External Side Effects"}
                </span>
                <div className="bk-approval-actions">
                  <button
                    type="button"
                    className="bk-btn-primary bk-btn-sm"
                    onClick={() => {
                      setApprovalStatus("approved");
                      playBrandSound("evidence-receipt", soundMuted);
                    }}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="bk-btn-secondary bk-btn-sm"
                    onClick={() => {
                      setApprovalStatus("rejected");
                      playBrandSound("error", soundMuted);
                    }}
                  >
                    Reject
                  </button>
                  {approvalStatus !== "pending" && (
                    <button
                      type="button"
                      className="bk-link-inline"
                      onClick={() => setApprovalStatus("pending")}
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Voice Agent Control Tower Interactive Conference Simulator */}
        <div className="bk-subsection">
          <div className="bk-subhead-row">
            <h3 className="bk-h3">Multi-Voice Agent Control Tower · Conference Surface</h3>
            <span className="bk-meta-text">Enterprise command audio environment · Zero cartoon mascots</span>
          </div>

          <div className="bk-voice-tower">
            <div className="bk-vt-topbar">
              <div className="bk-vt-id">
                <LuxorKeystoneGlyph fg={theme === "dark" ? "#F3EFE6" : "#0B0D10"} accent={theme === "dark" ? "#2EC4B6" : "#0F766E"} size={22} />
                <span className="bk-vt-title">LUXOR9 · Voice Control Tower</span>
                <span className="bk-mono-tag">{micActive ? "MIC LIVE · VAD 0.50" : "MIC MUTED"}</span>
              </div>
              <div className="bk-vt-controls">
                <button
                  type="button"
                  className="bk-btn-secondary bk-btn-sm"
                  onClick={() => {
                    const next = !micActive;
                    setMicActive(next);
                    playBrandSound(next ? "session-start" : "session-end", soundMuted);
                  }}
                >
                  {micActive ? "Mute Mic" : "Open Mic"}
                </button>
                <button
                  type="button"
                  className="bk-btn-danger bk-btn-sm"
                  onClick={handleInterrupt}
                >
                  Interrupt / Barge-In
                </button>
              </div>
            </div>

            <div className="bk-vt-body">
              {/* Active Speaker & Transcript */}
              <div className="bk-vt-stage">
                <div className="bk-vt-speaker-head">
                  <div>
                    <span className="bk-agent-code" style={{ borderColor: activeSpeaker.accentHex, color: activeSpeaker.accentHex }}>
                      {activeSpeaker.code}
                    </span>
                    <strong className="bk-vt-speaker-name">{activeSpeaker.role}</strong>
                    <span className="bk-meta-text"> · Active Speaker · {activeSpeaker.paceWpm}</span>
                  </div>
                  <div className={`bk-vu-bars ${micActive && !interruptedBanner ? "is-live" : ""}`} aria-hidden="true">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </div>

                {interruptedBanner ? (
                  <div className="bk-vt-interrupt" role="status">
                    ▲ {interruptedBanner}
                  </div>
                ) : (
                  <blockquote className="bk-vt-transcript">
                    “{activeSpeaker.sampleUtterance}”
                  </blockquote>
                )}

                <div className="bk-vt-gate">
                  <div>
                    <span className="bk-mono-tag">VOICE-INITIATED APPROVAL GATE</span>
                    <p className="bk-body-sm" style={{ margin: "4px 0 0" }}>
                      Dispatch English + Arabic brochure brief to Sales Ops? (Source: RERA File #412)
                    </p>
                  </div>
                  <button
                    type="button"
                    className={voiceApprovalState === "approved" ? "bk-btn-secondary bk-btn-sm" : "bk-btn-primary bk-btn-sm"}
                    onClick={handleVoiceApprove}
                  >
                    {voiceApprovalState === "approved" ? "✓ Approved · Receipt Logged" : "Authorize via Voice / Click"}
                  </button>
                </div>
              </div>

              {/* Speaking Queue & Non-Mascot Agent Roster */}
              <div className="bk-vt-queue">
                <p className="bk-panel-label">Specialist Queue · Click to Handoff</p>
                <div className="bk-vt-queue-list">
                  {queueAgents.map((ag) => (
                    <button
                      key={ag.id}
                      type="button"
                      className="bk-vt-agent-btn"
                      onClick={() => handleHandoff(ag.id)}
                    >
                      <span className="bk-agent-code" style={{ borderColor: ag.accentHex, color: ag.accentHex }}>
                        {ag.code}
                      </span>
                      <span className="bk-vt-agent-info">
                        <strong>{ag.role}</strong>
                        <span>{ag.temperament}</span>
                      </span>
                      <span className="bk-mono-tag">Handoff →</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 13 Control Tower Functional Architecture Areas */}
        <div className="bk-subsection">
          <h3 className="bk-h3">Control Tower Information Architecture (13 Core Modules)</h3>
          <div className="bk-module-grid">
            {CONTROL_TOWER_MODULES.map((m) => (
              <div key={m.id} className="bk-module-item">
                <span className="bk-mono-index">{m.id}</span>
                <div>
                  <strong className="bk-module-name">{m.name}</strong>
                  <p className="bk-body-sm" style={{ margin: "2px 0 0" }}>{m.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 9 — CORPORATE & COMMERCIAL BRAND APPLICATIONS */}
      <section id="applications" className="bk-section">
        <header className="bk-section-head">
          <p className="bk-kicker">06 · Corporate, Commercial &amp; Digital Applications</p>
          <h2 className="bk-h2">Executive Stationery, Pitch Deck &amp; Enterprise Presence</h2>
          <p className="bk-lead">
            Production-ready institutional applications governed by strict Mineral Ivory paper
            stock, Obsidian authority anchors, and Luxoranova Fintech Private Limited legal
            endorsements.
          </p>
        </header>

        <div className="bk-segmented bk-app-tabs" role="tablist" aria-label="Brand application category">
          {(
            [
              ["stationery", "Stationery & Business Cards"],
              ["pitch", "Enterprise Pitch Deck (6 Slides)"],
              ["documents", "Quotation, Invoice & NDA"],
              ["website", "Website Experience IA"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={corpTab === id}
              className={`bk-seg-btn ${corpTab === id ? "is-active" : ""}`}
              onClick={() => setCorpTab(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* TAB 1: Corporate Stationery, Business Cards & Email Signature */}
        {corpTab === "stationery" && (
          <div className="bk-two-col">
            {/* A4 Executive Letterhead Mockup */}
            <div className="bk-paper-sheet">
              <div className="bk-lh-head">
                <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                  <LuxorKeystoneGlyph fg="#0B0D10" accent="#0F766E" size={24} />
                  <span className="bk-lh-wordmark">
                    LUXOR<span style={{ color: "#0F766E" }}>9</span>
                  </span>
                </div>
                <span className="bk-lh-meta">INTELLIGENCE INFRASTRUCTURE</span>
              </div>
              <div className="bk-lh-body">
                <p className="bk-lh-date">23 November 2026 · REF: LX9-EXEC-2026-04</p>
                <h4 className="bk-lh-title">Executive Pilot Mandate — Dubai Real Estate Edition</h4>
                <p>
                  Dear Managing Director,
                </p>
                <p>
                  This memorandum outlines the governed deployment scope for the LUXOR9 Control
                  Tower across your upcoming residential launch. Every commercial figure, handover
                  schedule, and brochure claim remains bound to verified developer sources and
                  explicit executive authorization prior to release.
                </p>
                <p className="bk-lh-sign">
                  Yours sincerely,
                  <br />
                  <strong>Office of the Founder · LUXOR9</strong>
                </p>
              </div>
              <div className="bk-lh-foot">
                <span>Luxoranova Fintech Private Limited</span>
                <span>CONFIDENTIAL · GOVERNED RECORD</span>
              </div>
            </div>

            {/* Business Cards + Email Signature */}
            <div className="bk-stack-md">
              <div className="bk-bcard-pair">
                {/* Front — Obsidian 600gsm */}
                <div className="bk-bcard is-dark">
                  <div className="bk-bcard-top">
                    <LuxorKeystoneGlyph fg="#F3EFE6" accent="#2EC4B6" size={26} />
                    <span className="bk-bcard-mark">
                      LUXOR<span style={{ color: "#2EC4B6" }}>9</span>
                    </span>
                  </div>
                  <div className="bk-bcard-bottom">
                    <span className="bk-bcard-tag">INTELLIGENCE INFRASTRUCTURE</span>
                    <span className="bk-bcard-legal">Luxoranova Fintech Private Limited</span>
                  </div>
                </div>

                {/* Back — Mineral Ivory 600gsm */}
                <div className="bk-bcard is-light">
                  <div>
                    <strong className="bk-bcard-name">Founder &amp; Managing Director</strong>
                    <span className="bk-bcard-role">LUXOR9 · Enterprise AI Operating System</span>
                  </div>
                  <div className="bk-bcard-contact">
                    <span>Dubai, UAE · Global Operations</span>
                    <span>executive@luxor9.com · luxor9.com</span>
                  </div>
                </div>
              </div>

              {/* Email Signature */}
              <div className="bk-surface-panel">
                <div className="bk-panel-top">
                  <p className="bk-panel-label">Standard Corporate Email Signature</p>
                  <button type="button" className="bk-link-inline" onClick={() => void handleCopySignature()}>
                    {copiedSig ? "HTML Copied" : "Copy HTML"}
                  </button>
                </div>
                <div className="bk-email-sig">
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <LuxorKeystoneGlyph fg={theme === "dark" ? "#F3EFE6" : "#0B0D10"} accent={theme === "dark" ? "#2EC4B6" : "#0F766E"} size={18} thickened />
                    <strong>Aarav Nair</strong>
                    <span className="bk-meta-text">· Principal Solutions Architect</span>
                  </div>
                  <div className="bk-body-sm">
                    <strong>LUXOR9</strong> · Intelligence Infrastructure
                    <br />
                    <span className="bk-meta-text">Luxoranova Fintech Private Limited · Dubai &amp; Global</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Interactive 6-Slide Enterprise Pitch Deck */}
        {corpTab === "pitch" && (
          <div className="bk-deck-wrap">
            <div className={`bk-slide ${currentSlide.dark ? "is-dark" : "is-light"}`}>
              <div className="bk-slide-top">
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <LuxorKeystoneGlyph
                    fg={currentSlide.dark ? "#F3EFE6" : "#0B0D10"}
                    accent={currentSlide.dark ? "#2EC4B6" : "#0F766E"}
                    size={22}
                  />
                  <span className="bk-slide-brand">LUXOR9</span>
                </div>
                <span className="bk-mono-tag">{currentSlide.index}</span>
              </div>

              <div className="bk-slide-main">
                <p className="bk-slide-kicker">{currentSlide.kicker}</p>
                <h3 className="bk-slide-headline">{currentSlide.headline}</h3>
                <p className="bk-slide-sub">{currentSlide.subhead}</p>
                <p className="bk-slide-body">{currentSlide.body}</p>
              </div>

              <div className="bk-slide-foot">
                <span>Luxoranova Fintech Private Limited</span>
                <span>Controlled intelligence. Accountable execution.</span>
              </div>
            </div>

            <div className="bk-slide-controls">
              <button
                type="button"
                className="bk-btn-secondary bk-btn-sm"
                onClick={() => setSlideIdx((i) => (i === 0 ? PITCH_SLIDES.length - 1 : i - 1))}
              >
                ← Previous Slide
              </button>
              <div className="bk-slide-dots">
                {PITCH_SLIDES.map((s, idx) => (
                  <button
                    key={s.index}
                    type="button"
                    className={`bk-seg-btn ${slideIdx === idx ? "is-active" : ""}`}
                    onClick={() => setSlideIdx(idx)}
                  >
                    0{idx + 1}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="bk-btn-primary bk-btn-sm"
                onClick={() => setSlideIdx((i) => (i + 1) % PITCH_SLIDES.length)}
              >
                Next Slide →
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: Commercial Quotation, Invoice & NDA Cover */}
        {corpTab === "documents" && (
          <div className="bk-two-col">
            {/* Commercial Quotation / Invoice */}
            <div className="bk-paper-sheet">
              <div className="bk-lh-head">
                <span className="bk-lh-wordmark">
                  LUXOR<span style={{ color: "#0F766E" }}>9</span> · COMMERCIAL QUOTATION
                </span>
                <span className="bk-lh-meta">QT-2026-019</span>
              </div>
              <div className="bk-doc-meta-grid">
                <div>
                  <span className="bk-doc-label">ISSUING ENTITY</span>
                  <strong>Luxoranova Fintech Private Limited</strong>
                </div>
                <div>
                  <span className="bk-doc-label">CLIENT EDITION</span>
                  <strong>Dubai Real Estate Developer Pilot</strong>
                </div>
              </div>
              <table className="bk-doc-table">
                <thead>
                  <tr>
                    <th>Deliverable Scope</th>
                    <th>Timeline</th>
                    <th style={{ textAlign: "right" }}>Fee (AED)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Launch Blueprint + Source-Verified Collateral Pack</td>
                    <td>3 Business Days</td>
                    <td style={{ textAlign: "right" }}>2,500</td>
                  </tr>
                  <tr>
                    <td>Monthly Control Tower Operations (Optional)</td>
                    <td>Per Month</td>
                    <td style={{ textAlign: "right" }}>1,500</td>
                  </tr>
                </tbody>
              </table>
              <p className="bk-doc-footnote">
                Source: LUXOR9 Standard Service Rate Card · All external actions remain gated by
                written client authorization.
              </p>
            </div>

            {/* Mutual NDA & Governance Dossier Cover */}
            <div className="bk-nda-cover">
              <div className="bk-nda-top">
                <LuxorKeystoneGlyph fg="#F3EFE6" accent="#2EC4B6" size={32} />
                <span className="bk-mono-tag">LEGAL &amp; GOVERNANCE SERIES</span>
              </div>
              <div className="bk-nda-mid">
                <p className="bk-slide-kicker">MUTUAL NON-DISCLOSURE &amp; DATA BOUNDARY</p>
                <h4 className="bk-nda-title">Enterprise Confidentiality Agreement</h4>
                <p className="bk-nda-desc">
                  Tenant-scoped data governance, non-training guarantee on proprietary developer
                  assets, and audit-log retention protocol.
                </p>
              </div>
              <div className="bk-nda-foot">
                <span>LUXOR9 · By Luxoranova Fintech Private Limited</span>
                <span>DOC-NDA-V1</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Website Experience IA */}
        {corpTab === "website" && (
          <div className="bk-module-grid">
            {WEBSITE_PAGES.map((item, idx) => (
              <div key={item.page} className="bk-module-item">
                <span className="bk-mono-index">0{idx + 1}</span>
                <div>
                  <strong className="bk-module-name">{item.page}</strong>
                  <p className="bk-body-sm" style={{ margin: "4px 0 0" }}>{item.role}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
