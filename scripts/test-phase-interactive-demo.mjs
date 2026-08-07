/**
 * Gate : @creezio/interactive-demo conforme au patron « module natif
 * hybride » (docs/adr/ADR-module-natif-hybride.md).
 *
 * Verrouille : exports kit (migrations + merge + mount + validation +
 * scénario générique), schéma interactive_demo_content /
 * interactive_demo_preferences, merge pur défauts/overrides (steps =
 * remplacement, enabled:false, scénario additionnel), mount 503 sans db,
 * GET/PUT/DELETE scenarios + preferences sur une vraie DB (node:sqlite si
 * dispo, sinon stub mémoire), et surface UI (exports ./ui + CSS).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PKG = path.join(ROOT, "packages/interactive-demo");
const DIST = path.join(PKG, "dist/index.js");

async function loadDist() {
  assert.ok(
    fs.existsSync(DIST),
    "dist @creezio/interactive-demo manquant — lancer npm run build -w @creezio/interactive-demo",
  );
  return import(pathToFileURL(DIST).href);
}

/** DB réelle (node:sqlite) ou stub mémoire prepare/run/get/all. */
async function createDb(migrations) {
  try {
    const { DatabaseSync } = await import("node:sqlite");
    const db = new DatabaseSync(":memory:");
    for (const m of migrations) db.exec(m.sql);
    return db;
  } catch {
    return createStubDb();
  }
}

function createStubDb() {
  const content = new Map();
  const prefs = new Map();
  return {
    prepare(sql) {
      const s = sql.replace(/\s+/g, " ").trim();
      return {
        run: (...a) => {
          if (s.startsWith("INSERT INTO interactive_demo_content")) {
            content.set(a[0], { value_json: a[1], updated_at: a[2] });
            return { changes: 1 };
          }
          if (s.startsWith("DELETE FROM interactive_demo_content")) {
            return { changes: content.delete(a[0]) ? 1 : 0 };
          }
          if (s.startsWith("INSERT INTO interactive_demo_preferences")) {
            const [id, user, key, vj, ts] = a;
            const k = `${user}\u0000${key}`;
            const prev = prefs.get(k);
            prefs.set(k, {
              id: prev?.id ?? id,
              user_key: user,
              key,
              value_json: vj,
              updated_at: ts,
            });
            return { changes: 1 };
          }
          throw new Error(`stub run inattendu: ${s}`);
        },
        get: () => {
          throw new Error(`stub get inattendu: ${s}`);
        },
        all: (...a) => {
          if (s.startsWith("SELECT key, value_json FROM interactive_demo_content")) {
            const like = String(a[0] ?? "").replace(/%$/, "");
            return [...content.entries()]
              .filter(([k]) => k.startsWith(like))
              .sort(([x], [y]) => (x < y ? -1 : 1))
              .map(([k, v]) => ({ key: k, value_json: v.value_json }));
          }
          if (
            s.startsWith("SELECT key, value_json FROM interactive_demo_preferences")
          ) {
            return [...prefs.values()]
              .filter((r) => r.user_key === a[0])
              .sort((x, y) => (x.key < y.key ? -1 : 1))
              .map((r) => ({ key: r.key, value_json: r.value_json }));
          }
          throw new Error(`stub all inattendu: ${s}`);
        },
      };
    },
  };
}

const DEFAULTS = [
  {
    id: "tour",
    title: "Visite produit",
    description: "Découverte",
    enabled: true,
    autoStart: true,
    steps: [
      { id: "hello", kind: "say", title: "Bienvenue" },
      { id: "cat", kind: "click", target: { text: "Catalogue" } },
      { id: "search", kind: "type", target: "input", text: "bio" },
    ],
  },
  {
    id: "avance",
    title: "Fonctions avancées",
    steps: [{ id: "hl", kind: "highlight", target: { selector: "aside" }, title: "Nav" }],
  },
];

function call(mount, { method, subPath, body, query, db }) {
  return mount.handle({
    req: {
      method,
      path: `/api/v1/modules/interactive-demo/${subPath}`,
      body,
      query,
    },
    space: "module",
    mountId: "interactive-demo",
    subPath,
    db,
  });
}

