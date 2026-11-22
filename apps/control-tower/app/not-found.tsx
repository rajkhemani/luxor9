import Link from "next/link";

export default function NotFound() {
  return (
    <main className="tower-main">
      <section>
        <h1>Page not found</h1>
        <p className="muted">The requested LUXOR9 route does not exist.</p>
        <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
          <Link href="/">
            <button type="button">Return to Control Tower</button>
          </Link>
          <Link href="/home">
            <button type="button" className="secondary">
              Open Home
            </button>
          </Link>
        </div>
      </section>
    </main>
  );
}
