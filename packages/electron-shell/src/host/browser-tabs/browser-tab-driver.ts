// @ts-nocheck — Electron WebContents/session (shim kit mince, N7)
/**
 * Exécuteur des actions `external_*` (alias déprécié `supplier_*`) sur
 * les onglets sites externes.
 *
 * Architecture hybride (portage de src/components/assistant/ui-driver.tsx) :
 * - ÉNUMÉRATION / RÉSOLUTION des cibles : JavaScript exécuté dans un MONDE
 *   ISOLÉ de la page (executeJavaScriptInIsolatedWorld) — même logique que
 *   la souris virtuelle du CRM (sélecteur interactif, labels, refs stables,
 *   similarité Dice), mais invisible et inaccessible au site tiers.
 * - ENTRÉES : CDP via webContents.debugger (Input.dispatchMouseEvent /
 *   dispatchKeyEvent) → événements TRUSTED, indiscernables d'un vrai
 *   utilisateur (contrairement à dispatchEvent JS).
 * - Captures d'écran : Page.captureScreenshot (helper exporté, pour la
 *   vision LLM future).
 */

import type { SupplierTab, SupplierTabManager } from "./browser-tab-manager.js";
import type { WebContents } from "electron";
import { FAKE_CURSOR_INJECT } from "./fake-cursor-inject.js";

/** Monde isolé dédié (≠ 0 main world, ≠ mondes des extensions). */
const ISOLATED_WORLD_ID = 1999;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ────────────────────────────────────────────────────────────────────────
 * Script in-page (monde isolé) — portage de ui-driver.tsx sans les parties
 * CRM (data-tf2-aid, faux curseur, toasts sonner). Idempotent : redéfinit
 * window.__tfsup à chaque évaluation (l'état targets/generation survit tant
 * que la page vit ; une navigation le remet à zéro, comme côté CRM).
 * ──────────────────────────────────────────────────────────────────────── */
