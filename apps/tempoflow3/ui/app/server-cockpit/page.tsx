"use client";

import { useEffect, useState } from "react";
import { metierBase } from "@/lib/metier-base";

export default function Page() {
  const base = metierBase();
  const [ready, setReady] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch(`${base}/api/v1/os/ready`, { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok && !data.checks) {
          throw new Error(data.error || res.statusText);
        }
        setReady(data);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [base]);

  return (
    <section>
      <h1>Server cockpit</h1>
      <p>État agrégé des hosts OS (n8n, Hermes, tunnel, Meili).</p>
      {error ? <p style={{ color: "#8b1e1e" }}>{error}</p> : null}
      {ready ? (
        <pre style={{ whiteSpace: "pre-wrap", fontSize: 13 }}>
          {JSON.stringify(ready, null, 2)}
        </pre>
      ) : null}
      <p>
        <a href="/cockpit" style={{ color: "#0f3d32" }}>
          Cockpit
        </a>{" "}
        ·{" "}
        <a href="/developers" style={{ color: "#0f3d32" }}>
          Developers
        </a>{" "}
        ·{" "}
        <a href="/mcp" style={{ color: "#0f3d32" }}>
          MCP
        </a>
      </p>
    </section>
  );
}
