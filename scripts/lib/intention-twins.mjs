/**
 * Scanner jumeaux plateforme TF↔CV (Plan P* / intention OS).
 * Mesure cutover : présence + similarité de lignes — pas « package existe ».
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const KIT_ROOT = path.resolve(here, "../..");
export const DOCKER_ROOT = path.resolve(KIT_ROOT, "..");

export const BRANDS = {
  tempoflow2: path.join(DOCKER_ROOT, "tempoflow2/crm"),
  "certivan-app": path.join(DOCKER_ROOT, "certivan-app/crm"),
  fidu: path.join(DOCKER_ROOT, "fidu/crm"),
};

/** Surfaces P1 — shell CRM (doit être SoT kit après cutover). */
export const P1_SHELL_SURFACES = [
  "src/components/layout/sidebar.tsx",
  "src/components/workspace/tab-workspace-context.tsx",
  "src/components/workspace/workspace-shell.tsx",
  "src/components/cockpit/server-cockpit-shell.tsx",
  "src/components/cockpit/cockpit-client.tsx",
  "src/components/setup/setup-wizard.tsx",
  "src/components/global-search-provider.tsx",
  "src/components/onboarding/onboarding-shell.tsx",
  "src/lib/nav-context.ts",
  "src/lib/search-history.ts",
];

/** Surfaces P2 — tasks / kanban / AI (doit être SoT kit après cutover). */
export const P2_TASKS_SURFACES = [
  "src/lib/tasks.ts",
  "src/lib/task-runs.ts",
  "src/lib/ai-task-runner.ts",
  "src/lib/ai-task-agent.ts",
  "src/server/routes/tasks.ts",
  "src/lib/cabinet-tasks.ts",
  "src/components/tasks/taches-kanban-client.tsx",
];

/** Allowlist métier explicite — ne pas traiter comme jumeau plateforme. */
export const METIER_ALLOWLIST = [
  /^src\/components\/commandes\//,
  /^src\/components\/panier\//,
  /^src\/components\/dispatch\//,
  /^src\/components\/releves\//,
  /^src\/components\/catalogue\//,
  /^src\/components\/scan\//,
  /^src\/components\/rti\//,
  /^src\/components\/vasp\//,
  /^src\/components\/ged\//,
  /^src\/components\/pennylane\//,
  /^src\/components\/contacts\//,
  /^src\/components\/dossiers\//,
  /^src\/components\/onboarding\/step-(restaurant|fournisseurs|atelier|cabinet|collecte|organisation|portail|relances)\.tsx$/,
  /^electron\/supplier-tabs\.ts$/,
  /^electron\/supplier-driver\.ts$/,
  /^electron\/modules\//,
  /^modules\//,
];

export function isMetierPath(rel) {
  const n = rel.replace(/\\/g, "/");
  return METIER_ALLOWLIST.some((re) => re.test(n));
}

export function readLines(file) {
  return fs.readFileSync(file, "utf8").split("\n");
}

/** Similarité ligne-à-ligne (SequenceMatcher-like ratio). */
export function lineSimilarity(aLines, bLines) {
  if (aLines.length === 0 && bLines.length === 0) return 1;
  const m = aLines.length;
  const n = bLines.length;
  // LCS length via DP (bounded for gate files < ~2k LOC)
  if (m * n > 4_000_000) {
    // fallback: token bag for huge files
    const bag = (lines) => {
      const m = new Map();
      for (const l of lines) m.set(l, (m.get(l) || 0) + 1);
      return m;
    };
    const A = bag(aLines);
    const B = bag(bLines);
    let inter = 0;
    let total = 0;
    for (const [k, v] of A) {
      total += v;
      inter += Math.min(v, B.get(k) || 0);
    }
    for (const [k, v] of B) if (!A.has(k)) total += v;
    return total ? (2 * inter) / (A.size + B.size ? total + (total - inter) : 1) : 1;
  }
  const dp = Array.from({ length: m + 1 }, () => new Uint32Array(n + 1));
  for (let i = 1; i <= m; i++) {
    const ai = aLines[i - 1];
    const row = dp[i];
    const prev = dp[i - 1];
    for (let j = 1; j <= n; j++) {
      row[j] =
        ai === bLines[j - 1]
          ? prev[j - 1] + 1
          : Math.max(prev[j], row[j - 1]);
    }
  }
  const lcs = dp[m][n];
  return (2 * lcs) / (m + n);
}