const HELPERS = `
(() => {
  const g = globalThis;
  if (!g.__tfsupState) g.__tfsupState = { generation: 0, targets: new Map() };
  const state = g.__tfsupState;

  const INTERACTIVE_SELECTOR = [
    "a[href]", "button", '[role="button"]', '[role="option"]', '[role="menuitem"]',
    '[role="tab"]', '[role="combobox"]', '[role="link"]', '[onclick]',
    'input:not([type="hidden"])', "select", "textarea", "[contenteditable='true']",
  ].join(", ");

  function isVisible(el) {
    if (el.closest('[aria-hidden="true"]')) return false;
    if (el.hidden) return false;
    if (el.disabled) return false;
    const rect = el.getBoundingClientRect();
    if (rect.width < 4 || rect.height < 4) return false;
    const margin = 300;
    if (rect.bottom < -margin || rect.top > window.innerHeight + margin ||
        rect.right < -margin || rect.left > window.innerWidth + margin) return false;
    const style = window.getComputedStyle(el);
    if (style.visibility === "hidden" || style.display === "none") return false;
    return true;
  }

  function labelFor(el) {
    const aria = el.getAttribute && el.getAttribute("aria-label");
    if (aria && aria.trim()) return aria.trim();
    const title = el.getAttribute && el.getAttribute("title");
    if (title && title.trim()) return title.trim();
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      const ph = (el.placeholder || "").trim();
      if (ph) return ph;
      if (el.name) return el.name;
      if (el.id) return el.id;
    }
    const alt = el.querySelector && el.querySelector("img[alt]");
    const text = ((el.innerText || el.textContent || "") + (alt ? " " + alt.getAttribute("alt") : ""))
      .replace(/\\s+/g, " ").trim();
    return text.slice(0, 90);
  }

  function kindFor(el) {
    const role = el.getAttribute && el.getAttribute("role");
    if (role) return role;
    const tag = el.tagName.toLowerCase();
    if (tag === "a") return "link";
    if (tag === "input") return "input:" + (el.type || "text");
    return tag;
  }

  function normalize(s) {
    return (s || "").toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
  }

  function pageContext() {
    const h1 = document.querySelector("h1");
    return {
      url: window.location.href,
      title: document.title,
      heading: h1 ? (h1.textContent || "").replace(/\\s+/g, " ").trim().slice(0, 120) : null,
    };
  }

  function collectTargets(q) {
    state.generation += 1;
    if (state.targets.size > 2000) state.targets.clear();
    const scan = (nq) => {
      const seen = new Set();
      const out = [];
      let idx = 0;
      for (const el of Array.from(document.querySelectorAll(INTERACTIVE_SELECTOR))) {
        if (seen.has(el)) continue;
        seen.add(el);
        if (!isVisible(el)) continue;
        const label = labelFor(el);
        if (!label) continue;
        const href = el instanceof HTMLAnchorElement ? (el.getAttribute("href") || undefined) : undefined;
        if (nq) {
          const hay = normalize(label + " " + (href || ""));
          if (!hay.includes(nq)) continue;
        }
        idx += 1;
        const ref = "s" + state.generation + "-" + idx;
        state.targets.set(ref, new WeakRef(el));
        out.push({ ref, label, kind: kindFor(el), href });
        if (out.length >= 120) break;
      }
      return out;
    };
    const nq = q ? normalize(q) : "";
    let targets = scan(nq);
    let note;
    if (nq && targets.length === 0) {
      targets = scan("");
      note = "Aucune cible ne contient « " + q + " » — liste complète renvoyée à la place.";
    }
    return { targets, truncated: targets.length >= 120, note };
  }

  function similarity(a, b) {
    const na = normalize(a); const nb = normalize(b);
    if (!na || !nb) return 0;
    if (na === nb) return 1;
    if (na.includes(nb) || nb.includes(na)) return 0.9;
    const bigrams = (s) => {
      const m = new Map();
      for (let i = 0; i < s.length - 1; i++) {
        const bg = s.slice(i, i + 2);
        m.set(bg, (m.get(bg) || 0) + 1);
      }
      return m;
    };
    const ba = bigrams(na); const bb = bigrams(nb);
    let inter = 0, totalA = 0, totalB = 0;
    ba.forEach((c) => { totalA += c; });
    bb.forEach((c) => { totalB += c; });
    ba.forEach((c, bg) => { inter += Math.min(c, bb.get(bg) || 0); });
    return totalA + totalB ? (2 * inter) / (totalA + totalB) : 0;
  }

  function scoreCandidates(query) {
    const out = [];
    for (const el of Array.from(document.querySelectorAll(INTERACTIVE_SELECTOR))) {
      if (!isVisible(el)) continue;
      const label = labelFor(el);
      if (!label) continue;
      out.push({ el, label, score: similarity(query, label) });
    }
    return out.sort((a, b) => b.score - a.score);
  }

  function resolveTarget(refArg, labelArg) {
    if (refArg) {
      const wr = state.targets.get(refArg);
      const el = wr && wr.deref();
      if (el && document.contains(el) && isVisible(el)) return el;
    }
    if (labelArg) {
      const nl = normalize(labelArg);
      let partial = null;
      for (const el of Array.from(document.querySelectorAll(INTERACTIVE_SELECTOR))) {
        if (!isVisible(el)) continue;
        const l = normalize(labelFor(el));
        if (!l) continue;
        if (l === nl) return el;
        if (!partial && (l.includes(nl) || nl.includes(l))) partial = el;
      }
      if (partial) return partial;
    }
    return null;
  }

  async function resolveWithRepair(refArg, labelArg) {
    let el = resolveTarget(refArg, labelArg);
    if (el) return { el, suggestions: [] };
    const query = labelArg || refArg || "";
    if (query) {
      const scored = scoreCandidates(query);
      if (scored[0] && scored[0].score >= 0.6) return { el: scored[0].el, suggestions: [] };
      window.scrollBy({ top: Math.round(window.innerHeight * 0.8), behavior: "instant" });
      await new Promise((r) => setTimeout(r, 400));
      el = resolveTarget(refArg, labelArg);
      if (el) return { el, suggestions: [] };
      const rescored = scoreCandidates(query);
      if (rescored[0] && rescored[0].score >= 0.6) return { el: rescored[0].el, suggestions: [] };
      const suggestions = rescored.filter((c) => c.score > 0.2).slice(0, 5).map((c) => c.label);
      return { el: null, suggestions };
    }
    return { el: null, suggestions: [] };
  }

  /** Centre cliquable de l'élément (scroll au centre si hors écran). */
  async function locate(refArg, labelArg) {
    const { el, suggestions } = await resolveWithRepair(refArg, labelArg);
    if (!el) return { ok: false, suggestions, page: pageContext() };
    const before = el.getBoundingClientRect();
    if (before.top < 40 || before.bottom > window.innerHeight - 20 ||
        before.left < 0 || before.right > window.innerWidth) {
      el.scrollIntoView({ block: "center", inline: "nearest", behavior: "instant" });
      await new Promise((r) => setTimeout(r, 350));
    }
    const rect = el.getBoundingClientRect();
    const x = Math.round(rect.left + Math.min(rect.width / 2, 160));
    const y = Math.round(rect.top + rect.height / 2);
    const isField = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement ||
      (el.getAttribute && el.getAttribute("contenteditable") === "true");
    // Champ imbriqué (cible = conteneur) : viser l'input interne.
    let fieldSelectorHit = isField;
    if (!isField && el.querySelector) {
      const inner = el.querySelector("input, textarea");
      if (inner) {
        const r2 = inner.getBoundingClientRect();
        return { ok: true, x: Math.round(r2.left + r2.width / 2), y: Math.round(r2.top + r2.height / 2),
                 label: labelFor(el), isField: true, page: pageContext() };
      }
    }
    return { ok: true, x, y, label: labelFor(el), isField: fieldSelectorHit, page: pageContext() };
  }

  /** Vide le champ actuellement focus (avant frappe trusted). */
  function clearFocusedField() {
    const el = document.activeElement;
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      const proto = el instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const setter = Object.getOwnPropertyDescriptor(proto, "value");
      if (setter && setter.set) setter.set.call(el, "");
      else el.value = "";
      el.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    }
    return false;
  }

  function readText(q, maxChars) {
    const max = Math.min(Math.max(maxChars || 6000, 500), 20000);
    const raw = (document.body && document.body.innerText) || "";
    const lines = raw.split("\\n").map((l) => l.replace(/\\s+/g, " ").trim()).filter(Boolean);
    let selected = lines;
    if (q) {
      const nq = normalize(q);
      // Bloc de contexte : la ligne qui matche ± 3 lignes voisines.
      const keep = new Set();
      lines.forEach((l, i) => {
        if (normalize(l).includes(nq)) {
          for (let j = Math.max(0, i - 3); j <= Math.min(lines.length - 1, i + 3); j++) keep.add(j);
        }
      });
      selected = Array.from(keep).sort((a, b) => a - b).map((i) => lines[i]);
      if (selected.length === 0) selected = lines;
    }
    let text = selected.join("\\n");
    const truncated = text.length > max;
    if (truncated) text = text.slice(0, max);
    return { text, truncated, page: pageContext() };
  }

  g.__tfsup = { collectTargets, locate, clearFocusedField, readText, pageContext };
})();
`;

