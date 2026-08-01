/** creezio:owned-by-brand */
"use client";

import { useEffect, useState } from "react";
import { metierBase } from "@/lib/metier-base";

export default function Page() {
  const base = metierBase();
  const [ready, setReady] = useState<Record<string, unknown> | null>(null);
  const [dash, setDash] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    void Promise.all([
      fetch(`${base}/api/v1/os/ready`).then((r) => r.json()),
      fetch(`${base}/api/v1/modules/dashboard`).then((r) => r.json()),
    ]).then(([r, d]) => {
      setReady(r);
      setDash(d);
    });
  }, [base]);

  const checks = (ready?.checks || {}) as Record<string, boolean>;

  return (
    <section>
      <h1>Cockpit</h1>
      <p>Vue agrégée OS + métier (server-cockpit pour détail hosts).</p>
      <ul>
        {Object.entries(checks).map(([k, v]) => (
          <li key={k}>
            {k}: {v ? "✓" : "✗"}
          </li>
        ))}
      </ul>
      {dash ? (
        <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.85rem" }}>
          {JSON.stringify(dash, null, 2)}
        </pre>
      ) : null}
      <p>
        <a href="/server-cockpit" style={{ color: "#0f3d32" }}>
          Server cockpit
        </a>
      </p>
    </section>
  );
}
