/** creezio:owned-by-brand */
"use client";

import { useEffect, useMemo, useState } from "react";
import { metierBase } from "@/lib/metier-base";

type Suggestion = {
  produit_id?: string;
  produit_nom?: string;
  from_fournisseur_id?: string;
  to_fournisseur_id?: string;
  fournisseur_id?: string;
  fournisseur_nom?: string;
  from_montant?: number;
  to_montant?: number;
  prix_actuel?: number;
  prix_unitaire?: number;
  economy?: number;
  ecart_eur?: number;
  score?: string;
};

type GraphNode = { id: string; label: string; kind: "product" | "supplier" };

export default function Page() {
  const base = metierBase();
  const [items, setItems] = useState<Suggestion[]>([]);
  const [orientation, setOrientation] = useState("");
  const [economie, setEconomie] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function reload() {
    const res = await fetch(`${base}/api/v1/modules/optimiser/suggest`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ from: "panier" }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || res.statusText);
    setItems(data.suggestions || data.items || []);
    setOrientation(data.orientation || "");
    setEconomie(Number(data.economie_eur || 0));
  }

  useEffect(() => {
    void reload().catch((e) =>
      setError(e instanceof Error ? e.message : String(e)),
    );
  }, [base]);

  const graph = useMemo(() => {
    const nodes = new Map<string, GraphNode>();
    const edges: Array<{ from: string; to: string; label: string }> = [];
    for (const s of items) {
      const pid = s.produit_id || "p?";
      const from = s.from_fournisseur_id || "actuel";
      const to = s.to_fournisseur_id || s.fournisseur_id || "best";
      nodes.set(pid, {
        id: pid,
        label: s.produit_nom || pid.slice(0, 8),
        kind: "product",
      });
      nodes.set(from, {
        id: from,
        label: from === "actuel" ? "Actuel" : from.slice(0, 8),
        kind: "supplier",
      });
      nodes.set(to, {
        id: to,
        label: s.fournisseur_nom || to.slice(0, 8),
        kind: "supplier",
      });
      edges.push({
        from,
        to: pid,
        label: `${s.from_montant ?? s.prix_actuel ?? "?"}€`,
      });
      edges.push({
        from: to,
        to: pid,
        label: `${s.to_montant ?? s.prix_unitaire ?? "?"}€ ★`,
      });
    }
    return { nodes: [...nodes.values()], edges };
  }, [items]);

  async function applyAll() {
    setError(null);
    const res = await fetch(`${base}/api/v1/modules/optimiser/apply`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ propositions: items }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || res.statusText);
      return;
    }
    setMsg("Optimisation appliquée au panier");
    await reload();
  }

  const w = 640;
  const h = Math.max(280, 80 + graph.nodes.length * 36);
  const suppliers = graph.nodes.filter((n) => n.kind === "supplier");
  const products = graph.nodes.filter((n) => n.kind === "product");

  return (
    <section>
      <h1>Optimiser</h1>
      <p>Atelier score / graphe fournisseurs ↔ produits (parité comportementale TF2).</p>
      {orientation ? <p>{orientation}</p> : null}
      <p>
        Économie potentielle : <strong>{economie} €</strong>
      </p>
      <button type="button" onClick={() => void applyAll()}>
        Appliquer au panier
      </button>
      {error ? <p style={{ color: "#8b1e1e" }}>{error}</p> : null}
      {msg ? <p style={{ color: "#0f3d32" }}>{msg}</p> : null}

      <svg
        width="100%"
        viewBox={`0 0 ${w} ${h}`}
        style={{
          marginTop: "1.25rem",
          background: "rgba(255,255,255,0.45)",
          borderRadius: 8,
        }}
      >
        {graph.edges.map((e, i) => {
          const fi = suppliers.findIndex((n) => n.id === e.from);
          const ti = products.findIndex((n) => n.id === e.to);
          if (fi < 0 || ti < 0) return null;
          const x1 = 120;
          const y1 = 40 + fi * 48;
          const x2 = w - 140;
          const y2 = 40 + ti * 48;
          return (
            <g key={`${e.from}-${e.to}-${i}`}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={e.label.includes("★") ? "#0f3d32" : "#8a9a94"}
                strokeWidth={e.label.includes("★") ? 2.5 : 1}
              />
              <text
                x={(x1 + x2) / 2}
                y={(y1 + y2) / 2 - 4}
                fontSize="11"
                fill="#14201c"
              >
                {e.label}
              </text>
            </g>
          );
        })}
        {suppliers.map((n, i) => (
          <g key={n.id}>
            <rect
              x={40}
              y={20 + i * 48}
              width={160}
              height={36}
              rx={6}
              fill="#0f3d32"
            />
            <text x={50} y={42 + i * 48} fill="#f6f3eb" fontSize="12">
              {n.label}
            </text>
          </g>
        ))}
        {products.map((n, i) => (
          <g key={n.id}>
            <rect
              x={w - 200}
              y={20 + i * 48}
              width={160}
              height={36}
              rx={6}
              fill="#c45c26"
            />
            <text x={w - 190} y={42 + i * 48} fill="#fff" fontSize="12">
              {n.label}
            </text>
          </g>
        ))}
      </svg>

      <h2>Suggestions</h2>
      <ul>
        {items.map((s, i) => (
          <li key={`${s.produit_id}-${i}`}>
            {s.produit_nom || s.produit_id?.slice(0, 8)} :{" "}
            {s.from_montant ?? s.prix_actuel} → {s.to_montant ?? s.prix_unitaire}{" "}
            € ({s.score || "—"}) éco {s.economy ?? s.ecart_eur ?? "—"}
          </li>
        ))}
      </ul>
      {!items.length && !error ? (
        <p>Aucune suggestion — remplir le panier avec des prix concurrents.</p>
      ) : null}
    </section>
  );
}
