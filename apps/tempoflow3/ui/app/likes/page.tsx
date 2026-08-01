/** creezio:owned-by-brand */
"use client";

import { useEffect, useState } from "react";
import { metierBase } from "@/lib/metier-base";

type Like = { id: string; nom?: string; created_at?: string };

export default function Page() {
  const base = metierBase();
  const [items, setItems] = useState<Like[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const res = await fetch(`${base}/api/v1/modules/likes`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || res.statusText);
    setItems(data.items || []);
  }

  useEffect(() => {
    void reload().catch((e) =>
      setError(e instanceof Error ? e.message : String(e)),
    );
  }, [base]);

  async function unlike(id: string) {
    await fetch(`${base}/api/v1/modules/likes/${id}`, { method: "DELETE" });
    await reload();
  }

  return (
    <section>
      <h1>Likes</h1>
      <p>Produits favoris (parité TF2).</p>
      {error ? <p style={{ color: "#8b1e1e" }}>{error}</p> : null}
      <ul>
        {items.map((l) => (
          <li key={l.id} style={{ marginBottom: "0.35rem" }}>
            <a href={`/produits/${l.id}`} style={{ color: "#0f3d32" }}>
              {l.nom || l.id.slice(0, 8)}
            </a>{" "}
            <button type="button" onClick={() => void unlike(l.id)}>
              Retirer
            </button>
          </li>
        ))}
      </ul>
      {!items.length && !error ? <p>Aucun like.</p> : null}
    </section>
  );
}
