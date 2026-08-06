/**
 * `creezio brand module init <id>` — scaffolde une unité de travail module
 * conforme au standard kit (docs/DOC-STANDARD-MODULE.md) :
 *   1. dossier spec 4 fichiers (prd/interview/TODO/CHANGELOG) sous
 *      `brand-spec/modules/<id>/` (ou `admin-spec/modules/<id>/` pour un
 *      repo admin) ;
 *   2. stub de wiring `server/src/electron/modules/<id>.ts` (BrandModuleDef) ;
 *   3. stub de gate `server/scripts/test-module-<id>.mjs` ;
 *   4. ligne d'import + entrée dans le registre `modules/index.ts`
 *      (créé avec `types.ts` s'il n'existe pas encore).
 */
import fs from "node:fs";
import path from "node:path";
import { renderModuleSpecFiles } from "@creezio/brand-spec";

export type ModuleInitResult = {
  specDir: string;
  written: string[];
  skipped: string[];
};

function camelize(id: string): string {
  return id
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part, i) =>
      i === 0 ? part.toLowerCase() : part[0]!.toUpperCase() + part.slice(1).toLowerCase(),
    )
    .join("");
}

function titleize(id: string): string {
  const words = id.split(/[^a-zA-Z0-9]+/).filter(Boolean);
  return words
    .map((w) => w[0]!.toUpperCase() + w.slice(1))
    .join(" ");
}

const TYPES_TS = `/**
 * creezio:owned-by-brand
 * Contrat du registre de modules — un module métier = un fichier
 * \`modules/<id>.ts\` exportant un \`BrandModuleDef\` (standard kit
 * DOC-STANDARD-MODULE.md).
 */
import type { ApiKernel, ApiMount, EntitySpec } from "@creezio/api-kernel";
import type { McpRegisteredTool } from "@creezio/mcp-facade";
import type { SqliteMigration } from "@creezio/platform-core";
import type { BrandMeiliFeed } from "@creezio/electron-shell/meili";
import type { CoreNavItem } from "@creezio/shell-ui";

/** Entrée de nav métier — \`order\` fixe la position dans la sidebar. */
export type BrandNavItem = CoreNavItem & { order: number };

/** Spec d'index Meili (même forme que BrandMeiliFeed.indexes[n]). */
export type BrandMeiliIndex = BrandMeiliFeed["indexes"][number];

export type BrandModuleDef = {
  id: string;
  /** Entités CRUD (moteur kit createEntityApiMount) — clé = mount id. */
  entitySpecs?: Record<string, EntitySpec>;
  /** Mounts API manuscrits — clé = id sous /api/v1/modules/<id>. */
  apiMounts?: Record<string, ApiMount>;
  /** Entrées de nav du module (fusionnées + triées par order). */
  navItems?: BrandNavItem[];
  /** Tools MCP métier du module (surface module.<owner>.*). */
  mcpTools?: (api: ApiKernel) => McpRegisteredTool[];
  /** Index Meili contribués au feed marque. */
  meiliIndexes?: BrandMeiliIndex[];
  /**
   * Migrations du module — \`mod_<module>_00N_<slug>\`, jamais renuméroter
   * une migration appliquée ; migrations cross-module interdites.
   */
  migrations?: () => SqliteMigration[];
};
`;

