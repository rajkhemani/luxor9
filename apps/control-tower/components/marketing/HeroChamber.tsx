"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { HERO_COPY } from "@/lib/marketing-copy";

const HeroScene = dynamic(
  () => import("./HeroScene").then((m) => m.HeroScene),
  {
    ssr: false,
    loading: () => <div className="hero-scene hero-scene-fallback" aria-hidden />,
  },
);

export function HeroChamber() {
  const reduce = useReducedMotion();
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const showScene = !reduce && wide;

  const item = (delay: number) =>
    reduce
      ? { initial: { opacity: 1, y: 0 }, animate: { opacity: 1, y: 0 } }
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { delay, duration: 0.45, ease: "easeOut" as const },
        };

  return (
    <section className="hero-chamber" id="hero-chamber" aria-label="LUXOR9 hero">
      {showScene ? <HeroScene /> : <div className="hero-scene hero-scene-fallback" aria-hidden />}
      <div className="hero-copy">
        <motion.p className="hero-brand brand" {...item(0.12)}>
          LUXOR<span>9</span>
        </motion.p>
        <motion.h1 {...item(0.32)}>{HERO_COPY.headline}</motion.h1>
        <motion.p className="hero-support" {...item(0.48)}>
          {HERO_COPY.support}
        </motion.p>
        <motion.div className="hero-ctas" {...item(0.64)}>
          <Link href="/command">
            <button type="button">{HERO_COPY.primaryCta}</button>
          </Link>
          <a href="#accountable-route">
            <button type="button" className="secondary">
              {HERO_COPY.secondaryCta}
            </button>
          </a>
        </motion.div>
        <motion.p className="hero-micro muted" {...item(0.72)}>
          {HERO_COPY.micro}
        </motion.p>
      </div>
    </section>
  );
}
