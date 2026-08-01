#!/usr/bin/env node
/**
 * Preuve oracle vs TempoFlow 0.10.26 — échoue si parity insuffisante.
 * Sortie JSON + markdown sous /opt/cursor/artifacts/ et docs/experiences/tempoflow3/
 */
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const creezioRoot = process.env.CREEZIO_ROOT || path.resolve(root, "../..");
const artifacts =
  process.env.PROOF_ARTIFACTS_DIR || "/opt/cursor/artifacts/tempoflow3-proof";
fs.mkdirSync(artifacts, { recursive: true });

const checks = [];
function record(id, ok, detail) {
  checks.push({ id, ok: Boolean(ok), detail: String(detail || "") });
  const mark = ok ? "PASS" : "FAIL";
  console.log(`[${mark}] ${id} — ${detail || ""}`);
}

const localNm = path.join(root, "node_modules");
if (!fs.existsSync(localNm) && fs.existsSync(path.join(creezioRoot, "node_modules"))) {
  fs.symlinkSync(path.join(creezioRoot, "node_modules"), localNm, "dir");
}
const toolEnv = {
  ...process.env,
  CREEZIO_ROOT: creezioRoot,
  NODE_PATH: [path.join(root, "node_modules"), path.join(creezioRoot, "node_modules")]
    .join(path.delimiter),
  PATH: [
    path.join(root, "node_modules", ".bin"),
    path.join(creezioRoot, "node_modules", ".bin"),
    process.env.PATH || "",
  ].join(path.delimiter),
};

// --- Structure marque légère ---
record(
  "arch.no-brand-runtime",
  !fs.existsSync(path.join(root, "src/electron/brand-runtime.ts")),
  "pas de brand-runtime (kit createBrandKernel)",
);
record(
  "arch.no-host-stack",
  !fs.existsSync(path.join(root, "src/lib/host-stack.ts")),
  "pas de glue src/lib/host-stack",
);
const main = fs.readFileSync(path.join(root, "src/electron/main.ts"), "utf8");
record(
  "arch.startBrandDesktop",
  /startBrandDesktop/.test(main) && /brandMigrations/.test(main),
  "main déclaration façade",
);

// --- UI parity pages (fichiers) ---
const requiredUi = [
  "dashboard",
  "fournisseurs",
  "produits",
  "panier",
  "commandes",
  "optimiser",
  "stack",
  "releves",
  "scan",
  "marketplaces",
  "secteurs",
  "agregateurs",
  "data-mapping",
];
const missingUi = requiredUi.filter(
  (p) => !fs.existsSync(path.join(root, `ui/app/${p}/page.tsx`)),
);
record("ui.pages-metier", missingUi.length === 0, missingUi.join(", ") || "ok");

const tf2OnlyMissing = [
  "skus",
  "promotions",
  "site",
  "login",
  "setup",
  "onboarding",
  "taches",
  "mails",
  "collaborateurs",
  "configuration",
  "parametres",
  "cockpit",
  "developers",
  "admin/mcp",
  "admin/plugins",
  "admin/database",
];
const stillMissing = tf2OnlyMissing.filter(
  (p) => !fs.existsSync(path.join(root, `ui/app/${p}/page.tsx`)),
);
record(
  "ui.parity-0.10.26-pages",
  stillMissing.length === 0,
  `manquant: ${stillMissing.join(", ") || "aucun"}`,
);

// --- Renderer SPA vs Next ---
const renderer = fs.readFileSync(
  path.join(root, "resources/renderer/index.html"),
  "utf8",
);
record(
  "ui.renderer-has-bonus-nav",
  /optimiser|stack|releves|scan|marketplaces/.test(renderer),
  "SPA embarquée doit exposer nav bonus (sinon UI Electron incomplète)",
);

