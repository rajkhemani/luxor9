import Link from "next/link";

export default function TowerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="site-header">
        <Link href="/" className="brand">
          LUXOR<span>9</span>
        </Link>
        <nav>
          <Link href="/home">Home</Link>
          <Link href="/">Overview</Link>
          <Link href="/stack">Stack</Link>
          <Link href="/command">Command Bridge</Link>
          <Link href="/chat">Chat</Link>
          <Link href="/workflows">Workflows</Link>
          <Link href="/approvals">Approvals</Link>
          <Link href="/agents">Workforce</Link>
          <Link href="/atelier">Atelier</Link>
          <Link href="/metering">Metering</Link>
        </nav>
      </header>
      <main className="tower-main">{children}</main>
    </>
  );
}
