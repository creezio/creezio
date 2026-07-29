/**
 * CLI `creezio new-app` — factory Phase D.
 *
 * Usage:
 *   creezio new-app --name DemoBrand --id demobrand --domain demobrand.creez.io
 *   npm run factory:new-app -- --name DemoBrand --id demobrand
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { scaffoldNewApp, type NewAppOptions } from "./scaffold.js";

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
    else throw new Error(`Argument inconnu: ${a}`);
  }
  return out;
}

function printHelp(): void {
  console.log(`creezio — factory kit Creezio

Usage:
  creezio new-app --name <ProductName> --id <brandId> --domain <host> [options]

Options:
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

Équivalent npm:
  npm run factory:new-app -- --name DemoBrand --id demobrand --domain demobrand.creez.io
`);
}

function kitRoot(): string {
  // packages/factory/dist → ../../
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, "../../..");
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

  if (!args.name || !args.id || !args.domain) {
    printHelp();
    throw new Error("--name, --id et --domain sont requis");
  }

  const root = kitRoot();
  const outDir = path.resolve(
    args.out || path.join(root, "apps", args.id.trim().toLowerCase()),
  );

  const opts: NewAppOptions = {
    brandId: args.id,
    productName: args.name,
    domain: args.domain,
    outDir,
    envPrefix: args.envPrefix,
    feedToken: args.feedToken,
    sandbox: args.sandbox !== false,
    force: Boolean(args.force),
    kitRoot: root,
  };

  const result = scaffoldNewApp(opts);
  console.log(`✓ AppManifest ${result.manifest.brandId}`);
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
  console.log(`  cd ${result.outDir} && npm install && npm run build`);
  console.log(
    `  npm run desktop:publish -- --brand=${result.manifest.brandId} --dry-run`,
  );
}
