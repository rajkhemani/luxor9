"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { PROBLEM_COPY } from "@/lib/marketing-copy";

function FractureItem({
  label,
  index,
  progress,
  reduce,
}: {
  label: string;
  index: number;
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
  reduce: boolean | null;
}) {
  const x = useTransform(progress, [0.15, 0.55], [0, (index - 3) * 18]);
  const opacity = useTransform(progress, [0.15, 0.55], [0.45, 1]);
  return (
    <motion.li style={reduce ? undefined : { x, opacity }}>{label}</motion.li>
  );
}

export function ProblemFracture() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  return (
    <section ref={ref} className="mkt-section problem-fracture" id="problem-fracture">
      <p className="mkt-eyebrow">{PROBLEM_COPY.eyebrow}</p>
      <h2>{PROBLEM_COPY.headline}</h2>
      <p className="mkt-support">{PROBLEM_COPY.support}</p>
      <ul className="fracture-list">
        {PROBLEM_COPY.fractures.map((label, i) => (
          <FractureItem
            key={label}
            label={label}
            index={i}
            progress={scrollYProgress}
            reduce={reduce}
          />
        ))}
      </ul>
      <p className="muted fracture-footnote">
        See Trust gates in Tower → <a href="/approvals">/approvals</a>
      </p>
    </section>
  );
}
