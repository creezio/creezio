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
 * Consommateur du registre : \`...collectModuleMigrations()\` pour les
 * migrations \`mod_<module>_*\` (brand module init / modules/<id>.ts).
 */
import { composeMigrations, type SqliteMigration } from "@creezio/platform-core";
import { interactiveDemoMigrations } from "@creezio/interactive-demo";
import { collectModuleMigrations } from "./modules/index.js";

export const BRAND_SCHEMA_SQL = \`${sql}\`;

/**
 * Clés API service (portable TF2 020+025) — requis par le kit : clé CRM
 * Hermes (ensure-crm-key-db) et résolution d'intégrations plateforme
 * (@creezio/integrations, canal clé service).
 */
export const BRAND_API_KEYS_SQL = \`
CREATE TABLE IF NOT EXISTS api_keys (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  key_hash     TEXT NOT NULL UNIQUE,
  prefix       TEXT NOT NULL,
  scopes       TEXT NOT NULL DEFAULT 'full',
  user_id      TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  last_used_at TEXT,
  revoked_at   TEXT
);
CREATE INDEX IF NOT EXISTS idx_api_keys_active
  ON api_keys (key_hash)
  WHERE revoked_at IS NULL;
\`;

export function brandMigrations(): SqliteMigration[] {
  return composeMigrations(
    {
      id: "fromprd_brand_001_schema",
      sql: BRAND_SCHEMA_SQL,
    },
    {
      id: "fromprd_brand_api_keys",
      sql: BRAND_API_KEYS_SQL,
    },
    interactiveDemoMigrations(),
    collectModuleMigrations(),
  );
}
`;
}

/**
 * Mounts métier — consommateur du registre \`modules/\`.
 * EntitySpecs + mounts manuscrits vivent dans \`modules/<id>.ts\` ;
 * schema / dashboard / search restent des mounts partagés d'assemblage.
 */
