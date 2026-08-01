"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { metierBase } from "@/lib/metier-base";

type Sku = {
  id: string;
  sku?: string;
  nom?: string;
  unite?: string;
  categorie?: string;
  fournisseur_id?: string;
};

export default function Page() {
  const params = useParams();
  const id = String(params?.id || "");
  const base = metierBase();
  const [s, setS] = useState<Sku | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    void fetch(`${base}/api/v1/modules/produits/${id}`, { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || res.statusText);
        setS(data);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [base, id]);

  async function addStack() {
    setError(null);
    const res = await fetch(`${base}/api/v1/modules/stack`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ produit_id: id }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || res.statusText);
      return;
    }
    setMsg("Ajouté à Mes produits");
  }

  if (!s && !error) return <section><p>Chargement…</p></section>;

  return (
    <section>
      <p>
        <a href="/skus" style={{ color: "#0f3d32" }}>
          ← SKUs
        </a>
      </p>
      <h1>{s?.sku || s?.nom || "SKU"}</h1>
      {error ? <p style={{ color: "#8b1e1e" }}>{error}</p> : null}
      {msg ? <p style={{ color: "#0f3d32" }}>{msg}</p> : null}
      <p>
        {s?.nom} · {s?.unite || "—"} · {s?.categorie || "—"}
      </p>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <button type="button" onClick={() => void addStack()}>
          Ajouter à la stack
        </button>
        <a href={`/produits/${id}`} style={{ color: "#0f3d32" }}>
          Fiche produit
        </a>
        {s?.fournisseur_id ? (
          <a
            href={`/fournisseurs/${s.fournisseur_id}`}
            style={{ color: "#0f3d32" }}
          >
            Fournisseur
          </a>
        ) : null}
      </div>
    </section>
  );
}
