/**
 * CLI `creezio new-app` — factory OS + app métier depuis PRD.
 *
 * Usage:
 *   creezio new-app --name DemoBrand --id demobrand --domain demobrand.creez.io
 *   creezio new-app --from-prd docs/experiences/tempoflow3/PRD-PRODUIT.md --out /tmp/tf3
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scaffoldNewApp, type NewAppOptions } from "./scaffold.js";
import {
  assertProductModel,
  parseProductPrd,
  safeBrandId,
  type ProductModel,
} from "./product-model.js";

export type CliArgs = {
  command: string;
  name?: string;
  id?: string;
  domain?: string;
  out?: string;
  envPrefix?: string;
  feedToken?: string;
  force?: boolean;
  sandbox?: boolean;
  help?: boolean;
  fromPrd?: string;
};

export function parseArgs(argv: string[]): CliArgs {
  const out: CliArgs = { command: "", sandbox: true };
  const rest = [...argv];
  out.command = rest.shift() || "";

  while (rest.length) {
    const a = rest.shift()!;
    if (a === "--help" || a === "-h") out.help = true;
    else if (a === "--force") out.force = true;
    else if (a === "--no-sandbox") out.sandbox = false;
    else if (a === "--sandbox") out.sandbox = true;
    else if (a.startsWith("--name=")) out.name = a.slice("--name=".length);
    else if (a === "--name") out.name = rest.shift();
    else if (a.startsWith("--id=")) out.id = a.slice("--id=".length);
    else if (a === "--id") out.id = rest.shift();
    else if (a.startsWith("--domain=")) out.domain = a.slice("--domain=".length);
    else if (a === "--domain") out.domain = rest.shift();
    else if (a.startsWith("--out=")) out.out = a.slice("--out=".length);
    else if (a === "--out") out.out = rest.shift();
    else if (a.startsWith("--env-prefix="))
      out.envPrefix = a.slice("--env-prefix=".length);
    else if (a === "--env-prefix") out.envPrefix = rest.shift();
    else if (a.startsWith("--feed-token="))
      out.feedToken = a.slice("--feed-token=".length);
    else if (a === "--feed-token") out.feedToken = rest.shift();
    else if (a.startsWith("--from-prd="))
      out.fromPrd = a.slice("--from-prd=".length);
    else if (a === "--from-prd") out.fromPrd = rest.shift();
    else throw new Error(`Argument inconnu: ${a}`);
  }
  return out;
}

function printHelp(): void {
  console.log(`creezio — factory kit Creezio

Usage:
  creezio new-app --from-prd <prd.md> [--out <dir>] [overrides]
  creezio new-app --name <ProductName> --id <brandId> --domain <host> [options]

Mode produit (recommandé) :
  --from-prd      Brief / PRD markdown non technique
                  Dérive name / id / domain ; génère métier + wiring OS

Overrides optionnels avec --from-prd :
  --name, --id, --domain, --out, --env-prefix, --feed-token, --sandbox/--no-sandbox, --force

Mode technique (squelette OS vide) :
  --name          Nom produit (ex. DemoBrand)
  --id            brandId court (ex. demobrand)
  --domain        Domaine feed/tunnel (ex. demobrand.creez.io)
  --out           Dossier cible (défaut: apps/<id> sous la racine kit)
  --env-prefix    Préfixe env (défaut: ID upper)
  --feed-token    Token /dl-<token>/ (défaut: sandbox déterministe)
  --sandbox       Marque sandbox (défaut: oui)
  --no-sandbox    Désactive le flag sandbox (rare)
  --force         Écrase les fichiers existants
  -h, --help      Aide

Exemples:
  creezio new-app --from-prd docs/experiences/tempoflow3/PRD-PRODUIT.md --out /tmp/tempoflow3
  creezio new-app --name DemoBrand --id demobrand --domain demobrand.creez.io
`);
}

function kitRoot(): string {
  // packages/factory/dist → ../../..
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, "../../..");
}

function loadProductModel(args: CliArgs, root: string): ProductModel {
  const prdPath = path.resolve(root, args.fromPrd!);
  if (!fs.existsSync(prdPath)) {
    // aussi accepter chemin absolu déjà résolu
    const abs = path.resolve(args.fromPrd!);
    if (!fs.existsSync(abs)) {
      throw new Error(`PRD introuvable: ${args.fromPrd}`);
    }
    return finalizeModel(parseProductPrd(fs.readFileSync(abs, "utf8"), {
      sourcePath: abs,
      brandId: args.id,
      brandName: args.name,
    }), args);
  }
  return finalizeModel(
    parseProductPrd(fs.readFileSync(prdPath, "utf8"), {
      sourcePath: prdPath,
      brandId: args.id,
      brandName: args.name,
    }),
    args,
  );
}

function finalizeModel(model: ProductModel, args: CliArgs): ProductModel {
  if (args.id) model.brandId = safeBrandId(args.id);
  if (args.name) model.brandName = args.name.trim();
  if (args.domain) model.domain = args.domain.trim();
  assertProductModel(model);
  return model;
}

export async function runCli(argv: string[]): Promise<void> {
  const args = parseArgs(argv);
  if (args.help || !args.command) {
    printHelp();
    if (!args.command) process.exit(args.help ? 0 : 1);
    return;
  }

  if (args.command !== "new-app") {
    throw new Error(`Commande inconnue: ${args.command} (seul new-app est supporté)`);
  }

  const root = kitRoot();
  let productModel: ProductModel | undefined;
  let brandId: string;
  let productName: string;
  let domain: string;

  if (args.fromPrd) {
    productModel = loadProductModel(args, root);
    brandId = productModel.brandId;
    productName = productModel.brandName;
    domain = args.domain?.trim() || productModel.domain;
  } else {
    if (!args.name || !args.id || !args.domain) {
      printHelp();
      throw new Error(
        "Soit --from-prd <file>, soit --name + --id + --domain sont requis",
      );
    }
    brandId = args.id;
    productName = args.name;
    domain = args.domain;
  }

  const outDir = path.resolve(
    args.out || path.join(root, "apps", brandId.trim().toLowerCase()),
  );

  const opts: NewAppOptions = {
    brandId,
    productName,
    domain,
    outDir,
    envPrefix: args.envPrefix,
    feedToken: args.feedToken,
    sandbox: args.sandbox !== false,
    force: Boolean(args.force),
    kitRoot: root,
    productModel,
  };

  const result = scaffoldNewApp(opts);
  console.log(`✓ AppManifest ${result.manifest.brandId}`);
  if (result.productModel) {
    console.log(`  from-prd     ${result.productModel.sourcePrdPath || args.fromPrd}`);
    console.log(
      `  entities     ${result.productModel.entities.map((e) => e.id).join(", ")}`,
    );
    console.log(
      `  pages        ${result.productModel.pages.map((p) => p.path).join(", ")}`,
    );
  }
  console.log(`  client GUID  ${result.manifest.client.nsisGuid}`);
  console.log(`  server GUID  ${result.manifest.server.nsisGuid}`);
  console.log(`  feed client  ${result.manifest.client.feedUrl}`);
  console.log(`  out          ${result.outDir}`);
  console.log(`  files        ${result.writtenFiles.length}`);
  for (const f of result.writtenFiles) {
    console.log(`    + ${path.relative(result.outDir, f)}`);
  }
  console.log("");
  console.log("Suite:");
  if (result.productModel) {
    console.log(`  cd ${result.outDir}`);
    console.log(`  npm run test:metier-parcours`);
    console.log(`  npm run test:first-run-auth`);
    console.log(`  npm run metier:api   # API locale métier`);
  } else {
    console.log(`  cd ${result.outDir} && npm install && npm run build`);
    console.log(
      `  npm run desktop:publish -- --brand=${result.manifest.brandId} --dry-run`,
    );
  }
}
