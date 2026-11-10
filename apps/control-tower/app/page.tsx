import Link from "next/link";
import { client } from "@/lib/api";

export default async function OverviewPage() {
  let data;
  try {
    data = await client.overview();
  } catch {
    return (
      <section>
        <h1>Control Tower</h1>
        <p className="muted">
          API unreachable. Start the API on port 8000, then refresh.
        </p>
      </section>
    );
  }

  return (
    <section>
      <h1>Control Tower</h1>
      <p className="muted">Luxor9 for Real-Estate Developers — command and governance.</p>
      <div className="grid" style={{ marginTop: "1.25rem" }}>
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
      </div>
    </section>
  );
}
