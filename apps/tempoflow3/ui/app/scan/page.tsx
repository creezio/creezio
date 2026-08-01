/** creezio:owned-by-brand */
"use client";

import { useEffect, useState } from "react";
import { metierBase } from "@/lib/metier-base";

type Session = {
  id: string;
  statut?: string;
  notes?: string;
  created_at?: string;
};

export default function Page() {
  const base = metierBase();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [lignesTexte, setLignesTexte] = useState(
    "Carotte bio|1.45|\nPomme golden|2.10|",
  );
  const [fournisseurId, setFournisseurId] = useState("");
  const [current, setCurrent] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function reload() {
    const res = await fetch(`${base}/api/v1/modules/scan`, { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || res.statusText);
    setSessions(data.items || []);
  }

  useEffect(() => {
    void reload().catch((e) =>
      setError(e instanceof Error ? e.message : String(e)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function start() {
    setError(null);
    setMsg(null);
    const rawLines = lignesTexte
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split("|").map((s) => s.trim());
        if (fournisseurId && !parts[2]) parts[2] = fournisseurId;
        return parts.join("|");
      });
    const res = await fetch(`${base}/api/v1/modules/scan/start`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        notes: "capture UI TempoFlow3",
        lignes_texte: rawLines,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || res.statusText);
      return;
    }
    setCurrent(data);
    setMsg(`Session ${data.id?.slice?.(0, 8)} — propositions à valider`);
    await reload();
  }

  async function validate(id: string) {
    setError(null);
    const res = await fetch(`${base}/api/v1/modules/scan/${id}/validate`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || res.statusText);
      return;
    }
    setCurrent(data);
    setMsg(
      `Validé — produits=${data.written?.produits ?? 0} prix=${data.written?.prix ?? 0} relevés=${data.written?.releves ?? 0}`,
    );
    await reload();
  }

  async function open(id: string) {
    const res = await fetch(`${base}/api/v1/modules/scan/${id}`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || res.statusText);
      return;
    }
    setCurrent(data);
  }

  return (
    <section>
      <h1>Scan</h1>
      <p>
        Capture guidée → propositions → validation catalogue. La capture IA
        reste côté assistant Creezio ; ici le mapping métier.
      </p>
      {error ? <p style={{ color: "#8b1e1e" }}>{error}</p> : null}
      {msg ? <p style={{ color: "#0f3d32" }}>{msg}</p> : null}

      <label style={{ display: "block", marginTop: "0.75rem" }}>
        Fournisseur id (appliqué si ligne sans 3ᵉ champ)
        <br />
        <input
          value={fournisseurId}
          onChange={(e) => setFournisseurId(e.target.value)}
          placeholder="uuid fournisseur"
          style={{ width: "100%", maxWidth: "28rem" }}
        />
      </label>
      <label style={{ display: "block", marginTop: "0.5rem" }}>
        Lignes <code>nom|montant|fournisseur_id</code>
        <br />
        <textarea
          rows={5}
          value={lignesTexte}
          onChange={(e) => setLignesTexte(e.target.value)}
          style={{ width: "100%", maxWidth: "32rem", fontFamily: "monospace" }}
        />
      </label>
      <button type="button" onClick={() => void start()} style={{ marginTop: "0.5rem" }}>
        Démarrer le scan
      </button>

      <h2 style={{ marginTop: "1.5rem" }}>Sessions</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {sessions.map((s) => (
          <li
            key={s.id}
            style={{
              display: "flex",
              gap: "0.5rem",
              marginBottom: "0.4rem",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <span>
              {s.id.slice(0, 8)} · {s.statut}
            </span>
            <button type="button" onClick={() => void open(s.id)}>
              Voir
            </button>
            {s.statut !== "valide" ? (
              <button type="button" onClick={() => void validate(s.id)}>
                Valider → catalogue
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      {current ? (
        <pre style={{ whiteSpace: "pre-wrap", marginTop: "1rem" }}>
          {JSON.stringify(current, null, 2)}
        </pre>
      ) : null}
    </section>
  );
}
