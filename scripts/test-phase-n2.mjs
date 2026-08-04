#!/usr/bin/env node
/**
 * Phase N2 — Jumeaux hosts → @creezio/electron-shell (kit only).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hostDir = path.join(root, "packages/electron-shell/src/host");
const idxPath = path.join(root, "packages/electron-shell/src/index.ts");
const PAPERCLIP_RE = /paperclipApi|startPaperclip\b|paperclip-launcher/;

const REQUIRED = [
  "crash-reporter.ts",
  "web-telemetry.ts",
  "bridge-client.ts",
  "server-launcher.ts",
  "ai-workspace/bindings.ts",
  "ai-workspace/manager.ts",
  "ai-workspace/actions.ts",
  "ai-workspace/screencast.ts",
  "ai-workspace/profile-window.ts",
  "meili/index-schema.ts",
  "meili/coherence.ts",
  "meili/coherence-db.ts",
  "meili/indexer.ts",
];

test("N2.1 PHASE-N2.md + PLAN-N N2 livré", () => {
  const phase = fs.readFileSync(path.join(root, "docs/archive/PHASE-N2.md"), "utf8");
  assert.match(phase, /Jumeaux hosts/i);
  assert.match(phase, /16b61f7/);
  assert.match(phase, /configureAiWorkspaceHost|configureMeiliCoherencePaths/);
  assert.match(phase, /Sign-off|gates verts/i);
  assert.match(phase, /test-phase-n2/);
  assert.match(phase, /wc -l|LOC/i);

  const plan = fs.readFileSync(path.join(root, "docs/archive/PLAN-N.md"), "utf8");
  assert.match(plan, /## N2 — Jumeaux hosts → kit/);
  assert.match(plan, /PHASE-N2\.md/);
  assert.match(plan, /Done|livr/i);
});

test("N2.2 modules host présents", () => {
  for (const rel of REQUIRED) {
    const p = path.join(hostDir, rel);
    assert.ok(fs.existsSync(p), `manquant: ${rel}`);
    const loc = fs.readFileSync(p, "utf8").split("\n").length;
    assert.ok(loc > 15, `${rel} trop court: ${loc}`);
  }
});

test("N2.3 bindings + exports publics index.ts", () => {
  const bind = fs.readFileSync(
    path.join(hostDir, "ai-workspace/bindings.ts"),
    "utf8",
  );
  assert.match(bind, /export function configureAiWorkspaceHost/);
  assert.match(bind, /aiPartitionSlug/);
  assert.match(bind, /sessionCookieName/);

  const coh = fs.readFileSync(path.join(hostDir, "meili/coherence.ts"), "utf8");
  assert.match(coh, /export function configureMeiliCoherencePaths/);
  assert.match(coh, /export async function decideMeiliReady/);

  const crash = fs.readFileSync(
    path.join(hostDir, "crash-reporter.ts"),
    "utf8",
  );
  assert.match(crash, /export function configureCrashReporter/);
  assert.doesNotMatch(crash, /crm\.tempoflow\.fr\/crash/);

  const idx = fs.readFileSync(idxPath, "utf8");
  for (const sym of [
    "configureCrashReporter",
    "instrumentWebContents",
    "BridgeClient",
    "startBrandNextServer",
    "configureAiWorkspaceHost",
    "AiWorkspaceManager",
    "executeAiWorkspaceAction",
    "configureMeiliCoherencePaths",
    "decideMeiliReady",
    "runIndexation",
  ]) {
    assert.match(idx, new RegExp(sym), `export manquant: ${sym}`);
  }

  assert.ok(
    fs.existsSync(
      path.join(
        root,
        "packages/electron-shell/dist/host/ai-workspace/manager.js",
      ),
    ),
    "dist ai-workspace manquant — rebuild electron-shell",
  );
  assert.ok(
    fs.existsSync(
      path.join(root, "packages/electron-shell/dist/host/meili/indexer.js"),
    ),
    "dist meili indexer manquant — rebuild electron-shell",
  );
});

test("N2.4 embeds B2 toujours SoT platform-core + sandbox kit", () => {
  const embeds = path.join(root, "packages/platform-core/src/embeds");
  for (const name of [
    "hermes-embed.ts",
    "n8n-embed.ts",
    "embed-env-catalog.ts",
    "embed-stack-hooks.ts",
  ]) {
    assert.ok(fs.existsSync(path.join(embeds, name)), `embed manquant: ${name}`);
  }
  assert.ok(
    fs.existsSync(path.join(hostDir, "sandbox/os-sandbox.ts")),
    "os-sandbox kit manquant",
  );
  assert.ok(
    fs.existsSync(path.join(hostDir, "sandbox/embed-sandbox.ts")),
    "embed-sandbox kit manquant",
  );
  const pcIdx = fs.readFileSync(
    path.join(root, "packages/platform-core/src/index.ts"),
    "utf8",
  );
  assert.match(pcIdx, /hermes-embed/);
  assert.match(pcIdx, /n8n-embed/);
});

test("N2.5 shell ipc aiWorkspace + zéro hardcode TF crash kit", () => {
  const ipc = fs.readFileSync(
    path.join(root, "packages/shell/src/ipc-channels.ts"),
    "utf8",
  );
  assert.match(ipc, /aiWorkspace/);
  assert.match(ipc, /ai-workspace:list/);

  const mgr = fs.readFileSync(
    path.join(hostDir, "ai-workspace/manager.ts"),
    "utf8",
  );
  assert.doesNotMatch(mgr, /tempoflow2_crm_session/);
  assert.doesNotMatch(mgr, /TF2_AI_SHARE_WEB_SESSIONS/);
});

test("N2.6 paperclip mort + gate dans npm test", () => {
  const pkg = fs.readFileSync(path.join(root, "package.json"), "utf8");
  assert.match(pkg, /test-phase-n2\.mjs/);

  for (const rel of REQUIRED) {
    const src = fs.readFileSync(path.join(hostDir, rel), "utf8");
    assert.doesNotMatch(src, PAPERCLIP_RE, `paperclip dans ${rel}`);
  }
});
