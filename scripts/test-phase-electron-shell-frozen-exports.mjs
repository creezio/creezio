#!/usr/bin/env node
/**
 * Gate P1.b — la surface de ré-exports @deprecated d'electron-shell est FIGÉE.
 *
 * Depuis P1.b, le host Node pur vit dans `@creezio/host-runtime` et le
 * sous-domaine Meili dans `@creezio/search`. `@creezio/electron-shell`
 * ré-exporte l'existant (compat des imports historiques kit/marques/factory),
 * mais cette surface ne doit plus JAMAIS grandir :
 *
 *   - tout NOUVEAU symbole host s'exporte depuis son package SoT
 *     (`@creezio/host-runtime` / `@creezio/search` / `@creezio/platform-core`),
 *     jamais via electron-shell → une addition ici est ROUGE ;
 *   - une suppression est un breaking change (les marques importent encore via
 *     electron-shell) → ROUGE aussi, à traiter en major + codemod.
 *
 * Snapshot SoT : scripts/electron-shell-frozen-exports.json (index + meili).
 * `export *` depuis les packages extraits est interdit (exposerait
 * silencieusement chaque nouveau symbole).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SNAPSHOT = path.join(ROOT, "scripts/electron-shell-frozen-exports.json");
const INDEX = path.join(ROOT, "packages/electron-shell/src/index.ts");
const MEILI = path.join(ROOT, "packages/electron-shell/src/meili.ts");
const COMPAT_MARKER = "Ré-exports compat P1.b — FIGÉS";

/** Sources de ré-export compat autorisées. */
const COMPAT_SOURCES_RE = /^@creezio\/(host-runtime|search|platform-core)$/;

/**
 * Extrait les noms exportés des `export {…} from "@creezio/…"` d'un source
 * (alias `as` → nom public ; `type` accepté).
 */
function extractReexports(src) {
  const names = [];
  const re = /export\s+(?:type\s+)?\{([^}]*)\}\s*from\s*"(@creezio\/[a-z-]+)"/g;
  for (const m of src.matchAll(re)) {
    if (!COMPAT_SOURCES_RE.test(m[2])) continue;
    for (let part of m[1].split(",")) {
      part = part.trim().replace(/^type\s+/, "");
      if (!part) continue;
      const mm = /^([A-Za-z0-9_$]+)(?:\s+as\s+([A-Za-z0-9_$]+))?$/.exec(part);
      assert.ok(mm, `spécificateur d'export illisible: ${JSON.stringify(part)}`);
      names.push(mm[2] || mm[1]);
    }
  }
  return names.sort();
}

function diff(current, frozen) {
  const cur = new Set(current);
  const froz = new Set(frozen);
  return {
    added: current.filter((n) => !froz.has(n)),
    removed: frozen.filter((n) => !cur.has(n)),
  };
}

const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT, "utf8"));

test("frozen-exports — marqueur compat présent + pas d'export * compat", () => {
  const idx = fs.readFileSync(INDEX, "utf8");
  assert.ok(
    idx.includes(COMPAT_MARKER),
    `marqueur ${JSON.stringify(COMPAT_MARKER)} absent de electron-shell/src/index.ts`,
  );
  for (const file of [INDEX, MEILI]) {
    const src = fs.readFileSync(file, "utf8");
    const star = src.match(
      /export\s+\*\s+from\s*"@creezio\/(host-runtime|search|platform-core)"/,
    );
    assert.equal(
      star,
      null,
      `export * compat interdit dans ${path.relative(ROOT, file)} — il exposerait tout nouveau symbole host`,
    );
  }
});

test("frozen-exports — index.ts : surface de ré-exports identique au snapshot", () => {
  const current = extractReexports(fs.readFileSync(INDEX, "utf8"));
  const { added, removed } = diff(current, snapshot.index);
  assert.deepEqual(
    added,
    [],
    `nouveaux ré-exports host dans electron-shell/src/index.ts (surface FIGÉE) :\n  ${added.join(
      "\n  ",
    )}\n→ exporter depuis @creezio/host-runtime ou @creezio/search, pas via electron-shell.`,
  );
  assert.deepEqual(
    removed,
    [],
    `ré-exports supprimés d'electron-shell/src/index.ts (breaking pour les marques) :\n  ${removed.join(
      "\n  ",
    )}\n→ une suppression = major + codemod, pas un retrait silencieux.`,
  );
});

test("frozen-exports — meili.ts : shim subpath identique au snapshot", () => {
  const current = extractReexports(fs.readFileSync(MEILI, "utf8"));
  const { added, removed } = diff(current, snapshot.meili);
  assert.deepEqual(added, [], `nouveaux ré-exports dans meili.ts (shim FIGÉ) : ${added.join(", ")}`);
  assert.deepEqual(
    removed,
    [],
    `ré-exports supprimés de meili.ts (breaking) : ${removed.join(", ")}`,
  );
});
