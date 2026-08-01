/**
 * Mounts métier bonus TempoFlow3 — mini-PRDs 06–11.
 * Écrit dans la marque (pas de template factory CHR).
 */
import { randomUUID } from "node:crypto";
import type { ApiKernel, ApiMount, ApiRequest } from "@creezio/api-kernel";

type Db = {
  prepare(sql: string): {
    get(...args: unknown[]): unknown;
    all(...args: unknown[]): unknown[];
    run(...args: unknown[]): unknown;
  };
};

function now() {
  return new Date().toISOString();
}

function qstr(req: ApiRequest, key: string): string {
  const v = req.query?.[key];
  if (Array.isArray(v)) return String(v[0] ?? "");
  return v == null ? "" : String(v);
}

function latestPrix(
  db: Db,
  produitId: string,
  fournisseurId?: string,
): { montant: number; fournisseur_id: string; promo: number } | null {
  if (fournisseurId) {
    const row = db
      .prepare(
        `SELECT montant, fournisseur_id, COALESCE(promo,0) AS promo
         FROM prix WHERE produit_id = ? AND fournisseur_id = ?
         ORDER BY created_at DESC LIMIT 1`,
      )
      .get(produitId, fournisseurId) as
      | { montant: number; fournisseur_id: string; promo: number }
      | undefined;
    return row || null;
  }
  const row = db
    .prepare(
      `SELECT montant, fournisseur_id, COALESCE(promo,0) AS promo
       FROM prix WHERE produit_id = ?
       ORDER BY montant ASC, created_at DESC LIMIT 1`,
    )
    .get(produitId) as
    | { montant: number; fournisseur_id: string; promo: number }
    | undefined;
  return row || null;
}

