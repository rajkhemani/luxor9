"use client";

import { useState } from "react";
import { FAQ_ITEMS } from "@/lib/marketing-copy";

export function FaqPrecision() {
  const [open, setOpen] = useState(0);
  return (
    <section className="mkt-section faq-precision" id="faq-precision">
      <h2>Precision before the ask.</h2>
      <p className="mkt-support">Clear answers on chat, Trust, demo honesty, and stack fit.</p>
      <div className="faq-list">
        {FAQ_ITEMS.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={item.q} className={`faq-item${isOpen ? " is-open" : ""}`}>
              <button
                type="button"
                className="faq-q"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? -1 : i)}
              >
                {item.q}
              </button>
              {isOpen ? <p className="faq-a">{item.a}</p> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
