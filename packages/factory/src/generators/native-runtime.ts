/**
 * Générateurs runtime natif OS — SQLite + api-kernel (pas de sidecar JSON).
 */
import type { AppManifest } from "@creezio/brand-config";
import { isChrModel, type ProductModel } from "../product-model.js";
import { renderBrandSchemaSql } from "./schema.js";

export function renderBrandMigrationsTs(model: ProductModel): string {
  const sql = renderBrandSchemaSql(model)
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${");
  return `/**
 * Migrations brand ${model.brandId} — généré --from-prd (SQL métier marque).
 * Appliquées via createSqliteRuntime (OS @creezio/platform-core).
 */
import { composeMigrations, type SqliteMigration } from "@creezio/platform-core";

export const BRAND_SCHEMA_SQL = \`${sql}\`;

export function brandMigrations(): SqliteMigration[] {
  return composeMigrations({
    id: "fromprd_brand_001_schema",
    sql: BRAND_SCHEMA_SQL,
  });
}
`;
}

export function renderBrandModuleApiTs(model: ProductModel): string {
  const entityIds = model.entities.map((e) => e.id);
  const archivable = model.entities.filter((e) => e.archivable).map((e) => e.id);
  const chr = isChrModel(model);
  const pagesJson = JSON.stringify(
    model.pages.map((p) => ({ id: p.id, path: p.path, title: p.title })),
  );
  const flowsJson = JSON.stringify(model.flows);

  return `/**
 * Mounts métier ${model.brandId} — api-kernel /api/v1/modules/* + brand.db.
 * Généré --from-prd (CRUD SQL natif). Règles riches = enrichissement marque.
 */
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import type { ApiKernel, ApiMount, ApiRequest } from "@creezio/api-kernel";

const require = createRequire(import.meta.url);

const ENTITY_IDS: readonly string[] = ${JSON.stringify(entityIds)};
const ARCHIVABLE = new Set<string>(${JSON.stringify(archivable)});
const COMMANDE_STATUTS = new Set<string>(["brouillon", "envoyee", "recue"]);
const TABLE_COLS: Record<string, string[]> = ${JSON.stringify(
    Object.fromEntries(
      model.entities.map((e) => [
        e.id,
        [
          "id",
          "created_at",
          "updated_at",
          ...(e.archivable ? ["archived_at"] : []),
          ...e.fields.map((f) => f.name),
        ],
      ]),
    ),
  )};

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
        const row = db.prepare(\`SELECT * FROM \${table} WHERE id = ?\`).get(id) as
          | Record<string, unknown>
          | undefined;
        if (!row) return { status: 404, body: { error: "not_found" } };
        db.prepare(
          \`UPDATE \${table} SET archived_at = ?, updated_at = ? WHERE id = ?\`,
        ).run(now(), now(), id);
        const updated = db.prepare(\`SELECT * FROM \${table} WHERE id = ?\`).get(id);
        return { status: 200, body: updated };
      }

      if (parts.length === 1) {
        const id = parts[0]!;
        if (method === "GET") {
          const row = db.prepare(\`SELECT * FROM \${table} WHERE id = ?\`).get(id);
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
          const existing = db.prepare(\`SELECT * FROM \${table} WHERE id = ?\`).get(id) as
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
            \`UPDATE \${table} SET \${cols.map((c) => c + " = ?").join(", ")} WHERE id = ?\`,
          ).run(...cols.map((c) => next[c]), id);
          return {
            status: 200,
            body: db.prepare(\`SELECT * FROM \${table} WHERE id = ?\`).get(id),
          };
        }
        if (method === "DELETE") {
          if (ARCHIVABLE.has(table)) {
            return { status: 400, body: { error: "use_archive" } };
          }
          const existing = db.prepare(\`SELECT * FROM \${table} WHERE id = ?\`).get(id);
          if (!existing) return { status: 404, body: { error: "not_found" } };
          db.prepare(\`DELETE FROM \${table} WHERE id = ?\`).run(id);
          return { status: 200, body: existing };
        }
      }

      if (parts.length === 0 && method === "GET") {
        let rows = db.prepare(\`SELECT * FROM \${table}\`).all() as Array<
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
                \`SELECT montant FROM prix WHERE produit_id = ? AND fournisseur_id = ? ORDER BY created_at DESC LIMIT 1\`,
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
          \`INSERT INTO \${table} (\${cols.join(",")}) VALUES (\${cols.map(() => "?").join(",")})\`,
        ).run(...cols.map((c) => row[c]));
        return {
          status: 201,
          body: db.prepare(\`SELECT * FROM \${table} WHERE id = ?\`).get(id),
        };
      }

${
  chr
    ? `
      if (
        table === "commandes" &&
        parts[0] === "from-panier" &&
        method === "POST"
      ) {
        const body = (req.body || {}) as { fournisseur_id?: string; notes?: string };
        const lignes = db
          .prepare(\`SELECT * FROM panier_lignes\`)
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
          \`INSERT INTO commandes (id, created_at, updated_at, fournisseur_id, statut, total_ht, notes)
           VALUES (?, ?, ?, ?, ?, ?, ?)\`,
        ).run(
          id,
          created,
          created,
          fournisseurId,
          "brouillon",
          total,
          body.notes || "",
        );
        db.prepare(\`DELETE FROM panier_lignes WHERE fournisseur_id = ?\`).run(
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
`
    : ""
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
          brandId: ${JSON.stringify(model.brandId)},
          entities: ENTITY_IDS,
          pages: ${pagesJson},
          flows: ${flowsJson},
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
          db.prepare(\`SELECT COUNT(*) AS c FROM \${table} \${where}\`).get() as {
            c: number;
          }
        ).c;
      const entityCount = (table: string, where = "") =>
        ENTITY_IDS.includes(table) ? count(table, where) : 0;
      return {
        status: 200,
        body: {
          fournisseurs: ARCHIVABLE.has("fournisseurs")
            ? entityCount("fournisseurs", "WHERE archived_at IS NULL")
            : entityCount("fournisseurs"),
          produits: ARCHIVABLE.has("produits")
            ? entityCount("produits", "WHERE archived_at IS NULL")
            : entityCount("produits"),
          prix: entityCount("prix"),
          panier_lignes: entityCount("panier_lignes"),
          commandes: entityCount("commandes"),
          promos: ENTITY_IDS.includes("prix")
            ? count("prix", "WHERE promo = 1")
            : 0,
          entities: Object.fromEntries(
            ENTITY_IDS.map((id) => [
              id,
              ARCHIVABLE.has(id)
                ? count(id, "WHERE archived_at IS NULL")
                : count(id),
            ]),
          ),
        },
      };
    },
  };
}

function createSearchMount(): ApiMount {
  return {
    dbLayer: "brand",
    handle: async ({ req, db }) => {
      if (!db) return { status: 503, body: { error: "db_unavailable" } };
      if (req.method.toUpperCase() !== "GET") {
        return { status: 405, body: { error: "method_not_allowed" } };
      }
      const q = qstr(req, "q").trim();
      if (!q) return { status: 200, body: { engine: "none", items: [] } };

      const host = process.env.MEILI_HOST || "";
      if (host) {
        try {
          const { searchMeiliIndexes } = await import("@creezio/electron-shell/meili");
          const { brandMeiliFeed } = await import("./meili-feed.js");
          const hits = await searchMeiliIndexes({
            host,
            masterKey: process.env.MEILI_MASTER_KEY || "",
            indexUids: brandMeiliFeed.indexes.map((i) => i.uid),
            query: q,
          });
          if (hits.length > 0) {
            return { status: 200, body: { engine: "meili", items: hits } };
          }
        } catch {
          /* fallback SQL */
        }
      }

      const needle = q.toLowerCase();
      const items: Array<Record<string, unknown>> = [];
      for (const table of ENTITY_IDS) {
        if (!TABLE_COLS[table]) continue;
        const rows = db.prepare(\`SELECT * FROM \${table}\`).all() as Array<
          Record<string, unknown>
        >;
        for (const r of rows) {
          if (r.archived_at) continue;
          const hay = Object.values(r)
            .filter((v) => typeof v === "string")
            .join(" ")
            .toLowerCase();
          if (hay.includes(needle)) {
            items.push({ ...r, _table: table, _index: "sql" });
          }
        }
      }
      return { status: 200, body: { engine: "sql", items } };
    },
  };
}

export function registerBrandModuleApi(api: ApiKernel): void {
  for (const entity of ENTITY_IDS) {
    api.registerModuleApi(entity, createEntityMount(entity));
  }
  api.registerModuleApi("schema", createSchemaMount());
  api.registerModuleApi("dashboard", createDashboardMount());
  api.registerModuleApi("search", createSearchMount());
  // Bonus marque optionnel (brand-bonus-api.ts) — ignore si absent.
  try {
    const bonus = require("./brand-bonus-api.js") as {
      registerBrandBonusApi?: (a: ApiKernel) => void;
    };
    bonus.registerBrandBonusApi?.(api);
  } catch {
    /* pas de bonus */
  }
}
`;
}

export function renderMeiliFeedTs(model: ProductModel): string {
  if (!isChrModel(model)) {
    return `/**
 * Feed Meili générique — notes (sandbox).
 */
import {
  configureMeiliBrandFeed,
  configureMeiliCatalogSqlTables,
  type BrandMeiliFeed,
} from "@creezio/electron-shell/meili";

export const brandMeiliFeed: BrandMeiliFeed = {
  id: "${model.brandId}-notes",
  schemaVersion: 1,
  progressPrefix: "${model.brandId.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 24) || "BRAND"}",
  countTables: { produits: "notes", sites: "notes" },
  indexes: [
    {
      uid: "catalog_products",
      countKey: "produits",
      table: "notes",
      columns: ["id", "titre", "contenu"],
      docType: "note",
      settings: {
        searchableAttributes: ["titre", "contenu"],
        displayedAttributes: ["id", "type", "titre", "contenu"],
      },
    },
  ],
  metaIndexUid: "catalog_meta",
};

export function applyBrandMeiliConfig(): void {
  configureMeiliCatalogSqlTables(brandMeiliFeed.countTables);
  configureMeiliBrandFeed(brandMeiliFeed);
}
`;
  }

  return `/**
 * Feed Meili marque ${model.brandId} — config OS (pas de moteur maison).
 * UIDs génériques catalog_* (interdit tf2_* dans le feed marque).
 */
import {
  configureMeiliBrandFeed,
  configureMeiliCatalogSqlTables,
  createChrCatalogMeiliFeed,
  type BrandMeiliFeed,
} from "@creezio/electron-shell/meili";

export const brandMeiliFeed: BrandMeiliFeed = createChrCatalogMeiliFeed({
  brandId: ${JSON.stringify(model.brandId)},
});

export function applyBrandMeiliConfig(): void {
  configureMeiliCatalogSqlTables(brandMeiliFeed.countTables);
  configureMeiliBrandFeed(brandMeiliFeed);
}
`;
}

export function renderBrandKernelHarnessMjs(
  m: AppManifest,
  model: ProductModel,
): string {
  const prefix = m.envPrefix;
  return `#!/usr/bin/env node
/**
 * Harness Node — façade @creezio/app-runtime (même kernel que le desktop).
 * Usage: npm run build:electron && METIER_DATA_DIR=... METIER_PORT=... node scripts/brand-kernel-harness.mjs
 *
 * Fichier GÉNÉRÉ par la factory creezio (template kit) : la même façade pour
 * toutes les marques. Les modules optionnels (catalog-sync, brand-mcp-tools,
 * brand-platform-bindings) sont chargés s'ils existent dans build/electron —
 * le métier reste dans la marque, l'orchestration dans le kit.
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import {
  applyBrandCatalogEnvDefaults,
  startBrandKernelHarness,
} from "@creezio/app-runtime";
import { loadLocalEnv } from "./load-local-env.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
loadLocalEnv(root);
const PORT = Number(process.env.METIER_PORT || process.env.PORT || 18791);
const electron = path.join(root, "build/electron");

// Catalogue : léger par défaut (tests/CI — pas de download distant).
// Docker prod : CREEZIO_CATALOG=1 (profil prod) ou ${prefix}_CATALOG_ENABLE=1.
// À faire AVANT l'import des modules marque (ils lisent l'env à l'import).
applyBrandCatalogEnvDefaults(${JSON.stringify(prefix)});

const importMod = (name) =>
  import(pathToFileURL(path.join(electron, name)).href);
const importOptional = (name) =>
  fs.existsSync(path.join(electron, name)) ? importMod(name) : null;

const manifestMod = await importMod("app-manifest.js");
const migMod = await importMod("brand-migrations.js");
const apiMod = await importMod("brand-module-api.js");
const feedMod = await importMod("meili-feed.js");
const catalogMod = await importOptional("catalog-sync.js");
const mcpMod = await importOptional("brand-mcp-tools.js");
const bindMod = await importOptional("brand-platform-bindings.js");

const manifestExport = Object.keys(manifestMod).find((k) =>
  k.endsWith("Manifest"),
);
if (!manifestExport) throw new Error("AppManifest introuvable");

const dataDir = process.env.METIER_DATA_DIR || undefined;

await startBrandKernelHarness({
  brandId: ${JSON.stringify(model.brandId)},
  appRoot: root,
  port: PORT,
  manifest: manifestMod[manifestExport],
  brandMigrations: migMod.brandMigrations(),
  registerModuleApi: apiMod.registerBrandModuleApi,
  beforeBoot: () => {
    feedMod.applyBrandMeiliConfig?.();
    bindMod?.applyBrandPlatformBindings?.();
  },
  meiliFeed: feedMod.brandMeiliFeed,
  ...(catalogMod?.createBrandCatalogHost
    ? { catalogHost: catalogMod.createBrandCatalogHost(dataDir) }
    : {}),
  ...(mcpMod?.createBrandModuleMcpTools
    ? { discoverModuleTools: mcpMod.createBrandModuleMcpTools }
    : {}),
});
`;
}

export function renderMainFromPrdNativeTs(
  m: AppManifest,
  model: ProductModel,
): string {
  const exportName = m.brandId.replace(/-([a-z])/g, (_, c: string) =>
    c.toUpperCase(),
  );
  const manifestExport = `${exportName}Manifest`;
  return `/**
 * Main Electron — déclaration marque uniquement (métier + identité).
 * Orchestration OS = @creezio/app-runtime (P&P natif : shell runtime,
 * hosts Hermes/n8n/tunnel, Meili/cloudflared kit, MCP local).
 * Opt-out shell : CREEZIO_DESKTOP_SHELL=window
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { app } from "electron";
import { startBrandDesktop } from "@creezio/app-runtime";
import { ${manifestExport} as manifest } from "./app-manifest.js";
import { verticalSlot } from "./vertical-slot.js";
import { brandMigrations } from "./brand-migrations.js";
import { registerBrandModuleApi } from "./brand-module-api.js";
import { brandMeiliFeed, applyBrandMeiliConfig } from "./meili-feed.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

startBrandDesktop({
  manifest,
  electronDirname: __dirname,
  brandMigrations: brandMigrations(),
  registerModuleApi: registerBrandModuleApi,
  beforeBoot: applyBrandMeiliConfig,
  meiliFeed: brandMeiliFeed,
  navItems: verticalSlot.items,
  // Défaut kit = "runtime". Opt-out explicite pour CI/fenêtre seule.
  desktopShell:
    process.env.CREEZIO_DESKTOP_SHELL === "window" ? "window" : "runtime",
}).catch((err) => {
  console.error(err);
  app.exit(1);
});
// entities=${model.entities.length}
`;
}
