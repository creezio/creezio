/** creezio:owned-by-brand */
"use client";

import { useEffect, useState } from "react";
import { metierBase } from "@/lib/metier-base";

export default function Page() {
  const base = metierBase();
  const [tools, setTools] = useState<Array<{ name?: string; description?: string }>>(
    [],
  );
  const [publicMcp, setPublicMcp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      fetch(`${base}/mcp`).then((r) => r.json()),
      fetch(`${base}/api/v1/os/tunnel/status`).then((r) => r.json()),
    ])
      .then(([mcp, tunnel]) => {
        setTools(mcp.tools || []);
        setPublicMcp(tunnel.publicMcp || null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [base]);

  return (
    <section>
      <h1>Admin MCP</h1>
      <p>Outils MCP exposés par le kit (surface locale ou tunnel).</p>
      <p>
        URL publique :{" "}
        <code>{publicMcp || `${base}/mcp`}</code>
      </p>
      <ul>
        {tools.map((t) => (
          <li key={t.name}>
            <strong>{t.name}</strong>
            {t.description ? ` — ${t.description}` : ""}
          </li>
        ))}
      </ul>
      {!tools.length && !error ? <p>Aucun outil.</p> : null}
      {error ? <p style={{ color: "#8b1e1e" }}>{error}</p> : null}
      <p style={{ opacity: 0.75 }}>
        OAuth MCP distant : bloqueur credentials / routes admin kit (P1).
      </p>
    </section>
  );
}
