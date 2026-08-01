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

export async function warmBrandNativeHosts(
  os: BrandOsComposition,
  opts?: {
    start?: boolean;
    hermes?: boolean;
    n8n?: boolean;
    onLog?: (line: string) => void;
  },
): Promise<WarmNativeHostsResult> {
  const start = opts?.start !== false;
  const doN8n = opts?.n8n !== false;
  const doHermes = opts?.hermes !== false;
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
    const ensured = await n8n.ensureN8nRuntimeFromUi({ onLog: log });
    out.n8n.ensured = Boolean(ensured.ok);
    out.n8n.entry = ensured.entryPath ?? n8n.findN8nEntry();
    out.n8n.detail = ensured.detail;
    if (start && out.n8n.entry) {
      log("n8n start…");
      const running = await n8n.startN8n({
        connectionMode: "local",
        autoBootstrap: true,
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
    const ensured = await hermes.ensureHermesRuntimeFromUi({ onLog: log });
    out.hermes.ensured = Boolean(ensured.ok);
    out.hermes.binary = ensured.binary ?? hermes.findHermesBinary();
    out.hermes.detail = ensured.detail;
    if (start && out.hermes.binary) {
      log("hermes start…");
      const running = await hermes.startHermes({
        connectionMode: "local",
        autoBootstrap: true,
      });
      out.hermes.started = Boolean(running);
      out.hermes.binary = hermes.findHermesBinary();
    }
  }

  return out;
}
