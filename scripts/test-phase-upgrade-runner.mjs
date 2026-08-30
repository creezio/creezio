#!/usr/bin/env node
/**
 * Gate P3.a — runner de montée de version `creezio upgrade`.
 *
 * Contrat (packages/factory/src/upgrade-cli.ts + scripts/codemods/README.md) :
 *   U1. `creezio upgrade --dry-run` sur un scaffold factory FRAIS = no-op
 *       explicite (architecture courante = cible, manifests alignés) ;
 *   U2. sur une fixture simulant un retard multi-versions (marqueur H7,
 *       fichier legacy pré-H9), le dry-run liste LA CHAÎNE des codemods
 *       intermédiaires DANS L'ORDRE (H8 puis H9) ;
 *   U3. l'application réelle migre la fixture (types.ts → ré-export kit,
 *       marqueur re-stampé) en PROUVANT l'idempotence de chaque pas, et un
 *       second `upgrade` complet est un no-op.
 *
 * Offline : scaffold avec CREEZIO_SKIP_BRAND_DIST=1 + --no-push ; la fixture
 * multi-versions a des manifests déjà alignés sur le lockstep courant (aucun
 * bump ⇒ aucune régénération de lock ⇒ zéro réseau).
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

const LOCKSTEP = JSON.parse(
  fs.readFileSync(path.join(ROOT, "packages/platform-core/package.json"), "utf8"),
).version;

function runUpgrade(brandRoot, extra = []) {
  return spawnSync(
    process.execPath,
    [CLI, "upgrade", "--brand-root", brandRoot, ...extra],
    { encoding: "utf8", cwd: ROOT, timeout: 120_000 },
  );
}

/** Fixture minimale « repo marque en retard » (sans brand.yaml → doctor skip explicite). */
function makeLaggingFixture(work) {
  const modulesDir = path.join(work, "server/src/electron/modules");
  fs.mkdirSync(modulesDir, { recursive: true });
  fs.writeFileSync(
    path.join(work, "package.json"),
    JSON.stringify(
      {
        name: "updoc",
        private: true,
        creezio: { brandId: "updoc", layout: "monorepo", architectureVersion: "H7" },
        workspaces: ["server"],
      },
      null,
      2,
    ) + "\n",
  );
  fs.writeFileSync(
    path.join(work, "server/package.json"),
    JSON.stringify(
      {
        name: "updoc-server",
        dependencies: { "@creezio/platform-core": `^${LOCKSTEP}` },
      },
      null,
      2,
    ) + "\n",
  );
  // Copie locale legacy du contrat de module (état pré-H9) — cible du codemod H9.
  fs.writeFileSync(
    path.join(modulesDir, "types.ts"),
    `export type BrandModuleDef = {
  id: string;
  apiMounts?: Record<string, unknown>;
  navItems?: unknown[];
};
`,
  );
  return { modulesDir };
}

test("U1 dry-run sur scaffold factory frais = no-op explicite", () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "creezio-upgrade-fresh-"));
  const scaffold = spawnSync(
    process.execPath,
    [
      CLI,
      "new-app",
      "--name",
      "UpDoc",
      "--id",
      "updoc",
      "--domain",
      "updoc.local",
      "--out",
      path.join(out, "updoc"),
      "--no-push",
      "--force",
    ],
    {
      encoding: "utf8",
      cwd: ROOT,
      timeout: 120_000,
      env: { ...process.env, CREEZIO_SKIP_BRAND_DIST: "1" },
    },
  );
  assert.equal(scaffold.status, 0, scaffold.stderr || scaffold.stdout);

  // Le scaffold stampe le marqueur de version d'architecture (SoT détection).
  const rootPkg = JSON.parse(
    fs.readFileSync(path.join(out, "updoc/package.json"), "utf8"),
  );
  assert.match(
    String(rootPkg.creezio?.architectureVersion || ""),
    /^H\d+$/,
    "scaffold : creezio.architectureVersion stampé",
  );

  const r = runUpgrade(path.join(out, "updoc"), ["--dry-run"]);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout, /no-op/, r.stdout);
  assert.match(r.stdout, new RegExp(`\\^${LOCKSTEP.replaceAll(".", "\\.")}`));
  fs.rmSync(out, { recursive: true, force: true });
});

test("U2 fixture multi-versions : dry-run liste la chaîne H8 puis H9 dans l'ordre", () => {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "creezio-upgrade-lag-"));
  makeLaggingFixture(work);

  const r = runUpgrade(work, ["--dry-run"]);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout, /architecture : H7 → H\d+/);
  const h8 = r.stdout.indexOf("→ H8/");
  const h9 = r.stdout.indexOf("→ H9/");
  assert.ok(h8 !== -1, `chaîne sans H8 :\n${r.stdout}`);
  assert.ok(h9 !== -1, `chaîne sans H9 :\n${r.stdout}`);
  assert.ok(h8 < h9, `H8 doit précéder H9 :\n${r.stdout}`);
  assert.doesNotMatch(r.stdout, /→ H7\//, "H7 (déjà appliqué) hors chaîne");

  // Dry-run = rien n'est écrit.
  const pkg = JSON.parse(fs.readFileSync(path.join(work, "package.json"), "utf8"));
  assert.equal(pkg.creezio.architectureVersion, "H7");
  fs.rmSync(work, { recursive: true, force: true });
});

test("U3 application réelle : chaîne migrée, idempotence prouvée, re-run = no-op", () => {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "creezio-upgrade-apply-"));
  const { modulesDir } = makeLaggingFixture(work);

  const r = runUpgrade(work, ["--no-install"]);
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout, /codemod H8\//);
  assert.match(r.stdout, /codemod H9\//);
  assert.match(r.stdout, /doctor : pas de brand\.yaml/, r.stdout);
  assert.match(r.stdout, /✓ upgrade terminé/);

  // Le codemod H9 a bien remplacé la copie locale par le ré-export kit.
  const types = fs.readFileSync(path.join(modulesDir, "types.ts"), "utf8");
  assert.match(types, /from "@creezio\/app-runtime"/);
  assert.doesNotMatch(types, /type BrandModuleDef\s*=\s*\{/);

  // Marqueur re-stampé à la cible.
  const pkg = JSON.parse(fs.readFileSync(path.join(work, "package.json"), "utf8"));
  assert.match(String(pkg.creezio.architectureVersion), /^H\d+$/);
  assert.notEqual(pkg.creezio.architectureVersion, "H7");

  // Un second upgrade complet est un no-op vert.
  const again = runUpgrade(work, ["--no-install"]);
  assert.equal(again.status, 0, again.stderr || again.stdout);
  assert.match(again.stdout, /no-op/, again.stdout);
  fs.rmSync(work, { recursive: true, force: true });
});
