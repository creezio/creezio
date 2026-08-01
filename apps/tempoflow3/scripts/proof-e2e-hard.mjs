#!/usr/bin/env node
/**
 * Preuve dure TempoFlow3 — échoue si OS kit / MCP / métier / archi incomplets.
 * Critère : composition OS réelle (hosts construits), pas seulement existsSync.
 */
import { spawn } from "node:child_process";
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
  console.log(`[${ok ? "PASS" : "FAIL"}] ${id} — ${detail || ""}`);
}

const toolEnv = {
  ...process.env,
  CREEZIO_ROOT: creezioRoot,
  NODE_PATH: [
    path.join(root, "node_modules"),
    path.join(creezioRoot, "node_modules"),
  ].join(path.delimiter),
  PATH: [
    path.join(creezioRoot, "node_modules", ".bin"),
    process.env.PATH || "",
  ].join(path.delimiter),
};

// Archi
const main = fs.readFileSync(path.join(root, "src/electron/main.ts"), "utf8");
record(
  "arch.main-thin",
  /startBrandDesktop/.test(main) && main.split("\n").length < 45,
  `lines=${main.split("\n").length}`,
);
record(
  "arch.no-host-stack-brand",
  !fs.existsSync(path.join(root, "src/lib/host-stack.ts")) &&
    !fs.existsSync(path.join(root, "src/electron/host-stack.ts")),
  "hosts dans @creezio/app-runtime",
);
record(
  "arch.compose-in-kit",
  fs.existsSync(
    path.join(creezioRoot, "packages/app-runtime/src/compose-brand-os.ts"),
  ),
  "composeBrandOs",
);

// Build
const { spawnSync } = await import("node:child_process");
const build = spawnSync("npm", ["run", "build:electron"], {
  cwd: root,
  encoding: "utf8",
  env: toolEnv,
  shell: true,
});
record("build.electron", build.status === 0, build.status === 0 ? "ok" : build.stderr);

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "tf3-hard-"));
const port = 19400 + Math.floor(Math.random() * 500);
const child = spawn(process.execPath, [path.join(root, "scripts/brand-kernel-harness.mjs")], {
  env: {
    ...toolEnv,
    METIER_DATA_DIR: dataDir,
    METIER_PORT: String(port),
    MEILI_SKIP_INDEX: "1",
  },
  stdio: ["ignore", "pipe", "pipe"],
});

