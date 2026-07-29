/**
 * Confinement « OS desktop » — tout ce que Hermes / n8n
 * voient comme HOME, workspace, temp et cache npm doit vivre sous userData.
 *
 * Aucun import Electron : testable depuis Node.
 */

import fs from "node:fs";
import path from "node:path";
import { buildConfinedPath } from "./os-sandbox.js";

/**
 * Pose une variable d'env de façon fiable sous Windows : les blocs d'env
 * Windows sont insensibles à la casse ("LocalAppData" vs "LOCALAPPDATA").
 * Si on ne supprime pas la variante héritée du parent, l'objet JS contient
 * DEUX clés et le process enfant peut lire l'ancienne valeur → évasion du
 * sandbox (constaté en prod : install.ps1 Hermes voyait le vrai
 * %LOCALAPPDATA% malgré l'override). Régression audit flotte 0.10.20.
 */
export function setSandboxEnvVar(
  env: NodeJS.ProcessEnv,
  name: string,
  value: string
): void {
  const upper = name.toUpperCase();
  for (const key of Object.keys(env)) {
    if (key.toUpperCase() === upper && key !== name) delete env[key];
  }
  env[name] = value;
}

/**
 * Garantit les défauts git dans le FICHIER .gitconfig du profil sandbox
 * (pointé par GIT_CONFIG_GLOBAL). Indispensable en PLUS de l'env
 * GIT_CONFIG_COUNT : install.ps1 Hermes ÉCRASE GIT_CONFIG_COUNT avec sa
 * propre entrée (windows.appendAtomically) juste avant le clone — seul le
 * fichier survit (post-mortem flotte 0.10.23 : « Filename too long »,
 * checkout > MAX_PATH malgré l'env). Append-only : ne clobber jamais ce que
 * Hermes/l'agent aurait pu y écrire (identité git, etc.).
 */
export function ensureSandboxGitConfig(gitConfigPath: string): void {
  const block = [
    "# Desktop OS — défauts git sandbox (ne pas retirer)",
    "[core]",
    "\tlongpaths = true",
    "[init]",
    "\tdefaultBranch = main",
    "",
  ].join("\n");
  try {
    let current = "";
    try {
      current = fs.readFileSync(gitConfigPath, "utf8");
    } catch {
      /* absent → création */
    }
    if (current.includes("longpaths")) return;
    const next = current ? `${current.replace(/\n*$/, "\n\n")}${block}` : block;
    fs.writeFileSync(gitConfigPath, next, "utf8");
  } catch {
    // best-effort : l'échec éventuel remontera via les logs git (fleet)
  }
}

export const DESKTOP_SANDBOX_MARKER_BEGIN = "# BEGIN CREEZIO-SANDBOX";
export const DESKTOP_SANDBOX_MARKER_END = "# END CREEZIO-SANDBOX";

/** Sous-dossiers stables sous `{userData}/hermes-home`. */
export function hermesSandboxPaths(hermesHome: string): {
  home: string;
  /** Fake HOME pour outils (home_mode: profile). */
  profileHome: string;
  /** CWD agent — jamais ~/workspace OS. */
  workspace: string;
} {
  const home = path.resolve(hermesHome);
  return {
    home,
    profileHome: path.join(home, "home"),
    workspace: path.join(home, "workspace"),
  };
}

/** Chemins communs sandbox sous userData. */
export function desktopSandboxPaths(userData: string): {
  root: string;
  tmp: string;
  npmCache: string;
  /** Faux %APPDATA% / %LOCALAPPDATA% confinés. */
  appData: string;
  localAppData: string;
  /** Caches d'outils (pip / uv / XDG) confinés. */
  toolCache: string;
} {
  const root = path.resolve(userData);
  const osProfile = path.join(root, "os-appdata");
  return {
    root,
    tmp: path.join(root, "tmp"),
    npmCache: path.join(root, "desktop-npm", "cache"),
    appData: path.join(osProfile, "Roaming"),
    localAppData: path.join(osProfile, "Local"),
    toolCache: path.join(root, "tool-cache"),
  };
}

