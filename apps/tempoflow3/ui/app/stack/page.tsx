/** creezio:owned-by-brand */
"use client";

import { useEffect, useState } from "react";
import { metierBase } from "@/lib/metier-base";

type StackItem = {
  produit_id: string;
  nom?: string;
  unite?: string;
  prix_actuel?: number | null;
  prix_fournisseur_id?: string | null;
  notes?: string;
};

type Produit = { id: string; nom?: string };

export default function Page() {
  const base = metierBase();
  const [items, setItems] = useState<StackItem[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [produitId, setProduitId] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const [stackRes, prodRes] = await Promise.all([
      fetch(`${base}/api/v1/modules/stack`, { cache: "no-store" }),
      fetch(`${base}/api/v1/modules/produits`, { cache: "no-store" }),
    ]);
    const stack = await stackRes.json();
    const prod = await prodRes.json();
    if (!stackRes.ok) throw new Error(stack.error || stackRes.statusText);
    setItems(stack.items || []);
    setProduits(prod.items || []);
  }

  useEffect(() => {
    void reload().catch((e) =>
      setError(e instanceof Error ? e.message : String(e)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addToStack() {
    setError(null);
    setMsg(null);
    if (!produitId) {
      setError("Choisir un produit");
      return;
    }
    const res = await fetch(`${base}/api/v1/modules/stack`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ produit_id: produitId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || res.statusText);
      return;
    }
    setMsg(`Ajouté à la stack (${produitId.slice(0, 8)})`);
    setProduitId("");
    await reload();
  }

  async function remove(id: string) {
    setError(null);
    const res = await fetch(`${base}/api/v1/modules/stack/${id}`, {
      method: "DELETE",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || res.statusText);
      return;
    }
    setMsg("Retiré de la stack");
    await reload();
  }

  async function addPanier(id: string) {
    setError(null);
    const res = await fetch(`${base}/api/v1/modules/stack/${id}/panier`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ quantite: 1 }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || res.statusText);
      return;
    }
    setMsg("Ajouté au panier");
  }

  return (
    <section>
      <h1>Mes produits</h1>
      <p>Sélection habituelle — prix actuel et panier en un clic.</p>
      {error ? <p style={{ color: "#8b1e1e" }}>{error}</p> : null}
      {msg ? <p style={{ color: "#0f3d32" }}>{msg}</p> : null}

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
        <select
          value={produitId}
          onChange={(e) => setProduitId(e.target.value)}
          style={{ minWidth: "14rem" }}
        >
          <option value="">— produit catalogue —</option>
          {produits.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nom || p.id.slice(0, 8)}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => void addToStack()}>
          Ajouter à la stack
        </button>
      </div>

      <table style={{ width: "100%", marginTop: "1.25rem", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th align="left">Produit</th>
            <th align="left">Prix</th>
            <th align="left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <tr key={row.produit_id}>
              <td>
                {row.nom || row.produit_id.slice(0, 8)}
                {row.unite ? ` (${row.unite})` : ""}
              </td>
              <td>
                {row.prix_actuel != null ? `${row.prix_actuel} €` : "—"}
              </td>
              <td style={{ display: "flex", gap: "0.4rem" }}>
                <button type="button" onClick={() => void addPanier(row.produit_id)}>
                  Panier
                </button>
                <button type="button" onClick={() => void remove(row.produit_id)}>
                  Retirer
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {items.length === 0 ? <p style={{ opacity: 0.7 }}>Stack vide.</p> : null}
    </section>
  );
}
