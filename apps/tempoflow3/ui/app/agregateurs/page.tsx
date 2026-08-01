async function load() {
  const base = process.env.METIER_BASE_URL || "http://127.0.0.1:18791";
  try {
    const path = "agregateurs" === "optimiser"
      ? "/api/v1/modules/optimiser/suggest"
      : "agregateurs" === "scan"
        ? "/api/v1/modules/scan/start"
        : "/api/v1/modules/agregateurs";
    const res = await fetch(`${base}${path}`, {
      method: "agregateurs" === "optimiser" || "agregateurs" === "scan" ? "POST" : "GET",
      headers: { "content-type": "application/json" },
      body: "agregateurs" === "optimiser" ? JSON.stringify({ from: "panier" }) : "agregateurs" === "scan" ? "{}" : undefined,
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
      <h1>agregateurs</h1>
      <p>Module bonus TempoFlow3 — API kernel <code>/api/v1/modules/agregateurs</code>.</p>
      <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(data, null, 2)}</pre>
      <p>UI interactive : <code>resources/renderer/index.html#agregateurs</code></p>
    </section>
  );
}