/**
 * Confine TOTALEMENT l'environnement d'un process enfant embarqué au sandbox
 * TempoFlow : HOME/USERPROFILE, %APPDATA%/%LOCALAPPDATA%, TEMP, caches
 * (npm/pip/uv/XDG), configs globales (git/npm) et — si `toolDirs` est fourni —
 * un PATH minimal (dossiers TempoFlow + System32), sans le PATH utilisateur.
 *
 * Objectif : aucun binaire embarqué ne peut lire/écrire/résoudre hors du
 * périmètre desktop, même s'il ignore HOME (il ignorera aussi APPDATA/PATH).
 *
 * `toolDirs` : dossiers d'outils légitimes à mettre en tête de PATH (dossier
 * du Node desktop, bin du venv, resources/git…). Si omis, le PATH d'entrée
 * est conservé (compat appels internes qui gèrent déjà leur PATH via
 * buildIsolatedNodeEnv).
 */
export function applyOsSandboxEnv(opts: {
  env: NodeJS.ProcessEnv;
  /** HOME / USERPROFILE forcés (ex. hermes-home/home). */
  profileHome: string;
  userData: string;
  /** Dossiers d'outils desktop pour un PATH confiné (sinon PATH inchangé). */
  toolDirs?: string[];
  /**
   * Crée les dossiers sandbox (tmp, profil, AppData confinés…) — défaut true.
   * Sans ça, Meili plante à l'indexation : il écrit ses payloads dans %TEMP%
   * et Windows renvoie « os error 3 » si le dossier n'existe pas (régression
   * audit flotte 0.10.20). `false` réservé aux tests avec chemins factices.
   */
  mkdirs?: boolean;
}): NodeJS.ProcessEnv {
  const out: NodeJS.ProcessEnv = { ...opts.env };
  const profile = path.resolve(opts.profileHome);
  const { tmp, npmCache, appData, localAppData, toolCache } =
    desktopSandboxPaths(opts.userData);
  const set = (name: string, value: string) =>
    setSandboxEnvVar(out, name, value);

  if (opts.mkdirs !== false) {
    for (const dir of [profile, tmp, npmCache, appData, localAppData, toolCache]) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch {
        // best-effort : le process enfant échouera avec une erreur explicite
      }
    }
    ensureSandboxGitConfig(path.join(profile, ".gitconfig"));
  }

  set("HOME", profile);
  set("USERPROFILE", profile);
  // Empêche Hermes / outils de retomber sur le vrai profil OS.
  set("HERMES_REAL_HOME", profile);

  if (process.platform === "win32") {
    const parsed = path.win32.parse(profile);
    set("HOMEDRIVE", parsed.root.replace(/\\$/, "") || "C:");
    const withoutDrive = profile.replace(/^[A-Za-z]:/, "");
    set(
      "HOMEPATH",
      withoutDrive.startsWith("\\") ? withoutDrive : `\\${withoutDrive}`
    );
  } else {
    delete out.HOMEDRIVE;
    delete out.HOMEPATH;
  }

  // %APPDATA% / %LOCALAPPDATA% confinés — sinon fuite du vrai profil Windows.
  set("APPDATA", appData);
  set("LOCALAPPDATA", localAppData);

  set("TEMP", tmp);
  set("TMP", tmp);
  set("TMPDIR", tmp);

  // Caches d'outils confinés (Python/pip, uv, XDG POSIX).
  set("NPM_CONFIG_CACHE", npmCache);
  out.npm_config_cache = npmCache;
  set("PIP_CACHE_DIR", path.join(toolCache, "pip"));
  set("PYTHONUSERBASE", path.join(toolCache, "py-userbase"));
  set("UV_CACHE_DIR", path.join(toolCache, "uv"));
  // uv range ses Python managés via les known folders Windows (%APPDATA%\uv)
  // en IGNORANT l'env APPDATA — seuls ses propres UV_* le détournent. Sans
  // ça, l'install Hermes laisse des Python dans le vrai profil utilisateur.
  set("UV_PYTHON_INSTALL_DIR", path.join(toolCache, "uv-python"));
  set("UV_TOOL_DIR", path.join(toolCache, "uv-tools"));
  set("UV_TOOL_BIN_DIR", path.join(toolCache, "uv-tool-bin"));
  set("XDG_CACHE_HOME", path.join(toolCache, "xdg-cache"));
  set("XDG_CONFIG_HOME", path.join(toolCache, "xdg-config"));
  set("XDG_DATA_HOME", path.join(toolCache, "xdg-data"));

  // Configs globales neutralisées → confinées sous le profil sandbox.
  // ATTENTION : userconfig et globalconfig doivent être DEUX fichiers
  // distincts, sinon npm sort en erreur « double-loading config » et tout
  // bootstrap npm (n8n…) échoue (régression audit flotte 0.10.20).
  set("GIT_CONFIG_GLOBAL", path.join(profile, ".gitconfig"));
  set(
    "GIT_CONFIG_SYSTEM",
    process.platform === "win32" ? "NUL" : "/dev/null"
  );
  // Défauts git imposés par env (git ≥ 2.31), car la config du PC est
  // volontairement coupée ci-dessus (post-mortem flotte 0.10.22) :
  // - core.longpaths : le sandbox rend les chemins PROFONDS (~67 caractères
  //   de plus que le vrai profil) → sans lui, le checkout hermes-agent
  //   dépasse MAX_PATH et meurt (« unable to checkout working tree ») ;
  // - init.defaultBranch : sans config globale, git imprime un hint sur
  //   stderr que install.ps1 traite comme une erreur fatale (fallback ZIP).
  set("GIT_CONFIG_COUNT", "2");
  set("GIT_CONFIG_KEY_0", "core.longpaths");
  set("GIT_CONFIG_VALUE_0", "true");
  set("GIT_CONFIG_KEY_1", "init.defaultBranch");
  set("GIT_CONFIG_VALUE_1", "main");
  set("NPM_CONFIG_USERCONFIG", path.join(profile, ".npmrc"));
  set("NPM_CONFIG_GLOBALCONFIG", path.join(profile, ".npmrc-global"));

  // PATH confiné : uniquement outils desktop + System32 (pas le PATH user).
  // `toolDirs: []` = confinement pur système (Meili, cloudflared…).
  if (opts.toolDirs !== undefined) {
    const confined = buildConfinedPath({
      platform: process.platform,
      toolDirs: opts.toolDirs,
      env: out,
    });
    set("PATH", confined);
    if (process.platform === "win32") out.Path = confined;
  }

  return out;
}

