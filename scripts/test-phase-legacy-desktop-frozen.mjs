#!/usr/bin/env node
/**
 * Gate P2.a — la compat desktop héritée TF2/CV/Fidu est GELÉE.
 *
 * `packages/electron-shell/src/desktop/legacy-brand-compat.ts` regroupe la
 * compat marque héritée du moteur desktop (`brand-desktop-runtime.ts`) :
 * défauts d'env legacy, ordre des preloads historiques, alias de contrat
 * host. Les clients desktop legacy (TF2/Certivan/Fidu — repos hors kit,
 * non migrés sur `startBrandDesktop`) en dépendent : on ne peut ni le
 * supprimer, ni le laisser évoluer.
 *
 * Mécanique anti-diff : empreinte SHA-256 du contenu versionnée dans
 * `scripts/legacy-desktop-frozen.json`. Tout diff = ROUGE.
 *
 * POLITIQUE : aucune feature n'entre dans ce module — fixes sécurité
 * uniquement. Un fix sécurité légitime met à jour l'empreinte dans le MÊME
 * commit, avec justification dans le message de commit. Le retrait complet
 * du module est prévu au prochain bump `ARCHITECTURE_VERSION` (H9) avec
 * codemod de migration des clients legacy (voir docs/BACKLOG.md).
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SNAPSHOT = path.join(ROOT, "scripts/legacy-desktop-frozen.json");
const snapshot = JSON.parse(fs.readFileSync(SNAPSHOT, "utf8"));

test("legacy-desktop-frozen — empreinte du périmètre gelé intacte", () => {
  for (const entry of snapshot.files) {
    const abs = path.join(ROOT, entry.file);
    assert.ok(
      fs.existsSync(abs),
      `${entry.file} absent — le périmètre gelé ne se supprime pas sans bump ` +
        `ARCHITECTURE_VERSION + codemod clients legacy (H9, docs/BACKLOG.md).`,
    );
    const sha256 = createHash("sha256")
      .update(fs.readFileSync(abs))
      .digest("hex");
    assert.equal(
      sha256,
      entry.sha256,
      `${entry.file} a changé (périmètre GELÉ P2.a — aucune feature n'y entre).\n` +
        `  attendu ${entry.sha256}\n  obtenu  ${sha256}\n` +
        `→ fix sécurité uniquement : mettre à jour l'empreinte dans ` +
        `scripts/legacy-desktop-frozen.json DANS LE MÊME commit, avec ` +
        `justification dans le message. Toute feature va dans ` +
        `brand-desktop-runtime.ts via deps génériques, jamais ici.`,
    );
  }
});

test("legacy-desktop-frozen — pas de nouveau consommateur kit du module", () => {
  // Seul le moteur desktop consomme la compat gelée : un nouvel import
  // ailleurs dans le kit recréerait une dépendance au vocabulaire legacy.
  const allowed = new Set(snapshot.allowedImporters);
  const pkgsDir = path.join(ROOT, "packages");
  const offenders = [];
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name);
      const st = fs.statSync(p);
      if (st.isDirectory()) {
        if (["node_modules", "dist", "dist-cjs"].includes(name)) continue;
        walk(p);
      } else if (/\.(ts|tsx|mts|cts)$/.test(name)) {
        const src = fs.readFileSync(p, "utf8");
        if (src.includes("legacy-brand-compat")) {
          const rel = path.relative(ROOT, p);
          if (!allowed.has(rel)) offenders.push(rel);
        }
      }
    }
  };
  walk(pkgsDir);
  assert.deepEqual(
    offenders,
    [],
    `nouveaux consommateurs du périmètre gelé legacy-brand-compat :\n  ` +
      offenders.join("\n  ") +
      `\n→ interdit : la compat legacy est une feuille du moteur desktop.`,
  );
});
