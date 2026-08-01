async function load(path: string) {
  const base = process.env.METIER_BASE_URL || "http://127.0.0.1:18791";
  try {
    const res = await fetch(`${base}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function Page() {
  const data = await load("/api/v1/brand/schema");
  const page = (data?.pages || []).find(
    (x: { id: string; path: string }) => x.id === "releves" || x.path === "/releves",
  );
  const title = page?.title || "releves";
  return (
    <section>
      <h1>{title}</h1>
      <p>
        Surface métier TempoFlow3 — données via API brand (
        <code>METIER_BASE_URL</code>).
      </p>
      <p>
        UI interactive : renderer desktop{" "}
        <code>resources/renderer/index.html#releves</code>.
      </p>
    </section>
  );
}