/** Bloc YAML terminal forcé (cwd absolu + home_mode profile). */
export function buildHermesSandboxYamlBlock(workspaceAbs: string): string {
  const cwd = workspaceAbs.replace(/\\/g, "/");
  return [
    DESKTOP_SANDBOX_MARKER_BEGIN,
    "# Desktop OS — workspace + HOME confinés (régénéré à chaque boot)",
    "terminal:",
    "  backend: local",
    `  cwd: "${cwd}"`,
    "  home_mode: profile",
    "  timeout: 180",
    DESKTOP_SANDBOX_MARKER_END,
  ].join("\n");
}

/** Défaut Work / WebUI Hermes, compatible avec le reasoning Hermes. */
export const HERMES_DEFAULT_MODEL = "gpt-5.3-codex";
export const HERMES_DEFAULT_REASONING_EFFORT = "medium";
export const DESKTOP_REASONING_MIGRATION_MARKER =
  "# TEMPOFLOW-REASONING-MIGRATED-V1";

/** Anciens seeds TempoFlow à migrer vers HERMES_DEFAULT_MODEL. */
const HERMES_LEGACY_DEFAULTS = new Set([
  "gpt-4.1-mini",
  "gpt-5.2",
  "hermes-agent",
]);

/**
 * Hermes PROVIDER_REGISTRY n’a pas de provider `openai` (seulement
 * `openai-api` + OPENAI_API_KEY, ou `openai-codex` OAuth).
 * Un `provider: openai` fait échouer le chat avec un faux « no API key ».
 */
export function normalizeHermesModelProvider(yaml: string): string {
  return String(yaml || "").replace(
    /^([ \t]*provider:[ \t]*)openai[ \t]*$/gim,
    "$1openai-api",
  );
}

/**
 * Défaut modèle compatible reasoning + migration unique de l'ancien seed
 * TempoFlow `none` vers `medium`.
 *
 * L'ancien bootstrap ne laissait aucune provenance permettant de distinguer un
 * `none` choisi par l'utilisateur du `none` imposé par TempoFlow. La migration
 * V1 restaure donc `medium` une seule fois, puis le marqueur garantit que tout
 * choix utilisateur ultérieur (y compris `none`) est préservé aux boots suivants.
 * Les autres niveaux existants ne sont jamais écrasés.
 */
