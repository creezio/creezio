#!/usr/bin/env node
/**
 * Gate P1.a — manifests marque alignés (`@creezio/*`).
 *
 * Une marque générée porte des deps `@creezio/*` dans PLUSIEURS manifests
 * (`server/package.json`, `server/ui/package.json`, `client/package.json`).
 * Un bump partiel entre eux = CI verte, deploy vert, mais ancienne page
 * os-ui servie (incident réel login 0.6.0 — docs/PROPAGATION.md « Règle
 * d'or du bump côté apps »).
 *
 * Contrats gravés ici :
 *   1. le scaffold factory (`brand create`) génère des manifests dont TOUTES
 *      les specs `@creezio/*` sont identiques (lockstep `creezioDepSpec`) ;
 *   2. le doctor brand-spec (`doctorAppBrandSpec`) échoue fail-closed
 *      (`CREEZIO_MANIFEST_MISALIGNED`, level error) sur une app désalignée,
 *      et reste vert sur une app alignée.
 *
 * Prérequis : `packages/brand-spec/dist` buildé (npm run build:packages).
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
  CREEZIO_KIT_ROOT: ROOT,
  CREEZIO_SKIP_BRAND_DIST: "1",
  NODE_PATH: path.join(ROOT, "node_modules"),
};

/** Manifests d'une app marque susceptibles de porter des deps @creezio/*. */
const MANIFEST_RELS = [
  "package.json",
  "server/package.json",
  "server/ui/package.json",
  "client/package.json",
];

function collectCreezioSpecs(appDir) {
  const found = [];
  for (const rel of MANIFEST_RELS) {
    const p = path.join(appDir, rel);
    if (!fs.existsSync(p)) continue;
    const pkg = JSON.parse(fs.readFileSync(p, "utf8"));
    const merged = { ...pkg.dependencies, ...pkg.devDependencies };
    const specs = Object.fromEntries(
      Object.entries(merged).filter(([name]) => name.startsWith("@creezio/")),
    );
    if (Object.keys(specs).length) found.push({ rel, specs });
  }
  return found;
}

test("MA1 scaffold brand create — specs @creezio/* identiques dans tous les manifests", () => {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "creezio-manifest-align-"));
  const appDir = path.join(work, "acme");
  const r = spawnSync(
    process.execPath,
    [
      CLI, "brand", "create",
      "--id", "acme",
      "--name", "Acme",
      "--domain", "acme.local",
      "--out", appDir,
      "--force", "--no-push",
    ],
    { encoding: "utf8", cwd: ROOT, env: SMOKE_ENV },
  );
  assert.equal(r.status, 0, r.stderr + "\n" + r.stdout);

  const manifests = collectCreezioSpecs(appDir);
  assert.ok(
    manifests.length >= 3,
    `au moins server + server/ui + client attendus avec deps @creezio/* — trouvé : ${manifests.map((m) => m.rel).join(", ") || "(aucun)"}`,
  );
  assert.ok(
    manifests.some((m) => m.rel === "server/ui/package.json"),
    "server/ui/package.json sans deps @creezio/* — scaffold os-ui cassé",
  );

  const distinct = new Map(); // spec -> [ "rel:pkg", … ]
  for (const { rel, specs } of manifests) {
    for (const [name, spec] of Object.entries(specs)) {
      distinct.set(spec, [...(distinct.get(spec) ?? []), `${rel} → ${name}`]);
    }
  }
  assert.equal(
    distinct.size,
    1,
    `specs @creezio/* divergentes au scaffold (bump partiel garanti dès la naissance) :\n` +
      [...distinct.entries()]
        .map(([spec, uses]) => `  ${spec}\n    ${uses.slice(0, 5).join("\n    ")}${uses.length > 5 ? `\n    … (${uses.length} au total)` : ""}`)
        .join("\n") +
      `\n→ corriger la factory (creezioDepSpec est la SoT lockstep, packages/factory/src/kit-release.ts).`,
  );
  fs.rmSync(work, { recursive: true, force: true });
});

test("MA2 doctor — CREEZIO_MANIFEST_MISALIGNED fail-closed sur bump partiel", async () => {
  const { doctorAppBrandSpec } = await import(
    "../packages/brand-spec/dist/index.js"
  );

  const work = fs.mkdtempSync(path.join(os.tmpdir(), "creezio-manifest-doctor-"));
  const appDir = path.join(work, "acme");
  // App minimale : brand-spec + deux manifests portant @creezio/os-ui.
  fs.mkdirSync(path.join(appDir, "brand-spec/modules"), { recursive: true });
  fs.writeFileSync(
    path.join(appDir, "brand-spec/brand.yaml"),
    'brandId: acme\nbrandName: Acme\ndomain: acme.local\n',
  );
  fs.writeFileSync(path.join(appDir, "brand-spec/product.md"), "# Acme\nProduit.\n");
  fs.mkdirSync(path.join(appDir, "server/ui"), { recursive: true });
  const writeManifest = (rel, spec) =>
    fs.writeFileSync(
      path.join(appDir, rel),
      JSON.stringify(
        {
          name: rel === "server/package.json" ? "acme-server" : "@creezio/brand-ui",
          dependencies: { "@creezio/os-ui": spec, "@creezio/platform-core": "^0.10.14" },
        },
        null,
        2,
      ),
    );

  // Désaligné : os-ui bumpé côté serveur seulement (scénario incident 0.6.0).
  writeManifest("server/package.json", "^0.10.14");
  writeManifest("server/ui/package.json", "^0.6.0");
  const bad = doctorAppBrandSpec(appDir);
  const misaligned = bad.issues.filter((i) => i.code === "CREEZIO_MANIFEST_MISALIGNED");
  assert.equal(
    misaligned.length,
    1,
    `doctor devait rapporter 1 CREEZIO_MANIFEST_MISALIGNED (os-ui), issues : ${JSON.stringify(bad.issues)}`,
  );
  assert.equal(misaligned[0].level, "error", "désalignement = error (fail-closed), pas warn");
  assert.match(misaligned[0].message, /@creezio\/os-ui/);
  assert.match(misaligned[0].message, /PROPAGATION/);
  assert.equal(bad.ok, false, "doctor.ok doit être false sur app désalignée");

  // Aligné : plus d'issue de désalignement (les autres codes, ex. NO_MODULES,
  // ne concernent pas cette gate).
  writeManifest("server/ui/package.json", "^0.10.14");
  const good = doctorAppBrandSpec(appDir);
  assert.equal(
    good.issues.filter((i) => i.code === "CREEZIO_MANIFEST_MISALIGNED").length,
    0,
    `faux positif : app alignée signalée désalignée — ${JSON.stringify(good.issues)}`,
  );
  fs.rmSync(work, { recursive: true, force: true });
});

test("MA3 source — le check est câblé dans doctorBrandSpec (anti-régression)", () => {
  const src = fs.readFileSync(
    path.join(ROOT, "packages/brand-spec/src/doctor.ts"),
    "utf8",
  );
  assert.match(src, /CREEZIO_MANIFEST_MISALIGNED/, "code finding retiré de doctor.ts");
  assert.match(
    src,
    /doctorCreezioManifestAlignment\(spec\.rootDir, issues\)/,
    "doctorCreezioManifestAlignment n'est plus appelé par doctorBrandSpec",
  );
});
