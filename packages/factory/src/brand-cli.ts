/**
 * CLI `creezio brand` — BrandSpec (init / doctor / apply / smoke).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  doctorBrandSpec,
  formatDoctorReport,
  initBrandSpec,
  loadBrandSpec,
  resolveBrandSpecDir,
} from "@creezio/brand-spec";
import { scaffoldNewApp } from "./scaffold.js";
import {
  assertProductModel,
  parseProductPrd,
  safeBrandId,
  type ProductModel,
} from "./product-model.js";

export type BrandCliArgs = {
  command: string;
  sub?: string;
  spec?: string;
  out?: string;
  app?: string;
  name?: string;
  id?: string;
  domain?: string;
  force?: boolean;
  help?: boolean;
  vertical?: "chr" | "generic";
  /** Dossier icônes marque (sinon `<spec>/icons`). */
  iconsDir?: string;
};

export function parseBrandArgs(argv: string[]): BrandCliArgs {
  const out: BrandCliArgs = { command: "brand" };
  const rest = [...argv];
  out.sub = rest.shift() || "";

  while (rest.length) {
    const a = rest.shift()!;
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--force") out.force = true;
    else if (a.startsWith("--spec=")) out.spec = a.slice("--spec=".length);
    else if (a === "--spec") out.spec = rest.shift();
    else if (a.startsWith("--out=")) out.out = a.slice("--out=".length);
    else if (a === "--out") out.out = rest.shift();
    else if (a.startsWith("--app=")) out.app = a.slice("--app=".length);
    else if (a === "--app") out.app = rest.shift();
    else if (a.startsWith("--name=")) out.name = a.slice("--name=".length);
    else if (a === "--name") out.name = rest.shift();
    else if (a.startsWith("--id=")) out.id = a.slice("--id=".length);
    else if (a === "--id") out.id = rest.shift();
    else if (a.startsWith("--domain=")) out.domain = a.slice("--domain=".length);
    else if (a === "--domain") out.domain = rest.shift();
    else if (a.startsWith("--vertical=")) {
      const v = a.slice("--vertical=".length);
      out.vertical = v === "chr" ? "chr" : "generic";
    } else if (a === "--vertical") {
      const v = rest.shift();
      out.vertical = v === "chr" ? "chr" : "generic";
    } else if (a.startsWith("--icons-dir="))
      out.iconsDir = a.slice("--icons-dir=".length);
    else if (a === "--icons-dir") out.iconsDir = rest.shift();
    else {
      throw new Error(`Argument inconnu (brand): ${a}`);
    }
  }
  return out;
}

export function printBrandHelp(): void {
  console.log(`creezio brand — BrandSpec + apply

Usage:
  creezio brand init --id <id> --name <Name> --domain <host> [--out <dir>]
  creezio brand doctor [--spec <brand-spec-dir>]
  creezio brand apply --spec <brand-spec-dir> --out <app-dir> [--force] [--icons-dir <dir>]
  creezio brand apply-modules --spec <brand-spec-dir> --out <app-dir>
  creezio brand smoke --app <app-dir>

Notes:
  - BrandSpec = SoT déclarative (brand.yaml, product.md, modules/*)
  - apply réutilise le scaffold --from-prd (ProductModel) + pose brand-spec/
  - Icônes : --icons-dir ou <spec>/icons/{client,server}.png (pas le PNG 1×1)
  - apply-modules inventorie modules/*/prd.md et refuse d'écraser owned-by-brand
  - Runtime desktop = @creezio/app-runtime (startBrandDesktop)
`);
}

/**
 * Inventaire modules BrandSpec + garde-fous owned-by-brand.
 * Scaffold UI stubs uniquement si page absente (jamais écrase owned-by-brand).
 */
