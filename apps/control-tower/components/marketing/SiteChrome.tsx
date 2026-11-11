"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { client } from "@/lib/api";
import { errorMessageFromUnknown, isAuthFailureMessage } from "@/lib/api-errors";

type HealthState = "unknown" | "up" | "cold" | "gated" | "down";

export function SiteChrome() {
  const [health, setHealth] = useState<HealthState>("unknown");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const body = await client.health();
        if (cancelled) return;
        setHealth(body.status === "ok" || body.status === "healthy" ? "up" : "cold");
      } catch (err) {
        if (cancelled) return;
        const why = errorMessageFromUnknown(err);
        setHealth(isAuthFailureMessage(why) ? "gated" : "down");
      }
    };
    void tick();
    const id = window.setInterval(tick, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return (
    <header className="mkt-chrome">
      <Link href="/home" className="brand mkt-brand">
        LUXOR<span>9</span>
      </Link>
      <button
        type="button"
        className="mkt-menu-toggle secondary"
        aria-expanded={menuOpen}
        aria-controls="mkt-nav"
        onClick={() => setMenuOpen((v) => !v)}
      >
        Menu
      </button>
      <nav id="mkt-nav" className={`mkt-nav${menuOpen ? " is-open" : ""}`}>
        <a href="#accountable-route" onClick={() => setMenuOpen(false)}>
          Doctrine
        </a>
        <a href="#product-chamber" onClick={() => setMenuOpen(false)}>
          Product
        </a>
        <a href="#stack-constellation" onClick={() => setMenuOpen(false)}>
          Stack
        </a>
        <a href="#proof-and-trust" onClick={() => setMenuOpen(false)}>
          Proof
        </a>
        <Link href="/command" onClick={() => setMenuOpen(false)}>
          Command
        </Link>
        <Link href="/command" className="mkt-nav-cta" onClick={() => setMenuOpen(false)}>
          <span className={`mkt-health-pip is-${health}`} aria-hidden />
          Open Command Bridge
        </Link>
      </nav>
    </header>
  );
}
