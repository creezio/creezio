#!/usr/bin/env node
/**
 * Phase O9p — Cutover jumeaux lib/UI TF → CV → Fidu.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dockerRoot = path.resolve(root, "..");
const PAPERCLIP_RE = /paperclipApi|startPaperclip\b|paperclip-launcher/;

const BRANDS = ["tempoflow2", "certivan-app", "fidu"];

/** Jumeaux plateforme qui doivent être absents après cutover. */
const ABSENT = [
  "src/lib/api-scopes.ts",
  "src/lib/utils.ts",
  "src/lib/server-incident.ts",
  "src/lib/fleet-tracker-client.ts",
  "src/lib/desktop-host.ts",
  "src/components/ui/button.tsx",
  "src/components/list-toolbar.tsx",
  "src/components/data-table.tsx",
  "src/components/global-search.tsx",
  "src/components/app-error-boundary.tsx",
  "src/components/workspace/types.ts",
  "src/components/workspace/keep-alive.tsx",
  "src/components/workspace/workspace-tab-bar.tsx",
  "src/components/layout/app-shell.tsx",
  "src/components/layout/page-chrome.tsx",
  "src/components/settings/desktop-n8n-settings.tsx",
  "src/components/desktop/desktop-bridge.tsx",
  "src/components/pwa/register-sw.tsx",
  "src/components/tasks/ai-activity-panel.tsx",
];

test("O9p.1 PHASE-O9p.md + PLAN-O O9p", () => {
  const phase = fs.readFileSync(path.join(root, "docs/archive/PHASE-O9p.md"), "utf8");
  assert.match(phase, /shell-ui|Cutover|Sign-off|gates verts/i);
  assert.match(phase, /test-phase-o9p/);
  assert.match(phase, /ADR-no-brand-domain|Site externe|configure/);
  assert.doesNotMatch(phase, PAPERCLIP_RE);

  const plan = fs.readFileSync(path.join(root, "docs/archive/PLAN-O.md"), "utf8");
  assert.match(plan, /## O9p — Cutover jumeaux lib\/UI/);
  assert.match(plan, /PHASE-O9p\.md/);
  assert.match(plan, /O9p — Cutover jumeaux lib\/UI.*✅|## O9p —[\s\S]*?✅/);
});

test("O9p.2 jumeaux absents ×3 + boot configure", () => {
  for (const id of BRANDS) {
    const crm = path.join(dockerRoot, id, "crm");
    for (const rel of ABSENT) {
      const p = path.join(crm, rel);
      assert.ok(!fs.existsSync(p), `${id}: encore présent ${rel}`);
    }
    const boot = path.join(crm, "src/lib/shell-ui/configure-shell-ui-client.ts");
    assert.ok(fs.existsSync(boot), `${id}: configure-shell-ui-client manquant`);
    const bootBody = fs.readFileSync(boot, "utf8");
    assert.match(bootBody, /configureShellUiBrand/);
    assert.match(bootBody, /@creezio\/shell-ui/);
    assert.doesNotMatch(bootBody, PAPERCLIP_RE);

    const rootTsx = path.join(crm, "src/components/workspace/workspace-root.tsx");
    assert.ok(fs.existsSync(rootTsx), `${id}: workspace-root`);
    const rootBody = fs.readFileSync(rootTsx, "utf8");
    assert.match(rootBody, /@creezio\/shell-ui\/ui/);
    assert.match(rootBody, /configure-shell-ui-client/);
  }
});

test("O9p.3 vendor shell-ui/ui + tasks/ui + kitSha", () => {
  for (const id of BRANDS) {
    const vendor = path.join(dockerRoot, id, "crm/vendor/creezio");
    assert.ok(
      fs.existsSync(path.join(vendor, "shell-ui/ui/index.ts")),
      `${id}: vendor shell-ui/ui`,
    );
    assert.ok(
      fs.existsSync(path.join(vendor, "tasks/ui/index.ts")),
      `${id}: vendor tasks/ui`,
    );
    const sync = JSON.parse(
      fs.readFileSync(path.join(vendor, "SYNC.json"), "utf8"),
    );
    assert.equal(sync.architectureVersion, "H6");
    assert.ok(sync.kitSha && sync.kitSha !== "unknown", `${id}: kitSha`);
    assert.ok(sync.packages.includes("shell-ui"));
    assert.ok(sync.packages.includes("tasks"));
    assert.ok(sync.packages.length >= 16, `${id}: liste vendor incomplète`);
  }
});

test("O9p.4 kit ADR site externe + 0 Paperclip extract", () => {
  const bridge = fs.readFileSync(
    path.join(root, "packages/shell-ui/ui/desktop/desktop-bridge.tsx"),
    "utf8",
  );
  assert.match(bridge, /Site externe/);
  assert.doesNotMatch(bridge, /Site fournisseur/);
  assert.doesNotMatch(bridge, PAPERCLIP_RE);

  const host = fs.readFileSync(
    path.join(root, "packages/shell-ui/ui/workspace/tab-workspace-host.ts"),
    "utf8",
  );
  assert.match(host, /OpenExternalSiteOpts/);
  assert.match(host, /siteId/);
});
