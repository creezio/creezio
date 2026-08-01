/**
 * Mounts métier tempoflow3 — api-kernel /api/v1/modules/* + brand.db.
 * Généré --from-prd (CRUD SQL natif). Règles riches = enrichissement marque.
 */
import { randomUUID } from "node:crypto";
import type { ApiKernel, ApiMount, ApiRequest } from "@creezio/api-kernel";

const ENTITY_IDS = ["fournisseurs","produits","prix","panier_lignes","commandes"] as const;
const ARCHIVABLE = new Set(["fournisseurs","produits"]);
const COMMANDE_STATUTS = new Set(["brouillon", "envoyee", "recue"]);
const TABLE_COLS: Record<string, string[]> = {"fournisseurs":["id","created_at","updated_at","archived_at","nom","contact","email","telephone","site_web","notes"],"produits":["id","created_at","updated_at","archived_at","nom","unite","categorie","fournisseur_id"],"prix":["id","created_at","updated_at","produit_id","fournisseur_id","montant","devise","promo","promo_label"],"panier_lignes":["id","created_at","updated_at","produit_id","fournisseur_id","quantite","prix_unitaire"],"commandes":["id","created_at","updated_at","fournisseur_id","statut","total_ht","notes"]};

function now() {
  return new Date().toISOString();
}

function qstr(req: ApiRequest, key: string): string {
  const v = req.query?.[key];
  if (Array.isArray(v)) return String(v[0] ?? "");
  return v == null ? "" : String(v);
}

