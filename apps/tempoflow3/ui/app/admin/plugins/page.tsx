/** creezio:owned-by-brand */
"use client";

import { useEffect, useState } from "react";
import { metierBase } from "@/lib/metier-base";

export default function Page() {
  const base = metierBase();
  const [data, setData] = useState<{
    mode?: string;
    plugins?: Array<{ manifest?: { id?: string; name?: string }; enabled?: boolean; error?: string }>;
    count?: number;
    hint?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch(`${base}/api/v1/os/plugins`)
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [base]);

  return (
    <section>
      <h1>Admin Plugins</h1>
      <p>
        Control plane kit — opt-in <code>CREEZIO_PLUGINS=1</code>.
      </p>
      {data ? (
        <>
          <p>
            mode=<strong>{data.mode}</strong> count={data.count ?? data.plugins?.length ?? 0}
          </p>
          {data.hint ? <p style={{ opacity: 0.75 }}>{data.hint}</p> : null}
          <ul>
            {(data.plugins || []).map((p, i) => (
              <li key={p.manifest?.id || i}>
                {p.manifest?.name || p.manifest?.id || "plugin"} —{" "}
                {p.enabled ? "enabled" : "disabled"}
                {p.error ? ` (${p.error})` : ""}
              </li>
            ))}
          </ul>
          {!data.plugins?.length && data.mode === "enabled" ? (
            <p style={{ opacity: 0.7 }}>Aucun plugin découvert sous userData/plugins.</p>
          ) : null}
        </>
      ) : null}
      {error ? <p style={{ color: "#8b1e1e" }}>{error}</p> : null}
    </section>
  );
}
