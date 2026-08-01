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
import type { ApiKernel, ApiMount, ApiRequest } from "@creezio/api-kernel";

const ENTITY_IDS = ${JSON.stringify(entityIds)} as const;
const ARCHIVABLE = new Set(${JSON.stringify(archivable)});
const COMMANDE_STATUTS = new Set(["brouillon", "envoyee", "recue"]);
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
`;
}

export function renderBrandRuntimeTs(m: AppManifest, model: ProductModel): string {
  const exportName = m.brandId.replace(/-([a-z])/g, (_, c: string) =>
    c.toUpperCase(),
  );
  const manifestExport = `${exportName}Manifest`;
  return `/**
 * Runtime marque natif — SQLite + api-kernel (OS creezio).
 * Utilisé par Electron main ET par le harness Node (smokes).
 */
import {
  createSqliteRuntime,
  platformCoreMigrations,
  type SqliteRuntime,
  type PathsContext,
} from "@creezio/platform-core";
import { createApiKernel, type ApiKernel } from "@creezio/api-kernel";
import { ${manifestExport} as manifest } from "./app-manifest.js";
import { brandMigrations } from "./brand-migrations.js";
import { registerBrandModuleApi } from "./brand-module-api.js";

export type BrandKernelBoot = {
  api: ApiKernel;
  runtime: SqliteRuntime;
  paths: PathsContext;
  close: () => void;
};

export function bootBrandKernel(opts: {
  userDataDir: string;
  isPackaged?: boolean;
}): BrandKernelBoot {
  const paths: PathsContext = {
    manifest,
    userDataRoot: opts.userDataDir,
    isPackaged: Boolean(opts.isPackaged),
    resourcesRoot: opts.userDataDir,
  };
  const runtime = createSqliteRuntime({
    ctx: paths,
    coreMigrations: platformCoreMigrations(),
    brandMigrations: brandMigrations(),
    touchBrand: true,
  });
  const api = createApiKernel({
    brandId: manifest.brandId,
    sqliteRuntime: runtime,
  });
  registerBrandModuleApi(api);
  return {
    api,
    runtime,
    paths,
    close: () => runtime.close(),
  };
}
`;
}

export function renderBrandKernelHarnessMjs(model: ProductModel): string {
  return `#!/usr/bin/env node
/**
 * Harness Node — même api-kernel + SQLite que le desktop (pas de store.json).
 * Usage: npm run build:electron && METIER_DATA_DIR=... METIER_PORT=... node scripts/brand-kernel-harness.mjs
 */
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.METIER_PORT || process.env.PORT || 18791);
const DATA_DIR =
  process.env.METIER_DATA_DIR ||
  fs.mkdtempSync(path.join(os.tmpdir(), "${model.brandId}-kernel-"));

const bootMod = await import(
  pathToFileURL(path.join(root, "build/electron/brand-runtime.js")).href
);
const { api, close } = bootMod.bootBrandKernel({ userDataDir: DATA_DIR });

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve(undefined);
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
        "access-control-allow-headers": "content-type",
      });
      res.end();
      return;
    }
    const url = new URL(req.url || "/", \`http://127.0.0.1:\${PORT}\`);
    const query = Object.fromEntries(url.searchParams.entries());
    const body = ["POST", "PUT", "PATCH"].includes(req.method || "")
      ? await readBody(req)
      : undefined;
    const result = await api.handle({
      method: req.method || "GET",
      path: url.pathname,
      body,
      query,
      headers: req.headers,
    });
    const payload = JSON.stringify(result.body ?? {});
    res.writeHead(result.status || 200, {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      ...(result.headers || {}),
    });
    res.end(payload);
  } catch (err) {
    res.writeHead(500, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: String(err?.message || err) }));
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(
    \`brand-kernel-harness ${model.brandId} on http://127.0.0.1:\${PORT} data=\${DATA_DIR}\`,
  );
});

function shutdown() {
  server.close(() => {
    close();
    process.exit(0);
  });
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
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
 * Main Electron — OS kit + runtime natif (SQLite + api-kernel).
 * Généré --from-prd. Pas de sidecar JSON métier.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow, ipcMain } from "electron";
import {
  initLogger,
  log,
  prepareDesktopBoot,
  writeAppKindFile,
  installBrandDesktopRuntime,
  createDesktopSessionStore,
  registerDesktopSessionIpc,
} from "@creezio/electron-shell";
import { createMcpFacade } from "@creezio/mcp-facade";
import { createMemoryAuthStore } from "@creezio/auth";
import { createNavShellAdapter } from "@creezio/shell-ui";
import { ${manifestExport} as manifest } from "./app-manifest.js";
import { verticalSlot } from "./vertical-slot.js";
import { bootBrandKernel } from "./brand-runtime.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  const boot = await prepareDesktopBoot(manifest);
  initLogger(boot.userDataDir, manifest.logBasename);
  log("boot", \`kind=\${boot.appKind} product=\${manifest.client.productName} fromPrd=1 nativeKernel=1\`);

  writeAppKindFile(
    __dirname,
    boot.appKind === "legacy" ? "client" : boot.appKind,
  );

  const session = createDesktopSessionStore({
    userDataDir: boot.userDataDir,
    manifest,
  });

  const { api, close: closeKernel } = bootBrandKernel({
    userDataDir: boot.userDataDir,
    isPackaged: app.isPackaged,
  });

  const mcp = createMcpFacade({
    brandId: manifest.brandId,
    allowUnauthenticated: true,
    listApiMounts: () => api.listMounts(),
    discoverToolsBySpace: async () => ({ module: [], plugin: [] }),
  });
  const auth = createMemoryAuthStore();
  const navShell = createNavShellAdapter();
  navShell.registerBrandNav(verticalSlot.items);
  const navModel = navShell.getRenderModel();
  void mcp;
  void auth;
  void installBrandDesktopRuntime;

  const gotLock = app.requestSingleInstanceLock();
  if (!gotLock) {
    app.quit();
    return;
  }

  await app.whenReady();

  registerDesktopSessionIpc({
    ipcMain,
    session,
    info: {
      brandId: manifest.brandId,
      productName: manifest.client.productName,
      appKind: boot.appKind,
    },
  });

  const win = new BrowserWindow({
    width: 1180,
    height: 760,
    title:
      boot.appKind === "server"
        ? manifest.server.productName
        : manifest.client.productName,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      partition: boot.sessionPartition,
    },
  });

  const renderer = app.isPackaged
    ? path.join(process.resourcesPath, "renderer", "index.html")
    : path.join(__dirname, "../../resources/renderer/index.html");
  await win.loadFile(renderer);

  log(
    "nav",
    \`merged=\${navModel.items.length} mounts=\${api.listMounts().length} entities=${model.entities.length} setup=\${session.isSetupComplete()}\`,
  );

  app.on("will-quit", () => {
    closeKernel();
  });
}

main().catch((err) => {
  console.error(err);
  app.exit(1);
});
`;
}
