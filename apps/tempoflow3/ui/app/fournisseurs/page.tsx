/**
 * Page métier Fournisseurs — générée --from-prd.
 * Liste réelle via api-kernel /api/v1/modules/* (même kernel que desktop).
 */
async function loadItems() {
  const base = process.env.METIER_BASE_URL || "http://127.0.0.1:18791";
  try {
    const res = await fetch(`${base}/api/v1/modules/fournisseurs`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as { items?: Record<string, unknown>[] };
    return data.items || [];
  } catch {
    return [];
  }
}

export default async function Page() {
  const items = await loadItems();
  return (
    <section>
      <h1>Fournisseurs</h1>
      <p>Entité <code>fournisseurs</code> — {items.length} élément(s).</p>
      <ul>
        {items.map((item) => (
          <li key={String(item.id)}>
            <code>{String(item.id).slice(0, 8)}</code>{" "}
            {String(item.nom || item.titre || item.statut || item.montant || item.libelle_fournisseur || "")}
          </li>
        ))}
      </ul>
      <p>UI interactive : <code>resources/renderer/index.html#fournisseurs</code></p>
    </section>
  );
}
