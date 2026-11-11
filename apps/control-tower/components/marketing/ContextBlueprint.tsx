"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CONTEXT_BLUEPRINTS,
  RE_BOTTLENECKS,
  type ReBottleneck,
} from "@/lib/marketing-copy";

export function ContextBlueprint() {
  const [bottleneck, setBottleneck] = useState<ReBottleneck>("Launch brief chaos");
  const plan = useMemo(() => CONTEXT_BLUEPRINTS[bottleneck], [bottleneck]);
  const href = `/command?preset=${encodeURIComponent(plan.preset)}&bottleneck=${encodeURIComponent(bottleneck)}&brief=${encodeURIComponent(plan.brief)}`;

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
          <h3>{plan.title}</h3>
          <ol>
            {plan.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <p className="muted">Default context: Dubai · residential</p>
          <Link href={href}>
            <button type="button">Run this brief in Command Bridge</button>
          </Link>
        </div>
      </div>
    </section>
  );
}
