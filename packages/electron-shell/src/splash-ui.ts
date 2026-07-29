/**
 * Splash de démarrage — modèle + HTML (aucun import Electron).
 * Port brand-agnostic de electron/splash-ui.ts (TF2 0.10.26).
 */

import {
  windowChromeBarHtml,
  windowChromeCss,
  windowChromeJs,
} from "./window-chrome.js";

export type SplashStepStatus =
  | "pending"
  | "running"
  | "done"
  | "error"
  | "skip";

export type SplashStepId =
  | "catalog"
  | "migrations"
  | "meili"
  | "index"
  | "node"
  | "hermes"
  | "n8n"
  | "next"
  | "tunnel"
  | "login"
  | "remote";

export type SplashStepView = {
  id: SplashStepId;
  label: string;
  status: SplashStepStatus;
  detail: string;
  percent: number | null;
  startedAt: number | null;
  endedAt: number | null;
};

export type SplashViewModel = {
  headline: string;
  bootStartedAt: number;
  overallPercent: number;
  steps: SplashStepView[];
  footer: string;
};

export const SPLASH_STEP_WEIGHTS: Record<SplashStepId, number> = {
  catalog: 12,
  migrations: 5,
  meili: 5,
  index: 12,
  node: 10,
  hermes: 20,
  n8n: 22,
  next: 4,
  tunnel: 4,
  login: 3,
  remote: 100,
};

