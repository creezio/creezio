#!/usr/bin/env node
/**
 * Preuve dure TempoFlow3 — échoue si OS kit / MCP / métier / archi incomplets.
 * Critère : composition OS réelle (hosts construits), pas seulement existsSync.
 */
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

// Binaires OS kit (Meili / cloudflared) — hors marque
const ensureBins = spawnSync(
  process.execPath,
  [
    path.join(
      creezioRoot,
      "packages/electron-shell/scripts/ensure-kit-binaries.mjs",
    ),
  ],
  { encoding: "utf8", env: toolEnv },
);
record(
  "arch.kit-binaries",
  ensureBins.status === 0 &&
    fs.existsSync(
      path.join(creezioRoot, "packages/electron-shell/resources/bin/meili"),
    ) &&
    fs.existsSync(
      path.join(
        creezioRoot,
        "packages/electron-shell/resources/bin/cloudflared",
      ),
    ),
  ensureBins.status === 0 ? "meili+cloudflared" : ensureBins.stderr || ensureBins.stdout,
);

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
  "arch.installBrandOsDesktop",
  fs.existsSync(path.join(creezioRoot, "packages/app-runtime/src/install-brand-os-desktop.ts")),
  "installBrandOsDesktop kit",
);
record(
  "arch.compose-in-kit",
  fs.existsSync(
    path.join(creezioRoot, "packages/app-runtime/src/compose-brand-os.ts"),
  ),
  "composeBrandOs",
);

