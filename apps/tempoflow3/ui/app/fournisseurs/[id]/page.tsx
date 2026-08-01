/** creezio:owned-by-brand */
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { metierBase } from "@/lib/metier-base";

type Fournisseur = {
  id: string;
  nom?: string;
  email?: string;
  telephone?: string;
  notes?: string;
};

type Produit = { id: string; nom?: string; sku?: string };

export default function Page() {
  const params = useParams();
  const id = String(params?.id || "");
  const base = metierBase();
  const [f, setF] = useState<Fournisseur | null>(null);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      try {
        const [fr, pr] = await Promise.all([
          fetch(`${base}/api/v1/modules/fournisseurs/${id}`, {
            cache: "no-store",
          }),
          fetch(
            `${base}/api/v1/modules/produits?fournisseur_id=${encodeURIComponent(id)}`,
            { cache: "no-store" },
          ),
        ]);
        const fd = await fr.json();
        const pd = await pr.json();
        if (!fr.ok) throw new Error(fd.error || fr.statusText);
        setF(fd);
        setProduits(pd.items || pd || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, [base, id]);

  if (!f && !error) return <section><p>Chargement…</p></section>;

  return (
    <section>
      <p>
        <a href="/fournisseurs" style={{ color: "#0f3d32" }}>
          ← Fournisseurs
        </a>
      </p>
      <h1>{f?.nom || "Fournisseur"}</h1>
      {error ? <p style={{ color: "#8b1e1e" }}>{error}</p> : null}
      <p>
        {f?.email || "—"} · {f?.telephone || "—"}
      </p>
      {f?.notes ? <p>{f.notes}</p> : null}
      <p>
        <a href={`/site/${id}`} style={{ color: "#0f3d32" }}>
          Surface fournisseur
        </a>
      </p>
      <h2>Produits ({produits.length})</h2>
      <ul>
        {produits.map((p) => (
          <li key={p.id}>
            <a href={`/produits/${p.id}`} style={{ color: "#0f3d32" }}>
              {p.nom || p.id.slice(0, 8)}
            </a>
            {p.sku ? ` · ${p.sku}` : ""}
          </li>
        ))}
      </ul>
    </section>
  );
}