test("interactive-demo : exports kit + migrations", async () => {
  const mod = await loadDist();
  assert.equal(typeof mod.interactiveDemoMigrations, "function");
  assert.equal(typeof mod.createInteractiveDemoMount, "function");
  assert.equal(typeof mod.mergeDemoScenarios, "function");
  assert.equal(typeof mod.validateDemoScenario, "function");
  assert.equal(typeof mod.genericOsTourScenario, "function");

  const migs = mod.interactiveDemoMigrations();
  assert.equal(migs.length, 1);
  assert.equal(migs[0].id, "interactive_demo_001_content_prefs");
  assert.match(migs[0].sql, /interactive_demo_content/);
  assert.match(migs[0].sql, /interactive_demo_preferences/);
  assert.match(migs[0].sql, /UNIQUE\(user_key, key\)/);
});

test("interactive-demo : validateDemoScenario", async () => {
  const { validateDemoScenario, genericOsTourScenario } = await loadDist();

  assert.deepEqual(validateDemoScenario(DEFAULTS[0]), []);
  assert.deepEqual(
    validateDemoScenario(genericOsTourScenario({ productName: "Demo" })),
    [],
    "le scénario générique OS est valide",
  );

  assert.ok(validateDemoScenario(null).includes("scenario_invalide"));
  assert.ok(validateDemoScenario({ id: "x", title: "X" }).includes("etapes_requises"));
  const bad = validateDemoScenario({
    id: "x",
    title: "X",
    steps: [
      { id: "a", kind: "say" },
      { id: "a", kind: "navigate", href: "http://exterieur" },
      { id: "c", kind: "click", target: {} },
      { id: "d", kind: "wait", ms: 0 },
      { id: "e", kind: "inconnu" },
    ],
  });
  assert.ok(bad.includes("etape_0_titre_requis"));
  assert.ok(bad.includes("etape_1_id_duplique"));
  assert.ok(bad.includes("etape_1_href_invalide"));
  assert.ok(bad.includes("etape_2_cible_invalide"));
  assert.ok(bad.includes("etape_3_ms_invalide"));
  assert.ok(bad.includes("etape_4_kind_invalide"));
});

test("interactive-demo : mergeDemoScenarios pur", async () => {
  const { mergeDemoScenarios } = await loadDist();

  // Sans override : copie des défauts.
  const noOv = mergeDemoScenarios(DEFAULTS, null);
  assert.deepEqual(
    noOv.map((s) => s.id),
    ["tour", "avance"],
  );

  const merged = mergeDemoScenarios(DEFAULTS, [
    {
      id: "tour",
      title: "Visite (éditée)",
      steps: [{ id: "solo", kind: "say", title: "Étape unique" }],
    },
    { id: "avance", enabled: false },
    {
      id: "extra",
      title: "Scénario admin",
      steps: [{ id: "s1", kind: "say", title: "Ajouté" }],
    },
    { id: "casse", steps: "pas un tableau" },
  ]);

  const tour = merged.find((s) => s.id === "tour");
  assert.equal(tour.title, "Visite (éditée)");
  assert.equal(tour.steps.length, 1, "steps override = remplacement complet");
  assert.equal(tour.steps[0].id, "solo");
  assert.equal(tour.autoStart, true, "champ non overridé conservé");

  assert.equal(merged.find((s) => s.id === "avance").enabled, false);
  assert.equal(merged.find((s) => s.id === "extra").steps.length, 1);
  assert.equal(
    merged.some((s) => s.id === "casse"),
    false,
    "override additionnel invalide ignoré",
  );

  // Pureté : les défauts ne sont pas mutés.
  assert.equal(DEFAULTS[0].title, "Visite produit");
  assert.equal(DEFAULTS[0].steps.length, 3);
});

test("interactive-demo : mount 503 sans db", async () => {
  const { createInteractiveDemoMount } = await loadDist();
  const mount = createInteractiveDemoMount({ defaults: DEFAULTS });
  assert.equal(mount.dbLayer, "brand");
  const res = await call(mount, { method: "GET", subPath: "scenarios" });
  assert.equal(res.status, 503);
  assert.equal(res.body.error, "db_unavailable");
});

