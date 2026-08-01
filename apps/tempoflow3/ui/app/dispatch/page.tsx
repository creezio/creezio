"use client";

import { useEffect, useState } from "react";
import { metierBase } from "@/lib/metier-base";

type Candidate = {
  fournisseur_id: string;
  fournisseur_nom?: string;
  total_lignes?: number;
  lignes?: unknown[];
};

export default function Page() {
  const base = metierBase();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const res = await fetch(`${base}/api/v1/modules/dispatch/candidates`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || res.statusText);
    setCandidates(data.candidates || data.items || []);
  }

  useEffect(() => {
    void reload().catch((e) =>
      setError(e instanceof Error ? e.message : String(e)),
    );
  }, [base]);

  async function apply(fid: string) {
    setError(null);
    const res = await fetch(`${base}/api/v1/modules/dispatch/apply`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ fournisseur_id: fid }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || res.statusText);
      return;
    }
    setMsg(
      `Panier filtré sur ${fid.slice(0, 8)} — ${data.items?.length ?? 0} lignes`,
    );
    await reload();
  }

  return (
    <section>
      <h1>Dispatch</h1>
      <p>Regrouper le panier par fournisseur et ne garder qu’un candidat.</p>
      {error ? <p style={{ color: "#8b1e1e" }}>{error}</p> : null}
      {msg ? <p style={{ color: "#0f3d32" }}>{msg}</p> : null}
      <ul style={{ listStyle: "none", padding: 0, marginTop: "1rem" }}>
        {candidates.map((c) => (
          <li
            key={c.fournisseur_id}
            style={{
              display: "flex",
              gap: "0.75rem",
              alignItems: "center",
              marginBottom: "0.5rem",
              flexWrap: "wrap",
            }}
          >
            <strong>{c.fournisseur_nom || c.fournisseur_id.slice(0, 8)}</strong>
            <span>{c.total_lignes ?? c.lignes?.length ?? 0} lignes</span>
            <button type="button" onClick={() => void apply(c.fournisseur_id)}>
              Appliquer au panier
            </button>
          </li>
        ))}
      </ul>
      {candidates.length === 0 ? (
        <p style={{ opacity: 0.7 }}>Aucun candidat — remplir le panier d’abord.</p>
      ) : null}
    </section>
  );
}