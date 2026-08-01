async function loadDashboard() {
  const base = process.env.METIER_BASE_URL || "http://127.0.0.1:18791";
  try {
    const res = await fetch(`${base}/api/v1/modules/dashboard`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export default async function Page() {
  const d = await loadDashboard() as {
    fournisseurs?: number;
    produits?: number;
    panier_lignes?: number;
    commandes?: number;
  } | null;
  return (
    <section>
      <h1>Dashboard</h1>
      <p>
        Fournisseurs : {d?.fournisseurs ?? "—"} · Produits : {d?.produits ?? "—"} ·
        Panier : {d?.panier_lignes ?? "—"} · Commandes : {d?.commandes ?? "—"}
      </p>
      <p>UI interactive : <code>resources/renderer/index.html#dashboard</code></p>
    </section>
  );
}
