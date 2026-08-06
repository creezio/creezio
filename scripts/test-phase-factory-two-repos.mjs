#!/usr/bin/env node
/**
 * Gate FLOTTE — factory 2-repos : chaque marque = monorepo (server/ client/)
 * + repo ADMIN dédié `<brand>-admin` (pilotage flotte multi-VPS, sans secret).
 *
 * Partie réseau (création réelle des repos GitHub + suppression) : opt-in
 * derrière CREEZIO_GITHUB_E2E=1 (jamais dans test:kit).
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLI = path.join(ROOT, "packages/factory/bin/creezio.js");

function runCli(args, opts = {}) {
  return spawnSync(process.execPath, [CLI, ...args], {
    encoding: "utf8",
    ...opts,
  });
}

test("factory 2-repos : monorepo + repo admin dédié (sans réseau)", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "creezio-two-repos-"));
  const appDir = path.join(tmp, "proofbrand");
  try {
    const r = runCli([
      "new-app",
      "--name",
      "ProofBrand",
      "--id",
      "proofbrand",
      "--domain",
      "proofbrand.example",
      "--out",
      appDir,
      "--no-push",
      "--force",
    ]);
    assert.equal(r.status, 0, r.stderr + "\n" + r.stdout);
    assert.match(r.stdout, /--no-push/, "no-push doit être explicite");

    // Monorepo marque : plus de admin/ embarqué.
    assert.ok(fs.existsSync(path.join(appDir, "server/package.json")));
    assert.ok(fs.existsSync(path.join(appDir, "client")));
    assert.ok(!fs.existsSync(path.join(appDir, "admin")));

    // Repo admin dédié frère.
    const adminDir = `${appDir}-admin`;
    for (const f of [
      "server-admin.json",
      "fleet-hosts.json",
      "docker-compose.admin.yml",
      "README.md",
      ".env.example",
      ".gitignore",
    ]) {
      assert.ok(fs.existsSync(path.join(adminDir, f)), `admin repo: ${f}`);
    }

    // Config croisée SANS secrets : admin connaît brandId + domaine.
    const adminCfg = JSON.parse(
      fs.readFileSync(path.join(adminDir, "server-admin.json"), "utf8"),
    );
    assert.equal(adminCfg.brandId, "proofbrand");
    assert.equal(adminCfg.domain, "proofbrand.example");
    assert.ok(!("pass" in adminCfg), "jamais de pass dans la config versionnée");
    const hosts = JSON.parse(
      fs.readFileSync(path.join(adminDir, "fleet-hosts.json"), "utf8"),
    );
    assert.deepEqual(hosts.hosts, []);
    assert.ok(
      !JSON.stringify(hosts).includes("token"),
      "fleet-hosts.json versionné sans tokens",
    );
    const gitignore = fs.readFileSync(path.join(adminDir, ".gitignore"), "utf8");
    assert.match(gitignore, /docker-data\//);
    assert.match(gitignore, /^\.env$/m);

    // Le monorepo pointe vers le repo admin frère.
    const rootPkg = JSON.parse(
      fs.readFileSync(path.join(appDir, "package.json"), "utf8"),
    );
    assert.match(
      String(rootPkg.scripts["server-docker:admin"]),
      /--admin-root \.\.\/proofbrand-admin/,
    );

    // README admin : app OS + exploitation flotte.
    const readme = fs.readFileSync(path.join(adminDir, "README.md"), "utf8");
    assert.match(readme, /admin\.proofbrand\.example/);
    assert.match(readme, /ADR-admin-app-os/);
    assert.match(readme, /billing-webhook\/stripe/);

    // Repo admin = app OS Creezio COMPLÈTE en mode admin (ADR-admin-app-os).
    for (const f of [
      "server/package.json",
      "server/src/electron/main.ts",
      "server/src/electron/brand-module-api.ts",
      "server/src/electron/brand-migrations.ts",
      "server/scripts/brand-kernel-harness.mjs",
      "server/ui/app/flotte/page.tsx",
      "server/ui/app/tickets/page.tsx",
      "server/ui/app/prospects/page.tsx",
      "client/package.json",
    ]) {
      assert.ok(
        fs.existsSync(path.join(adminDir, f)),
        `app OS admin: ${f}`,
      );
    }
    const adminApi = fs.readFileSync(
      path.join(adminDir, "server/src/electron/brand-module-api.ts"),
      "utf8",
    );
    assert.match(adminApi, /createFleetAdminMount/);
    assert.match(adminApi, /createSupportAdminMount/);
    assert.match(adminApi, /createBillingWebhookMount/);
    const adminMig = fs.readFileSync(
      path.join(adminDir, "server/src/electron/brand-migrations.ts"),
      "utf8",
    );
    assert.match(adminMig, /adminMigrations\(\)/);
    const adminRootPkg = JSON.parse(
      fs.readFileSync(path.join(adminDir, "package.json"), "utf8"),
    );
    assert.equal(adminRootPkg.creezio?.appMode, "admin");
    const flottePage = fs.readFileSync(
      path.join(adminDir, "server/ui/app/flotte/page.tsx"),
      "utf8",
    );
    assert.match(flottePage, /FleetAdminClient/);
    const prospectsPage = fs.readFileSync(
      path.join(adminDir, "server/ui/app/prospects/page.tsx"),
      "utf8",
    );
    assert.match(prospectsPage, /ProspectsKanbanClient/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
    fs.rmSync(`${appDir}-admin`, { recursive: true, force: true });
  }
});

test("brand apply : mêmes 2 arbres + --admin-out custom", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "creezio-two-repos-ba-"));
  try {
    const specDir = path.join(tmp, "brand-spec");
    const init = runCli([
      "brand",
      "init",
      "--id",
      "twobrand",
      "--name",
      "TwoBrand",
      "--domain",
      "twobrand.example",
      "--out",
      specDir,
    ]);
    assert.equal(init.status, 0, init.stderr + "\n" + init.stdout);
    fs.writeFileSync(
      path.join(specDir, "product.md"),
      `# TwoBrand\n\nProduit: TwoBrand\nDomaine: twobrand.example\n\n## Vision\n\nGestion simple pour test gate factory 2-repos.\n`,
      "utf8",
    );
    const appDir = path.join(tmp, "twobrand");
    const adminDir = path.join(tmp, "custom-admin");
    const apply = runCli([
      "brand",
      "apply",
      "--spec",
      specDir,
      "--out",
      appDir,
      "--admin-out",
      adminDir,
      "--no-push",
      "--force",
    ]);
    assert.equal(apply.status, 0, apply.stderr + "\n" + apply.stdout);
    assert.ok(fs.existsSync(path.join(adminDir, "server-admin.json")));
    assert.ok(!fs.existsSync(path.join(appDir, "admin")));
    assert.match(apply.stdout, /--no-push/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test(
  "E2E GitHub : création réelle des 2 repos privés + suppression",
  { skip: process.env.CREEZIO_GITHUB_E2E !== "1" ? "opt-in CREEZIO_GITHUB_E2E=1" : false },
  async () => {
    const { resolveGithubToken, deleteRepo } = await import(
      "../packages/factory/dist/github-repos.js"
    );
    const token = resolveGithubToken([ROOT]);
    assert.ok(token, ".github-token requis pour l'E2E GitHub");
    const org = process.env.CREEZIO_GITHUB_ORG || "creezio";
    const stamp = Date.now().toString(36);
    const brandId = `gatebrand${stamp}`;
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "creezio-two-repos-e2e-"));
    const appDir = path.join(tmp, brandId);
    try {
      const r = runCli(
        [
          "new-app",
          "--name",
          "GateBrand",
          "--id",
          brandId,
          "--domain",
          `${brandId}.example`,
          "--out",
          appDir,
          "--push",
          "--github-org",
          org,
          "--force",
        ],
        { env: { ...process.env, CREEZIO_GITHUB_TOKEN: token } },
      );
      assert.equal(r.status, 0, r.stderr + "\n" + r.stdout);
      assert.match(r.stdout, new RegExp(`github\\.com/${org}/${brandId}`));
      assert.match(r.stdout, new RegExp(`github\\.com/${org}/${brandId}-admin`));
      assert.match(r.stdout, /push main/);
    } finally {
      // Nettoyage : marque jetable → suppression des 2 repos via API.
      for (const name of [brandId, `${brandId}-admin`]) {
        const ok = await deleteRepo(org, name, token).catch(() => false);
        if (!ok) console.log(`⚠ suppression ${org}/${name} à faire à la main`);
      }
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  },
);
