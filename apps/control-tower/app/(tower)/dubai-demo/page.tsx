"use client";

import { FormEvent, useState } from "react";
import {
  previewDubaiApproveLiveRead,
  resetDemoState,
  type DubaiApproveLiveDisplay,
} from "@/lib/demo-store";

type Stage = "idle" | "interview" | "researching" | "card" | "calling" | "live_display";

type Msg = { role: "user" | "assistant"; text: string };

const SPEAK_BRIEF =
  "Market-to-launch intelligence for a Dubai Creek Harbour residential tower, Q2 launch, AED 2.5 to 6 million.";

const INTERVIEW_Q =
  "Interview Me — before I plan: is the primary buyer segment GCC HNW end-users, South Asian investors, or both?";

function loadSeed() {
  resetDemoState();
  return previewDubaiApproveLiveRead();
}

export default function DubaiDemoPreviewPage() {
  const [stage, setStage] = useState<Stage>("idle");
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text: "Preview of the Dubai voice-first Approve card (D-011 → D-012). No cloud call — in-memory demo store only.",
    },
  ]);
  const [typed, setTyped] = useState("");
  const [segment, setSegment] = useState("");
  const [live, setLive] = useState<DubaiApproveLiveDisplay | null>(null);
  const [busy, setBusy] = useState(false);
  const [seed] = useState(loadSeed);

  function push(role: Msg["role"], text: string) {
    setMessages((m) => [...m, { role, text }]);
  }

  function startBrief(text: string) {
    if (busy || stage !== "idle") return;
    setBusy(true);
    push("user", text);
    window.setTimeout(() => {
      push("assistant", INTERVIEW_Q);
      setStage("interview");
      setBusy(false);
    }, 450);
  }

  function answerInterview(choice: string) {
    if (busy || stage !== "interview") return;
    setBusy(true);
    setSegment(choice);
    push("user", choice);
    setStage("researching");
    push(
      "assistant",
      "Got it. Running Market Researcher + Competitor Analyst in parallel, then Strategy Writer and Evaluator…",
    );
    window.setTimeout(() => {
      const evidenceLines = seed.evidence
        .map((e) => `• ${e.title}\n  ${e.excerpts[0] ?? ""}`)
        .join("\n");
      const claimLines = seed.claims
        .map((c) => `• [${c.status}] ${c.claim_text}`)
        .join("\n");
      push(
        "assistant",
        `Evidence gathered (synthetic fixtures — say so in the pitch):\n${evidenceLines}\n\nClaims:\n${claimLines}\n\nOne automation card is ready below.`,
      );
      setStage("card");
      setBusy(false);
    }, 900);
  }

  function onApprove() {
    if (busy || stage !== "card") return;
    setBusy(true);
    setStage("calling");
    push(
      "assistant",
      "Approve pressed → mock D-012 read-only live call (display only). No outbound send.",
    );
    window.setTimeout(() => {
      resetDemoState();
      const payload = previewDubaiApproveLiveRead();
      setLive(payload);
      setStage("live_display");
      push(
        "assistant",
        `Live read returned for display only.\nWorkflow ${payload.workflow_id} · status ${payload.display.status}\nPending approvals: ${payload.display.pending_approvals} · Open exceptions: ${payload.display.open_exceptions}`,
      );
      setBusy(false);
    }, 700);
  }

  function onReset() {
    resetDemoState();
    setStage("idle");
    setLive(null);
    setSegment("");
    setTyped("");
    setBusy(false);
    setMessages([
      {
        role: "assistant",
        text: "Preview reset. Speak or type a Dubai Creek brief to walk the Approve card again.",
      },
    ]);
  }

  function onTypeSubmit(e: FormEvent) {
    e.preventDefault();
    if (!typed.trim()) return;
    const text = typed.trim();
    setTyped("");
    startBrief(text);
  }

  return (
    <section>
      <h1>Dubai demo — Approve card preview</h1>
      <p className="muted">
        Visual mock of speak → Interview Me → evidence → one card → Approve = D-012 read-only
        display. Uses <code>demo-store</code>. Not wired to the real cloud backend.
      </p>
      <p>
        <span className="badge badge-shell">preview_mock</span>{" "}
        <span className="badge">D-012 display only</span>{" "}
        <span className="badge">no outbound send</span>
      </p>

      <div className="panel">
        <div className="chat-log">
          {messages.map((m, i) => (
            <div key={i} className={`bubble ${m.role}`}>
              {m.text}
            </div>
          ))}
        </div>

        {stage === "idle" && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            <button type="button" disabled={busy} onClick={() => startBrief(SPEAK_BRIEF)}>
              Speak brief
            </button>
            <form className="composer" onSubmit={onTypeSubmit} style={{ flex: 1, minWidth: 220 }}>
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder="Or type a Dubai brief…"
                disabled={busy}
              />
              <button type="submit" disabled={busy || !typed.trim()}>
                Send
              </button>
            </form>
          </div>
        )}

        {stage === "interview" && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.5rem" }}>
            <button type="button" disabled={busy} onClick={() => answerInterview("Both GCC HNW and South Asian investors")}>
              Both
            </button>
            <button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={() => answerInterview("Primarily GCC HNW end-users")}
            >
              GCC HNW
            </button>
            <button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={() => answerInterview("Primarily South Asian investors")}
            >
              South Asia
            </button>
          </div>
        )}

        {(stage === "card" || stage === "calling" || stage === "live_display") && (
          <div className="panel" style={{ marginTop: "1rem" }}>
            <h2 style={{ marginTop: 0 }}>Campaign draft</h2>
            <p className="muted">Exactly one automation card · one Approve (D-011).</p>
            <p>
              <strong>Creek Harbour Q2 launch pack</strong>
              {segment ? ` · segment: ${segment}` : null}
            </p>
            <ul className="muted" style={{ paddingLeft: "1.1rem" }}>
              <li>Channel: sandbox preview (mock)</li>
              <li>Action binding: campaign.publish.read_only_live_display</li>
              <li>Resource: {seed.approval?.resource_id ?? "creek_harbour_q2"}</li>
            </ul>
            {stage === "card" && (
              <button type="button" disabled={busy} onClick={onApprove}>
                Approve
              </button>
            )}
            {stage === "calling" && <p className="muted">Calling live API (mock)…</p>}
            {stage === "live_display" && live && (
              <div style={{ marginTop: "1rem" }}>
                <p>
                  <span className="badge badge-live">live read · display only</span>
                </p>
                <p className="muted">{live.note}</p>
                <table>
                  <tbody>
                    <tr>
                      <th>Fetched</th>
                      <td>{new Date(live.fetched_at).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <th>Workflow</th>
                      <td>
                        {live.workflow_id} · {live.display.status}
                      </td>
                    </tr>
                    <tr>
                      <th>Objective</th>
                      <td>{live.display.objective}</td>
                    </tr>
                    <tr>
                      <th>Counts</th>
                      <td>
                        active {live.display.active_workflows} · pending approvals{" "}
                        {live.display.pending_approvals} · exceptions{" "}
                        {live.display.open_exceptions}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <h2>Evidence on card</h2>
                <ul style={{ paddingLeft: "1.1rem" }}>
                  {live.evidence.map((e) => (
                    <li key={e.source_id}>
                      {e.title}
                      <div className="muted">{e.excerpts[0]}</div>
                    </li>
                  ))}
                </ul>
                <h2>Claims</h2>
                <ul style={{ paddingLeft: "1.1rem" }}>
                  {live.claims.map((c) => (
                    <li key={c.id}>
                      <span className="badge">{c.status}</span> {c.claim_text}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: "1rem" }}>
          <button type="button" className="secondary" onClick={onReset}>
            Reset preview
          </button>
        </div>
      </div>
    </section>
  );
}