export function ensureHermesAgentModelDefaults(yaml: string): string {
  let body = normalizeHermesModelProvider(String(yaml || "").trim());

  if (!/^model:/m.test(body)) {
    body = [
      "model:",
      "  provider: openai-api",
      `  default: ${HERMES_DEFAULT_MODEL}`,
      "",
      body,
    ]
      .join("\n")
      .trim();
  } else {
    const modelBlockRe = /^(model:\n)((?:[ \t]+.+\n?)*)/m;
    const m = body.match(modelBlockRe);
    if (m && m[2] != null) {
      let block = m[2];
      const defRe = /^([ \t]+default:[ \t]*)([^\n#]+)/m;
      const dm = block.match(defRe);
      if (dm && dm[2] != null) {
        const current = dm[2].trim().replace(/^["']|["']$/g, "");
        if (!current || HERMES_LEGACY_DEFAULTS.has(current)) {
          block = block.replace(defRe, `$1${HERMES_DEFAULT_MODEL}`);
        }
      } else {
        block = `  default: ${HERMES_DEFAULT_MODEL}\n${block}`;
      }
      body = body.replace(modelBlockRe, `model:\n${block}`);
    }
  }

  if (!body.includes(DESKTOP_REASONING_MIGRATION_MARKER)) {
    if (/^[ \t]*reasoning_effort:[ \t]*none[ \t]*(?:#.*)?$/im.test(body)) {
      body = body.replace(
        /^([ \t]*reasoning_effort:[ \t]*)none([ \t]*(?:#.*)?)$/gim,
        `$1${HERMES_DEFAULT_REASONING_EFFORT}$2`,
      );
    } else if (!/^[ \t]*reasoning_effort:[ \t]*.+$/im.test(body)) {
      if (/^agent:\n/m.test(body)) {
        body = body.replace(
          /^agent:\n/m,
          `agent:\n  reasoning_effort: ${HERMES_DEFAULT_REASONING_EFFORT}\n`,
        );
      } else {
        body = `${body.trim()}\n\nagent:\n  reasoning_effort: ${HERMES_DEFAULT_REASONING_EFFORT}\n`;
      }
    }
    body = `${body.trim()}\n\n${DESKTOP_REASONING_MIGRATION_MARKER}`;
  }

  return body.replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Remplace/insère le bloc TEMPOFLOW-SANDBOX dans config.yaml.
 * Préserve le reste (model, skills, etc.).
 */
export function upsertHermesSandboxConfig(
  existingYaml: string,
  workspaceAbs: string,
): string {
  const block = buildHermesSandboxYamlBlock(workspaceAbs);
  const re = new RegExp(
    `${DESKTOP_SANDBOX_MARKER_BEGIN}[\\s\\S]*?${DESKTOP_SANDBOX_MARKER_END}\\n?`,
    "g",
  );
  let body = ensureHermesAgentModelDefaults(
    String(existingYaml || "").replace(re, "").trimEnd(),
  );

  // Retire un éventuel `terminal:` libre hors marqueur (évite doublons hostiles).
  // On ne touche qu’un bloc terminal de premier niveau simple.
  body = body.replace(
    /(^|\n)terminal:\n(?:[ \t]+.+\n?)*/g,
    (match, lead) => {
      // Si déjà dans un marqueur on l’a enlevé ; ici on drop les vieux terminal:
      return lead || "\n";
    },
  );

  body = body.replace(/\n{3,}/g, "\n\n").trim();
  if (!body) {
    return [
      "# TempoFlow Desktop — Hermes embed (OS sandbox)",
      "model:",
      "  provider: openai-api",
      `  default: ${HERMES_DEFAULT_MODEL}`,
      "",
      "agent:",
      `  reasoning_effort: ${HERMES_DEFAULT_REASONING_EFFORT}`,
      "",
      DESKTOP_REASONING_MIGRATION_MARKER,
      "",
      block,
      "",
    ].join("\n");
  }
  return `${body}\n\n${block}\n`;
}

/** @deprecated alias */
export const tempoflowSandboxPaths = desktopSandboxPaths;
