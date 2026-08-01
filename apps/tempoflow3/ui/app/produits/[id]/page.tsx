"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { metierBase } from "@/lib/metier-base";

type Prix = {
  id: string;
  fournisseur_id?: string;
  montant?: number;
  promo?: number;
  promo_label?: string;
};

type Produit = {
  id: string;
  nom?: string;
  unite?: string;
  categorie?: string;
  sku?: string;
  in_stack?: boolean;
  prix?: Prix[];
};

export default function Page() {
  const params = useParams();
  const id = String(params?.id || "");
  const base = metierBase();
  const [p, setP] = useState<Produit | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const res = await fetch(`${base}/api/v1/modules/produits/${id}`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || res.statusText);
    setP(data);
  }

  useEffect(() => {
    if (!id) return;
    void reload().catch((e) =>
      setError(e instanceof Error ? e.message : String(e)),
    );
  }, [base, id]);

  async function toggleStack() {
    setError(null);
    if (p?.in_stack) {
      await fetch(`${base}/api/v1/modules/stack/${id}`, { method: "DELETE" });
      setMsg("Retiré de la stack");
    } else {
      const res = await fetch(`${base}/api/v1/modules/stack`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ produit_id: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || res.statusText);
        return;
      }
      setMsg("Ajouté à Mes produits");
    }
    await reload();
  }

  async function addPanier(pr: Prix) {
    setError(null);
    if (!pr.fournisseur_id) return;
    const res = await fetch(`${base}/api/v1/modules/panier_lignes`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        produit_id: id,
        fournisseur_id: pr.fournisseur_id,
        quantite: 1,
        prix_unitaire: pr.montant,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || res.statusText);
      return;
    }
    setMsg("Ajouté au panier");
  }

  return (
    <section>
      <p>
        <a href="/produits" style={{ color: "#0f3d32" }}>
          ← Produits
        </a>
      </p>
      <h1>{p?.nom || "Produit"}</h1>
      {error ? <p style={{ color: "#8b1e1e" }}>{error}</p> : null}
      {msg ? <p style={{ color: "#0f3d32" }}>{msg}</p> : null}
      <p>
        SKU <code>{p?.sku}</code> · {p?.unite || "—"} · {p?.categorie || "—"}
      </p>
      <button type="button" onClick={() => void toggleStack()}>
        {p?.in_stack ? "Retirer de la stack" : "Ajouter à la stack"}
      </button>
      <h2 style={{ marginTop: "1.25rem" }}>Prix connus</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {(p?.prix || []).map((pr) => (
          <li
            key={pr.id}
            style={{
              display: "flex",
              gap: "0.75rem",
              marginBottom: "0.4rem",
              flexWrap: "wrap",
            }}
          >
            <span>
              {pr.montant} €{" "}
              {pr.promo ? `(promo ${pr.promo_label || ""})` : ""}
            </span>
            <span style={{ opacity: 0.7 }}>{pr.fournisseur_id?.slice(0, 8)}</span>
            <button type="button" onClick={() => void addPanier(pr)}>
              Panier
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}