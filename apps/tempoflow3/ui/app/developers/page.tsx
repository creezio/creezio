/** creezio:owned-by-brand */
"use client";

import { useEffect, useState } from "react";
import { metierBase } from "@/lib/metier-base";

export default function Page() {
  const base = metierBase();
  const [tools, setTools] = useState<Array<{ name?: string }>>([]);
  const [publicMcp, setPublicMcp] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      fetch(`${base}/mcp`).then((r) => r.json()),
      fetch(`${base}/api/v1/os/tunnel/status`).then((r) => r.json()),
    ]).then(([mcp, tunnel]) => {
      setTools(mcp.tools || []);
      setPublicMcp(tunnel.publicMcp || `${base}/mcp`);
    });
  }, [base]);

  return (
    <section>
      <h1>Developers / MCP</h1>
      <p>
        Endpoint : <code>{publicMcp}</code>
      </p>
      <p>{tools.length} outils disponibles.</p>
      <ul>
        {tools.map((t) => (
          <li key={t.name}>{t.name}</li>
        ))}
      </ul>
      <p>
        <a href="/admin/mcp" style={{ color: "#0f3d32" }}>
          Admin MCP
        </a>
      </p>
    </section>
  );
}