/* ── Évaluation dans le monde isolé ── */

async function evalIsolated<T>(wc: WebContents, expression: string): Promise<T> {
  const code = `${HELPERS}\n(async () => (${expression}))()`;
  return (await wc.executeJavaScriptInIsolatedWorld(ISOLATED_WORLD_ID, [{ code }])) as T;
}

/* ── CDP (entrées trusted) ── */

function ensureDebugger(tab: SupplierTab): void {
  const dbg = tab.view.webContents.debugger;
  if (!tab.debuggerAttached || !dbg.isAttached()) {
    dbg.attach("1.3");
    tab.debuggerAttached = true;
  }
}

async function cdp(
  tab: SupplierTab,
  method: string,
  params: Record<string, unknown> = {},
): Promise<Record<string, unknown>> {
  ensureDebugger(tab);
  return (await tab.view.webContents.debugger.sendCommand(method, params)) as Record<
    string,
    unknown
  >;
}

/**
 * Même feedback visuel que le chatbot CRM (`fake-cursor.ts`) : déplace le
 * curseur IA puis halo de clic DANS la page fournisseur (monde isolé), car
 * la WebContentsView est au-dessus de la vue CRM.
 */
async function showFakeCursorAt(tab: SupplierTab, x: number, y: number): Promise<void> {
  try {
    const wc = tab.view.webContents;
    if (wc.isDestroyed()) return;
    // Borne dure : le feedback visuel ne doit JAMAIS bloquer l'action CDP
    // (fenêtre IA masquée / occluse → renderer throttlé, promesses lentes).
    const deadline = new Promise<void>((resolve) => setTimeout(resolve, 2000));
    const anim = (async () => {
      await wc.executeJavaScriptInIsolatedWorld(ISOLATED_WORLD_ID, [
        { code: FAKE_CURSOR_INJECT },
      ]);
      await wc.executeJavaScriptInIsolatedWorld(ISOLATED_WORLD_ID, [
        {
          code: `(async () => {
            const c = globalThis.__tfFakeCursor;
            if (!c) return;
            await c.moveTo(${Math.round(x)}, ${Math.round(y)});
            await c.clickEffect();
            c.hideSoon();
          })()`,
        },
      ]);
    })().catch(() => {});
    await Promise.race([anim, deadline]);
  } catch {
    /* feedback best-effort — le clic CDP suit quoi qu'il arrive */
  }
}

