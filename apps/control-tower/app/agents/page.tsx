import { client } from "@/lib/api";

export default async function AgentsPage() {
  const data = await client.agents().catch(() => null);
  const pack = (data?.packs as Array<Record<string, unknown>> | undefined)?.[0];
  const specialists = (pack?.specialists as Array<Record<string, string>>) || [];

  return (
    <section>
      <h1>AI Workforce</h1>
      <p className="muted">Orchestrator → CMO executive → parallel specialists.</p>
      <div className="panel">
        <h2>Active pack: CMO Real Estate</h2>
        <ul>
          {specialists.map((s) => (
            <li key={s.agent_key}>
              <strong>{s.name}</strong> <span className="badge">{s.agent_key}</span>
            </li>
          ))}
        </ul>
        <h2>Roadmap stubs</h2>
        <p className="muted">CFO / COO packs registered as roadmap only — not executable.</p>
      </div>
    </section>
  );
}