// --- Build electron ---
const build = spawnSync("npm", ["run", "build:electron"], {
  cwd: root,
  encoding: "utf8",
  shell: true,
  env: toolEnv,
});
record("build.electron-tsc", build.status === 0, build.status === 0 ? "tsc ok" : build.stderr);

// --- API functional ---
const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "tf3-oracle-"));
const port = 19100 + Math.floor(Math.random() * 800);
const child = spawn(process.execPath, [path.join(root, "scripts/brand-kernel-harness.mjs")], {
  env: { ...toolEnv, METIER_DATA_DIR: dataDir, METIER_PORT: String(port), MEILI_SKIP_INDEX: "1" },
  stdio: ["ignore", "pipe", "pipe"],
});

async function waitHealth() {
  for (let i = 0; i < 100; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/v1/core/health`);
      if (res.ok) return true;
    } catch {
      /* */
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  return false;
}

async function json(method, urlPath, body) {
  const res = await fetch(`http://127.0.0.1:${port}${urlPath}`, {
    method,
    headers: { "content-type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

try {
  const healthy = await waitHealth();
  record("api.health", healthy, healthy ? `port ${port}` : "timeout");
  if (!healthy) throw new Error("harness down");

  const f1 = await json("POST", "/api/v1/modules/fournisseurs", { nom: "Metro Proof" });
  record("api.fournisseurs.create", f1.status < 300 && f1.data.id, f1.data.id || f1.data.error);
  const f2 = await json("POST", "/api/v1/modules/fournisseurs", { nom: "Promocash Proof" });
  await json("POST", `/api/v1/modules/fournisseurs/${f2.data.id}/archive`, {});
  const archived = await json("GET", "/api/v1/modules/fournisseurs?archived=1");
  record(
    "api.fournisseurs.archive-filter",
    (archived.data.items || []).some((x) => x.id === f2.data.id),
    `n=${(archived.data.items || []).length}`,
  );

  const p = await json("POST", "/api/v1/modules/produits", {
    nom: "Tomate Proof",
    fournisseur_id: f1.data.id,
  });
  record("api.produits.create", p.status < 300 && p.data.id, p.data.id || p.data.error);
  const prix = await json("POST", "/api/v1/modules/prix", {
    produit_id: p.data.id,
    fournisseur_id: f1.data.id,
    montant: 2.5,
    promo: true,
    promo_label: "promo-proof",
  });
  record("api.prix.create", prix.status < 300 && prix.data.id, prix.data.id || prix.data.error);

  const ligne = await json("POST", "/api/v1/modules/panier_lignes", {
    produit_id: p.data.id,
    fournisseur_id: f1.data.id,
    quantite: 3,
  });
  record("api.panier.add", ligne.status < 300 && ligne.data.id, ligne.data.id || ligne.data.error);
  const cmd = await json("POST", "/api/v1/modules/commandes/from-panier", {
    fournisseur_id: f1.data.id,
  });
  record(
    "api.commandes.from-panier",
    cmd.status < 300 && cmd.data.id,
    cmd.data.id || JSON.stringify(cmd.data),
  );

  const sug = await json("POST", "/api/v1/modules/optimiser/suggest", {
    produit_id: p.data.id,
  });
  record(
    "api.optimiser.suggest",
    sug.status < 300 && Array.isArray(sug.data.suggestions || sug.data.items || []),
    `status=${sug.status}`,
  );

  for (const [id, pathApi] of [
    ["api.stack.list", "/api/v1/modules/stack"],
    ["api.releves.list", "/api/v1/modules/releves"],
    ["api.marketplaces.list", "/api/v1/modules/marketplaces"],
    ["api.secteurs.list", "/api/v1/modules/secteurs"],
    ["api.agregateurs.list", "/api/v1/modules/agregateurs"],
    ["api.data-mapping.list", "/api/v1/modules/data-mapping"],
  ]) {
    const r = await json("GET", pathApi);
    record(id, r.status < 300, `status=${r.status}`);
  }

  const scan = await json("POST", "/api/v1/modules/scan/start", { code: "PROOF-SKU-1" });
  record("api.scan.start", scan.status < 300, `status=${scan.status}`);

  const search = await json("GET", "/api/v1/modules/search?q=tomate");
  record("api.search", search.status < 300, `status=${search.status}`);

  // Surfaces 0.10.26 absentes → FAIL explicite
  for (const [id, pathApi] of [
    ["api.dispatch", "/api/v1/modules/dispatch/candidates"],
    ["api.skus", "/api/v1/modules/skus"],
    ["api.promotions", "/api/v1/modules/promotions"],
    ["api.site-fournisseur", `/api/v1/modules/site/${f1.data.id}`],
  ]) {
    const r = await json("GET", pathApi);
    record(id, r.status < 300, `status=${r.status} (requis 0.10.26)`);
  }
} catch (err) {
  record("api.suite", false, err instanceof Error ? err.message : String(err));
} finally {
  child.kill("SIGTERM");
}

// --- OS surfaces kit (fichiers / wiring) ---
record(
  "os.login-page",
  fs.existsSync(path.join(root, "ui/app/login/page.tsx")),
  "page login",
);
record(
  "os.setup-page",
  fs.existsSync(path.join(root, "ui/app/setup/page.tsx")),
  "page setup",
);
record(
  "os.taches-page",
  fs.existsSync(path.join(root, "ui/app/taches/page.tsx")),
  "page tâches",
);
record(
  "os.mails-page",
  fs.existsSync(path.join(root, "ui/app/mails/page.tsx")),
  "page mails",
);
record(
  "os.mcp-page",
  fs.existsSync(path.join(root, "ui/app/mcp/page.tsx")) ||
    fs.existsSync(path.join(root, "ui/app/developers/page.tsx")),
  "page mcp/developers",
);

// --- Binaire compilé ---
const distDir = path.join(root, "dist-electron");
const hasDist =
  fs.existsSync(distDir) &&
  fs.readdirSync(distDir).some((f) => /AppImage|exe|deb|rpm|TempoFlow/i.test(f));
record(
  "build.compiled-artifact",
  hasDist,
  hasDist
    ? fs.readdirSync(distDir).join(", ")
    : "aucun artefact dans dist-electron/ — mission non livrée",
);

const passed = checks.filter((c) => c.ok).length;
const failed = checks.filter((c) => !c.ok).length;
const missionOk =
  failed === 0 &&
  checks.some((c) => c.id === "build.compiled-artifact" && c.ok);

const report = {
  at: new Date().toISOString(),
  baseline: "tempoflow2@v0.10.26 (e36e4d0)",
  mission: missionOk ? "SUCCESS" : "FAILURE",
  passed,
  failed,
  checks,
};

const md = [
  `# Preuve oracle TempoFlow3`,
  ``,
  `**Mission : ${report.mission}** (${passed} pass / ${failed} fail)`,
  ``,
  `| Check | Result | Detail |`,
  `|-------|--------|--------|`,
  ...checks.map(
    (c) => `| \`${c.id}\` | ${c.ok ? "✅" : "❌"} | ${c.detail.replace(/\|/g, "/")} |`,
  ),
  ``,
  missionOk
    ? `Livrable compilé présent sous \`dist-electron/\`.`
    : `ÉCHEC : parity 0.10.26 + binaire non atteints.`,
  ``,
].join("\n");

fs.writeFileSync(path.join(artifacts, "oracle-proof.json"), JSON.stringify(report, null, 2));
fs.writeFileSync(path.join(artifacts, "oracle-proof.md"), md);
fs.writeFileSync(
  path.join(creezioRoot, "docs/experiences/tempoflow3/PREUVE-ORACLE-RUN.md"),
  md,
);

console.log(`\nMISSION=${report.mission} pass=${passed} fail=${failed}`);
console.log(`artifacts: ${artifacts}`);
process.exit(missionOk ? 0 : 2);
