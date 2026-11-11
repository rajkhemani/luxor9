"use client";

import { motion, useReducedMotion } from "framer-motion";
import { PROOF_QUESTIONS } from "@/lib/marketing-copy";

export function ProofAndTrust() {
  const reduce = useReducedMotion();
  return (
    <section className="mkt-section proof-and-trust" id="proof-and-trust">
      <h2>AI should not only act. It should prove what it did.</h2>
      <p className="mkt-support">
        The record below is interface architecture for a representative workflow. Live deployments
        bind these fields to real events.
      </p>
      <ol className="proof-list">
        {PROOF_QUESTIONS.map((item, i) => (
          <motion.li
            key={item.q}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
          >
            <span>
              <em>{String(i + 1).padStart(2, "0")}</em> {item.q}
            </span>
            <strong>{item.a}</strong>
          </motion.li>
        ))}
      </ol>
      <div className="before-after">
        <div>
          <p className="mkt-eyebrow">Before / fragmented</p>
          <h3>Many systems. No accountable execution layer.</h3>
          <p className="muted">Email · CRM · Documents · Approvals · People · Dashboards</p>
        </div>
        <div>
          <p className="mkt-eyebrow">After / orchestrated</p>
          <h3>The same systems. One controlled path through them.</h3>
          <p className="muted">Intent · Authority · Action · Evidence</p>
        </div>
      </div>
    </section>
  );
}