const INDEX_TS = `/**
 * creezio:owned-by-brand
 * Registre des modules métier — une ligne d'import par module (périmètre
 * multi-agents : chaque agent ne touche que SA ligne + son fichier module).
 */
import type { ApiKernel, ApiMount, EntitySpec } from "@creezio/api-kernel";
import type { McpRegisteredTool } from "@creezio/mcp-facade";
import type { SqliteMigration } from "@creezio/platform-core";
import type { BrandMeiliIndex, BrandModuleDef, BrandNavItem } from "./types.js";

// <creezio:module-imports> (une ligne par module — insertion \`brand module init\`)
// </creezio:module-imports>

export const BRAND_MODULES: BrandModuleDef[] = [
  // <creezio:module-registry>
  // </creezio:module-registry>
];

/** EntitySpecs CRUD fusionnés (clé unique par module — collision = bug). */
export function collectEntitySpecs(): Record<string, EntitySpec> {
  const out: Record<string, EntitySpec> = {};
  for (const mod of BRAND_MODULES) {
    for (const [key, spec] of Object.entries(mod.entitySpecs ?? {})) {
      if (out[key]) {
        throw new Error(\`entity spec en double: \${key} (module \${mod.id})\`);
      }
      out[key] = spec;
    }
  }
  return out;
}

/** Mounts API manuscrits fusionnés (un même mount peut avoir des alias). */
export function collectApiMounts(): Array<[string, ApiMount]> {
  const seen = new Set<string>();
  const out: Array<[string, ApiMount]> = [];
  for (const mod of BRAND_MODULES) {
    for (const [key, mount] of Object.entries(mod.apiMounts ?? {})) {
      if (seen.has(key)) {
        throw new Error(\`mount API en double: \${key} (module \${mod.id})\`);
      }
      seen.add(key);
      out.push([key, mount]);
    }
  }
  return out;
}

/** Entrées de nav métier triées par \`order\`. */
export function collectNavItems(extra: BrandNavItem[] = []): BrandNavItem[] {
  const items = [
    ...extra,
    ...BRAND_MODULES.flatMap((mod) => mod.navItems ?? []),
  ];
  return items.sort((a, b) => a.order - b.order);
}

/** Tools MCP métier de tous les modules. */
export function collectMcpTools(api: ApiKernel): McpRegisteredTool[] {
  return BRAND_MODULES.flatMap((mod) => mod.mcpTools?.(api) ?? []);
}

/** Index Meili contribués au feed marque. */
export function collectMeiliIndexes(): BrandMeiliIndex[] {
  return BRAND_MODULES.flatMap((mod) => mod.meiliIndexes ?? []);
}

/** Migrations des modules (IDs stables mod_<module>_*). */
export function collectModuleMigrations(): SqliteMigration[] {
  return BRAND_MODULES.flatMap((mod) => mod.migrations?.() ?? []);
}
`;

function renderModuleStub(id: string): string {
  const camel = camelize(id);
  const title = titleize(id);
  return `/**
 * creezio:owned-by-brand
 * Module ${id} — (décrire la mission en une ligne).
 * Spec : modules/${id}/ (prd + interview + TODO + CHANGELOG).
 */
import type { BrandModuleDef } from "./types.js";

export const ${camel}Module: BrandModuleDef = {
  id: "${id}",
  // entitySpecs: { ${camel}: { table: "${camel}", columns: [/* … */] } },
  // apiMounts: { "${id}": monMount },
  navItems: [
    { id: "brand.${id}", label: "${title}", href: "/${id}", group: "brand", order: 500 },
  ],
  // mcpTools: (api) => [/* registerGuardedMcpTool côté serveur MCP */],
  // migrations: () => [{ id: "mod_${camel}_001_init", sql: \`…\` }],
};
`;
}

