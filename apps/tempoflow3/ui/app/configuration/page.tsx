/** creezio:owned-by-brand */
"use client";

import { useEffect, useState } from "react";
import { metierBase } from "@/lib/metier-base";

type Profile = {
  mode: "local" | "remote";
  remoteUrl?: string | null;
  localBind?: string;
  chosen?: boolean;
};

export default function Page() {
  const base = metierBase();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mode, setMode] = useState<"local" | "remote">("local");
  const [remoteUrl, setRemoteUrl] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [osStatus, setOsStatus] = useState<Record<string, unknown> | null>(null);

  async function reload() {
    const [conn, status] = await Promise.all([
      fetch(`${base}/api/v1/os/connection`).then((r) => r.json()),
      fetch(`${base}/api/v1/os/status`).then((r) => r.json()),
    ]);
    setProfile(conn.profile);
    setMode(conn.profile?.mode || "local");
    setRemoteUrl(conn.profile?.remoteUrl || "");
    setOsStatus(status);
  }

  useEffect(() => {
    void reload().catch((e) =>
      setError(e instanceof Error ? e.message : String(e)),
    );
  }, [base]);

  async function apply() {
    setError(null);
    setMsg(null);
    const res = await fetch(`${base}/api/v1/os/connection`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mode,
        remoteUrl: mode === "remote" ? remoteUrl : null,
        localBind: "127.0.0.1",
        chosen: true,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || res.statusText);
      return;
    }
    setMsg(`Profil ${data.profile.mode} enregistré`);
    await reload();
  }

  async function testRemote() {
    setError(null);
    const res = await fetch(`${base}/api/v1/os/connection/test`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ remoteUrl }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Serveur injoignable");
      return;
    }
    setMsg(`Test OK — ${data.baseUrl}`);
  }

  return (
    <section>
      <h1>Configuration</h1>
      <p>Profil connexion OS — Héberger (local) ou Rejoindre (remote).</p>
      {osStatus ? (
        <p style={{ opacity: 0.8 }}>
          brand={String(osStatus.brandId)} setup=
          {String((osStatus as { setupComplete?: boolean }).setupComplete)}{" "}
          plugins=
          {String(
            (osStatus as { hosts?: { plugins?: string } }).hosts?.plugins,
          )}
        </p>
      ) : null}
      <fieldset style={{ border: "none", padding: 0, margin: "1rem 0" }}>
        <label style={{ display: "block", marginBottom: "0.5rem" }}>
          <input
            type="radio"
            checked={mode === "local"}
            onChange={() => setMode("local")}
          />{" "}
          Héberger (serveur local embarqué)
        </label>
        <label style={{ display: "block" }}>
          <input
            type="radio"
            checked={mode === "remote"}
            onChange={() => setMode("remote")}
          />{" "}
          Rejoindre un serveur distant
        </label>
      </fieldset>
      {mode === "remote" ? (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <input
            value={remoteUrl}
            onChange={(e) => setRemoteUrl(e.target.value)}
            placeholder="http://serveur:port"
            style={{ flex: "1 1 220px" }}
          />
          <button type="button" onClick={() => void testRemote()}>
            Tester
          </button>
        </div>
      ) : null}
      <p style={{ marginTop: "1rem" }}>
        <button type="button" onClick={() => void apply()}>
          Enregistrer le profil
        </button>
      </p>
      {profile ? (
        <pre style={{ whiteSpace: "pre-wrap", opacity: 0.8 }}>
          {JSON.stringify(profile, null, 2)}
        </pre>
      ) : null}
      {error ? <p style={{ color: "#8b1e1e" }}>{error}</p> : null}
      {msg ? <p style={{ color: "#0f3d32" }}>{msg}</p> : null}
      <p>
        <a href="/parametres" style={{ color: "#0f3d32" }}>
          Paramètres embeds
        </a>
        {" · "}
        <a href="/admin/plugins" style={{ color: "#0f3d32" }}>
          Plugins
        </a>
      </p>
    </section>
  );
}
