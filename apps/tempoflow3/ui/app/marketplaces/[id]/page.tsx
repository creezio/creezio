"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { metierBase } from "@/lib/metier-base";

type Marketplace = {
  id: string;
  nom?: string;
  url?: string;
  notes?: string;
};

export default function Page() {
  const params = useParams();
  const id = String(params?.id || "");
  const base = metierBase();
  const [m, setM] = useState<Marketplace | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    void fetch(`${base}/api/v1/modules/marketplaces/${id}`, {
      cache: "no-store",
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || res.statusText);
        setM(data);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [base, id]);

  if (!m && !error) return <section><p>Chargement…</p></section>;

  return (
    <section>
      <p>
        <a href="/marketplaces" style={{ color: "#0f3d32" }}>
          ← Marketplaces
        </a>
      </p>
      <h1>{m?.nom || "Marketplace"}</h1>
      {error ? <p style={{ color: "#8b1e1e" }}>{error}</p> : null}
      {m?.url ? (
        <p>
          <a href={m.url} target="_blank" rel="noreferrer">
            {m.url}
          </a>
        </p>
      ) : null}
      {m?.notes ? <p>{m.notes}</p> : null}
    </section>
  );
}
