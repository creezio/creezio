/** creezio:owned-by-brand */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { metierBase } from "@/lib/metier-base";

type Item = { id: string; nom: string; site_web?: string };

export default function Page() {
  const base = metierBase();
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch(`${base}/api/v1/modules/site`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || res.statusText);
        setItems(data.items || []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [base]);

  return (
    <section>
      <h1>Sites fournisseurs</h1>
      <p>Entrée navigateur fournisseur (slots catalogue / promos / web).</p>
      {error ? <p style={{ color: "#8b1e1e" }}>{error}</p> : null}
      <ul>
        {items.map((f) => (
          <li key={f.id}>
            <Link href={`/site/${f.id}`}>{f.nom}</Link>
            {f.site_web ? ` — ${f.site_web}` : ""}
          </li>
        ))}
      </ul>
      {!items.length && !error ? (
        <p style={{ opacity: 0.7 }}>Aucun fournisseur — créer via /fournisseurs.</p>
      ) : null}
    </section>
  );
}
