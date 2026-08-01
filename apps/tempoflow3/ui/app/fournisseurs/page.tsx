/** creezio:owned-by-brand */
"use client";

import { useEffect, useState } from "react";
import { metierBase } from "@/lib/metier-base";

type Fournisseur = {
  id: string;
  nom?: string;
  email?: string;
  telephone?: string;
};

export default function Page() {
  const base = metierBase();
  const [items, setItems] = useState<Fournisseur[]>([]);
  const [nom, setNom] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const res = await fetch(`${base}/api/v1/modules/fournisseurs`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || res.statusText);
    setItems(data.items || data || []);
  }

  useEffect(() => {
    void reload().catch((e) =>
      setError(e instanceof Error ? e.message : String(e)),
    );
  }, [base]);

  async function create() {
    setError(null);
    if (!nom.trim()) return;
    const res = await fetch(`${base}/api/v1/modules/fournisseurs`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ nom: nom.trim() }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || res.statusText);
      return;
    }
    setNom("");
    await reload();
  }

  return (
    <section>
      <h1>Fournisseurs</h1>
      <p>Catalogue local — fiche détail, surface site, commandes.</p>
      {error ? <p style={{ color: "#8b1e1e" }}>{error}</p> : null}
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
        <input
          placeholder="Nouveau fournisseur"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
        />
        <button type="button" onClick={() => void create()}>
          Créer
        </button>
      </div>
      <ul style={{ marginTop: "1rem" }}>
        {items.map((f) => (
          <li key={f.id}>
            <a href={`/fournisseurs/${f.id}`} style={{ color: "#0f3d32" }}>
              {f.nom || f.id.slice(0, 8)}
            </a>
            {f.email ? ` · ${f.email}` : ""}
          </li>
        ))}
      </ul>
    </section>
  );
}