function applyBrandModules(specDir: string, appDir: string): {
  modules: string[];
  protectedFiles: string[];
  scaffoldedUi: string[];
  notes: string[];
} {
  const modulesDir = path.join(specDir, "modules");
  const modules: string[] = [];
  if (fs.existsSync(modulesDir)) {
    for (const name of fs.readdirSync(modulesDir)) {
      const prd = path.join(modulesDir, name, "prd.md");
      if (fs.existsSync(prd)) modules.push(name);
    }
  }
  modules.sort();

  const candidates = [
    "src/electron/brand-bonus-api.ts",
    "src/electron/brand-module-api.ts",
    "src/electron/brand-migrations.ts",
    "src/electron/vertical-slot.ts",
    "package.json",
  ];
  const protectedFiles: string[] = [];
  for (const rel of candidates) {
    const abs = path.join(appDir, rel);
    if (!fs.existsSync(abs)) continue;
    const raw = fs.readFileSync(abs, "utf8");
    if (
      raw.includes("creezio:owned-by-brand") ||
      (rel === "package.json" && /"ownedByBrand"\s*:\s*true/.test(raw))
    ) {
      protectedFiles.push(rel);
    }
  }

  const scaffoldedUi: string[] = [];
  for (const mod of modules) {
    const rel = `ui/app/${mod}/page.tsx`;
    const abs = path.join(appDir, rel);
    if (fs.existsSync(abs)) {
      const raw = fs.readFileSync(abs, "utf8");
      if (raw.includes("creezio:owned-by-brand")) {
        protectedFiles.push(rel);
      }
      continue;
    }
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    const title = mod.charAt(0).toUpperCase() + mod.slice(1);
    fs.writeFileSync(
      abs,
      `/** creezio:owned-by-brand */
"use client";

import { useEffect, useState } from "react";
import { metierBase } from "@/lib/metier-base";

/** Stub généré par \`creezio brand apply-modules\` — à enrichir métier. */
export default function Page() {
  const base = metierBase();
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetch(\`\${base}/api/v1/modules/${mod}\`)
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || res.statusText);
        setData(body);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [base]);

  return (
    <section>
      <h1>${title}</h1>
      <p>Module BrandSpec \`${mod}\` — scaffold apply-modules.</p>
      {error ? <p style={{ color: "#8b1e1e" }}>{error}</p> : null}
      <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.85rem" }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </section>
  );
}
`,
      "utf8",
    );
    scaffoldedUi.push(rel);
  }

  const inventoryPath = path.join(appDir, "brand-spec", "MODULES-INVENTORY.md");
  fs.mkdirSync(path.dirname(inventoryPath), { recursive: true });
  const body = [
    "# Modules BrandSpec (apply-modules)",
    "",
    `Généré: ${new Date().toISOString()}`,
    "",
    "## Modules déclarés",
    ...modules.map((m) => `- \`${m}\` ← modules/${m}/prd.md`),
    "",
    "## Fichiers protégés owned-by-brand (non écrasés)",
    ...protectedFiles.map((f) => `- \`${f}\``),
    "",
    "## UI scaffoldés (absents → créés)",
    ...(scaffoldedUi.length
      ? scaffoldedUi.map((f) => `- \`${f}\``)
      : ["- (aucun — pages déjà présentes)"]),
    "",
    "## Suite",
    "- Enrichir stubs UI + `brand-bonus-api.ts` sans retirer `creezio:owned-by-brand`",
    "- Ne jamais wipe avec `brand apply --force` sans markers",
    "",
  ].join("\n");
  fs.writeFileSync(inventoryPath, body, "utf8");

  const notes = [
    `inventory → ${path.relative(process.cwd(), inventoryPath)}`,
    `${modules.length} modules`,
    `${protectedFiles.length} fichiers protégés`,
    `${scaffoldedUi.length} UI scaffoldés`,
  ];
  return { modules, protectedFiles, scaffoldedUi, notes };
}

function kitRoot(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, "../../..");
}

function productModelFromSpec(specDir: string): ProductModel {
  const spec = loadBrandSpec(specDir);
  const productPath = path.join(spec.rootDir, "product.md");
  if (!fs.existsSync(productPath)) {
    throw new Error(
      `product.md requis pour apply (manquant sous ${spec.rootDir})`,
    );
  }
  const model = parseProductPrd(fs.readFileSync(productPath, "utf8"), {
    sourcePath: productPath,
    brandId: spec.brand.brandId,
    brandName: spec.brand.brandName,
  });
  model.brandId = safeBrandId(spec.brand.brandId);
  model.brandName = spec.brand.brandName;
  model.domain = spec.brand.domain;
  if (spec.brand.tagline) model.tagline = spec.brand.tagline;
  if (spec.brand.vertical) model.vertical = spec.brand.vertical;
  assertProductModel(model);
  return model;
}

function copyBrandSpecIntoApp(specDir: string, appDir: string, force: boolean): void {
  const dest = path.join(appDir, "brand-spec");
  if (fs.existsSync(dest) && !force) {
    // sync brand.yaml at least if missing modules
    return;
  }
  fs.mkdirSync(dest, { recursive: true });
  const copyRecursive = (src: string, dst: string) => {
    const st = fs.statSync(src);
    if (st.isDirectory()) {
      fs.mkdirSync(dst, { recursive: true });
      for (const name of fs.readdirSync(src)) {
        if (name === "node_modules" || name === ".git") continue;
        copyRecursive(path.join(src, name), path.join(dst, name));
      }
      return;
    }
    if (fs.existsSync(dst) && !force) return;
    fs.copyFileSync(src, dst);
  };
  // Si specDir est déjà app/brand-spec, rien à faire
  if (path.resolve(specDir) === path.resolve(dest)) return;
  copyRecursive(specDir, dest);
}