async function trustedClick(tab: SupplierTab, x: number, y: number): Promise<void> {
  await showFakeCursorAt(tab, x, y);
  await cdp(tab, "Input.dispatchMouseEvent", { type: "mouseMoved", x, y, button: "none" });
  await sleep(60);
  await cdp(tab, "Input.dispatchMouseEvent", {
    type: "mousePressed",
    x,
    y,
    button: "left",
    buttons: 1,
    clickCount: 1,
  });
  await sleep(40);
  await cdp(tab, "Input.dispatchMouseEvent", {
    type: "mouseReleased",
    x,
    y,
    button: "left",
    buttons: 0,
    clickCount: 1,
  });
}

async function trustedTypeText(tab: SupplierTab, text: string): Promise<void> {
  // Frappe caractère par caractère (vitesse plafonnée, comme ui-driver.tsx).
  const perChar = Math.max(18, Math.min(55, Math.floor(1600 / Math.max(text.length, 1))));
  for (const ch of text) {
    await cdp(tab, "Input.dispatchKeyEvent", {
      type: "keyDown",
      text: ch,
      unmodifiedText: ch,
      key: ch,
    });
    await cdp(tab, "Input.dispatchKeyEvent", { type: "keyUp", key: ch });
    await sleep(perChar);
  }
}

async function trustedEnter(tab: SupplierTab): Promise<void> {
  const common = {
    key: "Enter",
    code: "Enter",
    windowsVirtualKeyCode: 13,
    nativeVirtualKeyCode: 13,
  };
  await cdp(tab, "Input.dispatchKeyEvent", { type: "rawKeyDown", ...common });
  await cdp(tab, "Input.dispatchKeyEvent", { type: "char", text: "\r", unmodifiedText: "\r", ...common });
  await cdp(tab, "Input.dispatchKeyEvent", { type: "keyUp", ...common });
}

/** Capture d'écran (PNG base64) — pour la vision LLM (usage futur). */
export async function captureScreenshot(tab: SupplierTab): Promise<string> {
  const res = await cdp(tab, "Page.captureScreenshot", { format: "png" });
  return String(res.data || "");
}

/* ── Handlers d'actions ── */

type Params = Record<string, unknown>;
type Result = Record<string, unknown>;

async function pageOf(tab: SupplierTab): Promise<Result> {
  try {
    return await evalIsolated<Result>(tab.view.webContents, "globalThis.__tfsup.pageContext()");
  } catch {
    return { url: tab.view.webContents.getURL(), title: tab.view.webContents.getTitle() };
  }
}

