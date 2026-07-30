/**
 * Cohérence SQLite ↔ Meili au boot Electron.
 *
 * IMPORTANT : pas de better-sqlite3 ici (ABI Node ≠ Electron). Les lectures
 * SQLite passent par un spawn Node vanilla (meili-coherence-query.js).
 */

import { spawnSync } from "node:child_process";
import {
  GED_INDEXES,
  INDEX_SCHEMA_VERSION,
  expectedMeiliCounts,
  type GedSqlCounts,
  type MeiliFingerprint,
  type GedIndexUid,
} from "./index-schema.js";
import type { RunningMeili } from "../meili-launcher.js";

export type MeiliCoherencePaths = {
  dbPath: () => string;
  nodeBinary: () => string;
  nodeScript: (rel: string) => string;
  nodeModulesPathForScripts: () => string | null | undefined;
};

let paths: MeiliCoherencePaths | null = null;

/** Configure les chemins spawn (marque) — requis avant decideMeiliReady. */
export function configureMeiliCoherencePaths(next: MeiliCoherencePaths): void {
  paths = next;
}

function requirePaths(): MeiliCoherencePaths {
  if (!paths) {
    throw new Error(
      "MeiliCoherencePaths absents — appeler configureMeiliCoherencePaths()",
    );
  }
  return paths;
}

export type { GedSqlCounts, MeiliFingerprint };
export { INDEX_SCHEMA_VERSION } from "./index-schema.js";

type CoherenceDbSnapshot = {
  sql: GedSqlCounts;
  sqliteSchema: number;
  fingerprint: MeiliFingerprint | null;
  /** Marqueur d'indexation précédente interrompue (peut être absent — anciens builds). */
  indexInProgress?: { startedAt: string; appVersion?: string } | null;
};

function queryDbSnapshot(dbFile: string): CoherenceDbSnapshot {
  const p = requirePaths();
  const script = p.nodeScript("meili-coherence-query.js");
  const env: NodeJS.ProcessEnv = { ...process.env, DB_PATH: dbFile };
  delete env.ELECTRON_RUN_AS_NODE;
  const nm = p.nodeModulesPathForScripts();
  if (nm) env.NODE_PATH = nm;
  const r = spawnSync(p.nodeBinary(), [script], {
    env,
    encoding: "utf8",
    windowsHide: true,
    timeout: 20_000,
  });
  if (r.error) throw r.error;
  if (r.status !== 0) {
    throw new Error(
      `meili-coherence-query exit ${r.status}: ${(r.stderr || r.stdout || "").slice(0, 400)}`,
    );
  }
  const line = (r.stdout || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .pop();
  if (!line) throw new Error("meili-coherence-query: stdout vide");
  return JSON.parse(line) as CoherenceDbSnapshot;
}

async function meiliIndexStats(
  m: RunningMeili,
  uid: string,
): Promise<{ ok: boolean; missing: boolean; docs: number }> {
  try {
    const res = await fetch(`${m.host}/indexes/${uid}/stats`, {
      headers: { Authorization: `Bearer ${m.masterKey}` },
      signal: AbortSignal.timeout(5000),
    });
    if (res.status === 404) return { ok: true, missing: true, docs: 0 };
    if (!res.ok) return { ok: false, missing: false, docs: 0 };
    const data = (await res.json()) as { numberOfDocuments?: number };
    return { ok: true, missing: false, docs: Number(data.numberOfDocuments || 0) };
  } catch {
    return { ok: false, missing: false, docs: 0 };
  }
}

export type MeiliReadyDecision = {
  ready: boolean;
  reason: string;
  sql: GedSqlCounts;
  meili: Partial<Record<GedIndexUid, number>>;
  fingerprint: MeiliFingerprint | null;
  sqliteSchema: number;
  /** Indexation précédente interrompue (marqueur meta resté en place). */
  interruptedPrevious: boolean;
};

/**
 * Ready seulement si fingerprint aligné + chaque index attendu peuplé si SQL > 0.
 */
export async function decideMeiliReady(
  m: RunningMeili,
  dbFile?: string,
): Promise<MeiliReadyDecision> {
  dbFile = dbFile ?? requirePaths().dbPath();
  const snap = queryDbSnapshot(dbFile);
  const { sql, sqliteSchema, fingerprint } = snap;
  const interruptedPrevious = Boolean(snap.indexInProgress);
  const expected = expectedMeiliCounts(sql);
  const meili: Partial<Record<GedIndexUid, number>> = {};

  const decide = (ready: boolean, reason: string): MeiliReadyDecision => ({
    ready,
    reason,
    sql,
    meili,
    fingerprint,
    sqliteSchema,
    interruptedPrevious,
  });

  if (!fingerprint) {
    return decide(
      false,
      interruptedPrevious
        ? "fingerprint-absent (indexation précédente interrompue)"
        : "fingerprint-absent",
    );
  }
  if (fingerprint.indexSchema !== INDEX_SCHEMA_VERSION) {
    return decide(
      false,
      `index-schema-mismatch fp=${fingerprint.indexSchema} want=${INDEX_SCHEMA_VERSION}`,
    );
  }
  if (fingerprint.sqliteSchema !== sqliteSchema) {
    return decide(
      false,
      `sqlite-schema-mismatch fp=${fingerprint.sqliteSchema} want=${sqliteSchema}`,
    );
  }

  for (const uid of GED_INDEXES) {
    const st = await meiliIndexStats(m, uid);
    if (!st.ok) {
      return decide(false, `meili-stats-error:${uid}`);
    }
    if (st.missing) {
      return decide(false, `index-missing:${uid}`);
    }
    meili[uid] = st.docs;
    const want = expected[uid];
    if (want > 0 && st.docs === 0) {
      return decide(false, `index-empty-while-sql:${uid} sql=${want}`);
    }
  }

  return decide(true, "fingerprint-ok");
}
