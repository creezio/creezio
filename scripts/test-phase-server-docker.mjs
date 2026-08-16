/**
 * Gate — artefacts docker/server + CLI creezio server-docker.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dockerServer = path.join(root, "docker/server");

test("docker/server artefacts présents", () => {
  for (const f of [
    "Dockerfile",
    "docker-compose.yml",
    "brand.dockerignore",
    "creezio-open-url.sh",
    "README.md",
    "AGENTS.md",
  ]) {
    assert.ok(
      fs.existsSync(path.join(dockerServer, f)),
      `manquant: docker/server/${f}`,
    );
  }
  const opener = fs.readFileSync(
    path.join(dockerServer, "creezio-open-url.sh"),
    "utf8",
  );
  assert.match(opener, /firefox/);
  assert.match(opener, /gio/);
  assert.match(opener, /xdg-open/);
  const df = fs.readFileSync(path.join(dockerServer, "Dockerfile"), "utf8");
  assert.match(df, /brand-kernel-harness/);
  assert.match(df, /CREEZIO_HTTP_HOST/);
  // Chantier embeds : Meili Linux embarqué dans l'image (plus de sql-fallback).
  assert.match(df, /meilisearch-linux-amd64/);
  assert.match(df, /MEILI_BINARY=\/opt\/creezio\/bin\/meilisearch/);
  // Image modulaire par variant : base (défaut) + browser sidecar IA
  // (chromium + xvfb + fonts, env CREEZIO_BROWSER_SIDECAR).
  assert.match(df, /ARG SERVER_VARIANT=base/);
  assert.match(df, /AS runtime-base/);
  assert.match(df, /FROM runtime-base AS runtime-browser/);
  assert.match(df, /FROM runtime-\$\{SERVER_VARIANT\} AS runtime/);
  assert.match(df, /chromium xvfb/);
  assert.match(df, /fonts-liberation/);
  assert.match(df, /libnss3/);
  assert.match(df, /CREEZIO_BROWSER_SIDECAR=1/);
  assert.match(df, /CREEZIO_CHROMIUM_BIN=\/usr\/bin\/chromium/);
  assert.match(df, /CREEZIO_BROWSER_DATA_DIR=\/data\/browser/);
  // Mode npm : npm ci strict (lock garanti par ensure-server-lock) + secret
  // BuildKit pour le token GitHub Packages (jamais en ARG/ENV ni historique).
  assert.match(df, /npm ci --omit=dev/);
  assert.match(df, /--mount=type=secret,id=CREEZIO_NPM_TOKEN/);
  assert.match(df, /--workspace/);
  assert.doesNotMatch(df, /npm install --omit=dev|COPY vendor/);
  // Pas de domaine marque dans l'image générique.
  assert.doesNotMatch(df, /TF3_|TEMPOFLOW|CERTIVAN|FIDU/);
  const compose = fs.readFileSync(
    path.join(dockerServer, "docker-compose.yml"),
    "utf8",
  );
  assert.match(compose, /name:\s*creezio-servers/);
  assert.match(compose, /server-1/);
  assert.match(compose, /server-2/);
  assert.doesNotMatch(compose, /server-[a-z]\b/);
  assert.match(compose, /SERVER_1_PORT/);
  assert.match(compose, /SERVER_2_PORT/);
  // Sécurité : ports publiés sur loopback par défaut (opt-in SERVER_BIND).
  assert.match(compose, /\$\{SERVER_BIND:-127\.0\.0\.1\}:\$\{SERVER_1_PORT:-18791\}/);
  assert.match(compose, /\$\{SERVER_BIND:-127\.0\.0\.1\}:\$\{SERVER_2_PORT:-18792\}/);
  // Build 100% in-image (dockerignore v5) : sources server/ + server/ui
  // dans le contexte ; artefacts hôte (node_modules, .next, build) exclus —
  // l'image rebuild tout, zéro dépendance au node/npm de l'hôte.
  const di = fs.readFileSync(
    path.join(dockerServer, "brand.dockerignore"),
    "utf8",
  );
  assert.match(di, /creezio-dockerignore v5/);
  assert.doesNotMatch(di, /!vendor\//);
  assert.match(di, /^\*\*\/node_modules$/m, "node_modules hôte exclus du contexte");
  assert.match(di, /^\*\*\/\.next$/m, ".next hôte exclu du contexte");
  assert.match(di, /^server\/build$/m, "build hôte exclu du contexte");
  assert.doesNotMatch(di, /^\*\*\/ui$/m, "sources ui exclues — requises in-image");
  assert.doesNotMatch(di, /^\*\*\/src$/m, "sources src exclues — requises in-image");
  assert.doesNotMatch(
    di,
    /\.\.\/\.\.\/node_modules/,
    "artefacts standalone copiés depuis le contexte (v4) — v5 = COPY --from",
  );
  // Dockerfile : le stage brand-build produit build/electron + standalone.
  // ELECTRON_SKIP_BINARY_DOWNLOAD dans deps ET brand-build : electron
  // atterrit dans l arbre prod via le lock (dev=false) ; son postinstall
  // telecharge ~100 Mo sur CDN GitHub flaky (vecu tempoflow 2026-08-12).
  assert.match(df, /ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1[\s\S]*ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1/);
  assert.match(df, /NPM_CONFIG_FETCH_RETRIES=5/);
  assert.match(df, /FROM node:22-bookworm-slim AS brand-build/);
  assert.match(df, /npm run build:runtime --prefix/);
  assert.match(df, /npm run build:ui --prefix/);
  assert.match(df, /COPY --from=brand-build \/app\/\$\{SERVER_DIR\}\/build /);
  assert.match(
    df,
    /COPY --from=brand-build \/app\/\$\{SERVER_DIR\}\/ui\/\.next\/standalone /,
  );
});

test("CLI creezio server-docker help", () => {
  const r = spawnSync(
    process.execPath,
    [path.join(root, "packages/factory/bin/creezio.js"), "server-docker", "--help"],
    { encoding: "utf8" },
  );
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout, /server-docker/);
  assert.match(r.stdout, /build/);
  assert.match(r.stdout, /proof/);
  assert.match(r.stdout, /SERVER_1_PORT/);
  assert.match(r.stdout, /Server-\{N\}|\.desktop/);
});

test("CLI source : instances numériques + raccourcis bureau", () => {
  const src = fs.readFileSync(
    path.join(root, "packages/factory/src/server-docker-cli.ts"),
    "utf8",
  );
  assert.match(src, /server-1/);
  assert.match(src, /server-2/);
  assert.match(src, /writeServerDesktopShortcuts/);
  assert.match(src, /ensureCreezioOpenUrl/);
  assert.match(src, /writeOpenCreezioServerN/);
  assert.match(src, /open-creezio-server-/);
  assert.match(src, /creezio-open-url/);
  assert.match(src, /markDesktopTrusted|metadata::trusted/);
  assert.match(src, /StartupNotify=false/);
  assert.match(src, /Desktop/);
  assert.match(src, /Bureau/);
  // Interdit les instances compose en lettres (server-a) — sans matcher
  // les identifiants légitimes type "server-admin".
  assert.doesNotMatch(src, /server-a\b|SERVER_A_PORT/);
  // Plus d'Exec .desktop = xdg-open seul (erreur « No such file »).
  assert.doesNotMatch(src, /Exec=\$?\{?xdg-open/);
  assert.doesNotMatch(src, /`xdg-open '/);
  const sh = fs.readFileSync(
    path.join(root, "docker/server/creezio-open-url.sh"),
    "utf8",
  );
  assert.match(sh, /\.local\/firefox\/firefox/);
  assert.match(sh, /open-server\.log/);
  assert.match(sh, /\/snap\/bin\/firefox/);
});

test("listenBrandOsHttp exporte resolveBrandOsHttpHost", () => {
  const src = fs.readFileSync(
    path.join(root, "packages/app-runtime/src/listen-brand-os-http.ts"),
    "utf8",
  );
  assert.match(src, /export function resolveBrandOsHttpHost/);
  assert.match(src, /CREEZIO_HTTP_HOST/);
});

test("CLI registre d'instances : create/start/stop/rm/logs/ls/update/backup + admin", () => {
  const r = spawnSync(
    process.execPath,
    [path.join(root, "packages/factory/bin/creezio.js"), "server-docker", "--help"],
    { encoding: "utf8" },
  );
  assert.equal(r.status, 0, r.stderr || r.stdout);
  for (const sub of [
    "create",
    "start",
    "stop",
    "rm",
    "logs",
    "ls",
    "update",
    "backup",
    "admin",
  ]) {
    assert.match(r.stdout, new RegExp(`\\b${sub}\\b`), `help sans ${sub}`);
  }
  assert.match(r.stdout, /--backup/);
  assert.match(r.stdout, /PAS de nouveau tar\.gz|pas de nouveau tar/);
  assert.match(r.stdout, /servers\.json/);
  assert.match(r.stdout, /127\.0\.0\.1/);
  assert.match(r.stdout, /boot-status/);
  assert.match(r.stdout, /fail-closed|hostname public|CREEZIO_TUNNEL_LOCAL=1/);
  assert.match(r.stdout, /CREEZIO_OWNER_EMAIL/);

  const reg = fs.readFileSync(
    path.join(root, "packages/factory/src/server-docker-registry.ts"),
    "utf8",
  );
  assert.match(reg, /export function loadServerRegistry/);
  assert.match(reg, /export (async )?function allocateServerPort/);
  assert.match(reg, /export function buildDockerRunArgs/);
  assert.match(reg, /creezio-server-\$\{brandId\}:local/);
  assert.match(reg, /creezio\.server/);
  assert.match(reg, /18790/);
  // Variant browser : image suffixée, shm ≥ 1 Go, label admin.
  assert.match(reg, /-browser:local/);
  assert.match(reg, /--shm-size=1g/);
  assert.match(reg, /creezio\.variant/);
  const cli = fs.readFileSync(
    path.join(root, "packages/factory/src/server-docker-cli.ts"),
    "utf8",
  );
  assert.match(cli, /--browser/);
  assert.match(cli, /SERVER_VARIANT/);
  assert.match(cli, /backup: !!args\.backup/);
  assert.doesNotMatch(cli, /noBackup|--no-backup/);
  const lib = fs.readFileSync(
    path.join(
      root,
      "packages/observability/fleet-collector/server-lib.mjs",
    ),
    "utf8",
  );
  assert.match(lib, /backup = false/);
  assert.match(lib, /pas de nouveau backup \(défaut\)/);
  // 0.10.3 : update ne droppe plus un sidecar / hostname public.
  assert.match(lib, /resolveStackUpdatePolicy/);
  assert.match(lib, /preserve-sidecar/);
  assert.match(cli, /allowDropSidecar: true/);
  assert.match(cli, /Jamais de nouvelle adresse à l'update/);
  // Backup via tar en conteneur éphémère (volume root-owned / backups/
  // root-owned : le tar hôte user serait incomplet ou impossible — vécu
  // tempoflow 2026-08-12). Socket docker = seul privilège requis.
  assert.match(lib, /conteneur éphémère/);
  assert.match(lib, /"run",\s*"--rm"/);
  assert.match(lib, /chown \$\{uid\}:\$\{gid\}/);
  assert.doesNotMatch(lib, /pruneBackups\(brandRoot, inst\.name\)/);
  const admin = fs.readFileSync(
    path.join(
      root,
      "packages/observability/fleet-collector/server-admin.mjs",
    ),
    "utf8",
  );
  assert.match(admin, /body\.backup === true/);
});

test("boot progress headless : reporter + early-listen + boot-status", () => {
  const bp = fs.readFileSync(
    path.join(root, "packages/app-runtime/src/boot-progress.ts"),
    "utf8",
  );
  assert.match(bp, /createBootProgressReporter/);
  assert.match(bp, /initOpsJournal/);
  assert.match(bp, /boot-step/); // JSONL docker logs
  assert.match(bp, /SplashViewModel/); // même modèle que le splash desktop

  const early = fs.readFileSync(
    path.join(root, "packages/app-runtime/src/listen-brand-boot-http.ts"),
    "utf8",
  );
  assert.match(early, /\/api\/v1\/os\/boot-status/);
  assert.match(early, /existingServer|listenBrandOsHttp|handoff/i);

  const listen = fs.readFileSync(
    path.join(root, "packages/app-runtime/src/listen-brand-os-http.ts"),
    "utf8",
  );
  assert.match(listen, /\/api\/v1\/os\/boot-status/);
  assert.match(listen, /existingServer/);
  assert.match(listen, /uiProxyTarget/);
  // Ready assoupli en mode Docker (CREEZIO_SKIP_KIT_BINARIES) — vendors soft.
  assert.match(listen, /skipKitBinaries/);
  assert.match(listen, /MEILI_BINARY/);

  const harness = fs.readFileSync(
    path.join(root, "packages/app-runtime/src/start-brand-kernel-harness.ts"),
    "utf8",
  );
  assert.match(harness, /createBootProgressReporter/);
  assert.match(harness, /listenBrandBootHttp/);
  assert.match(harness, /startBrandUiPlane/);
});
