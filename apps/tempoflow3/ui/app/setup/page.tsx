/** creezio:owned-by-brand */
"use client";

import { useEffect, useState } from "react";
import { metierBase } from "@/lib/metier-base";

export default function Page() {
  const base = metierBase();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [status, setStatus] = useState<{
    setupComplete?: boolean;
    username?: string | null;
  } | null>(null);
  const [recoveryKey, setRecoveryKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const data = await fetch(`${base}/api/v1/os/setup`).then((r) => r.json());
    setStatus(data);
  }

  useEffect(() => {
    void reload().catch((e) =>
      setError(e instanceof Error ? e.message : String(e)),
    );
  }, [base]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`${base}/api/v1/os/setup`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password, openaiKey }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || res.statusText);
      return;
    }
    setRecoveryKey(data.recoveryKey || null);
    await reload();
  }

  return (
    <section>
      <h1>Setup</h1>
      <p>Premier lancement OS — compte local + recovery key + clé OpenAI (BYOK).</p>
      {status?.setupComplete ? (
        <p style={{ color: "#0f3d32" }}>
          Setup déjà complet{status.username ? ` (user: ${status.username})` : ""}.
        </p>
      ) : null}
      <form
        onSubmit={(e) => void onSubmit(e)}
        style={{ display: "grid", gap: "0.75rem", maxWidth: 420 }}
      >
        <label>
          Identifiant
          <input
            required
            minLength={2}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ display: "block", width: "100%" }}
          />
        </label>
        <label>
          Mot de passe (min. 6)
          <input
            required
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ display: "block", width: "100%" }}
          />
        </label>
        <label>
          Clé OpenAI
          <input
            required
            value={openaiKey}
            onChange={(e) => setOpenaiKey(e.target.value)}
            placeholder="sk-…"
            style={{ display: "block", width: "100%" }}
          />
        </label>
        <button type="submit">Terminer le setup</button>
      </form>
      {recoveryKey ? (
        <aside
          style={{
            marginTop: "1rem",
            padding: "1rem",
            background: "rgba(15,61,50,0.08)",
          }}
        >
          <strong>Clé de récupération (à conserver) :</strong>
          <pre style={{ whiteSpace: "pre-wrap" }}>{recoveryKey}</pre>
        </aside>
      ) : null}
      {error ? <p style={{ color: "#8b1e1e" }}>{error}</p> : null}
      <p>
        <a href="/login" style={{ color: "#0f3d32" }}>
          → Login
        </a>
        {" · "}
        <a href="/configuration" style={{ color: "#0f3d32" }}>
          Configuration
        </a>
      </p>
    </section>
  );
}
