"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ROUTE_STATES } from "@/lib/marketing-copy";
import { useMarketingStore } from "./marketing-store";

export function AccountableRoute() {
  const {
    activeRouteIndex,
    setActiveRouteIndex,
    routeBroken,
    setRouteBroken,
    setRouteProgress,
  } = useMarketingStore();

  useEffect(() => {
    setRouteProgress(routeBroken ? 0 : (activeRouteIndex + 1) / ROUTE_STATES.length);
  }, [activeRouteIndex, routeBroken, setRouteProgress]);

  const active = ROUTE_STATES[activeRouteIndex];

  return (
    <section className="mkt-section accountable-route" id="accountable-route">
      <p className="mkt-eyebrow">Signal routing system</p>
      <h2>One intent. Six accountable states.</h2>
      <p className="mkt-support">
        Each output becomes the next input — until evidence is recorded.
      </p>

      <div className="route-track" role="list">
        {ROUTE_STATES.map((state, i) => {
          const on = !routeBroken && i <= activeRouteIndex;
          return (
            <button
              key={state.id}
              type="button"
              role="listitem"
              className={`route-node${on ? " is-on" : ""}${i === activeRouteIndex ? " is-active" : ""}`}
              onClick={() => {
                setRouteBroken(false);
                setActiveRouteIndex(i);
              }}
              aria-current={i === activeRouteIndex ? "step" : undefined}
            >
              <span className="route-code">{state.code}</span>
              <span className="route-title">{state.title}</span>
            </button>
          );
        })}
      </div>

      <div className="route-detail">
        <h3>
          {active.code} / {active.title}
        </h3>
        <p>{active.line}</p>
        {!routeBroken && active.id === "authorized" ? (
          <Link href="/approvals" className="capability-link">
            Open approval centre
          </Link>
        ) : null}
        {!routeBroken && active.id === "recorded" ? (
          <Link href="/workflows" className="capability-link">
            Inspect a workflow
          </Link>
        ) : null}
        {!routeBroken ? (
          <dl className="route-evidence">
            <div>
              <dt>Evidence</dt>
              <dd>LX9/EVT/000184</dd>
            </div>
            <div>
              <dt>Action</dt>
              <dd>workflow.execute</dd>
            </div>
            <div>
              <dt>Policy</dt>
              <dd>approved</dd>
            </div>
            <div>
              <dt>Verifier</dt>
              <dd>passed</dd>
            </div>
          </dl>
        ) : (
          <p className="muted">Accountable route removed — signals unbound again.</p>
        )}
        <p className="muted demo-label">Demonstration record, not live production evidence.</p>
      </div>

      <div className="route-toggles">
        <button type="button" onClick={() => setRouteBroken(false)}>
          Recorded execution
        </button>
        <button type="button" className="secondary" onClick={() => setRouteBroken(true)}>
          Remove the accountable route
        </button>
      </div>
    </section>
  );
}
