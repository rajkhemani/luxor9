"use client";

import { useEffect, useState } from "react";
import { client } from "@/lib/api";

type Approval = {
  id: string;
  workflow_id: string;
  action: string;
  status: string;
  resource_type: string;
  resource_id: string;
  payload: Record<string, unknown>;
  expires_at: string;
};

export default function ApprovalsPage() {
  const [items, setItems] = useState<Approval[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    try {
      setItems(await client.approvals());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onApprove(id: string) {
    setBusy(id);
    try {
      await client.approve(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Approve failed");
    } finally {
      setBusy(null);
    }
  }

  async function onReject(id: string) {
    setBusy(id);
    try {
      await client.reject(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reject failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section>
      <h1>Approval centre</h1>
      <p className="muted">Exact-action binding. Model text is never authorization.</p>
      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>Action</th>
              <th>Resource</th>
              <th>Status</th>
              <th>Expires</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id}>
                <td>
                  {a.action}
                  <div className="muted">{a.workflow_id}</div>
                </td>
                <td>
                  {a.resource_type}/{a.resource_id}
                </td>
                <td>
                  <span className="badge">{a.status}</span>
                </td>
                <td>{new Date(a.expires_at).toLocaleString()}</td>
                <td>
                  {a.status === "pending" && (
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <button disabled={busy === a.id} onClick={() => onApprove(a.id)}>
                        Approve
                      </button>
                      <button
                        className="danger"
                        disabled={busy === a.id}
                        onClick={() => onReject(a.id)}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
