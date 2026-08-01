/** creezio:owned-by-brand */
"use client";

import { useState } from "react";
import { metierBase } from "@/lib/metier-base";

export default function Page() {
  const base = metierBase();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMsg(null);
    // Session desktop Electron : POST auth kit ; harness → setup status.
    const auth = await fetch(`${base}/api/v1/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    }).catch(() => null);
    if (auth && auth.ok) {
      setMsg("Connecté — redirection dashboard.");
      window.location.href = "/dashboard";
      return;
    }
    const setup = await fetch(`${base}/api/v1/os/setup`).then((r) => r.json());
    if (setup.setupComplete && setup.username === email) {
      setMsg(
        `Compte local « ${setup.username} » prêt (session harness). Ouvrez le desktop pour la session chiffrée.`,
      );
      return;
    }
    setError(
      auth
        ? `Auth HTTP ${auth.status} — utilisez /setup si first-run.`
        : "Auth indisponible hors desktop — vérifiez /setup.",
    );
  }

  return (
    <section>
      <h1>Login</h1>
      <p>Session OS Creezio (`createDesktopSessionStore` / auth kit).</p>
      <form onSubmit={(e) => void onSubmit(e)} style={{ display: "grid", gap: "0.75rem", maxWidth: 360 }}>
        <label>
          Identifiant
          <input
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ display: "block", width: "100%" }}
          />
        </label>
        <label>
          Mot de passe
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ display: "block", width: "100%" }}
          />
        </label>
        <button type="submit">Se connecter</button>
      </form>
      {error ? <p style={{ color: "#8b1e1e" }}>{error}</p> : null}
      {msg ? <p style={{ color: "#0f3d32" }}>{msg}</p> : null}
      <p>
        <a href="/setup" style={{ color: "#0f3d32" }}>
          Premier lancement → Setup
        </a>
      </p>
    </section>
  );
}
