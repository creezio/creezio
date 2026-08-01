async function load() {
  const base = process.env.METIER_BASE_URL || "http://127.0.0.1:18791";
  try {
    const res = await fetch(`${base}/api/v1/modules/site`, { cache: "no-store" });
    if (!res.ok) return { items: [] };
    return res.json();
  } catch {
    return { items: [] };
  }
}

export default async function Page() {
  const data = await load();
  const items = data.items || [];
  return (
    <section>
      <h1>Sites fournisseurs</h1>
      <ul>
        {items.map((f: { id: string; nom: string; site_web?: string }) => (
          <li key={f.id}>
            <a href={`/site/${f.id}`}>{f.nom}</a>
            {f.site_web ? ` — ${f.site_web}` : ""}
          </li>
        ))}
      </ul>
    </section>
  );
}
