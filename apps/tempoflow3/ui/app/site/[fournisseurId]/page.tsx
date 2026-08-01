async function load(id: string) {
  const base = process.env.METIER_BASE_URL || "http://127.0.0.1:18791";
  try {
    const res = await fetch(`${base}/api/v1/modules/site/${id}`, { cache: "no-store" });
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
  return (
    <section>
      <h1>Site fournisseur</h1>
      <p>id: {fournisseurId}</p>
      <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(data, null, 2)}</pre>
    </section>
  );
}
