/** creezio:owned-by-brand */
"use client";

import { useEffect, useState } from "react";
import { metierBase } from "@/lib/metier-base";

type Promo = {
  id: string;
  produit_id?: string;
  produit_nom?: string;
  fournisseur_nom?: string;
  montant?: number;
  promo_label?: string;
};

export default function Page() {
  const base = metierBase();
  const [items, setItems] = useState<Promo[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const res = await fetch(`${base}/api/v1/modules/promotions`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || res.statusText);
    setItems(data.items || data.promotions || []);
  }

  useEffect(() => {
    void reload().catch((e) =>
      setError(e instanceof Error ? e.message : String(e)),
    );
  }, [base]);

  async function addPanier(p: Promo & { fournisseur_id?: string }) {
    setError(null);
    if (!p.produit_id || !p.fournisseur_id) {
      setError("produit_id / fournisseur_id manquants");
      return;
    }
    const res = await fetch(`${base}/api/v1/modules/panier_lignes`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        produit_id: p.produit_id,
        fournisseur_id: p.fournisseur_id,
        quantite: 1,
        prix_unitaire: p.montant,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || res.statusText);
      return;
    }
    setMsg(`Promo ajoutée au panier (${p.produit_nom || p.produit_id})`);
  }

  return (
    <section>
      <h1>Promotions</h1>
      <p>Prix promo connus — ajout rapide au panier.</p>
      {error ? <p style={{ color: "#8b1e1e" }}>{error}</p> : null}
      {msg ? <p style={{ color: "#0f3d32" }}>{msg}</p> : null}
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "1rem" }}>
        <thead>
          <tr>
            <th align="left">Produit</th>
            <th align="left">Fournisseur</th>
            <th align="left">Prix</th>
            <th align="left">Trace</th>
            <th align="left" />
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <tr key={p.id}>
              <td>{p.produit_nom || p.produit_id?.slice(0, 8)}</td>
              <td>{p.fournisseur_nom || "—"}</td>
              <td>{p.montant != null ? `${p.montant} €` : "—"}</td>
              <td style={{ fontSize: "0.85rem", opacity: 0.75 }}>
                {p.promo_label || ""}
              </td>
              <td>
                <button type="button" onClick={() => void addPanier(p)}>
                  Panier
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 ? <p style={{ opacity: 0.7 }}>Aucune promo.</p> : null}
    </section>
  );
}