// Build
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
    // Index Meili autorisé si binaire kit présent.
    MEILI_SKIP_INDEX: process.env.MEILI_SKIP_INDEX || "0",
    // Warm fait par les checks API ensure/start (pas au boot harness).
    CREEZIO_NATIVE_WARM: "0",
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
  const createdTask = await json("POST", "/api/v1/platform/platform-tasks/create", { title: "Proof task", body: "hard" }, { "x-creezio-user-id": "proof-user" });
  record("os.tasks-create", createdTask.status < 300 && createdTask.data.task?.id, createdTask.data.task?.id || createdTask.data.error);
  record("os.platform-tasks", tasks.status === 200 && Array.isArray(tasks.data.tasks), `status=${tasks.status}`);

  const mails = await json("GET", "/api/v1/platform/platform-mails/list", undefined, {
    "x-creezio-user-id": "proof-user",
  });
  record("os.platform-mails", mails.status === 200 && Array.isArray(mails.data.mails), `status=${mails.status}`);

  // Vendor OS = kit @creezio/electron-shell (interdit dans la marque)
  const kitVendorRoot = path.join(
    creezioRoot,
    "packages/electron-shell/resources/vendor",
  );
  record(
    "arch.kit-vendor-hermes",
    fs.existsSync(path.join(kitVendorRoot, "hermes-agent/runtime-manifest.json")),
    path.join(kitVendorRoot, "hermes-agent"),
  );
  record(
    "arch.kit-vendor-n8n",
    fs.existsSync(path.join(kitVendorRoot, "n8n/runtime-manifest.json")),
    path.join(kitVendorRoot, "n8n"),
  );
  record(
    "arch.no-brand-vendor",
    !fs.existsSync(path.join(root, "resources/vendor")),
    "vendor OS hors marque",
  );

  const hermes = await json("GET", "/api/v1/os/hermes/status");
  record("os.hermes-status", hermes.status === 200 && hermes.data.ok, `binary=${hermes.data.binary}`);
  const n8n = await json("GET", "/api/v1/os/n8n/status");
  record("os.n8n-status", n8n.status === 200 && n8n.data.ok, `entry=${n8n.data.entry}`);

  // Natif réel via kit : ensure + start
  const n8nEnsure = await json("POST", "/api/v1/os/n8n/ensure", {});
  record(
    "os.n8n-ensure",
    n8nEnsure.status < 300 && n8nEnsure.data.ok === true && Boolean(n8nEnsure.data.entry),
    n8nEnsure.data.entry || n8nEnsure.data.detail || n8nEnsure.data.error,
  );
  // n8n start : premier boot = migrations longues — retry
  let n8nStart = await json("POST", "/api/v1/os/n8n/start", {});
  for (let i = 0; i < 8 && !(n8nStart.data?.running === true); i++) {
    await new Promise((r) => setTimeout(r, 5000));
    n8nStart = await json("POST", "/api/v1/os/n8n/start", {});
  }
  record(
    "os.n8n-start",
    n8nStart.status < 300 && n8nStart.data.ok === true && n8nStart.data.running === true,
    n8nStart.data.entry ||
      n8nStart.data.error ||
      n8nStart.data.status?.detail ||
      JSON.stringify(n8nStart.data.status || {}),
  );

  const hermesEnsure = await json("POST", "/api/v1/os/hermes/ensure", {});
  record(
    "os.hermes-ensure",
    hermesEnsure.status < 300 &&
      hermesEnsure.data.ok === true &&
      Boolean(hermesEnsure.data.binary),
    hermesEnsure.data.binary ||
      hermesEnsure.data.detail ||
      hermesEnsure.data.error ||
      `status=${hermesEnsure.status}`,
  );
  if (hermesEnsure.data?.ok && hermesEnsure.data?.binary) {
    const hermesStart = await json("POST", "/api/v1/os/hermes/start", {});
    record(
      "os.hermes-start",
      hermesStart.status < 300 && hermesStart.data.ok === true,
      hermesStart.data.binary || hermesStart.data.error || "started",
    );
  } else {
    record("os.hermes-start", false, "skip — ensure sans binary");
  }

  const tunnel = await json("GET", "/api/v1/os/tunnel/status");
  record(
    "os.tunnel-status",
    tunnel.status === 200 && tunnel.data.ok && Boolean(tunnel.data.publicMcp),
    `mcp=${tunnel.data.publicMcp}`,
  );
  // MCP public joignable (surface locale kit ou tunnel)
  if (tunnel.data.publicMcp) {
    try {
      const mcpUrl = new URL(tunnel.data.publicMcp);
      const mcpRes = await fetch(mcpUrl, { method: "GET" });
      const mcpBody = await mcpRes.json().catch(() => ({}));
      record(
        "os.mcp-public",
        mcpRes.status === 200 &&
          (Array.isArray(mcpBody.tools) || mcpBody.ok === true),
        `status=${mcpRes.status} tools=${mcpBody.tools?.length ?? "?"}`,
      );
    } catch (e) {
      record(
        "os.mcp-public",
        false,
        e instanceof Error ? e.message : String(e),
      );
    }
  } else {
    const local = await json("POST", "/api/v1/os/tunnel/local", {
      localPort: port,
    });
    record(
      "os.tunnel-local",
      local.status < 300 && Boolean(local.data.publicMcp),
      local.data.publicMcp || local.data.error,
    );
  }

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
  const apply = await json("POST", "/api/v1/modules/optimiser/apply", {
    propositions: opt.data.suggestions,
  });
  record(
    "metier.optimiser-apply",
    apply.status < 300 && apply.data.applied === true,
    `status=${apply.status}`,
  );

  // Stack → panier (mini-PRD 07)
  const stackAdd = await json("POST", "/api/v1/modules/stack", {
    produit_id: p.data.id,
  });
  record(
    "metier.stack-add",
    stackAdd.status < 300 && stackAdd.data.in_stack === true,
    stackAdd.data.error || "ok",
  );
  const stackList = await json("GET", "/api/v1/modules/stack");
  record(
    "metier.stack-list",
    stackList.status === 200 &&
      Array.isArray(stackList.data.items) &&
      stackList.data.items.some((x) => x.produit_id === p.data.id),
    `n=${stackList.data.items?.length}`,
  );
  const stackPanier = await json("POST", `/api/v1/modules/stack/${p.data.id}/panier`, {
    quantite: 1,
  });
  record(
    "metier.stack-panier",
    stackPanier.status < 300 && stackPanier.data.ok === true,
    stackPanier.data.error || "ok",
  );

  // Relevés → apply-prix (mini-PRD 08)
  const p2 = await json("POST", "/api/v1/modules/produits", {
    nom: "Navet Hard",
    fournisseur_id: f.data.id,
  });
  const p3 = await json("POST", "/api/v1/modules/produits", {
    nom: "Poireau Hard",
    fournisseur_id: f.data.id,
  });
  const releve = await json("POST", "/api/v1/modules/releves", {
    fournisseur_id: f.data.id,
    source: "magasin",
    lignes: [
      { produit_id: p.data.id, montant: 1.55, libelle: "carotte" },
      { produit_id: p2.data.id, montant: 0.9, libelle: "navet" },
      { produit_id: p3.data.id, montant: 1.1, libelle: "poireau" },
    ],
  });
  record(
    "metier.releve-create",
    releve.status < 300 && releve.data.lignes?.length === 3,
    `lignes=${releve.data.lignes?.length} id=${releve.data.id}`,
  );
  const applyPrix = await json(
    "POST",
    `/api/v1/modules/releves/${releve.data.id}/apply-prix`,
    {},
  );
  record(
    "metier.releve-apply-prix",
    applyPrix.status < 300 &&
      applyPrix.data.prix_crees === 3 &&
      String(applyPrix.data.tracabilite || "").includes("releve:"),
    applyPrix.data.tracabilite || applyPrix.data.error,
  );

  // Scan → validate (mini-PRD 09)
  const scan = await json("POST", "/api/v1/modules/scan/start", {
    notes: "proof hard",
    lignes_texte: [`ScanProof A|3.3|${f.data.id}`, `ScanProof B|4.4|${f.data.id}`],
  });
  record(
    "metier.scan-start",
    scan.status < 300 && scan.data.propositions?.length >= 2,
    `props=${scan.data.propositions?.length}`,
  );
  const scanVal = await json("POST", `/api/v1/modules/scan/${scan.data.id}/validate`, {});
  record(
    "metier.scan-validate",
    scanVal.status < 300 &&
      scanVal.data.statut === "valide" &&
      (scanVal.data.written?.prix || 0) >= 2,
    JSON.stringify(scanVal.data.written || scanVal.data.error),
  );
  const scanList = await json("GET", "/api/v1/modules/scan");
  record(
    "metier.scan-list",
    scanList.status === 200 && Array.isArray(scanList.data.items),
    `n=${scanList.data.items?.length}`,
  );

  // Archi shell runtime par défaut
  record(
    "arch.desktop-shell-runtime-default",
    /desktopShell:[\s\S]*\? "window" : "runtime"/.test(main) ||
      /TEMPOFLOW3_DESKTOP_SHELL === "window"/.test(main),
    "runtime par défaut",
  );

  const f2 = await json("POST", "/api/v1/modules/fournisseurs", {
    nom: "Hard Proof Promocash",
  });
  const pAlt = await json("POST", "/api/v1/modules/produits", {
    nom: "Carotte Alt",
    fournisseur_id: f2.data.id,
  });
  await json("POST", "/api/v1/modules/prix", {
    produit_id: pAlt.data.id,
    fournisseur_id: f2.data.id,
    montant: 0.9,
  });
  await json("POST", "/api/v1/modules/panier_lignes", {
    produit_id: pAlt.data.id,
    fournisseur_id: f2.data.id,
    quantite: 2,
  });
  const disp = await json("GET", "/api/v1/modules/dispatch/candidates");
  record(
    "metier.dispatch",
    disp.status < 300 && (disp.data.candidates?.length || 0) >= 1,
    `n=${disp.data.candidates?.length}`,
  );
  const dispApply = await json("POST", "/api/v1/modules/dispatch/apply", {
    fournisseur_id: f.data.id,
  });
  record(
    "metier.dispatch-apply",
    dispApply.status < 300 && dispApply.data.applied === true,
    `items=${dispApply.data.items?.length} removed=${dispApply.data.removed}`,
  );

  for (const [id, pth] of [
    ["metier.skus", "/api/v1/modules/skus"],
    ["metier.promotions", "/api/v1/modules/promotions"],
    ["metier.site", `/api/v1/modules/site/${f.data.id}`],
    ["metier.data-mapping", "/api/v1/modules/data-mapping"],
    ["metier.dashboard", "/api/v1/modules/dashboard"],
  ]) {
    const r = await json("GET", pth);
    record(id, r.status < 300, `status=${r.status}`);
  }

  // Pages UI Next critiques présentes (plus de stubs JSON-only pour le cœur)
  for (const rel of [
    "ui/app/dashboard/page.tsx",
    "ui/app/dispatch/page.tsx",
    "ui/app/promotions/page.tsx",
    "ui/app/skus/page.tsx",
    "ui/app/stack/page.tsx",
  ]) {
    const src = fs.readFileSync(path.join(root, rel), "utf8");
    record(
      `ui.${rel.split("/").slice(-2).join("/")}`,
      /use client/.test(src) && !/JSON\.stringify\(data/.test(src),
      "interactive",
    );
  }
} catch (err) {
  record("suite", false, err instanceof Error ? err.message : String(err));
} finally {
  child.kill("SIGTERM");
}

const distOk =
  fs.existsSync(path.join(root, "dist-electron")) &&
  fs.readdirSync(path.join(root, "dist-electron")).some((f) => /AppImage/i.test(f));
record(
  "ui.next-standalone",
  fs.existsSync(path.join(root, "ui/.next/standalone/server.js")),
  fs.existsSync(path.join(root, "ui/.next/standalone/server.js"))
    ? "Next standalone prêt"
    : "lancer npm run build:ui",
);
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
