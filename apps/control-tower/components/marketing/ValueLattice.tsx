"use client";

import { motion, useReducedMotion } from "framer-motion";
import { VALUE_PILLARS } from "@/lib/marketing-copy";

export function ValueLattice() {
  const reduce = useReducedMotion();
  return (
    <section className="mkt-section value-lattice" id="value-lattice">
      <h2>Own the contracts. Own the evidence. Own the data.</h2>
      <p className="mkt-support">LUXOR9 sits between intelligence and action.</p>
      <div className="value-grid">
        {VALUE_PILLARS.map((p, i) => (
          <motion.article
            key={p.title}
            className="value-pillar"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
          >
            <p className="mkt-eyebrow">{p.title}</p>
            <h3>{p.headline}</h3>
            <p>{p.body}</p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
