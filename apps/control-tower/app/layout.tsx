import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "LUXOR9 Control Tower",
  description: "Governed intelligence for real-estate developers",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <div className="brand">
            LUXOR<span>9</span>
          </div>
          <nav>
            <Link href="/">Overview</Link>
            <Link href="/copilot">Copilot</Link>
            <Link href="/chat">Chat</Link>
            <Link href="/workflows">Workflows</Link>
            <Link href="/approvals">Approvals</Link>
            <Link href="/agents">Workforce</Link>
            <Link href="/metering">Metering</Link>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
