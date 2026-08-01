"use client";

import { useEffect, useState } from "react";
import { metierBase } from "@/lib/metier-base";

type Dash = {
  fournisseurs?: number;
  produits?: number;
  panier_lignes?: number;
  commandes?: number;
  orientation?: string;
  stack?: number;
  releves?: number;
  promos?: number;
  dernieres_commandes?: Array<{
    id: string;
    statut?: string;
    total_ht?: number;
    created_at?: string;
  }>;
  raccourcis?: Array<{ title: string; path: string }>;
};

export default function Page() {
  const base = metierBase();
  const [d, setD] = useState<Dash | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch(`${base}/api/v1/modules/dashboard`, { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || res.statusText);
        setD(data);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [base]);

  return (
    <section>
      <h1>Dashboard</h1>
      {error ? <p style={{ color: "#8b1e1e" }}>{error}</p> : null}
      <p style={{ fontSize: "1.15rem" }}>
        {d?.orientation || "Chargement…"}
      </p>
      <p>
        Fournisseurs : {d?.fournisseurs ?? "—"} · Produits : {d?.produits ?? "—"}{" "}
        · Panier : {d?.panier_lignes ?? "—"} · Commandes : {d?.commandes ?? "—"}{" "}
        · Stack : {d?.stack ?? "—"} · Relevés : {d?.releves ?? "—"}
      </p>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1rem" }}>
        {(d?.raccourcis || []).map((r) => (
          <a key={r.path} href={r.path} style={{ color: "#0f3d32" }}>
            {r.title}
          </a>
        ))}
      </div>
      <h2 style={{ marginTop: "1.5rem" }}>Dernières commandes</h2>
      <ul>
        {(d?.dernieres_commandes || []).map((c) => (
          <li key={c.id}>
            {c.id.slice(0, 8)} · {c.statut} · {c.total_ht ?? "—"} €
          </li>
        ))}
      </ul>
    </section>
  );
}
