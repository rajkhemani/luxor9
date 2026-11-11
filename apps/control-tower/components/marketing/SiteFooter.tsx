import Link from "next/link";
import { MARKETING_DOCTRINE } from "@/lib/marketing-copy";

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mkt-footer">
      <div className="mkt-footer-brand">
        <div className="brand">
          LUXOR<span>9</span>
        </div>
        <p className="muted">{MARKETING_DOCTRINE}</p>
      </div>
      <div className="mkt-footer-cols">
        <div>
          <h3>Product</h3>
          <Link href="/">Control Tower</Link>
          <Link href="/command">Command Bridge</Link>
          <Link href="/stack">Luxor Stack</Link>
          <Link href="/agents">Workforce</Link>
          <Link href="/approvals">Approvals</Link>
          <Link href="/workflows">Workflows</Link>
        </div>
        <div>
          <h3>Doctrine</h3>
          <a href="#accountable-route">Accountable route</a>
          <a href="#verification-theater">Verification</a>
          <a href="#proof-and-trust">Proof</a>
          <a href="#faq-precision">FAQ</a>
        </div>
        <div>
          <h3>Legal</h3>
          <span className="muted">Privacy (soon)</span>
          <span className="muted">Terms (soon)</span>
        </div>
      </div>
      <p className="mkt-footer-copy muted">© {year} LUXOR9</p>
    </footer>
  );
}
