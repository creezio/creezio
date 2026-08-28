#!/usr/bin/env node
/**
 * Gate Meili browse — contrat plateforme :
 * - browse q vide = Meili (POST q:"") ;
 * - 0 hit = engine meili (jamais 0-hit → SQL) ;
 * - filtre rejeté / Meili KO = SQL fallback visible ;
 * - factory search mount sans le piège `if (hits.length > 0)` ;
 * - module catalogue généré déclare meiliIndexes OU horsIndexJustification ;
 * - searchMeiliIndexes n'est PAS le helper de browse (retourne [] si q vide).
 */
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

test("source : browseMeiliIndex accepte q vide (kit)", () => {
  const api = read("packages/api-kernel/src/meili-browse.ts");
  assert.match(api, /export async function browseMeiliIndex/);
  assert.match(api, /q:\s*req\.query \?\? ""/);
  assert.match(api, /numberOfDocuments/);
  assert.doesNotMatch(api, /if\s*\(\s*!q|if\s*\(\s*!opts\.query/);

  const shell = read("packages/electron-shell/src/host/meili/browse.ts");
  assert.match(shell, /export async function browseMeiliIndex/);
  assert.match(shell, /q:\s*req\.query \?\? ""/);
  assert.match(shell, /searchMeiliIndexes/);
});

test("source : searchMeiliIndexes refuse q vide (pas un browse)", () => {
  const gen = read("packages/electron-shell/src/host/meili/generic-indexer.ts");
  assert.match(gen, /export async function searchMeiliIndexes/);
  assert.match(gen, /if\s*\(\s*!q\s*\|\|/);
});

test("source : factory search — 0 hit reste meili, SQL seulement dans catch", () => {
  const native = read("packages/factory/src/generators/native-runtime.ts");
  const start = native.indexOf("function createSearchMount()");
  assert.ok(start >= 0, "createSearchMount absent");
  const chunk = native.slice(start, start + 3500);
  assert.doesNotMatch(
    chunk,
    /if\s*\(\s*hits\.length\s*>\s*0\s*\)/,
    "piège 0-hit → SQL encore présent dans createSearchMount",
  );
  assert.match(chunk, /engine:\s*"meili"/);
  assert.match(chunk, /0 hit Meili EST la réponse/);
  assert.match(chunk, /hits:\s*mapped/);
});

test("source : factory module catalogue déclare meiliIndexes ou hors-index", () => {
  const reg = read("packages/factory/src/generators/modules-registry.ts");
  assert.match(reg, /horsIndexJustification/);
  assert.match(reg, /function renderMeiliOrHorsIndexBlock/);
  assert.match(reg, /catalog_products/);
  assert.match(reg, /CATALOG_BROWSE_IDS/);
  const init = read("packages/factory/src/brand-module-init.ts");
  assert.match(init, /meiliIndexes/);
  assert.match(init, /horsIndexJustification/);
  const guide = read("docs/agents/CREATE-MODULE.md");
  assert.match(guide, /horsIndexJustification/);
  assert.match(guide, /browseMeiliIndex/);
});

test("isolé : browse q vide = Meili, 0 hit = meili, filtre rejeté = null", async () => {
  const { browseMeiliIndex } = await import(
    path.join(ROOT, "packages/api-kernel/dist/meili-browse.js")
  );

  const docs = [{ id: "p1", title: "Tomates", categorie_id: 12 }];
  const server = http.createServer((req, res) => {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    const json = (code, body) => {
      res.writeHead(code, { "content-type": "application/json" });
      res.end(JSON.stringify(body));
    };
    if (url.pathname.endsWith("/stats")) {
      return json(200, { numberOfDocuments: docs.length });
    }
    if (req.method === "POST" && url.pathname.includes("/search")) {
      let raw = "";
      req.on("data", (c) => {
        raw += c;
      });
      req.on("end", () => {
        const body = JSON.parse(raw || "{}");
        const filter = Array.isArray(body.filter)
          ? body.filter.join(" AND ")
          : String(body.filter || "");
        if (filter.includes("unknown_field")) {
          return json(400, { message: "invalid filter" });
        }
        const q = String(body.q ?? "");
        let hits = docs;
        if (q === "nomatch") hits = [];
        else if (filter.includes("categorie_id = 12")) hits = docs;
        else if (q === "" || q === "tom") hits = docs;
        json(200, { hits, totalHits: hits.length });
      });
      return;
    }
    json(404, {});
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const { port } = server.address();
  const host = `http://127.0.0.1:${port}`;
  try {
    const emptyQ = await browseMeiliIndex({
      host,
      indexUid: "catalog_products",
      query: "",
      filters: ["categorie_id = 12"],
    });
    assert.ok(emptyQ, "q vide + filtre doit servir Meili");
    assert.equal(emptyQ.hits.length, 1);
    assert.equal(emptyQ.total, 1);

    const zero = await browseMeiliIndex({
      host,
      indexUid: "catalog_products",
      query: "nomatch",
    });
    assert.ok(zero, "0 hit = succès Meili (pas null)");
    assert.equal(zero.hits.length, 0);
    assert.equal(zero.total, 0);

    const rejected = await browseMeiliIndex({
      host,
      indexUid: "catalog_products",
      query: "",
      filters: ["unknown_field = 1"],
    });
    assert.equal(rejected, null, "filtre rejeté → null (SQL fallback)");
  } finally {
    server.close();
  }
});
