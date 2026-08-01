/** creezio:owned-by-brand */
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { metierBase } from "@/lib/metier-base";

type Version = {
  id: string;
  created_at?: string;
  statut?: string;
  total_ht?: number;
};

export default function Page() {
  const params = useParams();
  const id = String(params?.id || "");
  const base = metierBase();
  const [items, setItems] = useState<Version[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const res = await fetch(
      `${base}/api/v1/modules/commande-versions/${id}`,
      { cache: "no-store" },
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || res.statusText);
    setItems(data.items || []);
  }

  useEffect(() => {
    if (!id) return;
    void reload().catch((e) =>
      setError(e instanceof Error ? e.message : String(e)),
    );
  }, [base, id]);

  async function snapshot() {
    setError(null);
    const res = await fetch(
      `${base}/api/v1/modules/commande-versions/${id}`,
      { method: "POST" },
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || res.statusText);
      return;
    }
    setMsg(`Version créée ${String(data.id || "").slice(0, 8)}`);
    await reload();
  }

  return (
    <section>
      <p>
        <a href={`/commandes/${id}`} style={{ color: "#0f3d32" }}>
          ← Commande
        </a>
      </p>
      <h1>Versions de commande</h1>
      {error ? <p style={{ color: "#8b1e1e" }}>{error}</p> : null}
      {msg ? <p style={{ color: "#0f3d32" }}>{msg}</p> : null}
      <button type="button" onClick={() => void snapshot()}>
        Créer un snapshot
      </button>
      <ul>
        {items.map((v) => (
          <li key={v.id}>
            {v.created_at} · {v.statut} · {v.total_ht ?? "—"} € ·{" "}
            <code>{v.id.slice(0, 8)}</code>
          </li>
        ))}
      </ul>
    </section>
  );
}
