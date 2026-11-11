"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LUXOR_CAPABILITIES, statusLabel } from "@/lib/luxor-brand";
import { PRODUCT_SURFACES } from "@/lib/marketing-copy";
import { client, type AguiStatus, type OverviewData } from "@/lib/api";

export function ProductChamber() {
  const [tab, setTab] = useState<(typeof PRODUCT_SURFACES)[number]["id"]>("tower");
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [agui, setAgui] = useState<AguiStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [ovResult, stResult] = await Promise.allSettled([
        client.overview(),
        client.aguiStatus(),
      ]);
      if (cancelled) return;

      const ov = ovResult.status === "fulfilled" ? ovResult.value : null;
      const st = stResult.status === "fulfilled" ? stResult.value : null;
      setOverview(ov);
      setAgui(st);

      if (ov) {
        setError(null);
        return;
      }

      const ovWhy =
        ovResult.status === "rejected"
          ? ovResult.reason instanceof Error
            ? ovResult.reason.message
            : String(ovResult.reason)
          : "";
      const lower = ovWhy.toLowerCase();
      if (
        lower.includes("401") ||
        lower.includes("403") ||
        lower.includes("unauthorized") ||
        lower.includes("missing bearer") ||
        lower.includes("bearer token") ||
        lower.includes("demo auth is disabled") ||
        lower.includes("authentication")
      ) {
        setError("Live Tower metrics require a signed-in session.");
      } else if (!ov && !st) {
        setError("API warming or unreachable");
      } else {
        setError("Overview unavailable — Command / Stack panels may still respond.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const counts = useMemo(() => {
    const acc = { live: 0, wired: 0, shell: 0, planned: 0 };
    for (const c of LUXOR_CAPABILITIES) acc[c.status] += 1;
    return acc;
  }, []);

  const surface = PRODUCT_SURFACES.find((s) => s.id === tab) ?? PRODUCT_SURFACES[0];

  return (
    <section className="mkt-section product-chamber" id="product-chamber">
      <h2>Dense where operators need precision.</h2>
      <p className="mkt-support">
        The public page explains the system. The product gives a live view of agents, approvals,
        execution, cost, health, and evidence.
      </p>

      <div className="product-segments" role="tablist" aria-label="Product surfaces">
        {PRODUCT_SURFACES.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={tab === s.id}
            className={`product-seg${tab === s.id ? " is-active" : ""}`}
            onClick={() => setTab(s.id)}
          >
            {s.title}
          </button>
        ))}
      </div>

      <div className="product-frame" role="tabpanel">
        <h3>{surface.title}</h3>
        <p>{surface.blurb}</p>
        {tab === "tower" ? (
          overview ? (
            <div className="grid">
              <div className="stat">
                <strong>{overview.active_workflows}</strong>
                Active workflows
              </div>
              <div className="stat">
                <strong>{overview.pending_approvals}</strong>
                Pending approvals
              </div>
              <div className="stat">
                <strong>{overview.completed_workflows}</strong>
                Completed
              </div>
              <div className="stat">
                <strong>{overview.open_exceptions}</strong>
                Exceptions
              </div>
            </div>
          ) : (
            <p className="muted">{error ?? "Contacting Intelligence API…"}</p>
          )
        ) : null}
        {tab === "command" ? (
          <p className="muted">
            Orchestrator AG-UI:{" "}
            <strong>
              {agui ? (agui.enabled ? "connected" : "disabled") : error ?? "checking…"}
            </strong>
            {agui?.agents?.length
              ? ` · Agents: ${agui.agents.map((a) => a.name).join(", ")}`
              : null}
          </p>
        ) : null}
        {tab === "stack" ? (
          <p className="muted">
            {statusLabel("live")} {counts.live} · {statusLabel("wired")} {counts.wired} ·{" "}
            {statusLabel("shell")} {counts.shell} · {statusLabel("planned")} {counts.planned}
          </p>
        ) : null}
        {tab === "api" ? (
          <pre className="api-snippet">
            {JSON.stringify(
              overview ?? agui ?? { status: error ?? "warming" },
              null,
              2,
            )}
          </pre>
        ) : null}
        {surface.href.startsWith("#") ? (
          <a href={surface.href}>
            <button type="button" style={{ marginTop: "1rem" }}>
              {surface.cta}
            </button>
          </a>
        ) : (
          <Link href={surface.href}>
            <button type="button" style={{ marginTop: "1rem" }}>
              {surface.cta}
            </button>
          </Link>
        )}
      </div>
    </section>
  );
}