export function formatElapsedMs(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}:${String(r).padStart(2, "0")}` : `${r}s`;
}

export function sanitizeSplashDetail(line: string): string {
  return String(line || "")
    .replace(/\u001b\[[0-9;]*m/g, "")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function estimateEmbedPercent(detail: string): number {
  const s = detail.toLowerCase();
  if (!s || s === "…" || s === "démarrage") return 8;
  if (/erreur|error|fail/.test(s)) return 100;
  if (/\bok\b|prêt|ready|ui prêt|session owner/.test(s)) return 100;
  if (/réutilise|déjà prêt|warm/.test(s)) return 90;
  if (/health|attente|wait|lent/.test(s)) return 82;
  if (/npm install|pip install|download|télécharg|checksum|bootstrap/.test(s))
    return 35;
  if (/runtime (déjà|manquant)|installation runtime|node /.test(s)) return 20;
  return 40;
}

export function stepProgressRatio(step: SplashStepView): number {
  if (step.status === "done" || step.status === "skip") return 1;
  if (step.status === "error") return 1;
  if (step.status === "pending") return 0;
  if (typeof step.percent === "number" && Number.isFinite(step.percent)) {
    return Math.max(0, Math.min(100, step.percent)) / 100;
  }
  return 0.35;
}

export function computeOverallPercent(steps: SplashStepView[]): number {
  let wSum = 0;
  let pSum = 0;
  for (const step of steps) {
    if (step.status === "skip") continue;
    const w = SPLASH_STEP_WEIGHTS[step.id] ?? 5;
    wSum += w;
    pSum += w * stepProgressRatio(step);
  }
  if (wSum <= 0) return 0;
  return Math.max(0, Math.min(100, (pSum / wSum) * 100));
}

export function createLocalSplashSteps(opts: {
  needIndex: boolean;
  needNode: boolean;
  needHermes: boolean;
  needN8n: boolean;
  needTunnel: boolean;
  /** Label étape catalogue (vertical) — défaut générique. */
  catalogLabel?: string;
}): SplashStepView[] {
  const mk = (
    id: SplashStepId,
    label: string,
    status: SplashStepStatus = "pending",
  ): SplashStepView => ({
    id,
    label,
    status,
    detail: "",
    percent: null,
    startedAt: null,
    endedAt: null,
  });
  return [
    mk("catalog", opts.catalogLabel ?? "Données initiales"),
    mk("migrations", "Base de données"),
    mk("meili", "Moteur de recherche"),
    mk("index", "Indexation", opts.needIndex ? "pending" : "skip"),
    mk("node", "Runtime Node", opts.needNode ? "pending" : "skip"),
    mk("hermes", "Hermes (agents)", opts.needHermes ? "pending" : "skip"),
    mk("n8n", "n8n (automatisations)", opts.needN8n ? "pending" : "skip"),
    mk("next", "Serveur local CRM"),
    mk("tunnel", "Tunnel d’accès distant", opts.needTunnel ? "pending" : "skip"),
    mk("login", "Ouverture de l’interface"),
  ];
}

export function createRemoteSplashSteps(): SplashStepView[] {
  return [
    {
      id: "remote",
      label: "Connexion au serveur",
      status: "pending",
      detail: "",
      percent: null,
      startedAt: null,
      endedAt: null,
    },
    {
      id: "login",
      label: "Ouverture de l’interface",
      status: "pending",
      detail: "",
      percent: null,
      startedAt: null,
      endedAt: null,
    },
  ];
}

export function createSplashModel(
  steps: SplashStepView[],
  headline = "Démarrage…",
): SplashViewModel {
  const now = Date.now();
  return {
    headline,
    bootStartedAt: now,
    overallPercent: computeOverallPercent(steps),
    steps,
    footer:
      "Hermes et n8n démarrent en parallèle — le temps total ≈ le plus lent des deux.",
  };
}

export function activateSplashStep(
  model: SplashViewModel,
  id: SplashStepId,
  opts?: {
    detail?: string;
    percent?: number | null;
    parallel?: boolean;
    headline?: string;
  },
): SplashViewModel {
  const now = Date.now();
  const steps = model.steps.map((s) => {
    if (s.id === id) {
      if (s.status === "skip") return s;
      return {
        ...s,
        status: "running" as const,
        detail:
          opts?.detail !== undefined
            ? sanitizeSplashDetail(opts.detail)
            : s.detail,
        percent: opts?.percent !== undefined ? opts.percent : s.percent,
        startedAt: s.startedAt ?? now,
        endedAt: null,
      };
    }
    if (!opts?.parallel && s.status === "running" && s.id !== id) {
      return {
        ...s,
        status: "done" as const,
        percent: 100,
        endedAt: s.endedAt ?? now,
      };
    }
    return s;
  });
  const next: SplashViewModel = {
    ...model,
    headline: opts?.headline ?? model.headline,
    steps,
  };
  next.overallPercent = computeOverallPercent(steps);
  return next;
}

export function updateSplashStep(
  model: SplashViewModel,
  id: SplashStepId,
  patch: {
    detail?: string;
    percent?: number | null;
    status?: SplashStepStatus;
    headline?: string;
  },
): SplashViewModel {
  const now = Date.now();
  const steps = model.steps.map((s) => {
    if (s.id !== id) return s;
    const status = patch.status ?? s.status;
    const endedAt =
      status === "done" || status === "error"
        ? (s.endedAt ?? now)
        : status === "running"
          ? null
          : s.endedAt;
    return {
      ...s,
      status,
      detail:
        patch.detail !== undefined
          ? sanitizeSplashDetail(patch.detail)
          : s.detail,
      percent: patch.percent !== undefined ? patch.percent : s.percent,
      startedAt: status === "running" ? (s.startedAt ?? now) : s.startedAt,
      endedAt,
    };
  });
  const next: SplashViewModel = {
    ...model,
    headline: patch.headline ?? model.headline,
    steps,
  };
  next.overallPercent = computeOverallPercent(steps);
  return next;
}

export function completeSplashStep(
  model: SplashViewModel,
  id: SplashStepId,
  detail = "Terminé",
): SplashViewModel {
  return updateSplashStep(model, id, {
    status: "done",
    detail,
    percent: 100,
  });
}

export function splashHtmlDocument(opts: {
  productName: string;
  bridgeName: string;
  windowChrome?: boolean;
  accentColor?: string;
}): string {
  const chrome = Boolean(opts.windowChrome);
  const accent = opts.accentColor ?? "#f0701d";
  const chromeBar = chrome ? windowChromeBarHtml() : "";
  const chromeCss = chrome ? windowChromeCss({ dark: true }) : "";
  const chromeJs = chrome ? windowChromeJs(opts.bridgeName) : "";
  const bodyAttrs = chrome ? ' class="cz-chrome" data-cz-chrome-force="1"' : "";
  const title = opts.productName.replace(/</g, "");
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><title>${title}</title>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<style>
  *{box-sizing:border-box}
  body{
    margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
    background:#14182f;color:#fff;
    font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;
  }
  .wrap{width:min(640px,92vw);padding:28px 22px 32px}
  .brand{font-size:28px;font-weight:700;color:${accent};letter-spacing:-.02em}
  .headline{margin-top:10px;font-size:15px;line-height:1.4;opacity:.92;word-break:break-word}
  .meta{margin-top:14px;display:flex;justify-content:space-between;align-items:baseline;gap:12px;font-size:13px;opacity:.75}
  .meta b{color:#fff;opacity:1;font-variant-numeric:tabular-nums}
  .obar{margin-top:8px;height:10px;border-radius:6px;background:rgba(255,255,255,.12);overflow:hidden}
  .obar > i{display:block;height:100%;width:0%;border-radius:6px;background:${accent};transition:width .3s ease}
  .steps{margin-top:18px;display:flex;flex-direction:column;gap:8px;max-height:min(58vh,520px);overflow:auto}
  .step{border:1px solid rgba(255,255,255,.1);border-radius:10px;background:rgba(255,255,255,.03);padding:10px 12px}
  .step.skip{display:none}
  .step.pending{opacity:.45}
  .step.running{border-color:${accent}88;background:${accent}14}
  .footer{margin-top:14px;font-size:12px;line-height:1.45;opacity:.55}
  .cz-upd{margin-top:12px;font-size:12.5px;line-height:1.4;color:#ffd08a;opacity:.95}
  ${chromeCss}
</style>
</head>
<body${bodyAttrs}>
${chromeBar}
<div class="wrap">
  <div class="brand">${title}</div>
  <div class="headline" id="headline">Démarrage…</div>
  <div class="cz-upd" id="cz-upd" hidden></div>
  <div class="meta">
    <span>Temps écoulé <b id="elapsed">0s</b></span>
    <span><b id="opct">0</b>%</span>
  </div>
  <div class="obar"><i id="obar"></i></div>
  <div class="steps" id="steps"></div>
  <div class="footer" id="footer"></div>
</div>
<script>
(function () {
  var state = null;
  function fmt(ms) {
    var s = Math.max(0, Math.floor(ms / 1000));
    var m = Math.floor(s / 60);
    var r = s % 60;
    return m > 0 ? (m + ":" + String(r).padStart(2, "0")) : (r + "s");
  }
  function escapeHtml(s) {
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }
  function render() {
    if (!state) return;
    var now = Date.now();
    document.getElementById("headline").textContent = state.headline || "Démarrage…";
    document.getElementById("elapsed").textContent = fmt(now - (state.bootStartedAt || now));
    var op = Math.max(0, Math.min(100, Number(state.overallPercent) || 0));
    document.getElementById("opct").textContent = String(Math.round(op));
    document.getElementById("obar").style.width = op.toFixed(1) + "%";
    document.getElementById("footer").textContent = state.footer || "";
    var root = document.getElementById("steps");
    var html = "";
    (state.steps || []).forEach(function (st) {
      if (st.status === "skip") return;
      html += '<div class="step ' + (st.status || "pending") + '"><strong>'
        + escapeHtml(st.label) + '</strong>'
        + (st.detail ? ('<div style="font-size:12px;opacity:.78;margin-top:6px">' + escapeHtml(st.detail) + "</div>") : "")
        + "</div>";
    });
    root.innerHTML = html;
  }
  window.__setBoot = function (m) { state = m || null; render(); };
  window.__setStatus = function (t) {
    if (!state) {
      state = { headline: String(t || "Démarrage…"), bootStartedAt: Date.now(), overallPercent: 0, steps: [], footer: "" };
    } else { state.headline = String(t || state.headline); }
    render();
  };
  setInterval(function () {
    if (!state) return;
    document.getElementById("elapsed").textContent = fmt(Date.now() - (state.bootStartedAt || Date.now()));
  }, 250);
})();
${chromeJs}
</script>
</body></html>`;
}

export function splashDataUrl(opts: {
  productName: string;
  bridgeName: string;
  windowChrome?: boolean;
  accentColor?: string;
}): string {
  return `data:text/html;charset=utf-8,${encodeURIComponent(
    splashHtmlDocument(opts),
  )}`;
}
