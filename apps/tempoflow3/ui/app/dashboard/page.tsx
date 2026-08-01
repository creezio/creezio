async function loadDashboard() {
  const base = process.env.METIER_BASE_URL || "http://127.0.0.1:18791";
  try {
    const res = await fetch(`${base}/api/v1/brand/dashboard`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export default async function Page() {
  const d = await loadDashboard() as {
    fournisseurs_actifs?: number;
    lignes_panier?: number;
    raccourcis?: { title: string; path: string }[];
  } | null;
  return (
    <section>
      <h1>Dashboard</h1>
      <p>Fournisseurs actifs : {d?.fournisseurs_actifs ?? "—"} · Panier : {d?.lignes_panier ?? "—"}</p>
      <ul>
        {(d?.raccourcis || []).map((r) => (
          <li key={r.path}><a href={r.path}>{r.title}</a></li>
        ))}
      </ul>
      <p>UI interactive : <code>resources/renderer/index.html#dashboard</code></p>
    </section>
  );
}
