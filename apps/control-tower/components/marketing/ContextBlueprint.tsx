"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { RE_BOTTLENECKS } from "@/lib/marketing-copy";

const STEPS = [
  "01 Capture intent",
  "02 Classify risk",
  "03 Route authority",
  "04 Record evidence",
] as const;

export function ContextBlueprint() {
  const [bottleneck, setBottleneck] =
    useState<(typeof RE_BOTTLENECKS)[number]>("Launch brief chaos");

  const title = useMemo(() => {
    switch (bottleneck) {
      case "Approval latency":
        return "Policy-aware approval orchestration";
      case "Evidence gaps":
        return "Evidence-bound research loop";
      case "Channel publish risk":
        return "Trust-gated publish path";
      default:
        return "Policy-aware launch orchestration";
    }
  }, [bottleneck]);

  return (
    <section className="mkt-section context-blueprint" id="context-blueprint">
      <h2>Where is your launch losing time?</h2>
      <p className="mkt-support">
        Choose an operating context and bottleneck. LUXOR9 frames the first execution blueprint for
        review.
      </p>
      <div className="blueprint-grid">
        <div className="blueprint-controls">
          <label>
            <span className="mkt-eyebrow">Context</span>
            <select value="Real Estate" disabled>
              <option>Real Estate</option>
            </select>
          </label>
          <fieldset>
            <legend className="mkt-eyebrow">Bottleneck</legend>
            {RE_BOTTLENECKS.map((b) => (
              <label key={b} className="blueprint-radio">
                <input
                  type="radio"
                  name="bottleneck"
                  checked={bottleneck === b}
                  onChange={() => setBottleneck(b)}
                />
                {b}
              </label>
            ))}
          </fieldset>
        </div>
        <div className="blueprint-preview">
          <p className="mkt-eyebrow">Your execution blueprint · Draft / Real Estate</p>
          <h3>{title}</h3>
          <ol>
            {STEPS.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <p className="muted">Default context: Dubai · residential</p>
          <Link href="/command?preset=dubai-launch">
            <button type="button">Run this brief in Command Bridge</button>
          </Link>
        </div>
      </div>
    </section>
  );
}
