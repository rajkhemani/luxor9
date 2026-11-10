import type { Metadata } from "next";
import { SiteChrome } from "@/components/marketing/SiteChrome";
import { SiteFooter } from "@/components/marketing/SiteFooter";

export const metadata: Metadata = {
  title: "LUXOR9 | Control AI execution. Prove every outcome.",
  description:
    "Route intelligence through policy, execution, verification, and evidence — for real-estate teams who must own the record.",
  openGraph: {
    title: "LUXOR9 | Control AI execution. Prove every outcome.",
    description:
      "Governed agents. Verified launches. Own the contracts, evidence, and data.",
    type: "website",
  },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="marketing-shell">
      <a className="skip-link" href="#marketing-main">
        Skip to content
      </a>
      <SiteChrome />
      <main id="marketing-main" className="marketing-main">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
