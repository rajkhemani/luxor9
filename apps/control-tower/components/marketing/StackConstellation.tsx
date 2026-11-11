"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  LUXOR_CAPABILITIES,
  statusLabel,
  type CapabilityStatus,
} from "@/lib/luxor-brand";

const FILTERS: Array<"all" | CapabilityStatus> = [
  "all",
  "live",
  "wired",
  "shell",
  "planned",
];

export function StackConstellation() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [selected, setSelected] = useState(LUXOR_CAPABILITIES[0]?.id ?? "");

  const items = useMemo(
    () =>
      LUXOR_CAPABILITIES.filter((c) => (filter === "all" ? true : c.status === filter)),
    [filter],
  );

  useEffect(() => {
    if (!items.some((c) => c.id === selected)) {
      setSelected(items[0]?.id ?? "");
    }
  }, [items, selected]);

  const active = items.find((c) => c.id === selected) ?? items[0];

  return (
    <section className="mkt-section stack-constellation" id="stack-constellation">
      <h2>The Luxor Stack, named for the work — not the vendors.</h2>
      <p className="mkt-support">
        Live, Wired, Shell, Planned — one constellation for the CMO workforce.
      </p>
      <div className="constellation-filters" role="group" aria-label="Filter by status">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            className={`product-seg${filter === f ? " is-active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : statusLabel(f)}
          </button>
        ))}
      </div>
      <div className="constellation-layout">
        <ul className="constellation-list">
          {items.map((cap) => (
            <li key={cap.id}>
              <button
                type="button"
                className={`constellation-row${active?.id === cap.id ? " is-active" : ""}`}
                onClick={() => setSelected(cap.id)}
              >
                <span>{cap.label}</span>
                <span className={`badge badge-${cap.status}`}>{statusLabel(cap.status)}</span>
              </button>
            </li>
          ))}
        </ul>
        {active ? (
          <div className="constellation-detail">
            <h3>{active.label}</h3>
            <p>{active.blurb}</p>
            <p>
              <span className={`badge badge-${active.status}`}>
                {statusLabel(active.status)}
              </span>
            </p>
            {active.href ? (
              <Link href={active.href} className="capability-link">
                Open {active.label}
              </Link>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
