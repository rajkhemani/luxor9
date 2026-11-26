"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  CopilotKitProvider,
  type Message,
  type ToolCall,
  type ToolMessage,
} from "@copilotkit/react-core/v2";
import {
  useAgent,
  useCopilotKit,
  useRenderTool,
  useRenderToolCall,
} from "@copilotkit/react-core/v2/headless";
import { LuxorKeystoneGlyph } from "@/components/brand/LuxorMarkSvg";
import { playBrandSound } from "@/lib/brand-audio";
import {
  CHAT_PLACEHOLDER,
  DUBAI_APPROVAL_PREFIX,
  DUBAI_CHANGE_PREFIX,
  DUBAI_SOURCE_PREFIX,
  formatDisplayUserMessage,
  parseDubaiToolPayload,
  QUICK_EXAMPLES,
  type DubaiPricingMode,
  type DubaiThreadState,
} from "@/lib/dubai-genui";
import {
  ApprovalSealCard,
  ProofReceiptCard,
  SimplePlanCard,
  SourceGateCard,
  WorkPreviewCard,
} from "./DubaiGenUiCards";

const DUBAI_AGENT_ID = "luxor9_dubai";

type ThemeMode = "light" | "dark";

function readMessageText(msg: Message): string {
  const content = (msg as { content?: unknown }).content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && "text" in part) {
          const text = (part as { text?: unknown }).text;
          return typeof text === "string" ? text : "";
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

type DubaiStreamContextValue = {
  toolCallParentMap: Map<string, string>;
  lastAssistantMessageId: string | null;
  isApproved: boolean;
  isRunning: boolean;
  pricingMode: DubaiPricingMode;
  selectedDeliverables: Record<number, boolean>;
  setPricingMode: (mode: DubaiPricingMode) => void;
  onSubmitSource: (sourceText: string) => void;
  onToggleDeliverable: (idx: number) => void;
  onApprove: () => void;
  onAskToChange: () => void;
  onReset: () => void;
};

const DubaiStreamContext = React.createContext<DubaiStreamContextValue | null>(null);

function ReactiveDubaiToolCard({
  name,
  toolCallId,
  rawArgs,
}: {
  name: string;
  toolCallId: string;
  rawArgs: unknown;
}) {
  const ctx = React.useContext(DubaiStreamContext);
  const payload = parseDubaiToolPayload(name, rawArgs);
  if (!ctx || !payload) return null;

  const parentId = ctx.toolCallParentMap.get(toolCallId);
  const isLatestTurn = parentId !== undefined && parentId === ctx.lastAssistantMessageId;

  switch (payload.kind) {
    case "source_gate":
      return (
        <SourceGateCard
          payload={payload}
          isInteractive={isLatestTurn && !ctx.isApproved}
          isBusy={ctx.isRunning}
          onSubmitSource={ctx.onSubmitSource}
        />
      );
    case "simple_plan":
      return (
        <SimplePlanCard
          payload={payload}
          pricingMode={ctx.pricingMode}
          selectedDeliverables={ctx.selectedDeliverables}
          isInteractive={isLatestTurn && !ctx.isApproved}
          onSelectPricingMode={ctx.setPricingMode}
          onToggleDeliverable={ctx.onToggleDeliverable}
        />
      );
    case "preview_pack":
      return <WorkPreviewCard payload={payload} />;
    case "approval_seal":
      return (
        <ApprovalSealCard
          payload={payload}
          pricingMode={ctx.pricingMode}
          isInteractive={isLatestTurn}
          isBusy={ctx.isRunning}
          isAlreadyApproved={ctx.isApproved}
          onApprove={ctx.onApprove}
          onAskToChange={ctx.onAskToChange}
        />
      );
    case "proof_receipt":
      return (
        <ProofReceiptCard
          payload={payload}
          onStartNewProblem={ctx.onReset}
        />
      );
    default:
      return null;
  }
}

function DubaiGenUiWorkspace({
  theme,
  onToggleTheme,
}: {
  theme: ThemeMode;
  onToggleTheme: () => void;
}) {
  const { agent, isReady } = useAgent({ agentId: DUBAI_AGENT_ID });
  const { copilotkit } = useCopilotKit();

  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [changeMode, setChangeMode] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pricingMode, setPricingMode] = useState<DubaiPricingMode>("per_launch");
  const [selectedDeliverables, setSelectedDeliverables] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: true,
  });

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const streamEndRef = useRef<HTMLDivElement | null>(null);
  const pendingQueueRef = useRef<string | null>(null);

  const messages: Message[] = Array.isArray(agent.messages) ? agent.messages : [];
  const agentState = (agent.state || {}) as Partial<DubaiThreadState>;
  const isRunning = Boolean(agent.isRunning) || isSending;
  const isApproved = agentState.stage === "approved";

  // Map toolCallId -> ToolMessage for CopilotKit's useRenderToolCall
  const toolMessageById = useMemo(() => {
    const map = new Map<string, ToolMessage>();
    for (const msg of messages) {
      if (msg.role === "tool" && "toolCallId" in msg && typeof msg.toolCallId === "string") {
        map.set(msg.toolCallId, msg as ToolMessage);
      }
    }
    return map;
  }, [messages]);

  // Identify the last assistant message id so only the latest turn's action cards stay active
  const lastAssistantMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      if (messages[i]?.role === "assistant") {
        return messages[i].id;
      }
    }
    return null;
  }, [messages]);

  // Build index of toolCallId -> parent assistant message id
  const toolCallParentMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const msg of messages) {
      if (msg.role === "assistant" && "toolCalls" in msg && Array.isArray(msg.toolCalls)) {
        for (const tc of msg.toolCalls) {
          map.set(tc.id, msg.id);
        }
      }
    }
    return map;
  }, [messages]);

  const dispatchToAgent = useCallback(
    async (rawText: string) => {
      const cleaned = rawText.trim();
      if (!cleaned) return;

      if (!isReady) {
        pendingQueueRef.current = cleaned;
        setIsSending(true);
        return;
      }

      setErrorMessage(null);
      setIsSending(true);
      try {
        agent.addMessage({
          id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          role: "user",
          content: cleaned,
        });
        await copilotkit.runAgent({
          agent: agent as unknown as Parameters<typeof copilotkit.runAgent>[0]["agent"],
        });
      } catch (err) {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "Could not prepare your plan right now. Please try again.",
        );
      } finally {
        setIsSending(false);
      }
    },
    [agent, copilotkit, isReady],
  );

  // Flush any click that occurred during the ~20ms initial runtime handshake
  useEffect(() => {
    if (isReady && pendingQueueRef.current) {
      const queued = pendingQueueRef.current;
      pendingQueueRef.current = null;
      void dispatchToAgent(queued);
    }
  }, [isReady, dispatchToAgent]);

  // Smooth scroll to bottom when new cards arrive
  useEffect(() => {
    streamEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isRunning]);

  // Escape closes How It Works overlay
  useEffect(() => {
    if (!howItWorksOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setHowItWorksOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [howItWorksOpen]);

  const handleToggleDeliverable = useCallback((idx: number) => {
    setSelectedDeliverables((prev) => {
      const next = { ...prev, [idx]: prev[idx] === false };
      const anyActive = [0, 1, 2].some((k) => next[k] !== false);
      return anyActive ? next : prev;
    });
  }, []);

  const handleSubmitSource = useCallback(
    (sourceText: string) => {
      playBrandSound("notification");
      void dispatchToAgent(`${DUBAI_SOURCE_PREFIX}${sourceText}`);
    },
    [dispatchToAgent],
  );

  const handleApprove = useCallback(() => {
    const bp = agentState.blueprint;
    const deliverables = bp
      ? bp.buildList.map((item, idx) =>
          selectedDeliverables[idx] === false ? `${item} (paused)` : item,
        )
      : undefined;
    playBrandSound("confirmation");
    void dispatchToAgent(
      `${DUBAI_APPROVAL_PREFIX}${JSON.stringify({ mode: pricingMode, deliverables })}`,
    );
  }, [agentState.blueprint, dispatchToAgent, pricingMode, selectedDeliverables]);

  const handleAskToChange = useCallback(() => {
    setChangeMode(true);
    setErrorMessage(null);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 40);
  }, []);

  const handleReset = useCallback(() => {
    agent.setMessages([]);
    agent.setState({
      stage: "idle",
      blueprint: null,
      previewPack: null,
      proof: null,
      policyRef: null,
    });
    agent.threadId = `thread_dubai_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setInputValue("");
    setChangeMode(false);
    setErrorMessage(null);
    setPricingMode("per_launch");
    setSelectedDeliverables({ 0: true, 1: true, 2: true });
    inputRef.current?.focus();
  }, [agent]);

  // Register strict LUXOR9 Generative UI renderer once via CopilotKit v2 headless `useRenderTool`
  useRenderTool(
    {
      name: "*",
      agentId: DUBAI_AGENT_ID,
      render: ({ name, toolCallId, parameters, args }) => (
        <ReactiveDubaiToolCard
          name={name}
          toolCallId={toolCallId}
          rawArgs={parameters ?? args}
        />
      ),
    },
    [],
  );

  const streamContextValue = useMemo<DubaiStreamContextValue>(
    () => ({
      toolCallParentMap,
      lastAssistantMessageId,
      isApproved,
      isRunning,
      pricingMode,
      selectedDeliverables,
      setPricingMode,
      onSubmitSource: handleSubmitSource,
      onToggleDeliverable: handleToggleDeliverable,
      onApprove: handleApprove,
      onAskToChange: handleAskToChange,
      onReset: handleReset,
    }),
    [
      toolCallParentMap,
      lastAssistantMessageId,
      isApproved,
      isRunning,
      pricingMode,
      selectedDeliverables,
      handleSubmitSource,
      handleToggleDeliverable,
      handleApprove,
      handleAskToChange,
      handleReset,
    ],
  );

  const renderToolCall = useRenderToolCall();

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cleaned = inputValue.trim();
    if (!cleaned || isRunning) return;
    const outbound = changeMode ? `${DUBAI_CHANGE_PREFIX}${cleaned}` : cleaned;
    setInputValue("");
    setChangeMode(false);
    void dispatchToAgent(outbound);
  }

  function handleTextareaKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const cleaned = inputValue.trim();
      if (!cleaned || isRunning) return;
      const outbound = changeMode ? `${DUBAI_CHANGE_PREFIX}${cleaned}` : cleaned;
      setInputValue("");
      setChangeMode(false);
      void dispatchToAgent(outbound);
    }
  }

  const visibleMessages = messages.filter(
    (m) => m.role === "user" || m.role === "assistant",
  );
  const hasConversation = visibleMessages.length > 0;

  return (
    <DubaiStreamContext.Provider value={streamContextValue}>
      <div className="dg-root" data-theme={theme}>
      {/* Strict 3-Zone Top Bar */}
      <header className="dg-topbar">
        <div className="dg-topbar-inner">
          <Link href="/dubai" className="dg-brand" aria-label="LUXOR9 Dubai Home">
            <LuxorKeystoneGlyph
              size={22}
              fg={theme === "dark" ? "#F3EFE6" : "#0B0D10"}
              accent={theme === "dark" ? "#2EC4B6" : "#0F766E"}
            />
            <span className="dg-brand-word">
              LUXOR<span className="dg-brand-nine">9</span>
            </span>
          </Link>

          <nav className="dg-nav" aria-label="Primary navigation">
            <button
              type="button"
              className="dg-nav-link"
              onClick={() => setHowItWorksOpen(true)}
            >
              How it works
            </button>
            <Link href="/brand" className="dg-nav-link">
              Brand Kit
            </Link>
            <button
              type="button"
              className="dg-nav-link"
              onClick={onToggleTheme}
              aria-label={theme === "light" ? "Switch to Obsidian Dark mode" : "Switch to Mineral Ivory Light mode"}
            >
              {theme === "light" ? "Dark mode" : "Light mode"}
            </button>
          </nav>

          <button
            type="button"
            className="dg-topbar-cta"
            onClick={handleReset}
          >
            New Problem
          </button>
        </div>
      </header>

      {/* Single-Column Responsive Generative Stream */}
      <main className="dg-main" id="dubai-stream-main">
        <section className={`dg-hero ${hasConversation ? "is-compact" : ""}`}>
          <p className="dg-hero-kicker">Dubai Real Estate Launch Desk · Verified Sources Only</p>
          <h1 className="dg-hero-title">
            Tell us your launch problem. Get a checked plan in minutes.
          </h1>
          <p className="dg-hero-sub">
            Chat in plain English, check every source and preview, approve with one tap, and get a
            timestamped proof receipt.
          </p>

          {!hasConversation ? (
            <div className="dg-starters" role="group" aria-label="Quick example problems">
              {QUICK_EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  className="dg-starter-btn"
                  disabled={isRunning}
                  onClick={() => void dispatchToAgent(example)}
                >
                  <span>{example}</span>
                  <span className="dg-starter-arrow" aria-hidden="true">
                    →
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </section>

        {/* Conversation & Inline Generative UI Cards */}
        <section className="dg-stream" aria-label="Conversation and live plan cards" aria-live="polite">
          {visibleMessages.map((msg) => {
            if (msg.role === "user") {
              const display = formatDisplayUserMessage(readMessageText(msg));
              return (
                <div key={msg.id} className="dg-turn dg-turn-user">
                  <div className="dg-user-msg">{display}</div>
                </div>
              );
            }

            const text = readMessageText(msg);
            const toolCalls: ToolCall[] =
              "toolCalls" in msg && Array.isArray(msg.toolCalls) ? msg.toolCalls : [];

            return (
              <div key={msg.id} className="dg-turn dg-turn-assistant">
                {text ? (
                  <div className="dg-assistant-note">
                    <span className="dg-assistant-label">LUXOR9</span>
                    <p>{text}</p>
                  </div>
                ) : null}

                {toolCalls.length > 0 ? (
                  <div className="dg-cards-stack">
                    {toolCalls.map((tc) => {
                      const rendered = renderToolCall({
                        toolCall: tc,
                        toolMessage: toolMessageById.get(tc.id),
                      });
                      if (!rendered) return null;
                      return (
                        <div key={tc.id} className="dg-card-slot">
                          {rendered}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}

          {isRunning ? (
            <div className="dg-thinking" role="status">
              <span className="dg-thinking-bar" aria-hidden="true" />
              <span>Making your simple blueprint...</span>
            </div>
          ) : null}

          {errorMessage ? (
            <div className="dg-error-banner" role="alert">
              <strong>Could not complete that step:</strong> {errorMessage}
            </div>
          ) : null}

          <div ref={streamEndRef} />
        </section>
      </main>

      {/* Bottom Thumb-Zone Composer (Compact <= 15% mobile sticky cap with header) */}
      <footer className="dg-composer-shell">
        <div className="dg-composer-inner">
          {changeMode ? (
            <div className="dg-change-banner">
              <span>Tell us what to change in your plan</span>
              <button
                type="button"
                className="dg-text-btn"
                onClick={() => setChangeMode(false)}
              >
                Cancel
              </button>
            </div>
          ) : null}

          <form onSubmit={handleFormSubmit} className="dg-composer-form">
            <label htmlFor="dubai-chat-input" className="sr-only">
              Describe your real estate problem
            </label>
            <textarea
              id="dubai-chat-input"
              ref={inputRef}
              rows={1}
              className="dg-composer-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleTextareaKeyDown}
              placeholder={
                changeMode
                  ? "Tell us what to change (example: Add Arabic brochure and 15 posts)"
                  : CHAT_PLACEHOLDER
              }
              disabled={isRunning}
            />
            <button
              type="submit"
              className="dg-composer-send"
              disabled={isRunning || !inputValue.trim()}
            >
              Send
            </button>
          </form>
        </div>
      </footer>

      {/* How It Works Dialog */}
      {howItWorksOpen ? (
        <div
          className="dg-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="how-it-works-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setHowItWorksOpen(false);
          }}
        >
          <div className="dg-modal">
            <div className="dg-modal-head">
              <div>
                <div className="dg-label-row">Simple 3-Step Process</div>
                <h2 id="how-it-works-title" className="dg-modal-title">
                  How LUXOR9 works
                </h2>
              </div>
              <button
                type="button"
                className="dg-btn-secondary dg-modal-close"
                onClick={() => setHowItWorksOpen(false)}
              >
                Close
              </button>
            </div>

            <ol className="dg-steps-list">
              <li className="dg-step-item">
                <span className="dg-step-num dg-mono">01</span>
                <div>
                  <strong>Tell us your problem</strong>
                  <p className="dg-card-desc">
                    Type in plain English or tap a starter. We never invent unit prices, handover
                    dates, offers, or locations—if a source is missing, we stop and ask.
                  </p>
                </div>
              </li>
              <li className="dg-step-item">
                <span className="dg-step-num dg-mono">02</span>
                <div>
                  <strong>Check your plan &amp; previews</strong>
                  <p className="dg-card-desc">
                    Inspect the 3 steps, sample brochure text, 10 social posts, WhatsApp follow-up
                    messages, delivery days, and clear AED pricing right inside the chat.
                  </p>
                </div>
              </li>
              <li className="dg-step-item">
                <span className="dg-step-num dg-mono">03</span>
                <div>
                  <strong>Approve and get proof</strong>
                  <p className="dg-card-desc">
                    Nothing starts until you tap Approve and Build. You receive a timestamped proof
                    receipt you can share with partners immediately.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </div>
      ) : null}
      </div>
    </DubaiStreamContext.Provider>
  );
}

export function DubaiGenUiStream() {
  const [theme, setTheme] = useState<ThemeMode>("light");

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  return (
    <CopilotKitProvider runtimeUrl="/api/copilotkit" enableInspector={false}>
      <DubaiGenUiWorkspace theme={theme} onToggleTheme={handleToggleTheme} />
    </CopilotKitProvider>
  );
}
