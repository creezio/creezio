/**
 * Rapport de crash : fichier local (userData/logs/) + envoi automatique au
 * collecteur de l'éditeur (télémétrie de crash — service autonome sur le VPS,
 * voir scripts/crash-collector/).
 *
 * Règles :
 * - best-effort intégral : timeout court, try/catch partout, JAMAIS de throw ;
 * - l'envoi ne bloque rien (fire-and-forget) ;
 * - identifiant d'installation anonyme (uuid v4 généré au 1er lancement,
 *   persisté dans userData) pour regrouper les rapports d'une même machine.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { recentLines, log, logFileTail } from "../logger.js";

export type CrashReporterConfig = {
  /** URL collecteur par défaut (marque). */
  defaultEndpoint: string;
  /** Env override (ex. TF2_CRASH_ENDPOINT / CERTIVAN_CRASH_ENDPOINT). */
  endpointEnvKey?: string;
  /** Miroir flotte optionnel (marque). */
  sendFleetCrash?: (report: Record<string, unknown>) => void | Promise<void>;
};

let config: CrashReporterConfig = {
  defaultEndpoint: "http://127.0.0.1/crash-disabled",
};

export function configureCrashReporter(next: CrashReporterConfig): void {
  config = next;
}

function resolveCrashEndpoint(): string {
  const key = config.endpointEnvKey;
  if (key) {
    const fromEnv = (process.env[key] || "").trim();
    if (fromEnv) return fromEnv;
  }
  return config.defaultEndpoint;
}

let installId = "unknown";
let appVersion = "0.0.0";
let crashDir: string | null = null;
let bootStage = "init";
const bootTimeline: { at: string; stage: string }[] = [];

/** Étape de démarrage courante — jointe aux rapports pour situer le crash. */
export function setBootStage(stage: string): void {
  bootStage = stage;
  bootTimeline.push({ at: new Date().toISOString(), stage });
  if (bootTimeline.length > 100) bootTimeline.shift();
  try {
    log("boot", `stage=${stage}`);
  } catch {
    /* best-effort */
  }
}

export function getBootStage(): string {
  return bootStage;
}

export function getBootTimeline(): { at: string; stage: string }[] {
  return bootTimeline.slice();
}

export function initCrashReporter(userDataDir: string, version: string): void {
  appVersion = version;
  try {
    crashDir = path.join(userDataDir, "logs");
    fs.mkdirSync(crashDir, { recursive: true });
    const idFile = path.join(userDataDir, "install-id");
    try {
      installId = fs.readFileSync(idFile, "utf8").trim();
      if (!installId) throw new Error("vide");
    } catch {
      installId = crypto.randomUUID();
      try {
        fs.writeFileSync(idFile, installId);
      } catch {
        /* best-effort */
      }
    }
  } catch {
    crashDir = null;
  }
}

/** Endpoint + identifiants exposés (injectés au serveur Next par server-launcher). */
export function crashEndpoint(): string {
  return resolveCrashEndpoint();
}

export function getInstallId(): string {
  return installId;
}

export type CrashKind =
  | "uncaughtException"
  | "unhandledRejection"
  | "boot-failure"
  | "child-exit"
  | "renderer-gone"
  | "child-process-gone"
  /** Erreur dans un handler IPC / la gestion d'onglets (non fatale). */
  | "tab-error"
  /** Exception JS / rejet non géré DANS la page (UI CRM ou vue fournisseur). */
  | "renderer-error"
  /** Événement webContents anormal : preload-error, did-fail-load, unresponsive… */
  | "web-event"
  /** Anomalie détectée par la boîte noire (ops-rules) — remontée always-on. */
  | "ops-anomaly";

/**
 * Enregistre un rapport localement puis l'envoie au collecteur.
 * Ne throw jamais.
 *
 * `boot-failure` : ring élargi + queue fichier + timeline des stages splash
 * (sinon un npm install n8n noie les 120 dernières lignes utiles).
 */
export function reportCrash(kind: CrashKind, detail: Record<string, unknown>): void {
  const isBootFail = kind === "boot-failure";
  const timestamp = new Date().toISOString();
  const report: Record<string, unknown> = {
    kind,
    installId,
    appVersion,
    bootStage,
    platform: process.platform,
    arch: process.arch,
    osRelease: os.release(),
    electron: process.versions.electron,
    timestamp,
    detail,
    bootTimeline: getBootTimeline(),
    recentLog: recentLines(isBootFail ? 800 : 120),
  };
  if (isBootFail) {
    const tail = logFileTail(150_000);
    if (tail != null) report.logFileTail = tail;
  }

  // 1) trace locale (consultable hors-ligne / envoyable manuellement)
  try {
    if (crashDir) {
      const name = `crash-${timestamp.replace(/[:.]/g, "-")}-${kind}.json`;
      fs.writeFileSync(path.join(crashDir, name), JSON.stringify(report, null, 2));
    }
  } catch {
    /* best-effort */
  }
  try {
    log("crash", `${kind} @ ${bootStage}: ${JSON.stringify(detail).slice(0, 500)}`);
  } catch {
    /* best-effort */
  }

  // 2) envoi distant fire-and-forget (collecteur crash legacy)
  void sendReport(report);

  // 3) miroir flotte optionnel (hook marque)
  if (config.sendFleetCrash) {
    void Promise.resolve(config.sendFleetCrash(report)).catch(() => {
      /* best-effort */
    });
  }

  // 4) miroir boîte noire (import dynamique anti-cycle) — sauf ops-anomaly,
  // qui EST déjà un événement du journal (sinon boucle).
  if (kind !== "ops-anomaly") {
    void import("@creezio/observability")
      .then((m) => m.trackCrashMirror(kind, detail))
      .catch(() => {
        /* best-effort */
      });
  }
}

/**
 * Variante anti-spam : au plus un rapport par `key` toutes les `intervalMs`
 * (5 min par défaut). Les occurrences suivantes restent dans le log local.
 */
const lastReportByKey = new Map<string, number>();
export function reportCrashDebounced(
  kind: CrashKind,
  key: string,
  detail: Record<string, unknown>,
  intervalMs = 5 * 60_000,
): void {
  const now = Date.now();
  const last = lastReportByKey.get(key) || 0;
  if (now - last < intervalMs) {
    try {
      log("crash", `(débounce ${key}) ${kind}: ${JSON.stringify(detail).slice(0, 300)}`);
    } catch {
      /* best-effort */
    }
    return;
  }
  lastReportByKey.set(key, now);
  reportCrash(kind, detail);
}

async function sendReport(report: Record<string, unknown>): Promise<void> {
  try {
    await fetch(resolveCrashEndpoint(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    /* hors-ligne / collecteur down : le rapport local reste disponible */
  }
}

/** Handlers globaux du process principal — à installer au tout début. */
export function installGlobalHandlers(): void {
  process.on("uncaughtException", (e) => {
    reportCrash("uncaughtException", {
      message: e?.message,
      stack: e?.stack,
    });
    // On ne quitte PAS : beaucoup d'exceptions (ex. réseau) sont récupérables.
  });
  process.on("unhandledRejection", (reason) => {
    reportCrash("unhandledRejection", {
      message: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
    });
  });
}