function createOptimiserMount(): ApiMount {
  return {
    dbLayer: "brand",
    handle: async ({ req, subPath, db }) => {
      if (!db) return { status: 503, body: { error: "db_unavailable" } };
      const method = req.method.toUpperCase();
      const parts = subPath.split("/").filter(Boolean);

      if (parts[0] === "suggest" && method === "POST") {
        const body = (req.body || {}) as {
          from?: string;
          produit_id?: string;
          quantite?: number;
          besoins?: Array<{ produit_id: string; quantite: number }>;
        };
        let besoins = body.besoins || [];
        if (body.produit_id) {
          besoins = [
            {
              produit_id: body.produit_id,
              quantite: Number(body.quantite) || 1,
            },
          ];
        } else if (
          body.from === "panier" ||
          (!besoins.length && body.from !== "list")
        ) {
          const lignes = db
            .prepare(`SELECT produit_id, quantite, fournisseur_id, prix_unitaire FROM panier_lignes`)
            .all() as Array<{
            produit_id: string;
            quantite: number;
            fournisseur_id: string;
            prix_unitaire: number | null;
          }>;
          besoins = lignes.map((l) => ({
            produit_id: l.produit_id,
            quantite: Number(l.quantite) || 1,
          }));
        }
        if (!besoins.length) {
          return { status: 400, body: { error: "besoins_vides" } };
        }

        const propositions = [];
        let totalActuel = 0;
        let totalOptimise = 0;
        for (const b of besoins) {
          const qty = Number(b.quantite) || 1;
          const panierLigne = db
            .prepare(
              `SELECT fournisseur_id, prix_unitaire FROM panier_lignes WHERE produit_id = ? LIMIT 1`,
            )
            .get(b.produit_id) as
            | { fournisseur_id: string; prix_unitaire: number | null }
            | undefined;
          const actuel = panierLigne
            ? {
                fournisseur_id: panierLigne.fournisseur_id,
                montant:
                  panierLigne.prix_unitaire ??
                  latestPrix(db, b.produit_id, panierLigne.fournisseur_id)
                    ?.montant ??
                  0,
              }
            : latestPrix(db, b.produit_id);
          const best = latestPrix(db, b.produit_id);
          if (!best) {
            propositions.push({
              produit_id: b.produit_id,
              quantite: qty,
              error: "prix_inconnu",
            });
            continue;
          }
          const curUnit = actuel?.montant ?? best.montant;
          const optUnit = best.montant;
          const ecart = (curUnit - optUnit) * qty;
          totalActuel += curUnit * qty;
          totalOptimise += optUnit * qty;
          const produit = db
            .prepare(`SELECT id, nom FROM produits WHERE id = ?`)
            .get(b.produit_id) as { id: string; nom: string } | undefined;
          const four = db
            .prepare(`SELECT id, nom FROM fournisseurs WHERE id = ?`)
            .get(best.fournisseur_id) as { id: string; nom: string } | undefined;
          propositions.push({
            produit_id: b.produit_id,
            produit_nom: produit?.nom || b.produit_id,
            quantite: qty,
            fournisseur_id: best.fournisseur_id,
            fournisseur_nom: four?.nom || best.fournisseur_id,
            prix_unitaire: optUnit,
            prix_actuel: curUnit,
            ecart_eur: Math.round(ecart * 100) / 100,
            score: ecart > 0 ? "meilleur" : ecart < 0 ? "pire" : "egal",
          });
        }
        const economie = Math.round((totalActuel - totalOptimise) * 100) / 100;
        return {
          status: 200,
          body: {
            propositions,
            suggestions: propositions,
            items: propositions,
            total_actuel: Math.round(totalActuel * 100) / 100,
            total_optimise: Math.round(totalOptimise * 100) / 100,
            economie_eur: economie,
            orientation:
              economie > 0
                ? `Économie potentielle ${economie} € HT en changeant de fournisseur.`
                : "Le panier est déjà au meilleur prix connu.",
          },
        };
      }

      if (parts[0] === "apply" && method === "POST") {
        const body = (req.body || {}) as {
          propositions?: Array<{
            produit_id: string;
            quantite: number;
            fournisseur_id: string;
            prix_unitaire: number;
          }>;
        };
        let props = body.propositions || [];
        if (!props.length) {
          const lignes = db
            .prepare(`SELECT produit_id, quantite FROM panier_lignes`)
            .all() as Array<{ produit_id: string; quantite: number }>;
          for (const l of lignes) {
            const best = latestPrix(db, l.produit_id);
            if (!best) continue;
            props.push({
              produit_id: l.produit_id,
              quantite: Number(l.quantite) || 1,
              fournisseur_id: best.fournisseur_id,
              prix_unitaire: best.montant,
            });
          }
        }
        db.prepare(`DELETE FROM panier_lignes`).run();
        const ts = now();
        for (const p of props) {
          if (!p.fournisseur_id || !p.produit_id) continue;
          db.prepare(
            `INSERT INTO panier_lignes (id, created_at, updated_at, produit_id, fournisseur_id, quantite, prix_unitaire)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
          ).run(
            randomUUID(),
            ts,
            ts,
            p.produit_id,
            p.fournisseur_id,
            p.quantite || 1,
            p.prix_unitaire,
          );
        }
        const items = db.prepare(`SELECT * FROM panier_lignes`).all();
        return { status: 200, body: { applied: true, items } };
      }

      return { status: 404, body: { error: "not_found", subPath } };
    },
  };
}

function createStackMount(): ApiMount {
  return {
    dbLayer: "brand",
    handle: async ({ req, subPath, db }) => {
      if (!db) return { status: 503, body: { error: "db_unavailable" } };
      const method = req.method.toUpperCase();
      const parts = subPath.split("/").filter(Boolean);

      if (parts.length === 0 && method === "GET") {
        const rows = db
          .prepare(
            `SELECT s.produit_id, s.created_at, s.notes, p.nom, p.unite, p.categorie, p.fournisseur_id
             FROM stack_produits s
             JOIN produits p ON p.id = s.produit_id
             ORDER BY s.created_at DESC`,
          )
          .all() as Array<Record<string, unknown>>;
        const items = rows.map((r) => {
          const prix = latestPrix(db, String(r.produit_id));
          return { ...r, prix_actuel: prix?.montant ?? null, prix_fournisseur_id: prix?.fournisseur_id ?? null };
        });
        return { status: 200, body: { items } };
      }

      if (parts.length === 0 && method === "POST") {
        const body = (req.body || {}) as { produit_id?: string; notes?: string };
        if (!body.produit_id) {
          return { status: 400, body: { error: "produit_id_required" } };
        }
        const prod = db
          .prepare(`SELECT id FROM produits WHERE id = ?`)
          .get(body.produit_id);
        if (!prod) return { status: 404, body: { error: "produit_not_found" } };
        db.prepare(
          `INSERT INTO stack_produits (produit_id, created_at, notes)
           VALUES (?, ?, ?)
           ON CONFLICT(produit_id) DO UPDATE SET notes = excluded.notes`,
        ).run(body.produit_id, now(), body.notes || "");
        return { status: 200, body: { produit_id: body.produit_id, in_stack: true } };
      }

      if (parts.length === 1 && method === "DELETE") {
        db.prepare(`DELETE FROM stack_produits WHERE produit_id = ?`).run(parts[0]);
        return { status: 200, body: { produit_id: parts[0], in_stack: false } };
      }

      if (parts.length === 2 && parts[1] === "panier" && method === "POST") {
        const produitId = parts[0]!;
        const body = (req.body || {}) as { quantite?: number };
        const qty = Number(body.quantite) || 1;
        const prix = latestPrix(db, produitId);
        if (!prix) return { status: 400, body: { error: "prix_inconnu" } };
        const ts = now();
        const existing = db
          .prepare(`SELECT id FROM panier_lignes WHERE produit_id = ? AND fournisseur_id = ?`)
          .get(produitId, prix.fournisseur_id) as { id: string } | undefined;
        if (existing) {
          db.prepare(
            `UPDATE panier_lignes SET quantite = quantite + ?, prix_unitaire = ?, updated_at = ? WHERE id = ?`,
          ).run(qty, prix.montant, ts, existing.id);
        } else {
          db.prepare(
            `INSERT INTO panier_lignes (id, created_at, updated_at, produit_id, fournisseur_id, quantite, prix_unitaire)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
          ).run(randomUUID(), ts, ts, produitId, prix.fournisseur_id, qty, prix.montant);
        }
        return { status: 200, body: { ok: true, produit_id: produitId, quantite: qty } };
      }

      return { status: 404, body: { error: "not_found", subPath } };
    },
  };
}

