"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { GATE_CHECKS, THEATER_EVENTS } from "@/lib/marketing-copy";

export function VerificationTheater() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(-1);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (reduce) {
      setStep(THEATER_EVENTS.length - 1);
      setPlaying(false);
      return;
    }
    if (!playing) return;
    if (step >= THEATER_EVENTS.length - 1) {
      setPlaying(false);
      return;
    }
    const id = window.setTimeout(() => setStep((s) => s + 1), 550);
    return () => window.clearTimeout(id);
  }, [playing, step, reduce]);

  const gatePassed = step >= THEATER_EVENTS.length - 2;

  return (
    <section className="mkt-section verification-theater" id="verification-theater">
      <h2>Intelligence is not enough. It must execute.</h2>
      <p className="mkt-support">
        Every action advances through context, authority, policy, and verification before the
        system writes evidence.
      </p>
      <div className="theater-grid">
        <ol className="theater-timeline">
          {THEATER_EVENTS.map((ev, i) => (
            <li key={ev.t} className={i <= step ? "is-on" : ""}>
              <span className="theater-t">{ev.t}</span>
              <strong>{ev.event}</strong>
              <span className="muted">{ev.line}</span>
            </li>
          ))}
        </ol>
        <div className="theater-gate">
          <p className="mkt-eyebrow">Verification gate</p>
          <p className={`gate-status${gatePassed ? " is-passed" : ""}`}>
            {gatePassed ? "PASSED" : "UNVERIFIED"}
          </p>
          <ul className="gate-checks">
            {GATE_CHECKS.map((c, i) => (
              <li key={c} className={gatePassed || i < Math.max(0, step - 1) ? "is-on" : ""}>
                {c}
              </li>
            ))}
          </ul>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              if (reduce) {
                setStep(THEATER_EVENTS.length - 1);
                setPlaying(false);
                return;
              }
              setStep(-1);
              setPlaying(true);
            }}
          >
            Replay proof
          </button>
          <p className="muted demo-label">Demonstration record, not live production evidence.</p>
        </div>
      </div>
    </section>
  );
}
