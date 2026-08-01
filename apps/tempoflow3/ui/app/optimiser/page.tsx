"use client";

import { useState } from "react";

export default function Page() {
  const base =
    process.env.NEXT_PUBLIC_METIER_BASE_URL || "http://127.0.0.1:18791";
  const [produitId, setProduitId] = useState("");
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  async function suggest() {
    setError(null);
    const res = await fetch(`${base}/api/v1/modules/optimiser/suggest`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(
        produitId ? { produit_id: produitId } : { from: "panier" },
      ),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || res.statusText);
      return;
    }
    setResult(data);
  }

  async function apply() {
    const body = result as { suggestions?: unknown[] };
    const res = await fetch(`${base}/api/v1/modules/optimiser/apply`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ propositions: body?.suggestions || [] }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || res.statusText);
      return;
    }
    setResult(data);
  }

  return (
    <section>
      <h1>Optimiser</h1>
      <p>Calcul local sur prix connus — appliquer au panier.</p>
      <label>
        Produit id (optionnel — sinon panier)
        <br />
        <input
          value={produitId}
          onChange={(e) => setProduitId(e.target.value)}
        />
      </label>
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
        <button type="button" onClick={() => void suggest()}>
          Suggérer
        </button>
        <button type="button" onClick={() => void apply()}>
          Appliquer au panier
        </button>
      </div>
      {error ? <p style={{ color: "#8b1e1e" }}>{error}</p> : null}
      <pre style={{ whiteSpace: "pre-wrap", marginTop: "1rem" }}>
        {result ? JSON.stringify(result, null, 2) : "—"}
      </pre>
    </section>
  );
}
