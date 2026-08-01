/** creezio:owned-by-brand */
import Link from "next/link";

async function load(id: string) {
  const base = process.env.METIER_BASE_URL || "http://127.0.0.1:18791";
  try {
    const res = await fetch(`${base}/api/v1/modules/site/${id}`, {
      cache: "no-store",
    });
    if (!res.ok) return { error: res.status };
    return res.json();
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ fournisseurId: string }>;
}) {
  const { fournisseurId } = await params;
  const data = await load(fournisseurId);
  if (data.error) {
    return (
      <section>
        <p>
          <Link href="/fournisseurs">← Fournisseurs</Link>
        </p>
        <h1>Site fournisseur</h1>
        <p style={{ color: "#8b1e1e" }}>Erreur : {String(data.error)}</p>
      </section>
    );
  }
  const f = data.fournisseur || {};
  const produits = Array.isArray(data.produits) ? data.produits : [];
  const promos = Array.isArray(data.promotions) ? data.promotions : [];
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
        {f.contact ? `Contact : ${f.contact}` : null}
        {f.email ? ` · ${f.email}` : null}
      </p>
      {data.site_web || f.site_web ? (
        <p>
          <a
            href={String(data.site_web || f.site_web)}
            target="_blank"
            rel="noreferrer"
            style={{ color: "#0f3d32" }}
          >
            Ouvrir le site web
          </a>
        </p>
      ) : (
        <p style={{ opacity: 0.7 }}>Pas d’URL site enregistrée.</p>
      )}
      <h2>Catalogue ({produits.length})</h2>
      <ul>
        {produits.map((p: { id: string; nom?: string; unite?: string }) => (
          <li key={p.id}>
            <Link href={`/produits/${p.id}`}>{p.nom || p.id.slice(0, 8)}</Link>
            {p.unite ? ` · ${p.unite}` : ""}
          </li>
        ))}
      </ul>
      <h2>Promotions ({promos.length})</h2>
      <ul>
        {promos.map(
          (pr: {
            id?: string;
            produit_id?: string;
            montant?: number;
            created_at?: string;
          }) => (
            <li key={pr.id || `${pr.produit_id}-${pr.created_at}`}>
              {pr.produit_id?.slice(0, 8)} — {pr.montant} €
            </li>
          ),
        )}
      </ul>
      {!promos.length ? <p style={{ opacity: 0.7 }}>Aucune promo.</p> : null}
    </section>
  );
}
