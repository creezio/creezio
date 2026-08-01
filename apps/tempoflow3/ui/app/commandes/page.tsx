/** creezio:owned-by-brand */
"use client";

import { useEffect, useState } from "react";
import { metierBase } from "@/lib/metier-base";

type Commande = {
  id: string;
  fournisseur_id?: string;
  statut?: string;
  total_ht?: number;
  created_at?: string;
};

export default function Page() {
  const base = metierBase();
  const [items, setItems] = useState<Commande[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch(`${base}/api/v1/modules/commandes`, { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || res.statusText);
        setItems(data.items || []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [base]);

  return (
    <section>
      <h1>Commandes</h1>
      <p>Ouvrir une commande pour lignes figées et changement de statut.</p>
      {error ? <p style={{ color: "#8b1e1e" }}>{error}</p> : null}
      <table
        style={{ width: "100%", marginTop: "1rem", borderCollapse: "collapse" }}
      >
        <thead>
          <tr>
            <th align="left">Id</th>
            <th align="left">Statut</th>
            <th align="left">Total</th>
            <th align="left" />
          </tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.id}>
              <td>{c.id.slice(0, 8)}</td>
              <td>{c.statut}</td>
              <td>{c.total_ht ?? "—"} €</td>
              <td>
                <a href={`/commandes/${c.id}`} style={{ color: "#0f3d32" }}>
                  Ouvrir
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
