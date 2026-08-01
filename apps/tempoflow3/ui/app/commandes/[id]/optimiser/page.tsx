"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { metierBase } from "@/lib/metier-base";

type Suggestion = {
  produit_id?: string;
  produit_nom?: string;
  from_fournisseur_id?: string;
  to_fournisseur_id?: string;
  from_montant?: number;
  to_montant?: number;
  economy?: number;
};

export default function Page() {
  const params = useParams();
  const id = String(params?.id || "");
  const base = metierBase();
  const [items, setItems] = useState<Suggestion[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const res = await fetch(
      `${base}/api/v1/modules/optimiser?commande_id=${encodeURIComponent(id)}`,
      { cache: "no-store" },
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || res.statusText);
    setItems(data.suggestions || data.items || []);
  }

  useEffect(() => {
    if (!id) return;
    void reload().catch((e) =>
      setError(e instanceof Error ? e.message : String(e)),
    );
  }, [base, id]);

  async function applyAll() {
    setError(null);
    const res = await fetch(`${base}/api/v1/modules/optimiser/apply`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ commande_id: id }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || res.statusText);
      return;
    }
    setMsg(`Optimisation appliquée (${data.applied ?? "ok"})`);
    await reload().catch(() => undefined);
  }

  return (
    <section>
      <p>
        <a href={`/commandes/${id}`} style={{ color: "#0f3d32" }}>
          ← Commande
        </a>
      </p>
      <h1>Optimiser la commande</h1>
      <p>Suggestions de bascule fournisseur pour cette commande.</p>
      {error ? <p style={{ color: "#8b1e1e" }}>{error}</p> : null}
      {msg ? <p style={{ color: "#0f3d32" }}>{msg}</p> : null}
      <button type="button" onClick={() => void applyAll()}>
        Appliquer les suggestions
      </button>
      <ul>
        {items.map((s, i) => (
          <li key={`${s.produit_id || i}`}>
            {s.produit_nom || s.produit_id?.slice(0, 8)} : {s.from_montant} →{" "}
            {s.to_montant} € (éco {s.economy ?? "—"})
          </li>
        ))}
      </ul>
      {!items.length && !error ? <p>Aucune suggestion.</p> : null}
    </section>
  );
}
