/** creezio:owned-by-brand */
"use client";

import { useEffect, useState } from "react";
import { metierBase } from "@/lib/metier-base";

export default function Page() {
  const base = metierBase();
  const [status, setStatus] = useState<Record<string, unknown> | null>(null);
  const [arch, setArch] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      fetch(`${base}/api/v1/os/status`).then((r) => r.json()),
      fetch(`${base}/api/v1/core/architecture`).then((r) => r.json()),
    ])
      .then(([s, a]) => {
        setStatus(s);
        setArch(a);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [base]);

  const paths = (status?.paths || {}) as Record<string, string>;

  return (
    <section>
      <h1>Admin Database</h1>
      <p>core.db + brand.db — chemins OS kit (pas de jumeau marque).</p>
      <ul>
        <li>brandDb: {paths.brandDb || "—"}</li>
        <li>coreDb: {paths.coreDb || "—"}</li>
        <li>userData: {paths.userDataDir || "—"}</li>
      </ul>
      {arch ? (
        <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.85rem" }}>
          {JSON.stringify(arch, null, 2)}
        </pre>
      ) : null}
      {error ? <p style={{ color: "#8b1e1e" }}>{error}</p> : null}
    </section>
  );
}
