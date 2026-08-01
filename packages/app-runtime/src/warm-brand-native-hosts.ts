/**
 * Ensure + start hosts OS natifs (n8n, Hermes) pour une marque.
 * Les manifests/scripts viennent du kit `@creezio/electron-shell` — pas de la marque.
 */
import type { BrandOsComposition } from "./compose-brand-os.js";

export type WarmNativeHostsResult = {
  n8n: {
    ensured: boolean;
    started: boolean;
    entry: string | null;
    detail?: string;
  };
  hermes: {
    ensured: boolean;
    started: boolean;
    binary: string | null;
    detail?: string;
  };
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function withRetries<T>(
  label: string,
  attempts: number,
  fn: () => Promise<T>,
  log: (line: string) => void,
): Promise<T> {
  let last: unknown;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      const msg = err instanceof Error ? err.message : String(err);
      log(`${label} attempt ${i}/${attempts} failed: ${msg}`);
      if (i < attempts) await sleep(1500 * i);
    }
  }
  throw last instanceof Error ? last : new Error(String(last));
}

export async function warmBrandNativeHosts(
  os: BrandOsComposition,
  opts?: {
    start?: boolean;
    hermes?: boolean;
    n8n?: boolean;
    retries?: number;
    onLog?: (line: string) => void;
  },
): Promise<WarmNativeHostsResult> {
  const start = opts?.start !== false;
  const doN8n = opts?.n8n !== false;
  const doHermes = opts?.hermes !== false;
  const retries = Math.max(1, opts?.retries ?? 3);
  const log = opts?.onLog || ((line: string) => console.log(`[native] ${line}`));

  const out: WarmNativeHostsResult = {
    n8n: { ensured: false, started: false, entry: null },
    hermes: { ensured: false, started: false, binary: null },
  };

  if (doN8n) {
    const n8n = os.hostRuntime.n8nHost() as unknown as {
      ensureN8nRuntimeFromUi: (o?: {
        onLog?: (l: string) => void;
      }) => Promise<{ ok: boolean; detail?: string; entryPath?: string | null }>;
      startN8n: (o: {
        connectionMode: "local" | "remote";
        autoBootstrap?: boolean;
      }) => Promise<unknown>;
      findN8nEntry: () => string | null;
    };
    log("n8n ensure…");
    const ensured = await withRetries(
      "n8n ensure",
      retries,
      () => n8n.ensureN8nRuntimeFromUi({ onLog: log }),
      log,
    );
    out.n8n.ensured = Boolean(ensured.ok);
    out.n8n.entry = ensured.entryPath ?? n8n.findN8nEntry();
    out.n8n.detail = ensured.detail;
    if (start && out.n8n.entry) {
      log("n8n start…");
      const running = await withRetries(
        "n8n start",
        retries,
        async () => {
          const r = await n8n.startN8n({
            connectionMode: "local",
            autoBootstrap: true,
          });
          if (!r) throw new Error("n8n start returned falsy");
          return r;
        },
        log,
      ).catch((err) => {
        out.n8n.detail = err instanceof Error ? err.message : String(err);
        return null;
      });
      out.n8n.started = Boolean(running);
      out.n8n.entry = n8n.findN8nEntry();
    }
  }

  if (doHermes) {
    const hermes = os.hostRuntime.hermesHost() as unknown as {
      ensureHermesRuntimeFromUi: (o?: {
        onLog?: (l: string) => void;
      }) => Promise<{ ok: boolean; detail?: string; binary?: string | null }>;
      startHermes: (o: {
        connectionMode: "local" | "remote";
        autoBootstrap?: boolean;
      }) => Promise<unknown>;
      findHermesBinary: () => string | null;
    };
    log("hermes ensure…");
    const ensured = await withRetries(
      "hermes ensure",
      retries,
      () => hermes.ensureHermesRuntimeFromUi({ onLog: log }),
      log,
    ).catch((err) => {
      out.hermes.detail = err instanceof Error ? err.message : String(err);
      return { ok: false, detail: out.hermes.detail, binary: null };
    });
    out.hermes.ensured = Boolean(ensured.ok);
    out.hermes.binary = ensured.binary ?? hermes.findHermesBinary();
    out.hermes.detail = ensured.detail ?? out.hermes.detail;
    if (start && out.hermes.binary) {
      log("hermes start…");
      const running = await withRetries(
        "hermes start",
        retries,
        async () => {
          const r = await hermes.startHermes({
            connectionMode: "local",
            autoBootstrap: true,
          });
          if (!r) throw new Error("hermes start returned falsy");
          return r;
        },
        log,
      ).catch((err) => {
        out.hermes.detail = err instanceof Error ? err.message : String(err);
        return null;
      });
      out.hermes.started = Boolean(running);
      out.hermes.binary = hermes.findHermesBinary();
    }
  }

  return out;
}
