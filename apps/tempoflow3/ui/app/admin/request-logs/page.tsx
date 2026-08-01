/** creezio:owned-by-brand */
"use client";

import { useEffect, useState } from "react";
import { metierBase } from "@/lib/metier-base";

export default function Page() {
  const base = metierBase();
  const [logs, setLogs] = useState<unknown[]>([]);
  const [diag, setDiag] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      fetch(`${base}/api/v1/admin/mcp/audit-logs?limit=100`).then((r) =>
        r.json(),
      ),
      fetch(`${base}/api/v1/admin/mcp/diagnostics`).then((r) => r.json()),
    ])
      .then(([a, d]) => {
        setLogs(a.logs || []);
        setDiag(d);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [base]);

  return (
    <section>
      <h1>Admin Request logs</h1>
      <p>Audit MCP kit (`/api/v1/admin/mcp/audit-logs`).</p>
      {error ? <p style={{ color: "#8b1e1e" }}>{error}</p> : null}
      <p>{logs.length} entrées</p>
      <ul>
        {logs.slice(0, 50).map((l, i) => (
          <li key={i}>
            <code style={{ fontSize: "0.8rem" }}>
              {JSON.stringify(l).slice(0, 200)}
            </code>
          </li>
        ))}
      </ul>
      {!logs.length ? <p style={{ opacity: 0.7 }}>Aucun log encore.</p> : null}
      <h2>Diagnostics</h2>
      <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.85rem" }}>
        {JSON.stringify(diag, null, 2)}
      </pre>
    </section>
  );
}
