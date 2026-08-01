"use client";

import { useEffect, useState } from "react";

type Field = {
  name: string;
  label: string;
  type?: "text" | "number";
  required?: boolean;
};

export function MetierCrud(props: {
  title: string;
  entity: string;
  fields: Field[];
}) {
  const [base, setBase] = useState("http://127.0.0.1:18791");
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  async function reload(b = base) {
    try {
      const res = await fetch(`${b}/api/v1/modules/${props.entity}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      setItems(data.items || []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  useEffect(() => {
    const env =
      (typeof process !== "undefined" &&
        process.env.NEXT_PUBLIC_METIER_BASE_URL) ||
      "";
    const resolved = env || base;
    setBase(resolved);
    void reload(resolved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const payload: Record<string, unknown> = { ...form };
    for (const f of props.fields) {
      if (f.type === "number" && payload[f.name] !== undefined) {
        payload[f.name] = Number(payload[f.name]);
      }
    }
    const res = await fetch(`${base}/api/v1/modules/${props.entity}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || res.statusText);
      return;
    }
    setForm({});
    await reload();
  }

  return (
    <section>
      <h1>{props.title}</h1>
      {error ? <p style={{ color: "#8b1e1e" }}>{error}</p> : null}
      <form onSubmit={onSubmit} style={{ display: "grid", gap: "0.5rem" }}>
        {props.fields.map((f) => (
          <label key={f.name}>
            {f.label}
            <br />
            <input
              required={f.required}
              type={f.type || "text"}
              value={form[f.name] || ""}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, [f.name]: e.target.value }))
              }
            />
          </label>
        ))}
        <button type="submit">Ajouter</button>
      </form>
      <table style={{ width: "100%", marginTop: "1rem", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th align="left">id</th>
            {props.fields.map((f) => (
              <th key={f.name} align="left">
                {f.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((row) => (
            <tr key={String(row.id)}>
              <td>{String(row.id).slice(0, 8)}</td>
              {props.fields.map((f) => (
                <td key={f.name}>{String(row[f.name] ?? "")}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
