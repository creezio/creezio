#!/usr/bin/env node
/**
 * Sonde E2E CREATE-BRAND — init → doctor → apply → smoke façade.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLI = path.join(ROOT, "packages/factory/bin/creezio.js");
const SMOKE_ENV = {
  ...process.env,
  CREEZIO_ROOT: ROOT,
  // Gates structurelles : pas de vendor/lock Docker (layout node_modules tmp).
  CREEZIO_SKIP_BRAND_DIST: "1",
  NODE_PATH: path.join(ROOT, "node_modules"),
  PATH: [
    path.join(ROOT, "node_modules", ".bin"),
    process.env.PATH || "",
  ].join(path.delimiter),
};

function runCli(args, opts = {}) {
  return spawnSync(process.execPath, [CLI, ...args], {
    encoding: "utf8",
    cwd: ROOT,
    env: SMOKE_ENV,
    ...opts,
  });
}

test("CB1 help brand documente init/doctor/apply/smoke", () => {
  const r = runCli(["brand", "--help"]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /brand init/);
  assert.match(r.stdout, /brand doctor/);
  assert.match(r.stdout, /brand apply/);
  assert.match(r.stdout, /startBrandDesktop/);
});

test("CB2 init → doctor → apply → main façade", () => {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "create-brand-"));
  const specDir = path.join(work, "brand-spec");
  const appDir = path.join(work, "app");

  const init = runCli([
    "brand",
    "init",
    "--id",
    "probebrand",
    "--name",
    "ProbeBrand",
    "--domain",
    "probebrand.local",
    "--vertical",
    "generic",
    "--out",
    specDir,
    "--force",
  ]);
  assert.equal(init.status, 0, init.stderr + "\n" + init.stdout);
  assert.ok(fs.existsSync(path.join(specDir, "brand.yaml")));

  // product.md minimal avec indices parseProductPrd
  fs.writeFileSync(
    path.join(specDir, "product.md"),
    `# ProbeBrand

Gestion simple d'articles.

## Utilisateurs

- Opérateurs

## Parcours

1. Créer un article
2. Consulter la liste

## Entités

### Articles
- nom (texte)
- prix (nombre)

## Plateforme

Desktop Creezio.
`,
    "utf8",
  );

  const doctor = runCli(["brand", "doctor", "--spec", specDir]);
  assert.equal(doctor.status, 0, doctor.stderr + "\n" + doctor.stdout);

  const apply = runCli([
    "brand",
    "apply",
    "--spec",
    specDir,
    "--out",
    appDir,
    "--force",
  ]);
  assert.equal(apply.status, 0, apply.stderr + "\n" + apply.stdout);
  // Layout monorepo : métier sous server/, client thin sous client/ ;
  // admin flotte = repo dédié frère `<app>-admin` (factory 2-repos).
  const serverDir = path.join(appDir, "server");
  assert.ok(fs.existsSync(path.join(serverDir, "src/electron/main.ts")));
  assert.ok(fs.existsSync(path.join(appDir, "client/src/electron/main.ts")));
  assert.ok(fs.existsSync(path.join(`${appDir}-admin`, "server-admin.json")));
  assert.ok(!fs.existsSync(path.join(appDir, "admin")));
  assert.ok(fs.existsSync(path.join(appDir, "brand-spec/brand.yaml")));
  assert.ok(
    fs.existsSync(
      path.join(serverDir, "plugins/insights-assistant/manifest.json"),
    ),
    "brand apply doit installer server/plugins/insights-assistant",
  );

  const main = fs.readFileSync(
    path.join(serverDir, "src/electron/main.ts"),
    "utf8",
  );
  assert.match(main, /startBrandDesktop/);
  assert.doesNotMatch(main, /listenBrandKernelHttp/);

  const clientMain = fs.readFileSync(
    path.join(appDir, "client/src/electron/main.ts"),
    "utf8",
  );
  assert.match(clientMain, /startBrandDesktop/);
  assert.doesNotMatch(
    clientMain,
    /from "\.\/(brand-migrations|brand-module-api|vertical-slot)/,
  );

  // Socle registre modules (même standard que TempoFlow3).
  assert.ok(
    fs.existsSync(path.join(serverDir, "src/electron/modules/index.ts")),
  );
  assert.match(
    fs.readFileSync(
      path.join(serverDir, "src/electron/brand-module-api.ts"),
      "utf8",
    ),
    /collectEntitySpecs/,
  );
  assert.match(
    fs.readFileSync(
      path.join(serverDir, "src/electron/brand-migrations.ts"),
      "utf8",
    ),
    /collectModuleMigrations/,
  );
  assert.match(
    fs.readFileSync(path.join(appDir, "AGENTS.md"), "utf8"),
    /BrandModuleDef/,
  );

  // brand module init branche sans refactor des consommateurs.
  const modInit = runCli([
    "brand",
    "module",
    "init",
    "clients",
    "--app",
    appDir,
    "--force",
  ]);
  assert.equal(modInit.status, 0, modInit.stderr + "\n" + modInit.stdout);
  assert.ok(
    fs.existsSync(path.join(serverDir, "src/electron/modules/clients.ts")),
  );
  assert.match(
    fs.readFileSync(
      path.join(serverDir, "src/electron/modules/index.ts"),
      "utf8",
    ),
    /clientsModule/,
  );
  // Gate colocalisée (DOC-STANDARD-MODULE : 5ᵉ fichier) + runner découvert.
  const gatePath = path.join(appDir, "brand-spec/modules/clients/gate.mjs");
  assert.ok(fs.existsSync(gatePath), "gate.mjs colocalisée non scaffoldée");
  assert.ok(
    fs.existsSync(path.join(serverDir, "scripts/run-module-gates.mjs")),
    "runner run-module-gates.mjs non scaffoldé",
  );
  const serverPkg = JSON.parse(
    fs.readFileSync(path.join(serverDir, "package.json"), "utf8"),
  );
  assert.ok(
    serverPkg.scripts?.["test:modules"],
    "script test:modules absent du package.json scaffoldé",
  );
  const gate = spawnSync(process.execPath, [gatePath], {
    encoding: "utf8",
    cwd: serverDir,
    env: SMOKE_ENV,
  });
  assert.equal(gate.status, 0, gate.stderr + "\n" + gate.stdout);

  const firstRun = spawnSync(
    process.execPath,
    [path.join(serverDir, "scripts/test-first-run-auth.mjs")],
    { encoding: "utf8", cwd: serverDir, env: SMOKE_ENV },
  );
  assert.equal(firstRun.status, 0, firstRun.stderr + "\n" + firstRun.stdout);
});