export async function runBrandCli(argv: string[]): Promise<void> {
  const args = parseBrandArgs(argv);
  if (args.help || !args.sub) {
    printBrandHelp();
    if (!args.sub) process.exit(args.help ? 0 : 1);
    return;
  }

  const root = kitRoot();

  if (args.sub === "init") {
    if (!args.id || !args.name || !args.domain) {
      printBrandHelp();
      throw new Error("brand init requiert --id --name --domain");
    }
    const brandId = safeBrandId(args.id);
    const outDir = path.resolve(
      args.out || path.join(root, "apps", brandId, "brand-spec"),
    );
    const result = initBrandSpec({
      outDir,
      brandId,
      brandName: args.name,
      domain: args.domain,
      vertical: args.vertical,
      force: Boolean(args.force),
    });
    console.log(`✓ BrandSpec init ${brandId}`);
    console.log(`  out     ${result.outDir}`);
    console.log(`  files   ${result.written.length}`);
    for (const f of result.written) {
      console.log(`    + ${path.relative(result.outDir, f)}`);
    }
    console.log("");
    console.log("Suite: remplir product.md + modules/, puis:");
    console.log(`  creezio brand doctor --spec ${result.outDir}`);
    console.log(
      `  creezio brand apply --spec ${result.outDir} --out ${path.dirname(result.outDir)} --force`,
    );
    return;
  }

  if (args.sub === "doctor") {
    const specDir = path.resolve(
      args.spec ||
        resolveBrandSpecDir(process.cwd()) ||
        path.join(process.cwd(), "brand-spec"),
    );
    const result = doctorBrandSpec(specDir);
    console.log(formatDoctorReport(result));
    if (!result.ok) process.exit(1);
    return;
  }

  if (args.sub === "apply") {
    if (!args.spec || !args.out) {
      printBrandHelp();
      throw new Error("brand apply requiert --spec et --out");
    }
    const specDir = path.resolve(args.spec);
    const outDir = path.resolve(args.out);
    const doctor = doctorBrandSpec(specDir);
    if (!doctor.ok) {
      console.log(formatDoctorReport(doctor));
      throw new Error("brand apply refusé: doctor en erreur");
    }
    const model = productModelFromSpec(specDir);
    const iconsDir =
      (args.iconsDir && path.resolve(args.iconsDir)) ||
      (fs.existsSync(path.join(specDir, "icons", "client.png")) ||
      fs.existsSync(path.join(specDir, "icons", "server.png"))
        ? path.join(specDir, "icons")
        : undefined);
    const result = scaffoldNewApp({
      brandId: model.brandId,
      productName: model.brandName,
      domain: model.domain,
      outDir,
      sandbox: doctor.spec?.brand.sandbox !== false,
      force: Boolean(args.force),
      kitRoot: root,
      iconsDir,
      productModel: model,
    });
    copyBrandSpecIntoApp(specDir, outDir, Boolean(args.force));
    console.log(`✓ brand apply ${result.manifest.brandId}`);
    console.log(`  out     ${result.outDir}`);
    console.log(`  files   ${result.writtenFiles.length}`);
    console.log(`  spec    ${path.join(outDir, "brand-spec")}`);
    console.log("");
    console.log("Suite:");
    console.log(`  cd ${result.outDir}`);
    console.log(`  npm run test:metier-parcours`);
    return;
  }

  if (args.sub === "apply-modules") {
    if (!args.spec || !args.out) {
      printBrandHelp();
      throw new Error("brand apply-modules requiert --spec et --out");
    }
    const specDir = path.resolve(args.spec);
    const outDir = path.resolve(args.out);
    if (!fs.existsSync(path.join(specDir, "brand.yaml")) && !fs.existsSync(path.join(specDir, "product.md"))) {
      throw new Error(`BrandSpec invalide: ${specDir}`);
    }
    const result = applyBrandModules(specDir, outDir);
    console.log(`✓ brand apply-modules`);
    console.log(`  modules ${result.modules.join(", ") || "(aucun)"}`);
    console.log(`  protected ${result.protectedFiles.length}`);
    console.log(`  scaffolded ${result.scaffoldedUi.length}`);
    for (const n of result.notes) console.log(`  ${n}`);
    return;
  }

  if (args.sub === "smoke") {
    const appDir = path.resolve(args.app || process.cwd());
    const smoke = path.join(appDir, "scripts/test-metier-parcours.mjs");
    if (!fs.existsSync(smoke)) {
      throw new Error(`smoke introuvable: ${smoke}`);
    }
    const r = spawnSync(process.execPath, [smoke], {
      cwd: appDir,
      encoding: "utf8",
      env: {
        ...process.env,
        CREEZIO_ROOT: root,
        NODE_PATH: path.join(root, "node_modules"),
        PATH: [
          path.join(root, "node_modules", ".bin"),
          process.env.PATH || "",
        ].join(path.delimiter),
      },
      timeout: 120000,
    });
    process.stdout.write(r.stdout || "");
    process.stderr.write(r.stderr || "");
    if (r.status !== 0) process.exit(r.status || 1);
    return;
  }

  throw new Error(
    `Sous-commande brand inconnue: ${args.sub} (init|doctor|apply|apply-modules|smoke)`,
  );
}
