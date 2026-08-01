/** creezio:owned-by-brand */
"use client";

import { useEffect, useState } from "react";
import { metierBase } from "@/lib/metier-base";

export default function Page() {
  const base = metierBase();
  const [metrics, setMetrics] = useState<Record<string, unknown> | null>(null);
  const [dash, setDash] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      fetch(`${base}/api/v1/admin/mcp/metrics`).then((r) => r.json()),
      fetch(`${base}/api/v1/modules/dashboard`).then((r) => r.json()),
    ])
      .then(([m, d]) => {
        setMetrics(m);
        setDash(d);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [base]);

  return (
    <section>
      <h1>Admin Analytics</h1>
      <p>Métriques MCP kit + orientation métier.</p>
      {error ? <p style={{ color: "#8b1e1e" }}>{error}</p> : null}
      <h2>MCP metrics</h2>
      <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.85rem" }}>
        {JSON.stringify(metrics, null, 2)}
      </pre>
      <h2>Dashboard métier</h2>
      <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.85rem" }}>
        {JSON.stringify(dash, null, 2)}
      </pre>
    </section>
  );
}
