"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  LUXOR_CAPABILITIES,
  statusLabel,
  type CapabilityStatus,
} from "@/lib/luxor-brand";

type StackStatus = {
  enabled: boolean;
  agents?: Array<{ name: string; path: string }>;
  connectivity?: Record<string, unknown>;
  coworker_hub?: string;
  duo_skin?: string;
  intelligence?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

function badgeClass(status: CapabilityStatus): string {
  if (status === "live") return "badge badge-live";
  if (status === "wired") return "badge badge-wired";
  if (status === "shell") return "badge badge-shell";
  return "badge";
}

export default function LuxorStackPage() {
  const [status, setStatus] = useState<StackStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/agui/status`, { cache: "no-store" });
        if (!res.ok) throw new Error(await res.text());
        const body = (await res.json()) as StackStatus;
        if (!cancelled) setStatus(body);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "status unavailable");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section>
      <h1>Luxor Stack</h1>
      <p className="muted">
        One branded surface for the full agent workforce: Command Bridge, skins, Live UI, research,
        and the Orchestrator Graph. Vendor kit names stay internal.
      </p>

      <div className="panel">
        <h2>Engine link</h2>
        {error ? (
          <p className="muted">API status offline: {error}</p>
        ) : status ? (
          <ul className="stack-meta">
            <li>
              Orchestrator AG-UI:{" "}
              <strong>{status.enabled ? "connected" : "disabled"}</strong>
            </li>
            <li>
              Agents:{" "}
              {(status.agents || []).map((a) => a.name).join(", ") || "none"}
            </li>
            <li>{status.coworker_hub || "Coworker Hub: attach this AG-UI URL as a bot"}</li>
            <li>{status.duo_skin || "Duo Skin: same bot, proactive layout later"}</li>
          </ul>
        ) : (
          <p className="muted">Checking engine…</p>
        )}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
          <Link href="/command">
            <button type="button">Open Command Bridge</button>
          </Link>
          <Link href="/chat">
            <button type="button" className="secondary">
              Classic Chat
            </button>
          </Link>
          <Link href="/atelier">
            <button type="button" className="secondary">
              UI Atelier
            </button>
          </Link>
        </div>
      </div>

      <div className="capability-grid" style={{ marginTop: "1.25rem" }}>
        {LUXOR_CAPABILITIES.map((cap) => (
          <article key={cap.id} id={cap.id} className="capability-card">
            <div className="capability-head">
              <h2>{cap.label}</h2>
              <span className={badgeClass(cap.status)}>{statusLabel(cap.status)}</span>
            </div>
            <p className="muted">{cap.blurb}</p>
            {cap.href ? (
              <Link href={cap.href} className="capability-link">
                Open →
              </Link>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
