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
    void (async () => {
      try {
        const [mcp, tunnel] = await Promise.all([
          fetch(`${base}/mcp`, { cache: "no-store" }),
          fetch(`${base}/api/v1/os/tunnel/status`, { cache: "no-store" }),
        ]);
        const md = await mcp.json();
        const td = await tunnel.json();
        if (!mcp.ok) throw new Error(md.error || mcp.statusText);
        setTools(md.tools || []);
        setPublicMcp(td.publicMcp || null);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [base]);

  return (
    <section>
      <h1>MCP</h1>
      <p>Surface outil OS Creezio (locale + tunnel).</p>
      {error ? <p style={{ color: "#8b1e1e" }}>{error}</p> : null}
      {publicMcp ? (
        <p>
          Public : <code>{publicMcp}</code>
        </p>
      ) : null}
      <p>Local : <code>{base}/mcp</code></p>
      <ul>
        {tools.map((t) => (
          <li key={t.name}>
            <strong>{t.name}</strong>
            {t.description ? ` — ${t.description}` : ""}
          </li>
        ))}
      </ul>
    </section>
  );
}
