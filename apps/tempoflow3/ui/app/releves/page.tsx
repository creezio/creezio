"use client";

import { useEffect, useState } from "react";
import { metierBase } from "@/lib/metier-base";

type Releve = {
  id: string;
  date_releve?: string;
  fournisseur_id?: string;
  source?: string;
  notes?: string;
};

type Fournisseur = { id: string; nom?: string };
type Produit = { id: string; nom?: string; fournisseur_id?: string };

type LigneForm = { produit_id: string; montant: string; libelle: string };

export default function Page() {
  const base = metierBase();
  const [items, setItems] = useState<Releve[]>([]);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [fournisseurId, setFournisseurId] = useState("");
  const [source, setSource] = useState("magasin");
  const [dateReleve, setDateReleve] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [lignes, setLignes] = useState<LigneForm[]>([
    { produit_id: "", montant: "", libelle: "" },
    { produit_id: "", montant: "", libelle: "" },
    { produit_id: "", montant: "", libelle: "" },
  ]);
  const [detail, setDetail] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function reload() {
    const [r, f, p] = await Promise.all([
      fetch(`${base}/api/v1/modules/releves`, { cache: "no-store" }),
      fetch(`${base}/api/v1/modules/fournisseurs`, { cache: "no-store" }),
      fetch(`${base}/api/v1/modules/produits`, { cache: "no-store" }),
    ]);
    const rd = await r.json();
    const fd = await f.json();
    const pd = await p.json();
    if (!r.ok) throw new Error(rd.error || r.statusText);
    setItems(rd.items || []);
    setFournisseurs(fd.items || []);
    setProduits(pd.items || []);
  }

  useEffect(() => {
    void reload().catch((e) =>
      setError(e instanceof Error ? e.message : String(e)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function create() {
    setError(null);
    setMsg(null);
    const bodyLignes = lignes
      .filter((l) => l.montant !== "")
      .map((l) => ({
        produit_id: l.produit_id || undefined,
        libelle: l.libelle || undefined,
        montant: Number(l.montant),
      }));
    if (!fournisseurId || bodyLignes.length === 0) {
      setError("Fournisseur + au moins une ligne montant");
      return;
    }
    const res = await fetch(`${base}/api/v1/modules/releves`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        fournisseur_id: fournisseurId,
        source,
        date_releve: dateReleve,
        lignes: bodyLignes,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || res.statusText);
      return;
    }
    setMsg(`Relevé créé (${data.id?.slice?.(0, 8) || data.id})`);
    setDetail(data);
    await reload();
  }

  async function open(id: string) {
    setError(null);
    const res = await fetch(`${base}/api/v1/modules/releves/${id}`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || res.statusText);
      return;
    }
    setDetail(data);
  }

  async function applyPrix(id: string) {
    setError(null);
    const res = await fetch(`${base}/api/v1/modules/releves/${id}/apply-prix`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || res.statusText);
      return;
    }
    setMsg(
      `Prix catalogue mis à jour (${data.prix_crees}) — ${data.tracabilite || ""}`,
    );
    setDetail(data);
  }

  return (
    <section>
      <h1>Relevés</h1>
      <p>Tracer un prix relevé puis le pousser au catalogue avec traçabilité.</p>
      {error ? <p style={{ color: "#8b1e1e" }}>{error}</p> : null}
      {msg ? <p style={{ color: "#0f3d32" }}>{msg}</p> : null}

      <div
        style={{
          display: "grid",
          gap: "0.5rem",
          marginTop: "0.75rem",
          maxWidth: "32rem",
        }}
      >
        <label>
          Fournisseur
          <br />
          <select
            value={fournisseurId}
            onChange={(e) => setFournisseurId(e.target.value)}
          >
            <option value="">—</option>
            {fournisseurs.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nom || f.id.slice(0, 8)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Source
          <br />
          <select value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="magasin">magasin</option>
            <option value="site">site</option>
            <option value="autre">autre</option>
          </select>
        </label>
        <label>
          Date
          <br />
          <input
            type="date"
            value={dateReleve}
            onChange={(e) => setDateReleve(e.target.value)}
          />
        </label>
        {lignes.map((l, i) => (
          <div key={i} style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            <select
              value={l.produit_id}
              onChange={(e) =>
                setLignes((prev) =>
                  prev.map((row, j) =>
                    j === i ? { ...row, produit_id: e.target.value } : row,
                  ),
                )
              }
            >
              <option value="">produit</option>
              {produits.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nom || p.id.slice(0, 8)}
                </option>
              ))}
            </select>
            <input
              type="number"
              step="0.01"
              placeholder="montant"
              value={l.montant}
              onChange={(e) =>
                setLignes((prev) =>
                  prev.map((row, j) =>
                    j === i ? { ...row, montant: e.target.value } : row,
                  ),
                )
              }
              style={{ width: "6rem" }}
            />
            <input
              placeholder="libellé"
              value={l.libelle}
              onChange={(e) =>
                setLignes((prev) =>
                  prev.map((row, j) =>
                    j === i ? { ...row, libelle: e.target.value } : row,
                  ),
                )
              }
            />
          </div>
        ))}
        <button type="button" onClick={() => void create()}>
          Créer le relevé
        </button>
      </div>

      <h2 style={{ marginTop: "1.5rem" }}>Récents</h2>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {items.map((r) => (
          <li
            key={r.id}
            style={{
              display: "flex",
              gap: "0.5rem",
              alignItems: "center",
              marginBottom: "0.4rem",
              flexWrap: "wrap",
            }}
          >
            <span>
              {r.date_releve} · {r.source} · {r.id.slice(0, 8)}
            </span>
            <button type="button" onClick={() => void open(r.id)}>
              Voir
            </button>
            <button type="button" onClick={() => void applyPrix(r.id)}>
              Appliquer → prix
            </button>
          </li>
        ))}
      </ul>
      {detail ? (
        <pre style={{ whiteSpace: "pre-wrap", marginTop: "1rem" }}>
          {JSON.stringify(detail, null, 2)}
        </pre>
      ) : null}
    </section>
  );
}
