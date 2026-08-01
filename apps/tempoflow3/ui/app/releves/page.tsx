async function load() {
  const base = process.env.METIER_BASE_URL || "http://127.0.0.1:18791";
  try {
    const path = "releves" === "optimiser"
      ? "/api/v1/modules/optimiser/suggest"
      : "releves" === "scan"
        ? "/api/v1/modules/scan/start"
        : "/api/v1/modules/releves";
    const res = await fetch(`${base}${path}`, {
      method: "releves" === "optimiser" || "releves" === "scan" ? "POST" : "GET",
      headers: { "content-type": "application/json" },
      body: "releves" === "optimiser" ? JSON.stringify({ from: "panier" }) : "releves" === "scan" ? "{}" : undefined,
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
      <h1>releves</h1>
      <p>Module bonus TempoFlow3 — API kernel <code>/api/v1/modules/releves</code>.</p>
      <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(data, null, 2)}</pre>
      <p>UI interactive : <code>resources/renderer/index.html#releves</code></p>
    </section>
  );
}
