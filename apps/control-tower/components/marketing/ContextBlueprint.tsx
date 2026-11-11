"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { RE_BOTTLENECKS } from "@/lib/marketing-copy";

type Bottleneck = (typeof RE_BOTTLENECKS)[number];

const BLUEPRINTS: Record<
  Bottleneck,
  { title: string; steps: string[]; preset: string; brief: string }
> = {
  "Launch brief chaos": {
    title: "Policy-aware launch orchestration",
    steps: [
      "01 Capture Dubai launch intent",
      "02 Normalize brief into blueprint",
      "03 Route CMO specialists",
      "04 Record evidence pack",
    ],
    preset: "dubai-launch",
    brief:
      "Draft a Dubai residential launch brief, produce an approvable blueprint, and prepare evidence for Control Tower.",
  },
  "Approval latency": {
    title: "Policy-aware approval orchestration",
    steps: [
      "01 Capture publish intent",
      "02 Classify risk + approver",
      "03 Hold at Trust gate",
      "04 Record approval evidence",
    ],
    preset: "approval-latency",
    brief:
      "Create a launch blueprint that must pause for Trust approval before any consequential publish action.",
  },
  "Evidence gaps": {
    title: "Evidence-bound research loop",
    steps: [
      "01 Capture research objective",
      "02 Bind sources + claim status",
      "03 Flag UNVERIFIED gaps",
      "04 Record claim evidence",
    ],
    preset: "evidence-gaps",
    brief:
      "Run a Dubai market research loop that refuses unverified claims and lists evidence gaps for review.",
  },
  "Channel publish risk": {
    title: "Trust-gated publish path",
    steps: [
      "01 Capture channel publish intent",
      "02 Check Trust policy",
      "03 Require human approve",
      "04 Record publish evidence",
    ],
    preset: "channel-publish",
    brief:
      "Prepare a channel publish pack that cannot leave sandbox without Trust authorization and approval binding.",
  },
};

export function ContextBlueprint() {
  const [bottleneck, setBottleneck] = useState<Bottleneck>("Launch brief chaos");
  const plan = useMemo(() => BLUEPRINTS[bottleneck], [bottleneck]);
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