async function handleListTargets(tab: SupplierTab, params: Params): Promise<Result> {
  const q = typeof params.q === "string" ? params.q : undefined;
  const res = await evalIsolated<{
    targets: unknown[];
    truncated: boolean;
    note?: string;
  }>(tab.view.webContents, `globalThis.__tfsup.collectTargets(${JSON.stringify(q ?? null)})`);
  const page = await pageOf(tab);
  return { ok: true, page, ...res };
}

type LocateResult = {
  ok: boolean;
  x?: number;
  y?: number;
  label?: string;
  isField?: boolean;
  suggestions?: string[];
  page?: Result;
};

async function locateTarget(
  tab: SupplierTab,
  ref?: string,
  label?: string,
): Promise<LocateResult> {
  return evalIsolated<LocateResult>(
    tab.view.webContents,
    `globalThis.__tfsup.locate(${JSON.stringify(ref ?? null)}, ${JSON.stringify(label ?? null)})`,
  );
}

async function handleClick(tab: SupplierTab, params: Params): Promise<Result> {
  const ref = typeof params.ref === "string" ? params.ref : undefined;
  const label = typeof params.label === "string" ? params.label : undefined;
  const loc = await locateTarget(tab, ref, label);
  if (!loc.ok || loc.x == null || loc.y == null) {
    return {
      ok: false,
      error: `Cible introuvable (ref=${ref || "—"}, label=${label || "—"}). Refaire supplier_list_targets.`,
      suggestions: loc.suggestions || [],
      page: loc.page || (await pageOf(tab)),
    };
  }
  await trustedClick(tab, loc.x, loc.y);
  // Laisser une éventuelle navigation / rendu se produire.
  await sleep(1200);
  return { ok: true, page: await pageOf(tab), clicked: loc.label || ref || label };
}

async function handleType(tab: SupplierTab, params: Params): Promise<Result> {
  const ref = typeof params.ref === "string" ? params.ref : undefined;
  const label = typeof params.label === "string" ? params.label : undefined;
  const text = typeof params.text === "string" ? params.text : "";
  const submit = params.submit === true;

  const loc = await locateTarget(tab, ref, label);
  if (!loc.ok || loc.x == null || loc.y == null) {
    return {
      ok: false,
      error: `Champ introuvable (ref=${ref || "—"}, label=${label || "—"}).`,
      suggestions: loc.suggestions || [],
      page: loc.page || (await pageOf(tab)),
    };
  }
  await trustedClick(tab, loc.x, loc.y);
  await sleep(150);
  await evalIsolated<boolean>(tab.view.webContents, "globalThis.__tfsup.clearFocusedField()");
  await trustedTypeText(tab, text);
  if (submit) {
    await sleep(120);
    await trustedEnter(tab);
  }
  await sleep(900);
  return { ok: true, page: await pageOf(tab), typed: text };
}

async function handleScroll(tab: SupplierTab, params: Params): Promise<Result> {
  const direction = params.direction === "up" ? -1 : 1;
  const bounds = tab.view.getBounds();
  const deltaY = direction * Math.round(Math.max(bounds.height, 400) * 0.75);
  await cdp(tab, "Input.dispatchMouseEvent", {
    type: "mouseWheel",
    x: Math.round(bounds.width / 2),
    y: Math.round(Math.max(bounds.height, 400) / 2),
    deltaX: 0,
    deltaY,
  });
  await sleep(650);
  return { ok: true, page: await pageOf(tab) };
}

async function handleRead(tab: SupplierTab, params: Params): Promise<Result> {
  const q = typeof params.q === "string" ? params.q : undefined;
  const maxChars = typeof params.maxChars === "number" ? params.maxChars : undefined;
  const res = await evalIsolated<Result>(
    tab.view.webContents,
    `globalThis.__tfsup.readText(${JSON.stringify(q ?? null)}, ${JSON.stringify(maxChars ?? null)})`,
  );
  return { ok: true, ...res };
}

