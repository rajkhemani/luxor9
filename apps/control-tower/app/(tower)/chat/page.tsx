"use client";

import { FormEvent, useState } from "react";
import { client, type Workflow } from "@/lib/api";

type Msg = { role: "user" | "assistant"; text: string };

export default function ChatPage() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      text:
        "Describe a real-estate development problem. I will interview you one question at a time — no automation until I fully understand and you confirm.",
    },
  ]);
  const [input, setInput] = useState("");
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [awaiting, setAwaiting] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(message: string) {
    setBusy(true);
    setError(null);
    setMessages((m) => [...m, { role: "user", text: message }]);
    try {
      const res = await client.chat(message, workflow?.id);
      setWorkflow(res.workflow);
      setAwaiting(res.awaiting);
      setMessages((m) => [...m, { role: "assistant", text: res.reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chat failed");
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || busy) return;
    const message = input.trim();
    setInput("");
    await send(message);
  }

  const interviewConfidence =
    (workflow?.context as { interview?: { confidence?: number } } | undefined)?.interview
      ?.confidence;

  return (
    <section>
      <h1>Command Chat</h1>
      <p className="muted">
        Interview Me → confirm intent → blueprint gate → hierarchical CMO execution.
      </p>
      <div className="panel">
        <div className="chat-log">
          {messages.map((m, i) => (
            <div key={i} className={`bubble ${m.role}`}>
              {m.text}
            </div>
          ))}
        </div>
        {workflow && (
          <p className="muted">
            Workflow <span className="badge">{workflow.status}</span>
            {awaiting && (
              <>
                {" "}
                · awaiting <span className="badge">{awaiting}</span>
              </>
            )}
            {typeof interviewConfidence === "number" && workflow.status === "draft" && (
              <> · confidence ~{interviewConfidence}%</>
            )}
            {" · "}
            {workflow.id}
          </p>
        )}
        {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
        <form className="composer" onSubmit={onSubmit}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. Market-to-launch intel for a Creek Harbour tower"
            disabled={busy}
          />
          <button type="submit" disabled={busy}>
            Send
          </button>
        </form>
        {awaiting === "interview_confirm" && (
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
            <button type="button" disabled={busy} onClick={() => send("yes")}>
              Confirm understanding
            </button>
            <button type="button" disabled={busy} onClick={() => send("refine")}>
              Refine
            </button>
          </div>
        )}
        {workflow?.status === "awaiting_blueprint_approval" && (
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
            <button type="button" disabled={busy} onClick={() => send("approve")}>
              Approve blueprint
            </button>
            <button
              type="button"
              className="danger"
              disabled={busy}
              onClick={() => send("decline")}
            >
              Decline
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