function createEntityMount(table: string): ApiMount {
  return {
    dbLayer: "brand",
    handle: async ({ req, subPath, db }) => {
      if (!db) return { status: 503, body: { error: "db_unavailable" } };
      const method = req.method.toUpperCase();
      const parts = subPath.split("/").filter(Boolean);

      if (parts.length === 2 && parts[1] === "archive" && method === "POST") {
        if (!ARCHIVABLE.has(table)) {
          return { status: 400, body: { error: "not_archivable" } };
        }
        const id = parts[0]!;
        const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id) as
          | Record<string, unknown>
          | undefined;
        if (!row) return { status: 404, body: { error: "not_found" } };
        db.prepare(
          `UPDATE ${table} SET archived_at = ?, updated_at = ? WHERE id = ?`,
        ).run(now(), now(), id);
        const updated = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
        return { status: 200, body: updated };
      }

      if (parts.length === 1) {
        const id = parts[0]!;
        if (method === "GET") {
          const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
          if (!row) return { status: 404, body: { error: "not_found" } };
          return { status: 200, body: row };
        }
        if (method === "PATCH") {
          const body = (req.body || {}) as Record<string, unknown>;
          if (table === "commandes" && body.statut != null) {
            if (!COMMANDE_STATUTS.has(String(body.statut))) {
              return { status: 400, body: { error: "statut_invalide" } };
            }
          }
          const existing = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id) as
            | Record<string, unknown>
            | undefined;
          if (!existing) return { status: 404, body: { error: "not_found" } };
          const next: Record<string, unknown> = {
            ...existing,
            ...body,
            id,
            updated_at: now(),
          };
          const cols = Object.keys(next).filter((k) => k !== "id");
          db.prepare(
            `UPDATE ${table} SET ${cols.map((c) => c + " = ?").join(", ")} WHERE id = ?`,
          ).run(...cols.map((c) => next[c]), id);
          return {
            status: 200,
            body: db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id),
          };
        }
        if (method === "DELETE") {
          if (ARCHIVABLE.has(table)) {
            return { status: 400, body: { error: "use_archive" } };
          }
          const existing = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
          if (!existing) return { status: 404, body: { error: "not_found" } };
          db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
          return { status: 200, body: existing };
        }
      }

      if (parts.length === 0 && method === "GET") {
        let rows = db.prepare(`SELECT * FROM ${table}`).all() as Array<
          Record<string, unknown>
        >;
        if (ARCHIVABLE.has(table)) {
          const archived = qstr(req, "archived") || "0";
          if (archived === "0") {
            rows = rows.filter((r) => !r.archived_at);
          } else if (archived === "1") {
            rows = rows.filter((r) => Boolean(r.archived_at));
          }
        }
        const q = qstr(req, "q").trim().toLowerCase();
        if (q) {
          rows = rows.filter((r) => {
            const hay = [r.nom, r.contact, r.email, r.categorie, r.promo_label]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();
            return hay.includes(q);
          });
        }
        for (const key of ["fournisseur_id", "produit_id"] as const) {
          const v = qstr(req, key);
          if (v) rows = rows.filter((r) => r[key] === v);
        }
        if (table === "prix" && qstr(req, "promo") === "1") {
          rows = rows.filter((r) => Boolean(r.promo));
        }
        if (table === "panier_lignes") {
          let total = 0;
          const by = new Map<string, { fournisseur_id: string; lignes: number; total_ht: number }>();
          for (const l of rows) {
            const line =
              Number(l.quantite || 0) * Number(l.prix_unitaire || 0);
            total += line;
            const fid = String(l.fournisseur_id || "unknown");
            const cur = by.get(fid) || {
              fournisseur_id: fid,
              lignes: 0,
              total_ht: 0,
            };
            cur.lignes += 1;
            cur.total_ht += line;
            by.set(fid, cur);
          }
          return {
            status: 200,
            body: {
              items: rows,
              total_ht: total,
              by_fournisseur: [...by.values()],
            },
          };
        }
        return { status: 200, body: { items: rows } };
      }

      if (parts.length === 0 && method === "POST") {
        const body = (req.body || {}) as Record<string, unknown>;
        if (
          (table === "fournisseurs" || table === "produits") &&
          !String(body.nom || "").trim()
        ) {
          return { status: 400, body: { error: "nom_required" } };
        }
        if (table === "prix") {
          if (!body.produit_id || !body.fournisseur_id || body.montant == null) {
            return { status: 400, body: { error: "prix_fields_required" } };
          }
        }
        const id = String(body.id || randomUUID());
        const allowed = new Set(TABLE_COLS[table] || ["id", "created_at", "updated_at"]);
        const row: Record<string, unknown> = {
          id,
          created_at: now(),
          updated_at: now(),
        };
        for (const [k, v] of Object.entries(body)) {
          if (allowed.has(k) && k !== "id" && k !== "created_at") row[k] = v;
        }
        if (ARCHIVABLE.has(table) && row.archived_at === undefined) {
          row.archived_at = null;
        }
        if (table === "prix") {
          row.montant = Number(row.montant);
          row.promo = row.promo ? 1 : 0;
          row.devise = row.devise || "EUR";
        }
        if (table === "panier_lignes") {
          row.quantite = Number(row.quantite);
          if (row.prix_unitaire == null) {
            const prices = db
              .prepare(
                `SELECT montant FROM prix WHERE produit_id = ? AND fournisseur_id = ? ORDER BY created_at DESC LIMIT 1`,
              )
              .get(row.produit_id, row.fournisseur_id) as
              | { montant: number }
              | undefined;
            if (prices) row.prix_unitaire = Number(prices.montant);
          } else {
            row.prix_unitaire = Number(row.prix_unitaire);
          }
        }
        const cols = Object.keys(row).filter((c) => allowed.has(c));
        db.prepare(
          `INSERT INTO ${table} (${cols.join(",")}) VALUES (${cols.map(() => "?").join(",")})`,
        ).run(...cols.map((c) => row[c]));
        return {
          status: 201,
          body: db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id),
        };
      }


      if (
        table === "commandes" &&
        parts[0] === "from-panier" &&
        method === "POST"
      ) {
        const body = (req.body || {}) as { fournisseur_id?: string; notes?: string };
        const lignes = db
          .prepare(`SELECT * FROM panier_lignes`)
          .all() as Array<Record<string, unknown>>;
        if (!lignes.length) return { status: 400, body: { error: "panier_vide" } };
        const fournisseurId =
          body.fournisseur_id || String(lignes[0]!.fournisseur_id);
        const related = lignes.filter((l) => l.fournisseur_id === fournisseurId);
        if (!related.length) {
          return { status: 400, body: { error: "aucune_ligne_fournisseur" } };
        }
        const total = related.reduce(
          (s, l) =>
            s + Number(l.quantite || 0) * Number(l.prix_unitaire || 0),
          0,
        );
        const id = randomUUID();
        const created = now();
        db.prepare(
          `INSERT INTO commandes (id, created_at, updated_at, fournisseur_id, statut, total_ht, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ).run(
          id,
          created,
          created,
          fournisseurId,
          "brouillon",
          total,
          body.notes || "",
        );
        db.prepare(`DELETE FROM panier_lignes WHERE fournisseur_id = ?`).run(
          fournisseurId,
        );
        return {
          status: 201,
          body: {
            id,
            created_at: created,
            updated_at: created,
            fournisseur_id: fournisseurId,
            statut: "brouillon",
            total_ht: total,
            notes: body.notes || "",
            lignes: related,
          },
        };
      }


      return { status: 404, body: { error: "not_found", subPath } };
    },
  };
}

function createSchemaMount(): ApiMount {
  return {
    dbLayer: "brand",
    handle: async ({ req }) => {
      if (req.method.toUpperCase() !== "GET") {
        return { status: 405, body: { error: "method_not_allowed" } };
      }
      return {
        status: 200,
        body: {
          brandId: "tempoflow3",
          entities: ENTITY_IDS,
          pages: [{"id":"dashboard","path":"/dashboard","title":"Dashboard"},{"id":"fournisseurs","path":"/fournisseurs","title":"Fournisseurs"},{"id":"produits","path":"/produits","title":"Produits"},{"id":"prix","path":"/prix","title":"Prix"},{"id":"panier","path":"/panier","title":"Panier"},{"id":"commandes","path":"/commandes","title":"Commandes"}],
          flows: [{"id":"commande_fournisseur","label":"Commander chez un fournisseur","steps":["fournisseurs","produits","prix","panier","commandes"]}],
        },
      };
    },
  };
}

function createDashboardMount(): ApiMount {
  return {
    dbLayer: "brand",
    handle: async ({ req, db }) => {
      if (!db) return { status: 503, body: { error: "db_unavailable" } };
      if (req.method.toUpperCase() !== "GET") {
        return { status: 405, body: { error: "method_not_allowed" } };
      }
      const count = (table: string, where = "") =>
        (
          db.prepare(`SELECT COUNT(*) AS c FROM ${table} ${where}`).get() as {
            c: number;
          }
        ).c;
      return {
        status: 200,
        body: {
          fournisseurs: ARCHIVABLE.has("fournisseurs")
            ? count("fournisseurs", "WHERE archived_at IS NULL")
            : count("fournisseurs"),
          produits: ARCHIVABLE.has("produits")
            ? count("produits", "WHERE archived_at IS NULL")
            : count("produits"),
          prix: ENTITY_IDS.includes("prix" as never) ? count("prix") : 0,
          panier_lignes: ENTITY_IDS.includes("panier_lignes" as never)
            ? count("panier_lignes")
            : 0,
          commandes: ENTITY_IDS.includes("commandes" as never)
            ? count("commandes")
            : 0,
          promos: ENTITY_IDS.includes("prix" as never)
            ? count("prix", "WHERE promo = 1")
            : 0,
        },
      };
    },
  };
}

export function registerBrandModuleApi(api: ApiKernel): void {
  for (const entity of ENTITY_IDS) {
    api.registerModuleApi(entity, createEntityMount(entity));
  }
  api.registerModuleApi("schema", createSchemaMount());
  api.registerModuleApi("dashboard", createDashboardMount());
}
