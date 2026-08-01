"use client";

import { useState } from "react";
import { metierBase } from "@/lib/metier-base";

type Suggestion = {
  produit_id: string;
  produit_nom?: string;
  quantite?: number;
  fournisseur_nom?: string;
  prix_unitaire?: number;
  prix_actuel?: number;
  ecart_eur?: number;
  score?: string;
  error?: string;
};

type Result = {
  suggestions?: Suggestion[];
  total_actuel?: number;
  total_optimise?: number;
  economie_eur?: number;
  orientation?: string;
  applied?: boolean;
  items?: unknown[];
};

export default function Page() {
  const base = metierBase();
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function suggest() {
    setError(null);
    const res = await fetch(`${base}/api/v1/modules/optimiser/suggest`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ from: "panier" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || res.statusText);
      return;
    }
    setResult(data);
  }

  async function apply() {
    setError(null);
    const res = await fetch(`${base}/api/v1/modules/optimiser/apply`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        propositions: result?.suggestions || [],
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || res.statusText);
      return;
    }
    setResult(data);
  }

  const rows = result?.suggestions || [];

  return (
    <section>
      <h1>Optimiser</h1>
      <p>Calcul local sur prix connus — appliquer au panier.</p>
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
        <button type="button" onClick={() => void suggest()}>
          Suggérer depuis le panier
        </button>
        <button type="button" onClick={() => void apply()} disabled={!rows.length}>
          Appliquer au panier
        </button>
      </div>
      {error ? <p style={{ color: "#8b1e1e" }}>{error}</p> : null}
      {result?.orientation ? (
        <p style={{ marginTop: "1rem", fontSize: "1.1rem" }}>
          {result.orientation}
        </p>
      ) : null}
      {result?.economie_eur != null ? (
        <p>
          Actuel {result.total_actuel} € → Optimisé {result.total_optimise} € (
          {result.economie_eur} €)
        </p>
      ) : null}
      {result?.applied ? (
        <p style={{ color: "#0f3d32" }}>
          Panier mis à jour ({result.items?.length ?? 0} lignes).
        </p>
      ) : null}
      {rows.length ? (
        <table
          style={{
            width: "100%",
            marginTop: "1rem",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr>
              <th align="left">Produit</th>
              <th align="left">Qté</th>
              <th align="left">Actuel</th>
              <th align="left">Meilleur</th>
              <th align="left">Fournisseur</th>
              <th align="left">Écart</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.produit_id}>
                <td>{s.produit_nom || s.produit_id.slice(0, 8)}</td>
                <td>{s.quantite}</td>
                <td>{s.prix_actuel ?? "—"}</td>
                <td>{s.prix_unitaire ?? "—"}</td>
                <td>{s.fournisseur_nom || "—"}</td>
                <td>
                  {s.error ||
                    `${s.ecart_eur ?? 0} € (${s.score || "—"})`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </section>
  );
}