test("interactive-demo : scenarios GET défauts → PUT override → DELETE", async () => {
  const mod = await loadDist();
  const db = await createDb(mod.interactiveDemoMigrations());
  const mount = mod.createInteractiveDemoMount({ defaults: DEFAULTS });

  const g1 = await call(mount, { method: "GET", subPath: "scenarios", db });
  assert.equal(g1.status, 200);
  assert.equal(g1.body.ok, true);
  assert.deepEqual(g1.body.overrides, []);
  assert.equal(g1.body.scenarios.length, 2);

  const put = await call(mount, {
    method: "PUT",
    subPath: "scenarios/tour",
    db,
    body: { steps: [{ id: "solo", kind: "say", title: "Étape éditée" }] },
  });
  assert.equal(put.status, 200);
  assert.equal(put.body.hasOverride, true);
  assert.equal(put.body.scenario.steps.length, 1);

  const g2 = await call(mount, { method: "GET", subPath: "scenarios/tour", db });
  assert.equal(g2.status, 200);
  assert.equal(g2.body.scenario.steps[0].title, "Étape éditée");
  assert.equal(g2.body.scenario.title, "Visite produit", "défaut conservé");

  // Steps invalides → 400, jamais de throw.
  const bad = await call(mount, {
    method: "PUT",
    subPath: "scenarios/tour",
    db,
    body: { steps: [{ id: "x", kind: "wait", ms: -1 }] },
  });
  assert.equal(bad.status, 400);
  assert.equal(bad.body.error, "scenario_invalide");

  // Scénario additionnel inconnu : exigé complet.
  const incomplete = await call(mount, {
    method: "PUT",
    subPath: "scenarios/nouveau",
    db,
    body: { title: "Sans étapes" },
  });
  assert.equal(incomplete.status, 400);
  const complete = await call(mount, {
    method: "PUT",
    subPath: "scenarios/nouveau",
    db,
    body: {
      title: "Nouveau scénario",
      steps: [{ id: "s1", kind: "say", title: "Créé par l'admin" }],
    },
  });
  assert.equal(complete.status, 200);

  const g3 = await call(mount, { method: "GET", subPath: "scenarios", db });
  assert.equal(g3.body.scenarios.length, 3);
  assert.deepEqual(g3.body.overrides.sort(), ["nouveau", "tour"]);

  const del = await call(mount, { method: "DELETE", subPath: "scenarios/tour", db });
  assert.equal(del.status, 200);
  assert.equal(del.body.hasOverride, false);
  assert.equal(del.body.scenario.steps.length, 3, "retour aux défauts");

  const missing = await call(mount, {
    method: "GET",
    subPath: "scenarios/inconnu",
    db,
  });
  assert.equal(missing.status, 404);
});

test("interactive-demo : preferences PUT upsert + GET par user", async () => {
  const mod = await loadDist();
  const db = await createDb(mod.interactiveDemoMigrations());
  const mount = mod.createInteractiveDemoMount({ defaults: DEFAULTS });

  const p1 = await call(mount, {
    method: "PUT",
    subPath: "preferences",
    db,
    body: { user: "owner", answers: { "seen:tour": "2026-08-07T10:00:00Z" } },
  });
  assert.equal(p1.status, 200);
  assert.equal(p1.body.saved, 1);

  // Upsert : même clé, nouvelle valeur — pas de doublon.
  await call(mount, {
    method: "PUT",
    subPath: "preferences",
    db,
    body: { user: "owner", answers: { "seen:tour": "2026-08-08T10:00:00Z" } },
  });

  const get = await call(mount, {
    method: "GET",
    subPath: "preferences",
    db,
    query: { user: "owner" },
  });
  assert.equal(get.status, 200);
  assert.deepEqual(get.body.answers, { "seen:tour": "2026-08-08T10:00:00Z" });

  const noUser = await call(mount, { method: "GET", subPath: "preferences", db });
  assert.equal(noUser.status, 400);
  const badBody = await call(mount, {
    method: "PUT",
    subPath: "preferences",
    db,
    body: { answers: { a: 1 } },
  });
  assert.equal(badBody.status, 400);

  const other = await call(mount, {
    method: "GET",
    subPath: "preferences",
    db,
    query: { user: "autre" },
  });
  assert.deepEqual(other.body.answers, {});
});

test("interactive-demo : surface UI (exports ./ui + CSS + composants)", () => {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(PKG, "package.json"), "utf8"),
  );
  assert.equal(pkg.exports["./ui"].import, "./ui/index.ts");
  assert.equal(
    pkg.exports["./ui/interactive-demo.css"],
    "./ui/interactive-demo.css",
  );
  for (const f of [
    "ui/index.ts",
    "ui/demo-root.tsx",
    "ui/demo-player.tsx",
    "ui/fake-cursor.ts",
    "ui/dom.ts",
    "ui/interactive-demo.css",
  ]) {
    assert.ok(fs.existsSync(path.join(PKG, f)), `fichier UI manquant: ${f}`);
  }
  const uiIndex = fs.readFileSync(path.join(PKG, "ui/index.ts"), "utf8");
  assert.match(uiIndex, /InteractiveDemoRoot/);
  assert.match(uiIndex, /DemoPlayer/);
  assert.match(uiIndex, /startInteractiveDemo/);
});
