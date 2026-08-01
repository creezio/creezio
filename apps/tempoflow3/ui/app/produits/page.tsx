/**
 * Page métier Produits — générée --from-prd.
 * Données via API brand (METIER_BASE_URL).
 */
async function loadItems() {
  const base = process.env.METIER_BASE_URL || "http://127.0.0.1:18791";
  try {
    const res = await fetch(`${base}/api/v1/brand/produits`, { cache: "no-store" });
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
      <h1>Produits</h1>
      <p>Entité <code>produits</code> — {items.length} élément(s).</p>
      <ul>
        {items.map((item) => (
          <li key={String(item.id)}>
            <code>{String(item.id).slice(0, 8)}</code>{" "}
            {String(item.nom || item.titre || item.statut || item.montant || "")}
          </li>
        ))}
      </ul>
    </section>
  );
}
