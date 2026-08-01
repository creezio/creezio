#!/usr/bin/env node
/**
 * Gate expérience F5 — simulation agent « un prompt produit ».
 * Input = PROMPT-PRODUIT + PRD uniquement ; assert fichiers métier + smoke.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PROMPT = path.join(
  ROOT,
  "docs/experiences/tempoflow3/PROMPT-PRODUIT.md",
);
const PRD = path.join(ROOT, "docs/experiences/tempoflow3/PRD-PRODUIT.md");
const CLI = path.join(ROOT, "packages/factory/bin/creezio.js");

test("expérience: PROMPT-PRODUIT reste non technique", () => {
  const body = fs.readFileSync(PROMPT, "utf8");
  // Seul le bloc collable à l'agent doit rester non technique.
  const block = body.match(/```text\n([\s\S]*?)```/)?.[1] || "";
  assert.ok(block.length > 80, "bloc ```text``` du prompt manquant");
  assert.doesNotMatch(block, /host-stack|sync-vendor|P0–P12|allowlist|brand-runtime/i);
  assert.match(block, /fournisseurs/);
  assert.match(block, /PRD-PRODUIT/);
});

test("expérience: dry-run agent = new-app --from-prd seulement", () => {
  // L'agent produit n'a qu'une commande à connaître.
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), "tf3-experience-"));
  const r = spawnSync(
    process.execPath,
    [CLI, "new-app", "--from-prd", PRD, "--out", outDir, "--force"],
    { encoding: "utf8", cwd: ROOT },
  );
  assert.equal(r.status, 0, r.stderr);

  const model = JSON.parse(
    fs.readFileSync(path.join(outDir, "product-model.json"), "utf8"),
  );
  assert.equal(model.brandId, "tempoflow3");
  assert.ok(model.entities.some((e) => e.id === "fournisseurs"));
  assert.ok(model.entities.some((e) => e.id === "commandes"));

  assert.ok(
    fs.existsSync(path.join(outDir, "src/electron/brand-runtime.ts")),
    "runtime natif manquant",
  );
  assert.ok(!fs.existsSync(path.join(outDir, "scripts/metier-api.mjs")));

  const smoke = spawnSync(
    process.execPath,
    [path.join(outDir, "scripts/test-metier-parcours.mjs")],
    {
      encoding: "utf8",
      cwd: outDir,
      timeout: 120000,
      env: {
        ...process.env,
        CREEZIO_ROOT: ROOT,
        NODE_PATH: path.join(ROOT, "node_modules"),
        PATH: [
          path.join(ROOT, "node_modules", ".bin"),
          process.env.PATH || "",
        ].join(path.delimiter),
      },
    },
  );
  assert.equal(smoke.status, 0, smoke.stderr + "\n" + smoke.stdout);
  console.log("expérience 5/5: brief → app → parcours kernel OK");
});