/** Normalise literals marque pour comparer la logique plateforme. */
export function normalizeBrandNoise(text) {
  return text
    .replace(/window\.(tempoflow|certivan|fidu)Desktop/g, "window.__DESKTOP__")
    .replace(/\b(TempoFlow|Certivan|Fidu)\b/g, "__PRODUCT__")
    .replace(/tempoflow\.fr|certivan\.creez\.io|fidu\.creez\.io/g, "__HOST__")
    .replace(/(tempoflow|certivan|fidu):\/\//g, "__SCHEME__://")
    .replace(/tf2-|tempoflow2-|certivan-|fidu-/g, "__BRAND__-");
}

export function existsRel(brandDir, rel) {
  return fs.existsSync(path.join(brandDir, rel));
}

export function locRel(brandDir, rel) {
  const p = path.join(brandDir, rel);
  if (!fs.existsSync(p)) return 0;
  return readLines(p).length;
}

/**
 * @returns {{ rel: string, sim: number, tfLoc: number, cvLoc: number, fidu: boolean }[]}
 */
export function scanTwinPair(rels, { threshold = 0.85, normalize = true } = {}) {
  const tf = BRANDS.tempoflow2;
  const cv = BRANDS["certivan-app"];
  const fidu = BRANDS.fidu;
  const out = [];
  for (const rel of rels) {
    if (isMetierPath(rel)) continue;
    const tfPath = path.join(tf, rel);
    const cvPath = path.join(cv, rel);
    if (!fs.existsSync(tfPath) || !fs.existsSync(cvPath)) continue;
    let a = fs.readFileSync(tfPath, "utf8");
    let b = fs.readFileSync(cvPath, "utf8");
    if (normalize) {
      a = normalizeBrandNoise(a);
      b = normalizeBrandNoise(b);
    }
    const sim = lineSimilarity(a.split("\n"), b.split("\n"));
    if (sim >= threshold) {
      out.push({
        rel,
        sim,
        tfLoc: readLines(tfPath).length,
        cvLoc: readLines(cvPath).length,
        fidu: fs.existsSync(path.join(fidu, rel)),
      });
    }
  }
  return out;
}

/** Présence locale d’une surface (jumeau non éteint). */
export function localSurfacesPresent(rels) {
  const rows = [];
  for (const [name, dir] of Object.entries(BRANDS)) {
    for (const rel of rels) {
      if (existsRel(dir, rel)) {
        rows.push({ brand: name, rel, loc: locRel(dir, rel) });
      }
    }
  }
  return rows;
}

export function fileContains(brandDir, rel, re) {
  const p = path.join(brandDir, rel);
  if (!fs.existsSync(p)) return false;
  return re.test(fs.readFileSync(p, "utf8"));
}

export function kitExportsShellCrm() {
  const uiIndex = path.join(KIT_ROOT, "packages/shell-ui/ui/index.ts");
  const text = fs.readFileSync(uiIndex, "utf8");
  return {
    setupWizard: /setup\/setup-wizard|SetupWizard/.test(text),
    tabWorkspaceContext: /tab-workspace-context|TabWorkspaceProvider/.test(text),
    globalSearchProvider: /global-search-provider|GlobalSearchProvider/.test(text),
    cockpit: /server-cockpit-shell|ServerCockpitShell/.test(text),
    sidebar: /layout\/sidebar|Sidebar/.test(text),
    workspaceShell: /workspace-shell|WorkspaceShell/.test(text),
    onboardingShell: /onboarding-shell|OnboardingShell/.test(text),
  };
}

export function kitExportsTasksRuntime() {
  const idx = path.join(KIT_ROOT, "packages/tasks/src/index.ts");
  const text = fs.readFileSync(idx, "utf8");
  return {
    kanbanStore: /createKanbanTasksStore|listTasks|TaskRow|KANBAN_COLUMNS/.test(text),
    taskRuns: /task-runs|listTaskRuns|createTaskRun/.test(text),
    aiRunner: /ai-task-runner|runAiTask|AiTaskRunner/.test(text),
    routes: /createKanbanTasksRoutes|mountKanbanTasks/.test(text),
  };
}
