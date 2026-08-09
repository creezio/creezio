#!/usr/bin/env node
/**
 * Gate Phase C — BrandMeiliFeed générique (pas de tf2_* dans le chemin feed).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("C1 feed.ts expose BrandMeiliFeed + createChrCatalogMeiliFeed", () => {
  const feed = fs.readFileSync(
    path.join(ROOT, "packages/electron-shell/src/host/meili/feed.ts"),
    "utf8",
  );
  assert.match(feed, /export type BrandMeiliFeed/);
  assert.match(feed, /export function configureMeiliBrandFeed/);
  assert.match(feed, /export function createChrCatalogMeiliFeed/);
  assert.match(feed, /catalog_products/);
  assert.match(feed, /catalog_sites/);
  assert.doesNotMatch(feed, /tf2_produits/);
});

test("C2 generic-indexer + runIndexation accepte feed", () => {
  const gen = fs.readFileSync(
    path.join(ROOT, "packages/electron-shell/src/host/meili/generic-indexer.ts"),
    "utf8",
  );
  assert.match(gen, /export async function runFeedIndexation/);
  assert.match(gen, /export async function searchMeiliIndexes/);

  const idx = fs.readFileSync(
    path.join(ROOT, "packages/electron-shell/src/host/meili/indexer.ts"),
    "utf8",
  );
  assert.match(idx, /opts\?\.feed|getMeiliBrandFeed/);
  assert.match(idx, /runFeedIndexation/);
});

test("C3 export package ./meili sans barrel Electron", () => {
  const pkg = JSON.parse(
    fs.readFileSync(
      path.join(ROOT, "packages/electron-shell/package.json"),
      "utf8",
    ),
  );
  assert.ok(pkg.exports["./meili"]);
});

test("C4 factory génère meili-feed hors tf2_*", () => {
  const native = fs.readFileSync(
    path.join(ROOT, "packages/factory/src/generators/native-runtime.ts"),
    "utf8",
  );
  assert.match(native, /renderMeiliFeedTs/);
  assert.match(native, /createChrCatalogMeiliFeed/);
  assert.match(native, /createSearchMount/);
});

test("C5 ADR documente BrandMeiliFeed", () => {
  const adr = fs.readFileSync(
    path.join(ROOT, "docs/adr/ADR-no-brand-domain-in-native-packages.md"),
    "utf8",
  );
  assert.match(adr, /BrandMeiliFeed|configureMeiliBrandFeed/);
});

test("D1 kit expose listenBrandKernelHttp + maybeBootBrandMeili", () => {
  const httpSrc = fs.readFileSync(
    path.join(ROOT, "packages/electron-shell/src/host/brand-kernel-http.ts"),
    "utf8",
  );
  assert.match(httpSrc, /export async function listenBrandKernelHttp/);
  const bootSrc = fs.readFileSync(
    path.join(ROOT, "packages/electron-shell/src/host/brand-meili-boot.ts"),
    "utf8",
  );
  assert.match(bootSrc, /export async function maybeBootBrandMeili/);
  const barrel = fs.readFileSync(
    path.join(ROOT, "packages/electron-shell/src/index.ts"),
    "utf8",
  );
  assert.match(barrel, /listenBrandKernelHttp/);
  assert.match(barrel, /maybeBootBrandMeili/);
});

test("D2 boot Meili saute la réindexation quand le fingerprint est à jour", () => {
  // Régression prod : le harness serveur réindexait 85k+ docs à CHAQUE boot
  // de container (~7 min de CPU/IO → recherche dégradée), alors que le
  // desktop sautait déjà via decideMeiliReady. Le skip doit être câblé.
  const bootSrc = fs.readFileSync(
    path.join(ROOT, "packages/electron-shell/src/host/brand-meili-boot.ts"),
    "utf8",
  );
  assert.match(bootSrc, /skipIfCoherent\?: boolean/);
  assert.match(bootSrc, /decideMeiliReady\(meili, opts\.dbPath, \{\s*strictCounts: true/);
  assert.match(bootSrc, /indexSkipped: true/);

  const coherenceSrc = fs.readFileSync(
    path.join(ROOT, "packages/electron-shell/src/host/meili/coherence.ts"),
    "utf8",
  );
  // Compteurs stricts côté serveur : une dérive (import hors indexation
  // incrémentale) doit invalider le fingerprint, sinon l'index se fige.
  assert.match(coherenceSrc, /strictCounts\?: boolean/);
  assert.match(coherenceSrc, /count-drift:/);
  assert.match(coherenceSrc, /export function meiliCoherenceScriptPath/);

  const harnessSrc = fs.readFileSync(
    path.join(ROOT, "packages/app-runtime/src/start-brand-kernel-harness.ts"),
    "utf8",
  );
  assert.match(harnessSrc, /skipIfCoherent: true/);
  assert.match(harnessSrc, /meiliCoherenceScriptPath/);
  assert.match(harnessSrc, /indexSkipped/);

  const meiliBarrel = fs.readFileSync(
    path.join(ROOT, "packages/electron-shell/src/host/meili/index.ts"),
    "utf8",
  );
  assert.match(meiliBarrel, /meiliCoherenceScriptPath/);
});
