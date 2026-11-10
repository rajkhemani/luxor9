import Link from "next/link";
import { client } from "@/lib/api";

export default async function OverviewPage() {
  let data;
  try {
    data = await client.overview();
  } catch {
    return (
      <section>
        <h1>LUXOR9</h1>
        <p className="muted">Control intelligence. Govern execution.</p>
        <div className="panel">
          <p>API unreachable. Start the API on port 8000, then refresh.</p>
          <p className="muted">`make api-dev` then reload this page.</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h1>LUXOR9</h1>
      <p className="muted">
        For Real-Estate Developers — chat a brief, approve a blueprint, run governed CMO agents.
      </p>
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem", flexWrap: "wrap" }}>
        <Link href="/copilot">
          <button type="button">Open Copilot</button>
        </Link>
        <Link href="/chat">
          <button type="button" className="secondary">
            Classic Chat
          </button>
        </Link>
        <Link href="/approvals">
          <button type="button" className="secondary">
            Approval centre
          </button>
        </Link>
      </div>
      <div className="grid" style={{ marginTop: "1.5rem" }}>
        <div className="stat">
          <strong>{data.active_workflows}</strong>
          Active workflows
        </div>
        <div className="stat">
          <strong>{data.pending_approvals}</strong>
          Pending approvals
        </div>
        <div className="stat">
          <strong>{data.completed_workflows}</strong>
          Completed
        </div>
        <div className="stat">
          <strong>{data.open_exceptions}</strong>
          Exceptions
        </div>
      </div>
      <div className="panel">
        <h2>Recent workflows</h2>
        {data.recent_workflows.length === 0 ? (
          <p className="muted">
            No runs yet. Open Chat and paste a Dubai launch brief — or call{" "}
            <code>POST /api/v1/demo/run</code> for a one-click pitch demo.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Objective</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.recent_workflows.map((w) => (
                <tr key={w.id}>
                  <td>{w.objective}</td>
                  <td>
                    <span className="badge">{w.status}</span>
                  </td>
                  <td>
                    <Link href={`/workflows/${w.id}`}>Open</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
