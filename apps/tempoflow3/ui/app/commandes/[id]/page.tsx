"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { metierBase } from "@/lib/metier-base";

type Ligne = {
  id: string;
  produit_nom?: string;
  quantite?: number;
  prix_unitaire?: number;
  total_ligne?: number;
};

type Commande = {
  id: string;
  statut?: string;
  total_ht?: number;
  fournisseur_nom?: string;
  fournisseur_id?: string;
  notes?: string;
  created_at?: string;
  lignes?: Ligne[];
  nb_lignes?: number;
};

export default function Page() {
  const params = useParams();
  const id = String(params?.id || "");
  const base = metierBase();
  const [c, setC] = useState<Commande | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const res = await fetch(`${base}/api/v1/modules/commandes/${id}`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || res.statusText);
    setC(data);
  }

  useEffect(() => {
    if (!id) return;
    void reload().catch((e) =>
      setError(e instanceof Error ? e.message : String(e)),
    );
  }, [base, id]);

  async function setStatut(statut: string) {
    setError(null);
    const res = await fetch(`${base}/api/v1/modules/commandes/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ statut }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || res.statusText);
      return;
    }
    await reload();
  }

  if (!c && !error) return <section><p>Chargement…</p></section>;

  return (
    <section>
      <p>
        <a href="/commandes" style={{ color: "#0f3d32" }}>
          ← Commandes
        </a>
      </p>
      <h1>Commande {c?.id?.slice(0, 8)}</h1>
      {error ? <p style={{ color: "#8b1e1e" }}>{error}</p> : null}
      <p>
        {c?.fournisseur_nom || c?.fournisseur_id?.slice(0, 8)} · {c?.statut} ·{" "}
        {c?.total_ht ?? "—"} € HT · {c?.nb_lignes ?? 0} lignes
      </p>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        {["brouillon", "envoyee", "recue"].map((s) => (
          <button key={s} type="button" onClick={() => void setStatut(s)}>
            → {s}
          </button>
        ))}
      </div>
      <table style={{ width: "100%", marginTop: "1rem", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th align="left">Produit</th>
            <th align="left">Qté</th>
            <th align="left">PU</th>
            <th align="left">Total</th>
          </tr>
        </thead>
        <tbody>
          {(c?.lignes || []).map((l) => (
            <tr key={l.id}>
              <td>{l.produit_nom || "—"}</td>
              <td>{l.quantite}</td>
              <td>{l.prix_unitaire}</td>
              <td>{l.total_ligne}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
