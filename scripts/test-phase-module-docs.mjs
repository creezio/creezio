#!/usr/bin/env node
/**
 * Gate module-docs — standard module (docs/DOC-STANDARD-MODULE.md).
 *
 * Pour chaque `modules/<id>/` non-template des périmètres connus :
 *   1. les 4 fichiers du contrat sont présents et non vides
 *      (prd.md, interview.md, TODO.md, CHANGELOG.md) ;
 *   2. prd.md / interview.md portent les sections normalisées ;
 *   3. TODO.md est bien formé : statuts valides, claims datés pour
 *      [in-progress]/[blocked], ligne `done:` datée pour [done].
 *
 * Périmètres :
 *   - kit : `packages/admin/modules/` (modules admin natifs) ;
 *   - marque sonde TF3 : `<root>/brand-spec/modules/` (skip si absente) ;
 *   - repo admin sonde : `<root sibling>/tempoflow-admin/admin-spec/modules/`
 *     (skip si absent).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { resolveProbeBrandRoot } from "./lib/resolve-probe-brand.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REQUIRED_FILES = ["prd.md", "interview.md", "TODO.md", "CHANGELOG.md"];
const VALID_STATUSES = new Set(["todo", "in-progress", "blocked", "done"]);
const PRD_SECTIONS = ["## Vision", "## Modèle de données", "## API", "## UI"];
const INTERVIEW_SECTIONS = ["## 1.", "## 2.", "## 3.", "## 4.", "## 9."];

/** `modules/<id>/` non-template d'une racine modules. */
function listModuleDirs(modulesRoot) {
  if (!fs.existsSync(modulesRoot)) return [];
  return fs
    .readdirSync(modulesRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== "_template")
    .map((e) => e.name)
    .sort();
}

/** Erreurs de forme d'un TODO.md (statuts, claims datés, done daté). */
function lintTodo(raw) {
  const errors = [];
  const headings = [...raw.matchAll(/^### \[([^\]]*)\] +(\S+) — /gm)];
  const invalidBrackets = [...raw.matchAll(/^### \[([^\]]*)\](?! +\S+ — )/gm)];
  for (const m of invalidBrackets) {
    errors.push(`en-tête de tâche mal formé: "${m[0].trim()}" (attendu: ### [statut] <ID> — titre)`);
  }
  // Découpage en blocs de tâche pour vérifier claim/done par tâche.
  const blocks = raw.split(/^### /m).slice(1);
  for (const block of blocks) {
    const head = block.split("\n", 1)[0];
    const m = head.match(/^\[([^\]]*)\] +(\S+) — /);
    if (!m) continue; // déjà signalé ci-dessus
    const [, status, id] = m;
    if (!VALID_STATUSES.has(status)) {
      errors.push(`statut invalide "[${status}]" (tâche ${id}) — valides: todo|in-progress|blocked|done`);
      continue;
    }
    if (status === "in-progress" || status === "blocked") {
      if (!/^- claim: \S+ \d{4}-\d{2}-\d{2}\s*$/m.test(block)) {
        errors.push(`tâche ${id} [${status}] sans ligne "- claim: <agent> <YYYY-MM-DD>"`);
      }
    }
    if (status === "done" && !/^- done: \d{4}-\d{2}-\d{2}\s*$/m.test(block)) {
      errors.push(`tâche ${id} [done] sans ligne "- done: <YYYY-MM-DD>"`);
    }
  }
  if (!headings.length && !blocks.length) {
    // TODO vide de tâches : toléré (module sans dette connue) si non vide.
    if (!raw.trim()) errors.push("TODO.md vide");
  }
  return errors;
}

/** Erreurs du contrat 4 fichiers pour un module donné. */
function lintModule(moduleDir) {
  const errors = [];
  for (const name of REQUIRED_FILES) {
    const file = path.join(moduleDir, name);
    if (!fs.existsSync(file)) {
      errors.push(`fichier manquant: ${name}`);
      continue;
    }
    const raw = fs.readFileSync(file, "utf8");
    if (!raw.trim()) {
      errors.push(`fichier vide: ${name}`);
      continue;
    }
    if (name === "prd.md") {
      for (const s of PRD_SECTIONS) {
        if (!raw.includes(s)) errors.push(`prd.md sans section "${s}"`);
      }
    }
    if (name === "interview.md") {
      for (const s of INTERVIEW_SECTIONS) {
        if (!raw.includes(s)) errors.push(`interview.md sans section "${s}"`);
      }
    }
    if (name === "TODO.md") errors.push(...lintTodo(raw));
  }
  return errors;
}

/** Périmètres à vérifier : [label, racine modules, requis?]. */
function scopes() {
  const out = [];
  out.push({
    label: "kit packages/admin",
    modulesRoot: path.join(ROOT, "packages/admin/modules"),
    required: true,
  });
  const tf3 = resolveProbeBrandRoot(ROOT);
  if (tf3) {
    out.push({
      label: "tempoflow3 brand-spec",
      modulesRoot: path.join(tf3, "brand-spec/modules"),
      required: true,
    });
    const adminRoot = [
      process.env.CREEZIO_TEMPOFLOW_ADMIN_ROOT,
      path.resolve(tf3, "../tempoflow-admin"),
    ].filter(Boolean).find((p) => fs.existsSync(p));
    if (adminRoot) {
      out.push({
        label: "tempoflow-admin admin-spec",
        modulesRoot: path.join(adminRoot, "admin-spec/modules"),
        required: false,
      });
    }
  }
  return out;
}

for (const scope of scopes()) {
  const modules = listModuleDirs(scope.modulesRoot);

  test(`module-docs ${scope.label} — périmètre`, () => {
    if (scope.required) {
      assert.ok(
        fs.existsSync(scope.modulesRoot),
        `racine modules absente: ${scope.modulesRoot}`,
      );
      assert.ok(
        modules.length >= 1,
        `aucun module documenté sous ${scope.modulesRoot} (standard DOC-STANDARD-MODULE.md)`,
      );
    }
  });

  for (const id of modules) {
    test(`module-docs ${scope.label} — ${id}`, () => {
      const errors = lintModule(path.join(scope.modulesRoot, id));
      assert.deepEqual(
        errors,
        [],
        `${scope.label}/${id} :\n  ${errors.join("\n  ")}\n(contrat: docs/DOC-STANDARD-MODULE.md)`,
      );
    });
  }
}
