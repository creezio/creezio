/** creezio:owned-by-brand */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { metierBase } from "@/lib/metier-base";

type SitePayload = {
  fournisseur?: {
    id?: string;
    nom?: string;
    contact?: string;
    email?: string;
    site_web?: string;
  };
  site_web?: string;
  produits?: Array<{ id: string; nom?: string; unite?: string }>;
  promotions?: Array<{
    id?: string;
    produit_id?: string;
    montant?: number;
    created_at?: string;
  }>;
  error?: string | number;
};

export default function Page({
  params,
}: {
  params: { fournisseurId: string } | Promise<{ fournisseurId: string }>;
}) {
  const base = metierBase();
  const [fournisseurId, setFournisseurId] = useState("");
  const [data, setData] = useState<SitePayload | null>(null);
  const [slot, setSlot] = useState<"catalogue" | "promos" | "web">("catalogue");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.resolve(params).then((p) => setFournisseurId(p.fournisseurId));
  }, [params]);

  useEffect(() => {
    if (!fournisseurId) return;
    void fetch(`${base}/api/v1/modules/site/${fournisseurId}`)
      .then(async (res) => {
        const body = (await res.json()) as SitePayload;
        if (!res.ok) throw new Error(String(body.error || res.status));
        setData(body);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [base, fournisseurId]);

  const f = data?.fournisseur || {};
  const produits = Array.isArray(data?.produits) ? data!.produits! : [];
  const promos = Array.isArray(data?.promotions) ? data!.promotions! : [];
  const siteUrl = String(data?.site_web || f.site_web || "");

  return (
    <section>
      <p>
        <Link href="/fournisseurs" style={{ color: "#0f3d32" }}>
          ← Fournisseurs
        </Link>
        {" · "}
        <Link href={`/fournisseurs/${fournisseurId}`} style={{ color: "#0f3d32" }}>
          Fiche
        </Link>
      </p>
      <h1>{f.nom || "Site fournisseur"}</h1>
      <p>
        Navigateur fournisseur — slots catalogue / promos / web (parité comportementale TF2).
      </p>
      {error ? <p style={{ color: "#8b1e1e" }}>{error}</p> : null}

      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          margin: "1rem 0",
          flexWrap: "wrap",
        }}
      >
        {(
          [
            ["catalogue", "Catalogue"],
            ["promos", "Promotions"],
            ["web", "Site web"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setSlot(id)}
            style={{
              background: slot === id ? "#0f3d32" : "transparent",
              color: slot === id ? "#f6f3eb" : "#14201c",
              border: "1px solid #0f3d32",
              padding: "0.4rem 0.8rem",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(220px, 280px) 1fr",
          gap: "1rem",
          minHeight: 360,
        }}
      >
        <aside
          style={{
            background: "rgba(255,255,255,0.45)",
            borderRadius: 8,
            padding: "0.75rem",
          }}
        >
          <h2 style={{ fontSize: "1rem" }}>Slots</h2>
          {slot === "catalogue" ? (
            <ul>
              {produits.map((p) => (
                <li key={p.id}>
                  <Link href={`/produits/${p.id}`}>{p.nom || p.id.slice(0, 8)}</Link>
                  {p.unite ? ` · ${p.unite}` : ""}
                </li>
              ))}
              {!produits.length ? (
                <li style={{ opacity: 0.7 }}>Aucun produit</li>
              ) : null}
            </ul>
          ) : null}
          {slot === "promos" ? (
            <ul>
              {promos.map((pr) => (
                <li key={pr.id || `${pr.produit_id}-${pr.created_at}`}>
                  {pr.produit_id?.slice(0, 8)} — {pr.montant} €
                </li>
              ))}
              {!promos.length ? (
                <li style={{ opacity: 0.7 }}>Aucune promo</li>
              ) : null}
            </ul>
          ) : null}
          {slot === "web" ? (
            <p style={{ fontSize: "0.9rem", wordBreak: "break-all" }}>
              {siteUrl || "Pas d’URL site enregistrée."}
            </p>
          ) : null}
        </aside>

        <div
          data-testid="site-browser-frame"
          style={{
            background: "#14201c",
            borderRadius: 8,
            overflow: "hidden",
            minHeight: 360,
          }}
        >
          {siteUrl ? (
            <iframe
              title="site-fournisseur"
              src={siteUrl}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              style={{ width: "100%", height: "100%", minHeight: 360, border: 0 }}
            />
          ) : (
            <div
              style={{
                color: "#f6f3eb",
                padding: "1.5rem",
                opacity: 0.85,
              }}
            >
              <p>Pas d’URL — aperçu local du slot « {slot} ».</p>
              <p>
                Contact : {f.contact || "—"}
                {f.email ? ` · ${f.email}` : ""}
              </p>
              <p>
                {slot === "catalogue"
                  ? `${produits.length} produits`
                  : slot === "promos"
                    ? `${promos.length} promotions`
                    : "Site web manquant"}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
