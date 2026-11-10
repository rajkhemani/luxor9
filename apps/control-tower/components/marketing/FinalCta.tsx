import Link from "next/link";
import { FINAL_CTA } from "@/lib/marketing-copy";

export function FinalCta() {
  return (
    <section className="mkt-section final-cta" id="final-cta">
      <p className="brand mkt-brand-sm">
        LUXOR<span>9</span>
      </p>
      <h2>{FINAL_CTA.headline}</h2>
      <p className="mkt-support">{FINAL_CTA.support}</p>
      <div className="hero-ctas">
        <Link href="/command">
          <button type="button">{FINAL_CTA.primary}</button>
        </Link>
        <Link href="/">
          <button type="button" className="secondary">
            {FINAL_CTA.secondary}
          </button>
        </Link>
      </div>
      <p>
        <Link href="/stack" className="capability-link">
          {FINAL_CTA.tertiary}
        </Link>
      </p>
    </section>
  );
}