function renderGateStub(id: string, specRootName: string): string {
  return `#!/usr/bin/env node
/**
 * Gate module ${id} — stub scaffoldé par \`creezio brand module init\`.
 * Vérifie le contrat structurel (spec 4 fichiers + wiring + registre).
 * À enrichir : boot harness + CRUD HTTP + hooks + tools MCP (voir
 * DOC-STANDARD-MODULE.md §9).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appDir = path.resolve(serverDir, "..");
const errors = [];

const specDir = path.join(appDir, "${specRootName}", "modules", "${id}");
for (const f of ["prd.md", "interview.md", "TODO.md", "CHANGELOG.md"]) {
  if (!fs.existsSync(path.join(specDir, f))) errors.push(\`spec manquant: \${f}\`);
}

const wiring = path.join(serverDir, "src/electron/modules/${id}.ts");
if (!fs.existsSync(wiring)) {
  errors.push("wiring manquant: src/electron/modules/${id}.ts");
} else if (!fs.readFileSync(wiring, "utf8").includes("BrandModuleDef")) {
  errors.push("wiring sans BrandModuleDef");
}

const registry = path.join(serverDir, "src/electron/modules/index.ts");
if (!fs.existsSync(registry) || !fs.readFileSync(registry, "utf8").includes("./${id}.js")) {
  errors.push("module absent du registre modules/index.ts");
}

if (errors.length) {
  console.error(\`✗ test-module-${id}:\\n\` + errors.map((e) => \`  - \${e}\`).join("\\n"));
  process.exit(1);
}
console.log("OK test-module-${id} (structurel — enrichir avec des preuves HTTP)");
`;
}

function insertAfterMarker(
  filePath: string,
  closeMarker: string,
  line: string,
): void {
  const raw = fs.readFileSync(filePath, "utf8");
  if (raw.includes(line.trim())) return;
  const idx = raw.indexOf(closeMarker);
  if (idx < 0) {
    throw new Error(`marqueur ${closeMarker} introuvable dans ${filePath}`);
  }
  const lineStart = raw.lastIndexOf("\n", idx) + 1;
  const indent = raw.slice(lineStart, idx);
  fs.writeFileSync(
    filePath,
    raw.slice(0, lineStart) + indent + line + "\n" + indent + raw.slice(idx),
    "utf8",
  );
}

/** Livrable serveur d'une marque : `<app>/server` (monorepo) ou `<app>`. */
function resolveServerDir(appDir: string): string {
  const server = path.join(appDir, "server");
  return fs.existsSync(path.join(server, "package.json")) ? server : appDir;
}

export function runBrandModuleInit(
  appDir: string,
  moduleId: string,
  force = false,
): ModuleInitResult {
  if (!/^[a-z][a-z0-9-]*$/.test(moduleId)) {
    throw new Error(`id de module invalide: ${moduleId} ([a-z][a-z0-9-]*)`);
  }
  const written: string[] = [];
  const skipped: string[] = [];
  const write = (filePath: string, body: string) => {
    if (fs.existsSync(filePath) && !force) {
      skipped.push(filePath);
      return;
    }
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, body, "utf8");
    written.push(filePath);
  };

  // 1. Spec 4 fichiers (admin-spec/ si repo admin, sinon brand-spec/).
  const specRootName = fs.existsSync(path.join(appDir, "admin-spec"))
    ? "admin-spec"
    : "brand-spec";
  const specDir = path.join(appDir, specRootName, "modules", moduleId);
  const specFiles = renderModuleSpecFiles(moduleId);
  for (const [name, body] of Object.entries(specFiles)) {
    write(path.join(specDir, name), body);
  }

  // 2. Wiring modules/<id>.ts + registre (créés au besoin).
  const serverDir = resolveServerDir(appDir);
  const modulesDir = path.join(serverDir, "src/electron/modules");
  write(path.join(modulesDir, "types.ts"), TYPES_TS);
  write(path.join(modulesDir, "index.ts"), INDEX_TS);
  write(path.join(modulesDir, `${moduleId}.ts`), renderModuleStub(moduleId));

  const camel = camelize(moduleId);
  const registryPath = path.join(modulesDir, "index.ts");
  insertAfterMarker(
    registryPath,
    "// </creezio:module-imports>",
    `import { ${camel}Module } from "./${moduleId}.js";`,
  );
  insertAfterMarker(
    registryPath,
    "// </creezio:module-registry>",
    `${camel}Module,`,
  );

  // 3. Gate stub.
  write(
    path.join(serverDir, "scripts", `test-module-${moduleId}.mjs`),
    renderGateStub(moduleId, specRootName),
  );

  return { specDir, written, skipped };
}
