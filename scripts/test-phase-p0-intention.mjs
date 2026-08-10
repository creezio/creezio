#!/usr/bin/env node
/**
 * Phase P0 — Gates intention : mesure cutover marques (pas « package existe »).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import {
  BRANDS,
  DOCKER_ROOT,
  KIT_ROOT,
  P1_SHELL_SURFACES,
  P2_TASKS_SURFACES,
  kitExportsShellCrm,
  kitExportsTasksRuntime,
  localSurfacesPresent,
  scanTwinPair,
} from "./lib/intention-twins.mjs";

const PAPERCLIP_RE = /paperclipApi|startPaperclip\b|paperclip-launcher/;

const FULL_VENDOR = [
  "brand-config",
  "shell",
  "platform-core",
  "product-hub",
  "electron-shell",
  "desktop-tooling",
  "api-kernel",
  "mcp-facade",
  "shell-ui",
  "onboarding",
  "cockpit",
  "auth",
  "assistant",
  "tasks",
  "mails",
  "observability",
  "automations",
  "database",
];

test("P0.1 docs PLAN-P + ETAT §0 + PHASE-P0", () => {
  const plan = fs.readFileSync(path.join(KIT_ROOT, "docs/archive/PLAN-P.md"), "utf8");
  assert.match(plan, /Plan P\*/);
  assert.match(plan, /\*\*P0\*\*/);
  assert.match(plan, /Gates intention/);
  assert.match(plan, /×3.*NATIF|NATIF.*×3|Présent dans TF\+CV\+Fidu/i);
  assert.match(plan, /Façades \/ stubs \/ jumeaux = \*\*NON done\*\*/);
  assert.doesNotMatch(plan, PAPERCLIP_RE);

  const etat = fs.readFileSync(
    path.join(KIT_ROOT, "docs/archive/ETAT-DES-LIEUX-INTENTION.md"),
    "utf8",
  );
  assert.match(etat, /Règle d’arbitrage UNIQUE|règle ×3/i);
  assert.match(etat, /Présent ×3[\s\S]*?\*\*NATIF\*\*/);
  assert.match(etat, /D-GATES/);
  assert.match(etat, /test-phase-p0-intention/);
  assert.doesNotMatch(etat, PAPERCLIP_RE);

  const phase = fs.readFileSync(path.join(KIT_ROOT, "docs/archive/PHASE-P0.md"), "utf8");
  assert.match(phase, /Gates intention|matrice honnête/i);
  assert.match(phase, /test-phase-p0-intention/);
  assert.match(phase, /cutover/i);
  assert.match(phase, /Sign-off|✅/);
  assert.doesNotMatch(phase, PAPERCLIP_RE);
});

test("P0.2 matrice : légende cutover + Shell CRM / Tasks = réalité cutover", () => {
  const matrice = fs.readFileSync(
    path.join(KIT_ROOT, "docs/archive/MATRICE-NATIVE-METIER-PLUGIN.md"),
    "utf8",
  );
  assert.match(
    matrice,
    /livré \*\*et cutover marques prouvé\*\*|cutover marques prouvé/i,
  );
  assert.match(matrice, /🟡.*jumeaux|jumeaux restants/i);

  // Surfaces cœur : absentes marques ⇒ cutover prouvé ⇒ matrice ✅ ; sinon 🟡
  const coreShellSurfaces = [
    "src/components/layout/sidebar.tsx",
    "src/components/workspace/tab-workspace-context.tsx",
    "src/components/workspace/workspace-shell.tsx",
    "src/components/cockpit/server-cockpit-shell.tsx",
    "src/components/setup/setup-wizard.tsx",
    "src/components/global-search-provider.tsx",
  ];
  const shellCutoverDone = localSurfacesPresent(coreShellSurfaces).length === 0;

  const coreTasksSurfaces = [
    "src/lib/tasks.ts",
    "src/lib/cabinet-tasks.ts",
    "src/components/tasks/taches-kanban-client.tsx",
    "src/lib/ai-task-runner.ts",
  ];
  const tasksCutoverDone = localSurfacesPresent(coreTasksSurfaces).length === 0;

  const shellRow = matrice
    .split("\n")
    .find((l) => /Shell CRM/.test(l) && /shell-ui/.test(l));
  assert.ok(shellRow, "ligne Shell CRM absente");
  if (shellCutoverDone) {
    assert.match(shellRow, /\| ✅ \|/);
    assert.doesNotMatch(
      shellRow,
      /jumeaux locaux|encore locales|twin TF/,
      "Shell CRM ✅ ne doit pas revendiquer jumeaux locaux",
    );
  } else {
    assert.match(shellRow, /🟡/);
    assert.doesNotMatch(shellRow, /\| ✅ \|/);
  }

  const tasksRow = matrice
    .split("\n")
    .find((l) => /\*\*Tasks\*\*/.test(l) && /@creezio\/tasks/.test(l));
  assert.ok(tasksRow, "ligne Tasks absente");
  if (tasksCutoverDone) {
    assert.match(tasksRow, /\| ✅ \|/);
    assert.doesNotMatch(
      tasksRow,
      /jumeaux locaux|encore locales|twin TF/,
      "Tasks ✅ ne doit pas revendiquer jumeaux locaux",
    );
  } else {
    assert.match(tasksRow, /🟡/);
    assert.doesNotMatch(tasksRow, /\| ✅ \|/);
  }

  // Interdit : ✅ + « jumeaux locaux » sur la même ligne capacité
  for (const line of matrice.split("\n")) {
    if (!/^\|/.test(line)) continue;
    if (/jumeaux locaux|encore locales|twin TF/.test(line)) {
      assert.doesNotMatch(
        line,
        /\| ✅ \|/,
        `matrice ✅ cosmétique malgré jumeaux: ${line.slice(0, 120)}`,
      );
    }
  }
});

