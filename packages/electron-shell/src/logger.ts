/**
 * Logger process principal — paramétré par logBasename (manifest).
 * Port de electron/logger.ts (TF2 0.10.26), sans hardcode TempoFlow.
 */

import fs from "node:fs";
import path from "node:path";

const MAX_LOG_BYTES = 8 * 1024 * 1024;
const ARCHIVE_KEEP = 10;
const ARCHIVE_MAX_TOTAL_BYTES = 50 * 1024 * 1024;
const RING_SIZE = 2500;

let logDir: string | null = null;
let logFile: string | null = null;
let logBasename = "creezio-main";
const ring: string[] = [];

let opsLineHandler: ((scope: string, line: string) => boolean) | null = null;

export function setOpsLineHandler(
  handler: ((scope: string, line: string) => boolean) | null,
): void {
  opsLineHandler = handler;
}

export function initLogger(
  userDataDir: string,
  basename = "creezio-main",
): void {
  try {
    logBasename = basename;
    logDir = path.join(userDataDir, "logs");
    fs.mkdirSync(logDir, { recursive: true });
    logFile = path.join(logDir, `${logBasename}.log`);
    archivePreviousBootLog();
    log("logger", `--- démarrage ${new Date().toISOString()} ---`);
  } catch {
    logFile = null;
  }
}

export function logFilePath(): string | null {
  return logFile;
}

function archivePreviousBootLog(): void {
  if (!logFile || !logDir) return;
  try {
    const st = fs.statSync(logFile);
    if (st.size > 0) {
      const stamp = new Date(st.mtimeMs).toISOString().replace(/[:.]/g, "-");
      fs.renameSync(
        logFile,
        path.join(logDir, `${logBasename}-${stamp}.log`),
      );
    }
  } catch {
    /* premier lancement */
  }
  try {
    const old = `${logFile}.old`;
    if (fs.existsSync(old)) {
      const st = fs.statSync(old);
      const stamp = new Date(st.mtimeMs).toISOString().replace(/[:.]/g, "-");
      fs.renameSync(old, path.join(logDir, `${logBasename}-${stamp}.log`));
    }
  } catch {
    /* ignore */
  }
  try {
    const files = fs
      .readdirSync(logDir)
      .filter(
        (f) => f.startsWith(`${logBasename}-`) && f.endsWith(".log"),
      )
      .map((f) => {
        const p = path.join(logDir!, f);
        return { p, mtime: fs.statSync(p).mtimeMs, size: fs.statSync(p).size };
      })
      .sort((a, b) => b.mtime - a.mtime);
    let total = 0;
    for (let i = 0; i < files.length; i++) {
      const f = files[i]!;
      total += f.size;
      if (i >= ARCHIVE_KEEP || total > ARCHIVE_MAX_TOTAL_BYTES) {
        try {
          fs.rmSync(f.p, { force: true });
        } catch {
          /* ignore */
        }
      }
    }
  } catch {
    /* ignore */
  }
}

function append(line: string): void {
  ring.push(line);
  if (ring.length > RING_SIZE) ring.shift();
  if (!logFile) return;
  try {
    fs.appendFileSync(logFile, `${line}\n`, "utf8");
    const st = fs.statSync(logFile);
    if (st.size > MAX_LOG_BYTES) {
      // Rotation simple : troncature tête (best-effort).
      const buf = fs.readFileSync(logFile, "utf8");
      fs.writeFileSync(logFile, buf.slice(-Math.floor(MAX_LOG_BYTES / 2)), "utf8");
    }
  } catch {
    /* ignore */
  }
}

export function log(scope: string, message: string): void {
  const line = `[${new Date().toISOString()}] [${scope}] ${message}`;
  append(line);
  try {
    console.log(line);
  } catch {
    /* ignore */
  }
}

export function logError(scope: string, err: unknown): void {
  const msg = err instanceof Error ? err.stack || err.message : String(err);
  log(scope, `ERROR ${msg}`);
}

export function getLogRing(): string[] {
  return [...ring];
}

/** Route les lignes événement structurées des sous-process (si handler ops). */
export function feedChildLine(scope: string, line: string): void {
  if (opsLineHandler?.(scope, line)) return;
  log(scope, line);
}