async function waitHealth() {
  for (let i = 0; i < 120; i++) {
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

async function json(method, urlPath, body, headers = {}) {
  const res = await fetch(`http://127.0.0.1:${port}${urlPath}`, {
    method,
    headers: { "content-type": "application/json", ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

try {
  const healthy = await waitHealth();
  record("api.health", healthy, `port ${port}`);
  if (!healthy) throw new Error("harness down");

  const osStatus = await json("GET", "/api/v1/os/status");
  record(
    "os.status",
    osStatus.status === 200 &&
      osStatus.data.hosts?.hermes &&
      osStatus.data.hosts?.n8n &&
      osStatus.data.hosts?.tunnel,
    JSON.stringify(osStatus.data.hosts || osStatus.data),
  );

  const hosts = await json("GET", "/api/v1/os/hosts");
  record(
    "os.hosts-constructed",
    hosts.status === 200 &&
      hosts.data.constructed?.hermes &&
      hosts.data.constructed?.n8n &&
      hosts.data.constructed?.tunnel &&
      (hosts.data.constructed.hermesMethods || []).includes("startHermes") &&
      (hosts.data.constructed.n8nMethods || []).includes("startN8n") &&
      (hosts.data.constructed.tunnelMethods || []).length > 0,
    `hermes=${(hosts.data.constructed?.hermesMethods || []).slice(0, 3)} n8n=${(hosts.data.constructed?.n8nMethods || []).slice(0, 3)}`,
  );

  const mcp = await json("GET", "/mcp");
  const toolNames = (mcp.data.tools || []).map((t) => t.name);
  record(
    "mcp.http-list",
    mcp.status === 200 && toolNames.length >= 3,
    `n=${toolNames.length}`,
  );
  record(
    "mcp.os-tool",
    toolNames.includes("module.os.status"),
    toolNames.filter((n) => n.includes("os") || n.includes("platform")).join(","),
  );

  const tasks = await json("GET", "/api/v1/platform/platform-tasks/list", undefined, {
    "x-creezio-user-id": "proof-user",
  });
  record("os.platform-tasks", tasks.status === 200 && Array.isArray(tasks.data.tasks), `status=${tasks.status}`);

  const mails = await json("GET", "/api/v1/platform/platform-mails/list", undefined, {
    "x-creezio-user-id": "proof-user",
  });
  record("os.platform-mails", mails.status === 200 && Array.isArray(mails.data.mails), `status=${mails.status}`);

  // Métier cœur
  const f = await json("POST", "/api/v1/modules/fournisseurs", { nom: "Hard Proof Metro" });
  record("metier.fournisseur", f.status < 300 && f.data.id, f.data.id || f.data.error);
  const p = await json("POST", "/api/v1/modules/produits", {
    nom: "Carotte Hard",
    fournisseur_id: f.data.id,
  });
  await json("POST", "/api/v1/modules/prix", {
    produit_id: p.data.id,
    fournisseur_id: f.data.id,
    montant: 1.2,
    promo: true,
  });
  await json("POST", "/api/v1/modules/panier_lignes", {
    produit_id: p.data.id,
    fournisseur_id: f.data.id,
    quantite: 4,
  });
  const cmd = await json("POST", "/api/v1/modules/commandes/from-panier", {
    fournisseur_id: f.data.id,
  });
  record("metier.commande", cmd.status < 300 && cmd.data.id, cmd.data.id || JSON.stringify(cmd.data));

  const opt = await json("POST", "/api/v1/modules/optimiser/suggest", {
    produit_id: p.data.id,
  });
  record(
    "metier.optimiser",
    opt.status < 300 && Array.isArray(opt.data.suggestions),
    `status=${opt.status}`,
  );

  for (const [id, pth] of [
    ["metier.dispatch", "/api/v1/modules/dispatch/candidates"],
    ["metier.skus", "/api/v1/modules/skus"],
    ["metier.promotions", "/api/v1/modules/promotions"],
    ["metier.site", `/api/v1/modules/site/${f.data.id}`],
    ["metier.data-mapping", "/api/v1/modules/data-mapping"],
  ]) {
    const r = await json("GET", pth);
    record(id, r.status < 300, `status=${r.status}`);
  }
} catch (err) {
  record("suite", false, err instanceof Error ? err.message : String(err));
} finally {
  child.kill("SIGTERM");
}

const distOk =
  fs.existsSync(path.join(root, "dist-electron")) &&
  fs.readdirSync(path.join(root, "dist-electron")).some((f) => /AppImage/i.test(f));
record("build.appimage", distOk, distOk ? "AppImage présent" : "manquant");

const passed = checks.filter((c) => c.ok).length;
const failed = checks.filter((c) => !c.ok).length;
const missionOk = failed === 0;
const report = {
  at: new Date().toISOString(),
  kind: "proof-e2e-hard",
  mission: missionOk ? "SUCCESS" : "FAILURE",
  passed,
  failed,
  checks,
};
const md = [
  `# Preuve E2E dure TempoFlow3`,
  ``,
  `**Mission : ${report.mission}** (${passed} pass / ${failed} fail)`,
  ``,
  `| Check | Result | Detail |`,
  `|-------|--------|--------|`,
  ...checks.map(
    (c) => `| \`${c.id}\` | ${c.ok ? "✅" : "❌"} | ${c.detail.replace(/\|/g, "/")} |`,
  ),
  ``,
].join("\n");

fs.writeFileSync(path.join(artifacts, "oracle-hard.json"), JSON.stringify(report, null, 2));
fs.writeFileSync(path.join(artifacts, "oracle-hard.md"), md);
fs.writeFileSync(
  path.join(creezioRoot, "docs/experiences/tempoflow3/PREUVE-HARD-RUN.md"),
  md,
);
console.log(`\nMISSION=${report.mission} pass=${passed} fail=${failed}`);
process.exit(missionOk ? 0 : 2);
