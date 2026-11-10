import Link from "next/link";
import { client } from "@/lib/api";

export default async function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workflow = await client.workflow(id).catch(() => null);
  if (!workflow) {
    return (
      <section>
        <h1>Workflow</h1>
        <p className="muted">Not found or API offline.</p>
      </section>
    );
  }
  const [evidence, claims] = await Promise.all([
    client.evidence(id).catch(() => []),
    client.claims(id).catch(() => []),
  ]);

  return (
    <section>
      <p>
        <Link href="/workflows">← Workflows</Link>
      </p>
      <h1>Workflow detail</h1>
      <p className="muted">{workflow.objective}</p>
      <p>
        Status <span className="badge">{workflow.status}</span>
      </p>
      {workflow.blueprint && (
        <div className="panel">
          <h2>Blueprint</h2>
          <p>
            <strong>{workflow.blueprint.title}</strong> · {workflow.blueprint.status}
          </p>
          <p>{workflow.blueprint.summary}</p>
        </div>
      )}
      <div className="panel">
        <h2>Evidence ledger</h2>
        {evidence.length === 0 && <p className="muted">No evidence yet.</p>}
        <ul>
          {evidence.map((e) => (
            <li key={e.source_id}>
              <a href={e.canonical_uri} target="_blank" rel="noreferrer">
                {e.title || e.canonical_uri}
              </a>
              <div className="muted">{e.source_type} · hash {e.content_hash.slice(0, 12)}</div>
            </li>
          ))}
        </ul>
      </div>
      <div className="panel">
        <h2>Claims</h2>
        <table>
          <thead>
            <tr>
              <th>Claim</th>
              <th>Status</th>
              <th>Confidence</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((c) => (
              <tr key={c.id}>
                <td>{c.claim_text}</td>
                <td>
                  <span className="badge">{c.status}</span>
                </td>
                <td>{c.confidence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {workflow.report && (
        <div className="panel">
          <h2>Report</h2>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.85rem" }}>
            {JSON.stringify(workflow.report, null, 2)}
          </pre>
        </div>
      )}
    </section>
  );
}