test("P0.3 mesure cutover : jumeau local ⇒ dette ; absent ⇒ SoT kit obligatoire", () => {
  // Existence package O9 ≠ cutover — on mesure les fichiers marques.
  assert.ok(
    fs.existsSync(path.join(KIT_ROOT, "packages/shell-ui/ui/index.ts")),
  );
  assert.ok(fs.existsSync(path.join(KIT_ROOT, "packages/tasks/ui/index.ts")));

  const coreShellSurfaces = [
    "src/components/layout/sidebar.tsx",
    "src/components/workspace/tab-workspace-context.tsx",
    "src/components/workspace/workspace-shell.tsx",
    "src/components/cockpit/server-cockpit-shell.tsx",
    "src/components/setup/setup-wizard.tsx",
    "src/components/global-search-provider.tsx",
  ];
  const localCoreShell = localSurfacesPresent(coreShellSurfaces);
  const localShell = localSurfacesPresent(P1_SHELL_SURFACES);
  if (localCoreShell.length === 0) {
    // Cutover cœur prouvé — SoT kit (setup/cockpit = packages dédiés).
    const exp = kitExportsShellCrm();
    assert.ok(exp.setupWizard, "cutover shell: SetupWizard (@creezio/onboarding)");
    assert.ok(exp.cockpit, "cutover shell: ServerCockpitShell (@creezio/cockpit)");
    assert.ok(exp.tabWorkspaceContext, "cutover shell: TabWorkspaceProvider kit");
    assert.ok(exp.globalSearchProvider, "cutover shell: GlobalSearchProvider kit");
    assert.ok(exp.workspaceShell, "cutover shell: WorkspaceShell kit");
    assert.ok(exp.sidebar, "cutover shell: Sidebar kit");
  } else if (localShell.length > 0) {
    const shellTwins = scanTwinPair(P1_SHELL_SURFACES, { threshold: 0.85 });
    assert.ok(
      shellTwins.length >= 1,
      `jumeaux shell locaux sans sim≥0.85 TF↔CV: ${[...new Set(localShell.map((r) => r.rel))].join(", ")}`,
    );
  }

  const localTasksCore = localSurfacesPresent([
    "src/lib/tasks.ts",
    "src/lib/cabinet-tasks.ts",
    "src/components/tasks/taches-kanban-client.tsx",
  ]);
  if (localTasksCore.length > 0) {
    const tasksTwins = scanTwinPair(
      ["src/lib/tasks.ts", "src/lib/task-runs.ts", "src/server/routes/tasks.ts"],
      { threshold: 0.85 },
    );
    assert.ok(
      tasksTwins.length >= 1 ||
        localTasksCore.some((r) => r.rel.includes("cabinet-tasks")),
      "dette tasks locale sans twin TF↔CV ni cabinet-tasks Fidu",
    );
  } else {
    const rt = kitExportsTasksRuntime();
    assert.ok(rt.kanbanStore, "cutover tasks: kanban store kit");
    assert.ok(rt.routes, "cutover tasks: createTasksHonoRoutes kit");
    assert.ok(rt.aiRunner || rt.taskRuns, "cutover tasks: AI ou task-runs kit");
  }
});

test("P0.4 surface npm = liste complète publiable + Paperclip mort", () => {
  // Distribution npm : chaque package du socle est publié sur GitHub
  // Packages (publishConfig + version lockstep, pas de private:true) — plus
  // de DEFAULT_PACKAGES vendor.
  for (const pkg of FULL_VENDOR) {
    const pj = JSON.parse(
      fs.readFileSync(
        path.join(KIT_ROOT, "packages", pkg, "package.json"),
        "utf8",
      ),
    );
    assert.ok(!pj.private, `${pkg} private — non publiable`);
    assert.equal(
      pj.publishConfig?.registry,
      "https://npm.pkg.github.com",
      `${pkg} sans publishConfig npm.pkg.github.com`,
    );
    assert.doesNotMatch(JSON.stringify(pj), PAPERCLIP_RE);
  }

  for (const [name, dir] of Object.entries(BRANDS)) {
    assert.ok(fs.existsSync(dir), `${name} crm`);
    const wrapper = path.join(dir, "scripts/electron/sync-creezio-vendor.sh");
    assert.ok(fs.existsSync(wrapper), `${name}: sync wrapper`);
    const body = fs.readFileSync(wrapper, "utf8");
    for (const pkg of ["observability", "automations", "database"]) {
      assert.match(body, new RegExp(pkg), `${name}: vendor ${pkg}`);
    }
    assert.doesNotMatch(body, PAPERCLIP_RE);
  }

  // Racines docker présentes (mesure cutover marques)
  assert.ok(fs.existsSync(DOCKER_ROOT));
});

test("P0.5 npm test wire + anti-régression O8 paperclip", () => {
  const pkg = JSON.parse(
    fs.readFileSync(path.join(KIT_ROOT, "package.json"), "utf8"),
  );
  assert.match(pkg.scripts.test, /test-phase-p0-intention/);
  assert.doesNotMatch(JSON.stringify(pkg), PAPERCLIP_RE);
});
