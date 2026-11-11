import { client } from "@/lib/api";

export default async function MeteringPage() {
  const events = await client.metering().catch(() => []);
  return (
    <section>
      <h1>Workflow metering</h1>
      <p className="muted">SaaS billing hooks — events only; Stripe later.</p>
      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>Event</th>
              <th>Workflow</th>
              <th>Units</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id}>
                <td>{e.event_name}</td>
                <td>{e.workflow_id}</td>
                <td>{e.units}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
