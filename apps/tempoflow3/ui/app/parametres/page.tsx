/** creezio:owned-by-brand */
"use client";

import { useEffect, useState } from "react";
import { metierBase } from "@/lib/metier-base";

export default function Page() {
  const base = metierBase();
  const [ready, setReady] = useState<Record<string, unknown> | null>(null);
  const [n8n, setN8n] = useState<Record<string, unknown> | null>(null);
  const [hermes, setHermes] = useState<Record<string, unknown> | null>(null);
  const [tunnel, setTunnel] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function reload() {
    const [r, n, h, t] = await Promise.all([
      fetch(`${base}/api/v1/os/ready`).then((x) => x.json()),
      fetch(`${base}/api/v1/os/n8n/status`).then((x) => x.json()),
      fetch(`${base}/api/v1/os/hermes/status`).then((x) => x.json()),
      fetch(`${base}/api/v1/os/tunnel/status`).then((x) => x.json()),
    ]);
    setReady(r);
    setN8n(n);
    setHermes(h);
    setTunnel(t);
  }

  useEffect(() => {
    void reload().catch((e) =>
      setError(e instanceof Error ? e.message : String(e)),
    );
  }, [base]);

  async function ensure(path: string) {
    setError(null);
    const res = await fetch(`${base}${path}`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || res.statusText);
      return;
    }
    setMsg(`${path} OK`);
    await reload();
  }

  return (
    <section>
      <h1>Paramètres</h1>
      <p>État hosts OS (n8n / Hermes / tunnel / Meili) — actions ensure kit.</p>
      {ready ? (
        <p>
          ready={String(ready.ready)} mcp={String(ready.publicMcp || "—")}
        </p>
      ) : null}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button type="button" onClick={() => void ensure("/api/v1/os/n8n/ensure")}>
          Ensure n8n
        </button>
        <button
          type="button"
          onClick={() => void ensure("/api/v1/os/hermes/ensure")}
        >
          Ensure Hermes
        </button>
        <button
          type="button"
          onClick={() => void ensure("/api/v1/os/tunnel/local")}
        >
          MCP local
        </button>
      </div>
      <h2>n8n</h2>
      <pre style={{ whiteSpace: "pre-wrap" }}>
        {JSON.stringify(
          { entry: n8n?.entry, nativeReady: n8n?.nativeReady },
          null,
          2,
        )}
      </pre>
      <h2>Hermes</h2>
      <pre style={{ whiteSpace: "pre-wrap" }}>
        {JSON.stringify(
          { binary: hermes?.binary, nativeReady: hermes?.nativeReady },
          null,
          2,
        )}
      </pre>
      <h2>Tunnel</h2>
      <pre style={{ whiteSpace: "pre-wrap" }}>
        {JSON.stringify(
          { publicMcp: tunnel?.publicMcp, status: tunnel?.status },
          null,
          2,
        )}
      </pre>
      {error ? <p style={{ color: "#8b1e1e" }}>{error}</p> : null}
      {msg ? <p style={{ color: "#0f3d32" }}>{msg}</p> : null}
    </section>
  );
}
