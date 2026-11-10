import Link from "next/link";
import { client } from "@/lib/api";

export default async function WorkflowsPage() {
  const workflows = await client.workflows().catch(() => []);
  return (
    <section>
      <h1>Workflows</h1>
      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>Objective</th>
              <th>Pack</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {workflows.map((w) => (
              <tr key={w.id}>
                <td>{w.objective}</td>
                <td>{w.pack}</td>
                <td>
                  <span className="badge">{w.status}</span>
                </td>
                <td>
                  <Link href={`/workflows/${w.id}`}>Detail</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
