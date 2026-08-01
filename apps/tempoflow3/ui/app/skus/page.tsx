"use client";

import { useEffect, useState } from "react";
import { metierBase } from "@/lib/metier-base";

type Sku = {
  id: string;
  sku?: string;
  nom?: string;
  unite?: string;
  categorie?: string;
  fournisseur_id?: string;
};

export default function Page() {
  const base = metierBase();
  const [items, setItems] = useState<Sku[]>([]);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch(`${base}/api/v1/modules/skus`, { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || res.statusText);
        setItems(data.items || data.skus || []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [base]);

  const filtered = items.filter((s) => {
    if (!q.trim()) return true;
    const hay = `${s.sku} ${s.nom} ${s.categorie}`.toLowerCase();
    return hay.includes(q.trim().toLowerCase());
  });

  async function addStack(id: string) {
    setError(null);
    const res = await fetch(`${base}/api/v1/modules/stack`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ produit_id: id }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || res.statusText);
      return;
    }
    setMsg("Ajouté à Mes produits");
  }

  return (
    <section>
      <h1>SKUs</h1>
      <p>Catalogue produit avec identifiant court — vers stack ou détail.</p>
      {error ? <p style={{ color: "#8b1e1e" }}>{error}</p> : null}
      {msg ? <p style={{ color: "#0f3d32" }}>{msg}</p> : null}
      <input
        placeholder="Filtrer…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ marginTop: "0.75rem", minWidth: "16rem" }}
      />
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
        <thead>
          <tr>
            <th align="left">SKU</th>
            <th align="left">Nom</th>
            <th align="left">Unité</th>
            <th align="left" />
          </tr>
        </thead>
        <tbody>
          {filtered.map((s) => (
            <tr key={s.id}>
              <td>
                <code>{s.sku || s.id.slice(0, 8)}</code>
              </td>
              <td>{s.nom}</td>
              <td>{s.unite || "—"}</td>
              <td>
                <button type="button" onClick={() => void addStack(s.id)}>
                  Stack
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