export function renderBrandModuleApiTs(model: ProductModel): string {
  const pagesJson = JSON.stringify(
    model.pages.map((p) => ({ id: p.id, path: p.path, title: p.title })),
  );
  const flowsJson = JSON.stringify(model.flows);

  return `/**
 * Mounts métier ${model.brandId} — api-kernel /api/v1/modules/* + brand.db.
 * Consommateur du registre de modules (\`modules/index.ts\`) : les EntitySpec
 * et mounts manuscrits vivent dans \`modules/<id>.ts\` (standard kit
 * DOC-STANDARD-MODULE.md). Ne pas ré-inliner de métier ici.
 */
import { createRequire } from "node:module";
import type {
  ApiKernel,
  ApiMount,
  ApiRequest,
} from "@creezio/api-kernel";
import { registerEntityMounts } from "@creezio/api-kernel";
import {
  collectInteractiveDemoDefaults,
  createInteractiveDemoMount,
  genericOsTourScenario,
} from "@creezio/interactive-demo";
import { collectApiMounts, collectDemoScenarios, collectEntitySpecs } from "./modules/index.js";

const require = createRequire(import.meta.url);

function qstr(req: ApiRequest, key: string): string {
  const v = req.query?.[key];
  if (Array.isArray(v)) return String(v[0] ?? "");
  return v == null ? "" : String(v);
}

function createSchemaMount(): ApiMount {
  return {
    dbLayer: "brand",
    operations: [
      {
        id: "get",
        method: "GET",
        path: "/",
        description: "Schéma métier (entités, pages, flux)",
      },
    ],
    handle: async ({ req }) => {
      if (req.method.toUpperCase() !== "GET") {
        return { status: 405, body: { error: "method_not_allowed" } };
      }
      return {
        status: 200,
        body: {
          brandId: ${JSON.stringify(model.brandId)},
          entities: Object.keys(collectEntitySpecs()),
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
    operations: [
      {
        id: "get",
        method: "GET",
        path: "/",
        description: "Compteurs dashboard métier",
      },
    ],
    handle: async ({ req, db }) => {
      if (!db) return { status: 503, body: { error: "db_unavailable" } };
      if (req.method.toUpperCase() !== "GET") {
        return { status: 405, body: { error: "method_not_allowed" } };
      }
      const specs = collectEntitySpecs();
      const entityIds = Object.keys(specs);
      const archivable = new Set(
        entityIds.filter((id) => specs[id]!.archivable),
      );
      const count = (table: string, where = "") =>
        (
          db.prepare(\`SELECT COUNT(*) AS c FROM \${table} \${where}\`).get() as {
            c: number;
          }
        ).c;
      const entityCount = (table: string, where = "") =>
        entityIds.includes(table) ? count(table, where) : 0;
      return {
        status: 200,
        body: {
          fournisseurs: archivable.has("fournisseurs")
            ? entityCount("fournisseurs", "WHERE archived_at IS NULL")
            : entityCount("fournisseurs"),
          produits: archivable.has("produits")
            ? entityCount("produits", "WHERE archived_at IS NULL")
            : entityCount("produits"),
          prix: entityCount("prix"),
          panier_lignes: entityCount("panier_lignes"),
          commandes: entityCount("commandes"),
          promos: entityIds.includes("prix")
            ? count("prix", "WHERE promo = 1")
            : 0,
          entities: Object.fromEntries(
            entityIds.map((id) => [
              id,
              archivable.has(id)
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
    operations: [
      {
        id: "search",
        method: "GET",
        path: "/",
        description: "Recherche métier (Meili ou SQL)",
      },
    ],
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

      const specs = collectEntitySpecs();
      const needle = q.toLowerCase();
      const items: Array<Record<string, unknown>> = [];
      for (const table of Object.keys(specs)) {
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
  registerEntityMounts(api, collectEntitySpecs());
  for (const [id, mount] of collectApiMounts()) {
    api.registerModuleApi(id, mount);
  }
  api.registerModuleApi("schema", createSchemaMount());
  api.registerModuleApi("dashboard", createDashboardMount());
  api.registerModuleApi("search", createSearchMount());
  api.registerModuleApi(
    "interactive-demo",
    createInteractiveDemoMount({
      defaults: collectInteractiveDemoDefaults([
        {
          moduleId: "os",
          scenarios: [
            genericOsTourScenario({
              productName: ${JSON.stringify(model.brandName)},
            }),
          ],
        },
        { moduleId: "brand", scenarios: collectDemoScenarios() },
      ]),
    }),
  );
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
    // Première entité RÉELLE du spec — jamais un hardcode « notes » : la
    // table indexée doit exister dans le schema brand généré (sinon
    // l'indexation Meili plante sur une table absente — vécu foove2-admin).
    const ent = model.entities[0];
    if (!ent) {
      return `/**
 * Feed Meili OS shell — aucune table métier tant que module init n'a pas posé d'entité.
 */
import {
  configureMeiliBrandFeed,
  configureMeiliCatalogSqlTables,
  type BrandMeiliFeed,
} from "@creezio/electron-shell/meili";

export const brandMeiliFeed: BrandMeiliFeed = {
  id: "${model.brandId}-os",
  schemaVersion: 1,
  progressPrefix: "${model.brandId.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 24) || "BRAND"}",
  countTables: { produits: "_none", sites: "_none" },
  indexes: [],
  metaIndexUid: "catalog_meta",
};

export function applyBrandMeiliConfig(): void {
  configureMeiliCatalogSqlTables(brandMeiliFeed.countTables);
  configureMeiliBrandFeed(brandMeiliFeed);
}
`;
    }
    const textFields = ent.fields
      .filter((f) => f.type === "text")
      .map((f) => f.name);
    const searchable = textFields.length
      ? textFields
      : ent.fields.slice(0, 1).map((f) => f.name);
    const columns = ["id", ...searchable];
    return `/**
 * Feed Meili générique — première entité du spec (${ent.id}).
 */
import {
  configureMeiliBrandFeed,
  configureMeiliCatalogSqlTables,
  type BrandMeiliFeed,
} from "@creezio/electron-shell/meili";

export const brandMeiliFeed: BrandMeiliFeed = {
  id: "${model.brandId}-${ent.id}",
  schemaVersion: 1,
  progressPrefix: "${model.brandId.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 24) || "BRAND"}",
  countTables: { produits: "${ent.id}", sites: "${ent.id}" },
  indexes: [
    {
      uid: "catalog_products",
      countKey: "produits",
      table: "${ent.id}",
      columns: ${JSON.stringify(columns)},
      docType: "${ent.id}",
      settings: {
        searchableAttributes: ${JSON.stringify(searchable)},
        displayedAttributes: ${JSON.stringify(["id", "type", ...searchable])},
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
