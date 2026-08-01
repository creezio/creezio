async function load() {
  const base = process.env.METIER_BASE_URL || "http://127.0.0.1:18791";
  try {
    const path = "marketplaces" === "optimiser"
      ? "/api/v1/modules/optimiser/suggest"
      : "marketplaces" === "scan"
        ? "/api/v1/modules/scan/start"
        : "/api/v1/modules/marketplaces";
    const res = await fetch(`${base}${path}`, {
      method: "marketplaces" === "optimiser" || "marketplaces" === "scan" ? "POST" : "GET",
      headers: { "content-type": "application/json" },
      body: "marketplaces" === "optimiser" ? JSON.stringify({ from: "panier" }) : "marketplaces" === "scan" ? "{}" : undefined,
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

export default async function Page() {
  const data = await load();
  return (
    <section>
      <h1>marketplaces</h1>
      <p>Module bonus TempoFlow3 — API kernel <code>/api/v1/modules/marketplaces</code>.</p>
      <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(data, null, 2)}</pre>
      <p>UI interactive : <code>resources/renderer/index.html#marketplaces</code></p>
    </section>
  );
}
