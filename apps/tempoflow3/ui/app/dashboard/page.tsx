async function loadDashboard() {
  const base = process.env.METIER_BASE_URL || "http://127.0.0.1:18791";
  try {
    const res = await fetch(`${base}/api/v1/modules/dashboard`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export default async function Page() {
  const d = (await loadDashboard()) as {
    orientation?: string;
    fournisseurs?: number;
    panier_lignes?: number;
    promos?: number;
    stack?: number;
    raccourcis?: { title: string; path: string }[];
  } | null;
  return (
    <section>
      <h1>Dashboard</h1>
      <p><strong>{d?.orientation ?? "—"}</strong></p>
      <p>
        Fournisseurs : {d?.fournisseurs ?? "—"} · Panier : {d?.panier_lignes ?? "—"} ·
        Promos : {d?.promos ?? "—"} · Stack : {d?.stack ?? "—"}
      </p>
      <ul>
        {(d?.raccourcis || []).map((r) => (
          <li key={r.path}><a href={r.path}>{r.title}</a></li>
        ))}
      </ul>
      <p>UI interactive : <code>resources/renderer/index.html#dashboard</code></p>
    </section>
  );
}
