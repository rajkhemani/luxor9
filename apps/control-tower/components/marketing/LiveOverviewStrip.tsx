"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { client, type AguiStatus, type OverviewData } from "@/lib/api";
import { isAuthFailureMessage } from "@/lib/api-errors";

type StripState = "loading" | "live" | "cold" | "gated" | "down";

function classifyOverviewError(why: string): { state: StripState; message: string } {
  const lower = why.toLowerCase();
  if (isAuthFailureMessage(why)) {
    return {
      state: "gated",
      message: "Live metrics require a Tower session — open Control Tower after sign-in.",
    };
  }
  if (lower.includes("fetch") || lower.includes("network") || lower.includes("unreachable")) {
    return {
      state: "down",
      message: "API unreachable. Start the API or check NEXT_PUBLIC_API_BASE_URL.",
    };
  }
  return {
    state: "cold",
    message: "API warming — Tower remains browsable.",
  };
}

export function LiveOverviewStrip() {
  const [state, setState] = useState<StripState>("loading");
  const [data, setData] = useState<OverviewData | null>(null);
  const [agui, setAgui] = useState<AguiStatus | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [message, setMessage] = useState("Contacting Intelligence API…");

  useEffect(() => {
    let cancelled = false;
    let delay = 15_000;
    let timer: number | undefined;

    const tick = async () => {
      try {
        const [ov, st] = await Promise.all([
          client.overview(),
          client.aguiStatus().catch(() => null),
        ]);
        if (cancelled) return;
        setData(ov);
        setAgui(st);
        setUpdatedAt(new Date());
        setState("live");
        setMessage(`Updated ${new Date().toLocaleTimeString()}`);
        delay = 15_000;
      } catch (err) {
        if (cancelled) return;
        const why = err instanceof Error ? err.message : "unreachable";
        const classified = classifyOverviewError(why);
        setState(classified.state);
        setMessage(classified.message);
        delay = classified.state === "gated" ? 60_000 : Math.min(delay * 2, 60_000);
      } finally {
        if (!cancelled) timer = window.setTimeout(tick, delay);
      }
    };

    void tick();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  return (
    <section className="mkt-section live-overview-strip" id="live-overview-strip">
      <div className="live-head">
        <h2>Live operators see numbers, not slides.</h2>
        <p className="muted" aria-live="polite">
          <span
            className={`mkt-health-pip is-${
              state === "live"
                ? "up"
                : state === "down"
                  ? "down"
                  : state === "gated"
                    ? "gated"
                    : "cold"
            }`}
          />{" "}
          {message}
          {agui ? ` · Orchestrator: ${agui.enabled ? "connected" : "disabled"}` : null}
        </p>
      </div>
      <div className="grid">
        <div className="stat">
          <strong>{data?.active_workflows ?? "—"}</strong>
          Active workflows
        </div>
        <div className="stat">
          <strong>{data?.pending_approvals ?? "—"}</strong>
          Pending approvals
        </div>
        <div className="stat">
          <strong>{data?.completed_workflows ?? "—"}</strong>
          Completed
        </div>
        <div className="stat">
          <strong>{data?.open_exceptions ?? "—"}</strong>
          Exceptions
        </div>
      </div>
      {data?.recent_workflows?.length ? (
        <ul className="live-recent">
          {data.recent_workflows.slice(0, 3).map((w) => (
            <li key={w.id}>
              <Link href={`/workflows/${w.id}`}>{w.objective}</Link>
              <span className="muted"> · {w.status}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">
          No runs yet. Open Command Bridge with a Dubai launch brief — or call demo seed from the API.
        </p>
      )}
      <p>
        <Link href="/" className="capability-link">
          Open full overview
        </Link>
        {updatedAt ? (
          <span className="muted"> · last success {updatedAt.toLocaleTimeString()}</span>
        ) : null}
      </p>
    </section>
  );
}
