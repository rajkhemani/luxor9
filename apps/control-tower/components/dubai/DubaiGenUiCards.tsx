"use client";

import React, { useState } from "react";
import {
  formatProofClipboardText,
  type ApprovalSealPayload,
  type DubaiPricingMode,
  type PreviewPackPayload,
  type ProofReceiptPayload,
  type SimplePlanPayload,
  type SourceGatePayload,
} from "@/lib/dubai-genui";

function formatUaeDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-AE", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/**
 * Geometric state glyph — LUXOR9 Brand Kit 9-State Execution Taxonomy (never color alone).
 */
function StateGlyph({
  variant,
}: {
  variant: "warning" | "proposal" | "preview" | "approval" | "completed";
}) {
  if (variant === "warning") {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 2L14.5 13.5H1.5L8 2Z" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 6.5V9.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
        <rect x="7.25" y="11.2" width="1.5" height="1.5" fill="currentColor" />
      </svg>
    );
  }
  if (variant === "completed") {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="12" height="12" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M5 8.2L7.1 10.3L11.2 5.8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="square"
        />
      </svg>
    );
  }
  if (variant === "approval") {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M8 1.8L14.2 8L8 14.2L1.8 8L8 1.8Z" stroke="currentColor" strokeWidth="1.5" />
        <rect x="6.75" y="6.75" width="2.5" height="2.5" fill="currentColor" />
      </svg>
    );
  }
  if (variant === "preview") {
    return (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="2" y="3" width="12" height="10" stroke="currentColor" strokeWidth="1.5" />
        <path d="M2 6.5H14" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="2.5" y="2.5" width="11" height="11" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5.5 6H10.5M5.5 9.5H9" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* 1. SOURCE NEEDED GATE CARD                                                 */
/* -------------------------------------------------------------------------- */

export function SourceGateCard({
  payload,
  isInteractive,
  isBusy,
  onSubmitSource,
}: {
  payload: SourceGatePayload;
  isInteractive: boolean;
  isBusy: boolean;
  onSubmitSource: (sourceText: string) => void;
}) {
  const [sourceInput, setSourceInput] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = sourceInput.trim();
    if (cleaned.length < 4) {
      setValidationError("Please enter where your price, date, or offer came from.");
      return;
    }
    setValidationError(null);
    onSubmitSource(cleaned);
    setSourceInput("");
  }

  if (payload.resolved) {
    return (
      <article className="dg-card dg-card-verified" aria-label="Source Verified">
        <div className="dg-card-kicker dg-state-verified">
          <StateGlyph variant="completed" />
          <span>Source Verified</span>
          <span aria-hidden="true">·</span>
          <span>{payload.project}</span>
        </div>
        <h3 className="dg-card-title">Developer source attached</h3>
        <p className="dg-card-desc">
          Verified record saved: <strong>{payload.resolvedSource || "Provided by developer"}</strong>.
          You can now review and approve your plan below.
        </p>
      </article>
    );
  }

  return (
    <article className="dg-card dg-card-warning" role="alert" aria-label="Source Needed">
      <div className="dg-card-kicker dg-state-warning">
        <StateGlyph variant="warning" />
        <span>Source Needed</span>
        <span aria-hidden="true">·</span>
        <span>Action Required</span>
      </div>
      <h3 className="dg-card-title">Source needed. Please give source. Do not guess.</h3>
      <p className="dg-card-desc">{payload.reason}</p>

      {payload.missingItems.length > 0 ? (
        <div className="dg-inline-meta">
          <span>Missing source for:</span>{" "}
          <strong>{payload.missingItems.join(" · ")}</strong>
        </div>
      ) : null}

      {isInteractive ? (
        <form onSubmit={handleSave} className="dg-source-form" noValidate>
          <label htmlFor={`source-input-${payload.blueprintId}`} className="dg-field-label">
            Add your verified source (example: Developer Q2 Price Sheet — AED 1.9M, handover Q4 2027)
          </label>
          <div className="dg-source-row">
            <input
              id={`source-input-${payload.blueprintId}`}
              type="text"
              className="dg-input"
              value={sourceInput}
              onChange={(e) => {
                setSourceInput(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="Example: Developer Q2 brochure & RERA permit — AED 2.1M, Q4 2027"
              disabled={isBusy}
            />
            <button type="submit" className="dg-btn-primary" disabled={isBusy}>
              Save Source &amp; Check Plan
            </button>
          </div>
          {validationError ? <p className="dg-error-note">{validationError}</p> : null}
        </form>
      ) : (
        <p className="dg-muted-note">Resolved in a newer step below.</p>
      )}
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. YOUR SIMPLE PLAN CARD                                                   */
/* -------------------------------------------------------------------------- */

export function SimplePlanCard({
  payload,
  pricingMode,
  selectedDeliverables,
  isInteractive,
  onSelectPricingMode,
  onToggleDeliverable,
}: {
  payload: SimplePlanPayload;
  pricingMode: DubaiPricingMode;
  selectedDeliverables: Record<number, boolean>;
  isInteractive: boolean;
  onSelectPricingMode: (mode: DubaiPricingMode) => void;
  onToggleDeliverable: (index: number) => void;
}) {
  const { blueprint } = payload;

  return (
    <article className="dg-card" aria-label="Your Simple Plan">
      <div className="dg-card-kicker dg-state-proposal">
        <StateGlyph variant="proposal" />
        <span>Your Simple Plan</span>
        <span aria-hidden="true">·</span>
        <span>{blueprint.project}</span>
        {blueprint.revisionCount > 1 ? (
          <>
            <span aria-hidden="true">·</span>
            <span className="dg-mono">Revision {blueprint.revisionCount}</span>
          </>
        ) : null}
      </div>

      <h3 className="dg-card-title">{blueprint.problem}</h3>

      <div className="dg-section-block">
        <div className="dg-label-row">Solution in 3 simple steps</div>
        <ol className="dg-steps-list">
          {blueprint.solutionSteps.map((step, idx) => (
            <li key={`${blueprint.id}-step-${idx}`} className="dg-step-item">
              <span className="dg-step-num dg-mono">0{idx + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="dg-section-block">
        <div className="dg-label-row">
          What we will build {isInteractive ? "· Tap to include or pause" : ""}
        </div>
        <div className="dg-deliverables-list" role="group" aria-label="Deliverables to build">
          {blueprint.buildList.map((item, idx) => {
            const active = selectedDeliverables[idx] !== false;
            return (
              <button
                key={`${blueprint.id}-build-${idx}`}
                type="button"
                className={`dg-deliverable-row ${active ? "is-checked" : "is-paused"}`}
                aria-pressed={active}
                disabled={!isInteractive}
                onClick={() => onToggleDeliverable(idx)}
              >
                <span className="dg-checkbox-box" aria-hidden="true">
                  {active ? "✓" : ""}
                </span>
                <span className="dg-deliverable-text">{item}</span>
                <span className="dg-deliverable-state">{active ? "Included" : "Paused"}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="dg-plan-metrics">
        <div className="dg-metric-cell">
          <div className="dg-label-row">Time</div>
          <div className="dg-metric-value dg-mono">{blueprint.timeLabel}</div>
          <div className="dg-metric-sub">{blueprint.timeSource}</div>
        </div>

        <div className="dg-metric-cell">
          <div className="dg-label-row">Price Option</div>
          <div className="dg-segmented" role="tablist" aria-label="Select pricing plan">
            <button
              type="button"
              role="tab"
              aria-selected={pricingMode === "per_launch"}
              className={`dg-seg-btn ${pricingMode === "per_launch" ? "is-active" : ""}`}
              onClick={() => onSelectPricingMode("per_launch")}
              disabled={!isInteractive}
            >
              Per Launch
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={pricingMode === "monthly_tower"}
              className={`dg-seg-btn ${pricingMode === "monthly_tower" ? "is-active" : ""}`}
              onClick={() => onSelectPricingMode("monthly_tower")}
              disabled={!isInteractive}
            >
              Monthly Tower
            </button>
          </div>
          <div className="dg-metric-value dg-mono">
            {pricingMode === "monthly_tower"
              ? blueprint.pricing.monthlyTower
              : blueprint.pricing.perLaunch}
          </div>
          <div className="dg-metric-sub">
            {pricingMode === "monthly_tower"
              ? `Or ${blueprint.pricing.perLaunch}`
              : `Plus Monthly Tower option: ${blueprint.pricing.monthlyTower}`}
          </div>
        </div>
      </div>

      <div className={`dg-source-strip ${blueprint.missingSource ? "is-missing" : ""}`}>
        <div className="dg-label-row">Source</div>
        <div className="dg-source-main">
          {blueprint.missingSource ? (
            <span className="dg-state-warning-text">
              Source needed. Please give source. Do not guess.
            </span>
          ) : (
            <span>{blueprint.sourceLabel}</span>
          )}
        </div>
        <div className="dg-source-details">
          {blueprint.sourceDetails.join(" · ")}
        </div>
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. WORK PREVIEW DECK CARD                                                  */
/* -------------------------------------------------------------------------- */

export function WorkPreviewCard({ payload }: { payload: PreviewPackPayload }) {
  const [activeTab, setActiveTab] = useState<"brochure" | "posts" | "whatsapp">("brochure");
  const { pack } = payload;

  return (
    <article className="dg-card" aria-label="Work Preview">
      <div className="dg-card-head-row">
        <div>
          <div className="dg-card-kicker dg-state-preview">
            <StateGlyph variant="preview" />
            <span>Work Preview</span>
            <span aria-hidden="true">·</span>
            <span>Inspect before building</span>
          </div>
          <h3 className="dg-card-title">Sample deliverables for {pack.project}</h3>
        </div>
      </div>

      <div className="dg-segmented dg-preview-tabs" role="tablist" aria-label="Preview tabs">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "brochure"}
          className={`dg-seg-btn ${activeTab === "brochure" ? "is-active" : ""}`}
          onClick={() => setActiveTab("brochure")}
        >
          Brochure
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "posts"}
          className={`dg-seg-btn ${activeTab === "posts" ? "is-active" : ""}`}
          onClick={() => setActiveTab("posts")}
        >
          10 Posts
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "whatsapp"}
          className={`dg-seg-btn ${activeTab === "whatsapp" ? "is-active" : ""}`}
          onClick={() => setActiveTab("whatsapp")}
        >
          WhatsApp Follow-Ups
        </button>
      </div>

      {activeTab === "brochure" ? (
        <div className="dg-preview-panel" role="tabpanel">
          <h4 className="dg-preview-heading">{pack.brochure.headline}</h4>
          <p className="dg-card-desc">{pack.brochure.subheadline}</p>
          <ul className="dg-clean-list">
            {pack.brochure.highlights.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
          <p className="dg-fact-note">{pack.brochure.factNote}</p>
        </div>
      ) : null}

      {activeTab === "posts" ? (
        <div className="dg-preview-panel" role="tabpanel">
          <div className="dg-posts-list">
            {pack.socialPosts.map((post) => (
              <div key={post.day} className="dg-post-row">
                <div className="dg-post-meta">
                  <span className="dg-mono">Day {String(post.day).padStart(2, "0")}</span>
                  <span aria-hidden="true">·</span>
                  <span>{post.channel}</span>
                  <span aria-hidden="true">·</span>
                  <span>{post.angle}</span>
                </div>
                <p className="dg-post-caption">{post.caption}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === "whatsapp" ? (
        <div className="dg-preview-panel" role="tabpanel">
          <div className="dg-posts-list">
            {pack.whatsappSequence.map((msg, i) => (
              <div key={i} className="dg-post-row">
                <div className="dg-post-meta">
                  <span className="dg-mono">{msg.timing}</span>
                  <span aria-hidden="true">·</span>
                  <span>{msg.title}</span>
                </div>
                <p className="dg-post-caption">{msg.message}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. APPROVAL SEAL CARD (HUMAN-IN-THE-LOOP)                                  */
/* -------------------------------------------------------------------------- */

export function ApprovalSealCard({
  payload,
  pricingMode,
  isInteractive,
  isBusy,
  isAlreadyApproved,
  onApprove,
  onAskToChange,
}: {
  payload: ApprovalSealPayload;
  pricingMode: DubaiPricingMode;
  isInteractive: boolean;
  isBusy: boolean;
  isAlreadyApproved: boolean;
  onApprove: () => void;
  onAskToChange: () => void;
}) {
  const locked = payload.lockedByMissingSource;
  const priceText =
    pricingMode === "monthly_tower" ? payload.monthlyTowerPrice : payload.perLaunchPrice;

  return (
    <article
      className={`dg-card ${isAlreadyApproved ? "dg-card-verified" : "dg-card-approval"}`}
      aria-label="Approval Gate"
    >
      <div
        className={`dg-card-kicker ${
          isAlreadyApproved
            ? "dg-state-verified"
            : locked
              ? "dg-state-warning"
              : "dg-state-approval"
        }`}
      >
        <StateGlyph variant={isAlreadyApproved ? "completed" : locked ? "warning" : "approval"} />
        <span>
          {isAlreadyApproved
            ? "Approved"
            : locked
              ? "Waiting for Source"
              : "Waiting for Your Approval"}
        </span>
        <span aria-hidden="true">·</span>
        <span className="dg-mono">{payload.policyRef}</span>
        <span aria-hidden="true">·</span>
        <span>{payload.expiresLabel}</span>
      </div>

      <h3 className="dg-card-title">
        {isAlreadyApproved
          ? "Plan approved and handed to the build team"
          : locked
            ? "Add your source above to unlock approval"
            : "Approve this plan to start building"}
      </h3>

      <div className="dg-approval-summary">
        <div>
          <span className="dg-muted-label">Project</span>
          <strong>{payload.project}</strong>
        </div>
        <div>
          <span className="dg-muted-label">Selected fee</span>
          <strong className="dg-mono">{priceText}</strong>
        </div>
        <div>
          <span className="dg-muted-label">Delivery</span>
          <strong className="dg-mono">{payload.timeLabel}</strong>
        </div>
      </div>

      {isInteractive && !isAlreadyApproved ? (
        <div className="dg-action-row">
          <button
            type="button"
            className="dg-btn-primary"
            disabled={locked || isBusy}
            onClick={onApprove}
          >
            {isBusy ? "Starting automation..." : "Approve and Build"}
          </button>
          <button
            type="button"
            className="dg-btn-secondary"
            disabled={isBusy}
            onClick={onAskToChange}
          >
            Ask to Change
          </button>
        </div>
      ) : (
        <p className="dg-muted-note">
          {isAlreadyApproved
            ? "Signed and locked. Your proof receipt is below."
            : "Superseded by your updated plan below."}
        </p>
      )}
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/* 5. LIVE PROOF RECEIPT CARD                                                 */
/* -------------------------------------------------------------------------- */

export function ProofReceiptCard({
  payload,
  onStartNewProblem,
}: {
  payload: ProofReceiptPayload;
  onStartNewProblem: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const { proof } = payload;

  async function handleCopy() {
    const summary = formatProofClipboardText(proof, payload.selectedMode);
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  }

  return (
    <article className="dg-card dg-card-proof" aria-label="Proof Receipt">
      <div className="dg-proof-hero">
        <div className="dg-proof-check" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12.5L9.6 17.1L19 7.5"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="square"
            />
          </svg>
        </div>
        <div>
          <div className="dg-card-kicker dg-state-verified">
            <span>Completed Approval</span>
            <span aria-hidden="true">·</span>
            <span className="dg-mono">{proof.proofId}</span>
          </div>
          <h3 className="dg-card-title">Automation started.</h3>
        </div>
      </div>

      <dl className="dg-proof-grid">
        <div className="dg-proof-item">
          <dt>What was planned</dt>
          <dd>{proof.plannedSummary}</dd>
        </div>
        <div className="dg-proof-item">
          <dt>What you approved</dt>
          <dd>{proof.approvedBuildList.join(" · ")}</dd>
        </div>
        <div className="dg-proof-item">
          <dt>What is being built now</dt>
          <dd>
            {proof.buildingNow.map((entry, idx) => (
              <span key={entry.item} className="dg-build-line">
                <strong>{entry.item}</strong> — {entry.status}
                {idx < proof.buildingNow.length - 1 ? " · " : ""}
              </span>
            ))}
          </dd>
        </div>
        <div className="dg-proof-item">
          <dt>When it started</dt>
          <dd className="dg-mono">{formatUaeDateTime(proof.startedAtIso)}</dd>
        </div>
      </dl>

      {expanded ? (
        <div className="dg-proof-expanded">
          <div className="dg-label-row">Full Verified Proof Record</div>
          <ul className="dg-clean-list">
            <li>
              <strong>Approval reference:</strong>{" "}
              <span className="dg-mono">{payload.policyRef}</span>
            </li>
            <li>
              <strong>Selected fee:</strong>{" "}
              <span className="dg-mono">
                {payload.selectedMode === "monthly_tower"
                  ? "AED 1,500 per month (Monthly Tower)"
                  : "AED 2,500 per launch (Per Launch)"}
              </span>
            </li>
            <li>
              <strong>Delivery schedule:</strong> {proof.approvedTime}
            </li>
            <li>
              <strong>Verified source:</strong> {proof.sourceDetails.join(" · ")}
            </li>
          </ul>
        </div>
      ) : null}

      <div className="dg-action-row">
        <button
          type="button"
          className="dg-btn-primary"
          aria-expanded={expanded}
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? "Hide Full Proof" : "View Proof"}
        </button>
        <button type="button" className="dg-btn-secondary" onClick={handleCopy}>
          {copied ? "Copied Proof" : "Copy Proof"}
        </button>
        <button type="button" className="dg-btn-secondary" onClick={onStartNewProblem}>
          Start New Problem
        </button>
      </div>
    </article>
  );
}
