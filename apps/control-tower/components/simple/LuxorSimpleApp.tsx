"use client";

import { useEffect, useRef, useState } from "react";
import {
  CHAT_PLACEHOLDER,
  QUICK_EXAMPLES,
  type BlueprintItem,
  type ProofRecord,
} from "@/lib/simple-blueprint";

type ChatMessage = {
  id: string;
  sender: "user" | "luxor";
  text: string;
  timeLabel: string;
};

function formatClockNow(): string {
  return new Intl.DateTimeFormat("en-AE", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

function formatDateTime(iso: string): string {
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

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "welcome-1",
    sender: "luxor",
    text: "Hello. Tell us what is slowing your launch or sales team down, and we will prepare a simple plan in minutes.",
    timeLabel: "",
  },
];

export function LuxorSimpleApp() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputValue, setInputValue] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [blueprint, setBlueprint] = useState<BlueprintItem | null>(null);
  const [proof, setProof] = useState<ProofRecord | null>(null);
  const [showDetailedProof, setShowDetailedProof] = useState(false);
  const [copiedProof, setCopiedProof] = useState(false);
  const [changeMode, setChangeMode] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [inlineSource, setInlineSource] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formattedStartTime, setFormattedStartTime] = useState<string>("");

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const resultCardRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, isThinking]);

  useEffect(() => {
    if (proof?.startedAtIso) {
      setFormattedStartTime(formatDateTime(proof.startedAtIso));
    } else {
      setFormattedStartTime("");
    }
  }, [proof]);

  async function submitMessage(rawText: string, forceChange = false) {
    const trimmed = rawText.trim();
    if (!trimmed || isThinking || isApproving) return;

    setErrorMessage(null);
    const shouldRevise = (forceChange || changeMode) && blueprint !== null;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: trimmed,
      timeLabel: formatClockNow(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setProof(null);
    setShowDetailedProof(false);
    setIsThinking(true);

    const minDelay = new Promise((resolve) => setTimeout(resolve, 480));

    try {
      const [res] = await Promise.all([
        fetch("/api/v1/simple-blueprint", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: shouldRevise ? "change" : "draft",
            message: trimmed,
            previousBlueprint: shouldRevise ? blueprint : null,
          }),
        }),
        minDelay,
      ]);

      const data = (await res.json()) as { blueprint?: BlueprintItem; error?: string };
      if (!res.ok || !data.blueprint) {
        throw new Error(data.error || "Could not prepare your plan. Please try again.");
      }

      const nextBlueprint = data.blueprint;
      setBlueprint(nextBlueprint);
      setChangeMode(false);
      setInlineSource("");

      const replyText = nextBlueprint.missingSource
        ? "Your plan is ready to review, but a source is needed for your project price, date, or offer. Please share the source before approving."
        : "Your simple blueprint is ready. Review the steps, timing, price, and source, then click Approve and Build.";

      setMessages((prev) => [
        ...prev,
        {
          id: `luxor-${Date.now()}`,
          sender: "luxor",
          text: replyText,
          timeLabel: formatClockNow(),
        },
      ]);

      scrollResultIntoView();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsThinking(false);
    }
  }

  function scrollResultIntoView() {
    setTimeout(() => {
      const el = resultCardRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const isNarrow = window.innerWidth < 960;
      if (isNarrow || rect.top < 84 || rect.top > window.innerHeight * 0.6) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 60);
  }

  async function handleApprove() {
    if (!blueprint || isApproving) return;

    if (blueprint.missingSource) {
      setErrorMessage("Source needed. Please give source before approving.");
      return;
    }

    setErrorMessage(null);
    setIsApproving(true);

    try {
      const res = await fetch("/api/v1/simple-blueprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          blueprint,
        }),
      });
      const data = (await res.json()) as { proof?: ProofRecord; error?: string };
      if (!res.ok || !data.proof) {
        throw new Error(data.error || "Could not start automation. Please try again.");
      }

      setProof(data.proof);
      setShowDetailedProof(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `luxor-approved-${Date.now()}`,
          sender: "luxor",
          text: "Approved. Automation started and your proof record is ready.",
          timeLabel: formatClockNow(),
        },
      ]);

      scrollResultIntoView();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not approve plan.");
    } finally {
      setIsApproving(false);
    }
  }

  function handleAskToChange() {
    setErrorMessage(null);
    setProof(null);
    setShowDetailedProof(false);
    setChangeMode(true);

    setMessages((prev) => [
      ...prev,
      {
        id: `luxor-change-${Date.now()}`,
        sender: "luxor",
        text: "Tell us what to change.",
        timeLabel: formatClockNow(),
      },
    ]);

    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }

  function handleStartNewProblem() {
    setMessages(INITIAL_MESSAGES);
    setInputValue("");
    setBlueprint(null);
    setProof(null);
    setShowDetailedProof(false);
    setCopiedProof(false);
    setChangeMode(false);
    setInlineSource("");
    setErrorMessage(null);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }

  function handleInlineSourceSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = inlineSource.trim();
    if (!cleaned) return;
    const formatted = /^source\s*[:=-]/i.test(cleaned) ? cleaned : `Source: ${cleaned}`;
    void submitMessage(formatted, true);
  }

  async function handleCopyProof() {
    if (!proof) return;
    const text = [
      `LUXOR9 Proof Record (${proof.proofId})`,
      `What was planned: ${proof.plannedSummary}`,
      `Steps: 1. ${proof.plannedSteps[0]} | 2. ${proof.plannedSteps[1]} | 3. ${proof.plannedSteps[2]}`,
      `What you approved: ${proof.approvedBuildList.join(", ")} — ${proof.approvedPrice} (${proof.approvedTime})`,
      `What is being built now: ${proof.buildingNow.map((b) => `${b.item} (${b.status})`).join(", ")}`,
      `When it started: ${formattedStartTime || proof.startedAtIso}`,
      `Source: ${proof.sourceLabel}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopiedProof(true);
      setTimeout(() => setCopiedProof(false), 2000);
    } catch {
      setCopiedProof(false);
    }
  }

  function handleChatKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submitMessage(inputValue);
    }
  }

  const hasResultCard = Boolean(blueprint || proof);

  return (
    <div className="lx-simple-shell">
      <div className="lx-simple-bg" aria-hidden="true" />

      {/* SCREEN 1 — TOP BAR */}
      <header className="lx-simple-topbar">
        <div className="lx-simple-topbar-inner">
          <button
            type="button"
            className="lx-simple-logo"
            onClick={handleStartNewProblem}
            aria-label="LUXOR9 Home"
          >
            LUXOR<span className="lx-simple-logo-accent">9</span>
          </button>

          <button
            type="button"
            className="lx-btn-secondary lx-btn-compact"
            onClick={() => setHowItWorksOpen(true)}
          >
            How it works
          </button>
        </div>
      </header>

      <main className={`lx-simple-main ${hasResultCard ? "is-split" : "is-centered"}`}>
        {/* HERO HEADLINE */}
        <section className="lx-simple-hero">
          <h1 className="lx-simple-headline">
            Tell us your problem. Get a simple plan in minutes.
          </h1>
          <p className="lx-simple-subtext">
            Chat, approve, done. We build the automation.
          </p>
        </section>

        {/* WORKSPACE GRID */}
        <div className={`lx-simple-grid ${hasResultCard ? "has-result" : ""}`}>
          {/* SCREEN 2 — WHATSAPP-STYLE CHAT */}
          <section className="lx-glass-card lx-chat-card" aria-label="Chat with LUXOR9">
            <div className="lx-chat-header">
              <div className="lx-chat-avatar" aria-hidden="true">
                L9
              </div>
              <div className="lx-chat-identity">
                <span className="lx-chat-name">LUXOR9 Desk</span>
                <span className="lx-chat-note">Fast plan for UAE developers</span>
              </div>
            </div>

            <div className="lx-chat-messages" role="log" aria-live="polite">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`lx-bubble-row ${msg.sender === "user" ? "is-user" : "is-luxor"}`}
                >
                  <div className={`lx-bubble ${msg.sender === "user" ? "is-user" : "is-luxor"}`}>
                    <p className="lx-bubble-text">{msg.text}</p>
                    {msg.timeLabel && (
                      <span className="lx-bubble-time">
                        {msg.timeLabel}
                        {msg.sender === "user" && (
                          <span className="lx-bubble-check" aria-hidden="true">
                            {" "}
                            ✓✓
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {isThinking && (
                <div className="lx-bubble-row is-luxor">
                  <div className="lx-bubble is-luxor lx-thinking-bubble">
                    <span className="lx-thinking-dots" aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </span>
                    <span className="lx-thinking-label">Making your simple blueprint...</span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {errorMessage && (
              <div className="lx-alert-red" role="alert">
                {errorMessage}
              </div>
            )}

            <form
              className="lx-chat-form"
              onSubmit={(e) => {
                e.preventDefault();
                void submitMessage(inputValue);
              }}
            >
              <label htmlFor="luxor-chat-input" className="sr-only">
                Tell us your business problem
              </label>
              <textarea
                id="luxor-chat-input"
                ref={inputRef}
                className="lx-chat-input"
                rows={3}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleChatKeyDown}
                placeholder={
                  changeMode
                    ? "Tell us what to change, or paste the source for your price, date, or offer..."
                    : CHAT_PLACEHOLDER
                }
                disabled={isThinking || isApproving}
              />

              <div className="lx-chat-actions">
                <button
                  type="submit"
                  className="lx-btn-primary lx-send-btn"
                  disabled={isThinking || isApproving || !inputValue.trim()}
                >
                  {isThinking ? "Working..." : "Send"}
                </button>
              </div>
            </form>

            {/* 3 QUICK EXAMPLE BUTTONS */}
            <div className="lx-quick-wrap">
              <p className="lx-quick-label">Quick examples</p>
              <div className="lx-quick-grid">
                {QUICK_EXAMPLES.map((example) => (
                  <button
                    key={example}
                    type="button"
                    className="lx-btn-secondary lx-quick-btn"
                    onClick={() => void submitMessage(example, false)}
                    disabled={isThinking || isApproving}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* SCREEN 3 — BLUEPRINT CARD */}
          {blueprint && !proof && (
            <section
              ref={resultCardRef}
              className="lx-glass-card lx-blueprint-card"
              aria-label="Your Simple Blueprint"
            >
              <div className="lx-card-head">
                <h2 className="lx-card-title">Your Simple Blueprint</h2>
                <p className="lx-card-project">{blueprint.project}</p>
              </div>

              <div className="lx-field-list">
                <div className="lx-field">
                  <span className="lx-field-label">Problem</span>
                  <p className="lx-field-value lx-field-strong">{blueprint.problem}</p>
                </div>

                <div className="lx-field">
                  <span className="lx-field-label">Solution</span>
                  <ol className="lx-numbered-list">
                    {blueprint.solutionSteps.map((step, index) => (
                      <li key={step}>
                        <span className="lx-step-num">{index + 1}</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="lx-field">
                  <span className="lx-field-label">What we will build</span>
                  <ul className="lx-bullet-list">
                    {blueprint.buildList.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="lx-field-split">
                  <div className="lx-field">
                    <span className="lx-field-label">Time</span>
                    <p className="lx-field-value lx-field-strong">{blueprint.timeLabel}</p>
                    <p className="lx-field-meta">Source: {blueprint.timeSource}</p>
                  </div>

                  <div className="lx-field">
                    <span className="lx-field-label">Price</span>
                    <p className="lx-field-value lx-field-strong">{blueprint.pricing.perLaunch}</p>
                    <p className="lx-field-sub">
                      Monthly Tower option: <strong>{blueprint.pricing.monthlyTower}</strong>
                    </p>
                    <p className="lx-field-meta">Source: {blueprint.pricing.priceSource}</p>
                  </div>
                </div>

                <div className="lx-field">
                  <span className="lx-field-label">Source</span>
                  {blueprint.missingSource ? (
                    <div className="lx-source-missing" role="alert">
                      <p className="lx-source-missing-title">
                        Source needed. Please give source.
                      </p>
                      <p className="lx-source-missing-desc">
                        {blueprint.missingSourceReason ||
                          "We never guess prices, dates, offers, or locations."}
                      </p>
                      <form className="lx-inline-source-form" onSubmit={handleInlineSourceSubmit}>
                        <label htmlFor="luxor-inline-source" className="sr-only">
                          Provide verified source
                        </label>
                        <input
                          id="luxor-inline-source"
                          type="text"
                          className="lx-inline-source-input"
                          value={inlineSource}
                          onChange={(e) => setInlineSource(e.target.value)}
                          placeholder="Example: Developer PDF — AED 1.4M, handover Q4 2027, 60/40 plan"
                          disabled={isThinking}
                        />
                        <button
                          type="submit"
                          className="lx-btn-secondary lx-inline-source-btn"
                          disabled={isThinking || !inlineSource.trim()}
                        >
                          Add Source
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="lx-source-ok">
                      <p className="lx-field-value lx-source-verified">{blueprint.sourceLabel}</p>
                      <ul className="lx-source-details">
                        {blueprint.sourceDetails.map((detail) => (
                          <li key={detail}>{detail}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="lx-card-actions">
                <button
                  type="button"
                  className="lx-btn-primary"
                  onClick={() => void handleApprove()}
                  disabled={isApproving || isThinking || blueprint.missingSource}
                >
                  {isApproving ? "Starting..." : "Approve and Build"}
                </button>
                <button
                  type="button"
                  className="lx-btn-secondary"
                  onClick={handleAskToChange}
                  disabled={isApproving || isThinking}
                >
                  Ask to Change
                </button>
              </div>
            </section>
          )}

          {/* SCREEN 4 — APPROVAL & PROOF CARD */}
          {proof && (
            <section
              ref={resultCardRef}
              className="lx-glass-card lx-proof-card"
              aria-label="Automation started and proof"
            >
              <div className="lx-success-banner">
                <div className="lx-big-tick" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="lx-success-title">Automation started.</h2>
                  <p className="lx-success-sub">
                    Your approval is saved with full proof. Reference: {proof.proofId}
                  </p>
                </div>
              </div>

              <div className="lx-field-list">
                <div className="lx-field">
                  <span className="lx-field-label">What was planned</span>
                  <p className="lx-field-value lx-field-strong">{proof.plannedSummary}</p>
                  <ol className="lx-numbered-list lx-compact-list">
                    {proof.plannedSteps.map((step, index) => (
                      <li key={step}>
                        <span className="lx-step-num">{index + 1}</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="lx-field">
                  <span className="lx-field-label">What you approved</span>
                  <ul className="lx-bullet-list">
                    {proof.approvedBuildList.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <p className="lx-field-meta">
                    {proof.approvedPrice} · {proof.approvedTime}
                  </p>
                </div>

                <div className="lx-field">
                  <span className="lx-field-label">What is being built now</span>
                  <ul className="lx-build-progress">
                    {proof.buildingNow.map((entry) => (
                      <li key={entry.item}>
                        <span className="lx-build-item">{entry.item}</span>
                        <span className="lx-build-state">{entry.status}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="lx-field">
                  <span className="lx-field-label">When it started</span>
                  <p className="lx-field-value lx-field-strong">
                    {formattedStartTime || "Just now"}
                  </p>
                </div>
              </div>

              {showDetailedProof && (
                <div className="lx-proof-ledger" aria-label="Verified proof details">
                  <div className="lx-proof-ledger-head">
                    <span className="lx-field-label">Verified Proof Record</span>
                    <button
                      type="button"
                      className="lx-link-btn"
                      onClick={() => void handleCopyProof()}
                    >
                      {copiedProof ? "Copied" : "Copy proof"}
                    </button>
                  </div>
                  <p className="lx-proof-meta-line">
                    <strong>Proof ID:</strong> {proof.proofId}
                  </p>
                  <p className="lx-proof-meta-line">
                    <strong>Source:</strong> {proof.sourceLabel}
                  </p>
                  <ul className="lx-source-details">
                    {proof.sourceDetails.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                  <p className="lx-proof-meta-line">
                    <strong>Your original request:</strong> {proof.originalMessage}
                  </p>
                </div>
              )}

              <div className="lx-card-actions">
                <button
                  type="button"
                  className="lx-btn-primary"
                  onClick={() => setShowDetailedProof((prev) => !prev)}
                >
                  {showDetailedProof ? "Hide Proof" : "View Proof"}
                </button>
                <button
                  type="button"
                  className="lx-btn-secondary"
                  onClick={handleStartNewProblem}
                >
                  Start New Problem
                </button>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* HOW IT WORKS MODAL */}
      {howItWorksOpen && (
        <div
          className="lx-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="how-it-works-title"
          onClick={() => setHowItWorksOpen(false)}
        >
          <div className="lx-glass-card lx-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="lx-modal-head">
              <h2 id="how-it-works-title" className="lx-card-title">
                How it works
              </h2>
              <button
                type="button"
                className="lx-btn-secondary lx-btn-compact"
                onClick={() => setHowItWorksOpen(false)}
              >
                Close
              </button>
            </div>

            <ol className="lx-how-steps">
              <li>
                <span className="lx-step-num">1</span>
                <div>
                  <strong>Tell us your problem</strong>
                  <p>Type what you need in plain language — just like sending a WhatsApp message.</p>
                </div>
              </li>
              <li>
                <span className="lx-step-num">2</span>
                <div>
                  <strong>Review your simple blueprint</strong>
                  <p>
                    See 3 clear steps, what we will build, delivery days, price, and exact source.
                    We never guess prices, dates, offers, or locations.
                  </p>
                </div>
              </li>
              <li>
                <span className="lx-step-num">3</span>
                <div>
                  <strong>Approve and see proof</strong>
                  <p>
                    Click Approve and Build. We start immediately and show clear proof of what was
                    planned, approved, and started.
                  </p>
                </div>
              </li>
            </ol>

            <div className="lx-modal-foot">
              <button
                type="button"
                className="lx-btn-primary"
                onClick={() => setHowItWorksOpen(false)}
              >
                Start Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
