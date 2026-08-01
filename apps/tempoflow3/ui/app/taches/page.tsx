async function load() {
  const base = process.env.METIER_BASE_URL || "http://127.0.0.1:18791";
  try {
    const res = await fetch(`${base}/api/v1/platform/platform-tasks/list`, {
      cache: "no-store",
      headers: { "x-creezio-user-id": "ui-user" },
    });
    if (!res.ok) return { error: res.status };
    return res.json();
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export default async function Page() {
  const data = await load();
  return (
    <section>
      <h1>Tâches</h1>
      <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(data, null, 2)}</pre>
      <p>UI interactive desktop : <code>resources/renderer/index.html</code></p>
    </section>
  );
}