/**
 * Capture JPEG compressée (vision LLM) — quality 60 ≈ 40-120 Ko sur une page
 * classique, assez pour lire l'UI sans exploser le contexte du modèle.
 */
async function handleScreenshot(tab: SupplierTab): Promise<Result> {
  const res = await cdp(tab, "Page.captureScreenshot", { format: "jpeg", quality: 60 });
  const data = String(res.data || "");
  if (!data) return { ok: false, error: "Capture d'écran vide", page: await pageOf(tab) };
  return { ok: true, page: await pageOf(tab), imageBase64: data, format: "jpeg" };
}

/* ── Point d'entrée ── */

export type SupplierActionRequest = {
  actionId: string;
  type: string;
  tabId?: string;
  params: Record<string, unknown>;
};

export type SupplierActionHooks = {
  /** Demande à l'UI CRM d'ouvrir/activer l'onglet workspace correspondant. */
  onTabOpened?: (info: {
    tabId: string;
    fournisseurId: number;
    url: string;
    title: string;
  }) => void;
};

/**
 * Exécute une action external_* / supplier_* et retourne un résultat
 * JSON-compatible (même contrat que executeUiAction : jamais de throw).
 */
export async function executeSupplierAction(
  manager: SupplierTabManager,
  req: SupplierActionRequest,
  hooks?: SupplierActionHooks,
): Promise<Result> {
  try {
    const actionType = String(req.type || "").replace(/^supplier_/, "external_");

    if (
      actionType === "external_list_tabs" ||
      req.type === "supplier_list_tabs"
    ) {
      return { ok: true, tabs: manager.list() };
    }

    if (
      actionType === "external_open_tab" ||
      req.type === "supplier_open_tab"
    ) {
      const siteId = Number(
        req.params.site_id ?? req.params.fournisseur_id ?? 0,
      );
      const url = typeof req.params.url === "string" ? req.params.url : "";
      if (!Number.isFinite(siteId) || siteId <= 0) {
        return { ok: false, error: "site_id invalide" };
      }
      if (!/^https?:\/\//i.test(url)) {
        return { ok: false, error: "url invalide (http(s):// requis)" };
      }
      const tab = await manager.openTab(siteId, url);
      const page = await pageOf(tab);
      const title =
        typeof page.title === "string" && page.title
          ? page.title
          : tab.view.webContents.getTitle() || url;
      hooks?.onTabOpened?.({
        tabId: tab.tabId,
        fournisseurId: tab.siteId ?? tab.fournisseurId,
        url: tab.view.webContents.getURL() || url,
        title,
      });
      return { ok: true, tabId: tab.tabId, page };
    }

    const tabId = req.tabId || (typeof req.params.tabId === "string" ? req.params.tabId : "");
    const tab = tabId ? manager.get(tabId) : manager.getActive();
    if (!tab) {
      return {
        ok: false,
        error: `Onglet introuvable (tabId=${tabId || "—"}). Faire supplier_list_tabs d'abord.`,
        tabs: manager.list(),
      };
    }
    // S'assurer que la vue est celle active (bounds content-area déjà connus).
    manager.activate(tab.tabId);
    hooks?.onTabOpened?.({
      tabId: tab.tabId,
      fournisseurId: tab.fournisseurId,
      url: tab.view.webContents.isDestroyed() ? "" : tab.view.webContents.getURL(),
      title: tab.view.webContents.isDestroyed() ? "" : tab.view.webContents.getTitle(),
    });
    if (tab.view.webContents.isLoading()) {
      await sleep(1500);
    }

    switch (req.type) {
      case "supplier_list_targets":
        return await handleListTargets(tab, req.params);
      case "supplier_click":
        return await handleClick(tab, req.params);
      case "supplier_type":
        return await handleType(tab, req.params);
      case "supplier_scroll":
        return await handleScroll(tab, req.params);
      case "supplier_read":
        return await handleRead(tab, req.params);
      case "supplier_screenshot":
        return await handleScreenshot(tab);
      default:
        return { ok: false, error: `Action inconnue: ${req.type}` };
    }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Erreur exécution action fournisseur",
    };
  }
}