function createRelevesMount(): ApiMount {
  return {
    dbLayer: "brand",
    handle: async ({ req, subPath, db }) => {
      if (!db) return { status: 503, body: { error: "db_unavailable" } };
      const method = req.method.toUpperCase();
      const parts = subPath.split("/").filter(Boolean);

      if (parts.length === 0 && method === "GET") {
        const items = db
          .prepare(`SELECT * FROM releves ORDER BY date_releve DESC, created_at DESC LIMIT 100`)
          .all();
        return { status: 200, body: { items } };
      }

      if (parts.length === 0 && method === "POST") {
        const body = (req.body || {}) as {
          fournisseur_id?: string;
          source?: string;
          date_releve?: string;
          notes?: string;
          lignes?: Array<{
            produit_id?: string;
            libelle?: string;
            montant: number;
            devise?: string;
          }>;
        };
        if (!body.fournisseur_id) {
          return { status: 400, body: { error: "fournisseur_id_required" } };
        }
        const source = body.source || "autre";
        if (!["site", "magasin", "autre"].includes(source)) {
          return { status: 400, body: { error: "source_invalide" } };
        }
        const id = randomUUID();
        const ts = now();
        db.prepare(
          `INSERT INTO releves (id, created_at, updated_at, date_releve, fournisseur_id, source, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ).run(
          id,
          ts,
          ts,
          body.date_releve || ts.slice(0, 10),
          body.fournisseur_id,
          source,
          body.notes || "",
        );
        for (const l of body.lignes || []) {
          db.prepare(
            `INSERT INTO releve_lignes (id, releve_id, produit_id, libelle, montant, devise, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
          ).run(
            randomUUID(),
            id,
            l.produit_id || null,
            l.libelle || "",
            Number(l.montant),
            l.devise || "EUR",
            ts,
          );
        }
        const lignes = db
          .prepare(`SELECT * FROM releve_lignes WHERE releve_id = ?`)
          .all(id);
        return {
          status: 201,
          body: { id, fournisseur_id: body.fournisseur_id, source, lignes },
        };
      }

      if (parts.length === 1 && method === "GET") {
        const row = db.prepare(`SELECT * FROM releves WHERE id = ?`).get(parts[0]);
        if (!row) return { status: 404, body: { error: "not_found" } };
        const lignes = db
          .prepare(`SELECT * FROM releve_lignes WHERE releve_id = ?`)
          .all(parts[0]);
        return { status: 200, body: { ...row, lignes } };
      }

      if (parts.length === 2 && parts[1] === "lignes" && method === "POST") {
        const body = (req.body || {}) as {
          produit_id?: string;
          libelle?: string;
          montant?: number;
          devise?: string;
        };
        if (body.montant == null) {
          return { status: 400, body: { error: "montant_required" } };
        }
        const releve = db.prepare(`SELECT id FROM releves WHERE id = ?`).get(parts[0]);
        if (!releve) return { status: 404, body: { error: "releve_not_found" } };
        const id = randomUUID();
        db.prepare(
          `INSERT INTO releve_lignes (id, releve_id, produit_id, libelle, montant, devise, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ).run(
          id,
          parts[0],
          body.produit_id || null,
          body.libelle || "",
          Number(body.montant),
          body.devise || "EUR",
          now(),
        );
        return {
          status: 201,
          body: db.prepare(`SELECT * FROM releve_lignes WHERE id = ?`).get(id),
        };
      }

      if (parts.length === 2 && parts[1] === "apply-prix" && method === "POST") {
        const releve = db
          .prepare(`SELECT * FROM releves WHERE id = ?`)
          .get(parts[0]) as { id: string; fournisseur_id: string } | undefined;
        if (!releve) return { status: 404, body: { error: "releve_not_found" } };
        const lignes = db
          .prepare(
            `SELECT * FROM releve_lignes WHERE releve_id = ? AND produit_id IS NOT NULL`,
          )
          .all(parts[0]) as Array<{
          produit_id: string;
          montant: number;
          devise: string | null;
          libelle: string | null;
        }>;
        const created = [];
        const ts = now();
        for (const l of lignes) {
          const id = randomUUID();
          db.prepare(
            `INSERT INTO prix (id, created_at, updated_at, produit_id, fournisseur_id, montant, devise, promo, promo_label)
             VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)`,
          ).run(
            id,
            ts,
            ts,
            l.produit_id,
            releve.fournisseur_id,
            l.montant,
            l.devise || "EUR",
            `releve:${releve.id}`,
          );
          created.push(id);
        }
        return {
          status: 200,
          body: {
            releve_id: releve.id,
            prix_crees: created.length,
            ids: created,
            tracabilite: `promo_label=releve:${releve.id}`,
          },
        };
      }

      return { status: 404, body: { error: "not_found", subPath } };
    },
  };
}

function createScanMount(): ApiMount {
  return {
    dbLayer: "brand",
    handle: async ({ req, subPath, db }) => {
      if (!db) return { status: 503, body: { error: "db_unavailable" } };
      const method = req.method.toUpperCase();
      const parts = subPath.split("/").filter(Boolean);

      // Mapping métier seulement — capture/IA = OS creezio (assistant).
      if (parts.length === 0 && method === "GET") {
        const items = db
          .prepare(
            `SELECT * FROM scan_sessions ORDER BY created_at DESC LIMIT 50`,
          )
          .all();
        return { status: 200, body: { items } };
      }

      if (parts[0] === "start" && method === "POST") {
        const body = (req.body || {}) as {
          notes?: string;
          propositions?: Array<{
            produit_nom?: string;
            produit_id?: string;
            fournisseur_id?: string;
            montant?: number;
          }>;
          /** Lignes texte simples « nom|montant|fournisseur_id » (sans IA marque). */
          lignes_texte?: string[];
        };
        const id = randomUUID();
        const ts = now();
        db.prepare(
          `INSERT INTO scan_sessions (id, created_at, updated_at, statut, notes)
           VALUES (?, ?, ?, 'brouillon', ?)`,
        ).run(id, ts, ts, body.notes || "");

        const props = [...(body.propositions || [])];
        for (const line of body.lignes_texte || []) {
          const [nom, montant, fid] = String(line).split("|").map((s) => s.trim());
          if (!nom) continue;
          props.push({
            produit_nom: nom,
            montant: montant ? Number(montant) : undefined,
            fournisseur_id: fid || undefined,
          });
        }
        for (const p of props) {
          db.prepare(
            `INSERT INTO scan_propositions
             (id, session_id, produit_nom, produit_id, fournisseur_id, montant, validated, created_at)
             VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
          ).run(
            randomUUID(),
            id,
            p.produit_nom || "",
            p.produit_id || null,
            p.fournisseur_id || null,
            p.montant ?? null,
            ts,
          );
        }
        const propositions = db
          .prepare(`SELECT * FROM scan_propositions WHERE session_id = ?`)
          .all(id);
        return {
          status: 201,
          body: {
            id,
            statut: "brouillon",
            propositions,
            hint: "Valider via POST …/scan/:id/validate — capture IA = assistant Creezio",
          },
        };
      }

      if (parts.length === 1 && method === "GET") {
        const session = db
          .prepare(`SELECT * FROM scan_sessions WHERE id = ?`)
          .get(parts[0]);
        if (!session) return { status: 404, body: { error: "not_found" } };
        const propositions = db
          .prepare(`SELECT * FROM scan_propositions WHERE session_id = ?`)
          .all(parts[0]);
        return { status: 200, body: { ...session, propositions } };
      }

      if (parts.length === 2 && parts[1] === "propositions" && method === "POST") {
        const body = (req.body || {}) as {
          produit_nom?: string;
          produit_id?: string;
          fournisseur_id?: string;
          montant?: number;
        };
        const session = db
          .prepare(`SELECT id FROM scan_sessions WHERE id = ?`)
          .get(parts[0]);
        if (!session) return { status: 404, body: { error: "session_not_found" } };
        const id = randomUUID();
        db.prepare(
          `INSERT INTO scan_propositions
           (id, session_id, produit_nom, produit_id, fournisseur_id, montant, validated, created_at)
           VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
        ).run(
          id,
          parts[0],
          body.produit_nom || "",
          body.produit_id || null,
          body.fournisseur_id || null,
          body.montant ?? null,
          now(),
        );
        return {
          status: 201,
          body: db.prepare(`SELECT * FROM scan_propositions WHERE id = ?`).get(id),
        };
      }

      if (parts.length === 2 && parts[1] === "validate" && method === "POST") {
        const session = db
          .prepare(`SELECT * FROM scan_sessions WHERE id = ?`)
          .get(parts[0]) as { id: string } | undefined;
        if (!session) return { status: 404, body: { error: "session_not_found" } };
        const props = db
          .prepare(`SELECT * FROM scan_propositions WHERE session_id = ?`)
          .all(parts[0]) as Array<{
          id: string;
          produit_nom: string;
          produit_id: string | null;
          fournisseur_id: string | null;
          montant: number | null;
        }>;
        const ts = now();
        const written = { produits: 0, prix: 0, releves: 0 };
        let releveId: string | null = null;
        for (const p of props) {
          let produitId = p.produit_id;
          if (!produitId && p.produit_nom) {
            produitId = randomUUID();
            db.prepare(
              `INSERT INTO produits (id, created_at, updated_at, nom, unite, categorie, fournisseur_id)
               VALUES (?, ?, ?, ?, '', '', ?)`,
            ).run(produitId, ts, ts, p.produit_nom, p.fournisseur_id || null);
            written.produits += 1;
          }
          if (produitId && p.montant != null && p.fournisseur_id) {
            db.prepare(
              `INSERT INTO prix (id, created_at, updated_at, produit_id, fournisseur_id, montant, devise, promo, promo_label)
               VALUES (?, ?, ?, ?, ?, ?, 'EUR', 0, ?)`,
            ).run(
              randomUUID(),
              ts,
              ts,
              produitId,
              p.fournisseur_id,
              p.montant,
              `scan:${session.id}`,
            );
            written.prix += 1;
            if (!releveId) {
              releveId = randomUUID();
              db.prepare(
                `INSERT INTO releves (id, created_at, updated_at, date_releve, fournisseur_id, source, notes)
                 VALUES (?, ?, ?, ?, ?, 'autre', ?)`,
              ).run(
                releveId,
                ts,
                ts,
                ts.slice(0, 10),
                p.fournisseur_id,
                `scan:${session.id}`,
              );
              written.releves += 1;
            }
            db.prepare(
              `INSERT INTO releve_lignes (id, releve_id, produit_id, libelle, montant, devise, created_at)
               VALUES (?, ?, ?, ?, ?, 'EUR', ?)`,
            ).run(
              randomUUID(),
              releveId,
              produitId,
              p.produit_nom || "",
              p.montant,
              ts,
            );
          }
          db.prepare(
            `UPDATE scan_propositions SET validated = 1, produit_id = ? WHERE id = ?`,
          ).run(produitId, p.id);
        }
        db.prepare(
          `UPDATE scan_sessions SET statut = 'valide', updated_at = ? WHERE id = ?`,
        ).run(ts, session.id);
        return {
          status: 200,
          body: { session_id: session.id, statut: "valide", written, releve_id: releveId },
        };
      }

      return { status: 404, body: { error: "not_found", subPath } };
    },
  };
}

function createCrudSimpleMount(
  table: string,
  required: string[],
): ApiMount {
  return {
    dbLayer: "brand",
    handle: async ({ req, subPath, db }) => {
      if (!db) return { status: 503, body: { error: "db_unavailable" } };
      const method = req.method.toUpperCase();
      const parts = subPath.split("/").filter(Boolean);

      if (parts.length === 0 && method === "GET") {
        const items = db
          .prepare(`SELECT * FROM ${table} ORDER BY created_at DESC`)
          .all();
        return { status: 200, body: { items } };
      }
      if (parts.length === 0 && method === "POST") {
        const body = (req.body || {}) as Record<string, unknown>;
        for (const k of required) {
          if (body[k] == null || body[k] === "") {
            return { status: 400, body: { error: `${k}_required` } };
          }
        }
        const id = randomUUID();
        const ts = now();
        if (table === "marketplaces") {
          db.prepare(
            `INSERT INTO marketplaces (id, created_at, updated_at, nom, url, notes)
             VALUES (?, ?, ?, ?, ?, ?)`,
          ).run(id, ts, ts, body.nom, body.url || "", body.notes || "");
        } else if (table === "secteurs") {
          db.prepare(
            `INSERT INTO secteurs (id, created_at, updated_at, nom, slug)
             VALUES (?, ?, ?, ?, ?)`,
          ).run(
            id,
            ts,
            ts,
            body.nom,
            body.slug || String(body.nom).toLowerCase().replace(/\s+/g, "-"),
          );
        } else if (table === "agregateurs") {
          db.prepare(
            `INSERT INTO agregateurs (id, created_at, updated_at, nom, url, notes)
             VALUES (?, ?, ?, ?, ?, ?)`,
          ).run(id, ts, ts, body.nom, body.url || "", body.notes || "");
        } else if (table === "data_mappings") {
          db.prepare(
            `INSERT INTO data_mappings (id, created_at, updated_at, libelle_externe, fournisseur_id, produit_id)
             VALUES (?, ?, ?, ?, ?, ?)`,
          ).run(
            id,
            ts,
            ts,
            body.libelle_externe,
            body.fournisseur_id || null,
            body.produit_id,
          );
        }
        return {
          status: 201,
          body: db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id),
        };
      }
      if (parts.length === 1 && method === "GET") {
        const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(parts[0]);
        if (!row) return { status: 404, body: { error: "not_found" } };
        return { status: 200, body: row };
      }
      if (parts.length === 1 && method === "DELETE") {
        db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(parts[0]);
        return { status: 200, body: { deleted: parts[0] } };
      }

      // liens marketplace/secteur/agregateur ↔ fournisseur|produit
      if (
        parts.length === 2 &&
        parts[1] === "link" &&
        method === "POST" &&
        (table === "marketplaces" || table === "agregateurs")
      ) {
        const body = (req.body || {}) as { fournisseur_id?: string };
        if (!body.fournisseur_id) {
          return { status: 400, body: { error: "fournisseur_id_required" } };
        }
        const linkTable =
          table === "marketplaces"
            ? "marketplace_fournisseurs"
            : "agregateur_fournisseurs";
        const fk =
          table === "marketplaces" ? "marketplace_id" : "agregateur_id";
        db.prepare(
          `INSERT OR IGNORE INTO ${linkTable} (${fk}, fournisseur_id) VALUES (?, ?)`,
        ).run(parts[0], body.fournisseur_id);
        return { status: 200, body: { linked: true } };
      }
      if (
        parts.length === 2 &&
        parts[1] === "link-produit" &&
        method === "POST" &&
        table === "secteurs"
      ) {
        const body = (req.body || {}) as { produit_id?: string };
        if (!body.produit_id) {
          return { status: 400, body: { error: "produit_id_required" } };
        }
        db.prepare(
          `INSERT OR IGNORE INTO produit_secteurs (produit_id, secteur_id) VALUES (?, ?)`,
        ).run(body.produit_id, parts[0]);
        return { status: 200, body: { linked: true } };
      }
      if (parts.length === 2 && parts[1] === "resolve" && table === "data_mappings" && method === "GET") {
        const q = qstr(req, "libelle").trim().toLowerCase();
        const fid = qstr(req, "fournisseur_id");
        let row;
        if (fid) {
          row = db
            .prepare(
              `SELECT * FROM data_mappings
               WHERE lower(libelle_externe) = ? AND (fournisseur_id = ? OR fournisseur_id IS NULL)
               ORDER BY fournisseur_id DESC LIMIT 1`,
            )
            .get(q, fid);
        } else {
          row = db
            .prepare(
              `SELECT * FROM data_mappings WHERE lower(libelle_externe) = ? LIMIT 1`,
            )
            .get(q);
        }
        if (!row) return { status: 404, body: { error: "unmapped" } };
        return { status: 200, body: row };
      }

      return { status: 404, body: { error: "not_found", subPath } };
    },
  };
}

/** Enrichit le dashboard cœur avec orientation + raccourcis métier. */
export function enrichDashboardBody(
  db: Db,
  base: Record<string, unknown>,
): Record<string, unknown> {
  const count = (sql: string) =>
    (db.prepare(sql).get() as { c: number }).c;
  const panier = Number(base.panier_lignes || 0);
  const promos = Number(base.promos || 0);
  let orientation = "Parcourir les fournisseurs pour démarrer.";
  if (panier > 0) orientation = "Continuer mon panier";
  else if (promos > 0) orientation = "Voir les promos";
  const lastCommandes = db
    .prepare(
      `SELECT id, fournisseur_id, statut, total_ht, created_at
       FROM commandes ORDER BY created_at DESC LIMIT 5`,
    )
    .all();
  return {
    ...base,
    orientation,
    stack: count(`SELECT COUNT(*) AS c FROM stack_produits`),
    releves: count(`SELECT COUNT(*) AS c FROM releves`),
    marketplaces: count(`SELECT COUNT(*) AS c FROM marketplaces`),
    secteurs: count(`SELECT COUNT(*) AS c FROM secteurs`),
    dernieres_commandes: lastCommandes,
    raccourcis: [
      { title: "Fournisseurs", path: "/fournisseurs" },
      { title: "Panier", path: "/panier" },
      { title: "Commandes", path: "/commandes" },
      { title: "Optimiser", path: "/optimiser" },
      { title: "Mes produits", path: "/stack" },
      { title: "Relevés", path: "/releves" },
      { title: "Scan", path: "/scan" },
      { title: "Marketplaces", path: "/marketplaces" },
    ],
  };
}

function createSkusMount(): ApiMount {
  return {
    dbLayer: "brand",
    handle: async ({ req, subPath, db }) => {
      if (!db) return { status: 503, body: { error: "db_unavailable" } };
      const method = req.method.toUpperCase();
      const parts = subPath.split("/").filter(Boolean);
      if (parts.length === 0 && method === "GET") {
        const rows = db
          .prepare(
            `SELECT id, nom, unite, categorie, fournisseur_id, archived_at
             FROM produits ORDER BY nom ASC`,
          )
          .all() as Array<Record<string, unknown>>;
        const items = rows.map((r) => ({
          id: r.id,
          sku: String(r.id).slice(0, 8).toUpperCase(),
          nom: r.nom,
          unite: r.unite,
          categorie: r.categorie,
          fournisseur_id: r.fournisseur_id,
          archived_at: r.archived_at,
        }));
        return { status: 200, body: { items, skus: items } };
      }
      if (parts.length === 1 && method === "GET") {
        const row = db
          .prepare(`SELECT * FROM produits WHERE id = ?`)
          .get(parts[0]) as Record<string, unknown> | undefined;
        if (!row) return { status: 404, body: { error: "not_found" } };
        return {
          status: 200,
          body: {
            ...row,
            sku: String(row.id).slice(0, 8).toUpperCase(),
          },
        };
      }
      return { status: 404, body: { error: "not_found", subPath } };
    },
  };
}

function createPromotionsMount(): ApiMount {
  return {
    dbLayer: "brand",
    handle: async ({ req, subPath, db }) => {
      if (!db) return { status: 503, body: { error: "db_unavailable" } };
      const method = req.method.toUpperCase();
      const parts = subPath.split("/").filter(Boolean);
      if (parts.length === 0 && method === "GET") {
        const items = db
          .prepare(
            `SELECT p.*, pr.nom AS produit_nom, f.nom AS fournisseur_nom
             FROM prix p
             LEFT JOIN produits pr ON pr.id = p.produit_id
             LEFT JOIN fournisseurs f ON f.id = p.fournisseur_id
             WHERE COALESCE(p.promo, 0) = 1
             ORDER BY p.created_at DESC`,
          )
          .all();
        return { status: 200, body: { items, promotions: items } };
      }
      return { status: 404, body: { error: "not_found", subPath } };
    },
  };
}

function createDispatchMount(): ApiMount {
  return {
    dbLayer: "brand",
    handle: async ({ req, subPath, db }) => {
      if (!db) return { status: 503, body: { error: "db_unavailable" } };
      const method = req.method.toUpperCase();
      const parts = subPath.split("/").filter(Boolean);
      if (parts[0] === "candidates" && method === "GET") {
        const lignes = db
          .prepare(
            `SELECT pl.*, pr.nom AS produit_nom, f.nom AS fournisseur_nom
             FROM panier_lignes pl
             LEFT JOIN produits pr ON pr.id = pl.produit_id
             LEFT JOIN fournisseurs f ON f.id = pl.fournisseur_id
             ORDER BY f.nom, pr.nom`,
          )
          .all() as Array<Record<string, unknown>>;
        const byFournisseur = new Map<string, typeof lignes>();
        for (const l of lignes) {
          const fid = String(l.fournisseur_id || "unknown");
          if (!byFournisseur.has(fid)) byFournisseur.set(fid, []);
          byFournisseur.get(fid)!.push(l);
        }
        const candidates = [...byFournisseur.entries()].map(
          ([fournisseur_id, items]) => ({
            fournisseur_id,
            fournisseur_nom: items[0]?.fournisseur_nom || fournisseur_id,
            lignes: items,
            total_lignes: items.length,
          }),
        );
        return {
          status: 200,
          body: { candidates, items: candidates },
        };
      }
      if (parts.length === 0 && method === "GET") {
        return {
          status: 200,
          body: { ok: true, hint: "GET /dispatch/candidates" },
        };
      }
      // Appliquer un candidat : ne garder dans le panier que les lignes du fournisseur.
      if (parts[0] === "apply" && method === "POST") {
        const body = (req.body || {}) as { fournisseur_id?: string };
        if (!body.fournisseur_id) {
          return { status: 400, body: { error: "fournisseur_id_required" } };
        }
        const before = (
          db.prepare(`SELECT COUNT(*) AS c FROM panier_lignes`).get() as {
            c: number;
          }
        ).c;
        db.prepare(
          `DELETE FROM panier_lignes WHERE fournisseur_id IS NULL OR fournisseur_id != ?`,
        ).run(body.fournisseur_id);
        const items = db.prepare(`SELECT * FROM panier_lignes`).all();
        return {
          status: 200,
          body: {
            applied: true,
            fournisseur_id: body.fournisseur_id,
            removed: Math.max(0, before - items.length),
            items,
          },
        };
      }
      return { status: 404, body: { error: "not_found", subPath } };
    },
  };
}

function createSiteMount(): ApiMount {
  return {
    dbLayer: "brand",
    handle: async ({ req, subPath, db }) => {
      if (!db) return { status: 503, body: { error: "db_unavailable" } };
      const method = req.method.toUpperCase();
      const parts = subPath.split("/").filter(Boolean);
      if (parts.length === 1 && method === "GET") {
        const f = db
          .prepare(`SELECT * FROM fournisseurs WHERE id = ?`)
          .get(parts[0]) as Record<string, unknown> | undefined;
        if (!f) return { status: 404, body: { error: "not_found" } };
        const produits = db
          .prepare(
            `SELECT id, nom, unite, categorie FROM produits
             WHERE fournisseur_id = ? AND archived_at IS NULL
             ORDER BY nom`,
          )
          .all(parts[0]);
        const promos = db
          .prepare(
            `SELECT * FROM prix WHERE fournisseur_id = ? AND COALESCE(promo,0)=1
             ORDER BY created_at DESC`,
          )
          .all(parts[0]);
        return {
          status: 200,
          body: {
            fournisseur: f,
            site_web: f.site_web || null,
            produits,
            promotions: promos,
          },
        };
      }
      if (parts.length === 0 && method === "GET") {
        const items = db
          .prepare(
            `SELECT id, nom, site_web, contact, email FROM fournisseurs
             WHERE archived_at IS NULL ORDER BY nom`,
          )
          .all();
        return { status: 200, body: { items } };
      }
      return { status: 404, body: { error: "not_found", subPath } };
    },
  };
}

export function registerBrandBonusApi(api: ApiKernel): void {
  api.registerModuleApi("optimiser", createOptimiserMount());
  api.registerModuleApi("stack", createStackMount());
  api.registerModuleApi("releves", createRelevesMount());
  api.registerModuleApi("scan", createScanMount());
  api.registerModuleApi("marketplaces", createCrudSimpleMount("marketplaces", ["nom"]));
  api.registerModuleApi("secteurs", createCrudSimpleMount("secteurs", ["nom"]));
  api.registerModuleApi("agregateurs", createCrudSimpleMount("agregateurs", ["nom"]));
  const dataMapping = createCrudSimpleMount("data_mappings", [
    "libelle_externe",
    "produit_id",
  ]);
  api.registerModuleApi("data_mappings", dataMapping);
  api.registerModuleApi("data-mapping", dataMapping);
  api.registerModuleApi("skus", createSkusMount());
  api.registerModuleApi("promotions", createPromotionsMount());
  api.registerModuleApi("dispatch", createDispatchMount());
  api.registerModuleApi("site", createSiteMount());
}
