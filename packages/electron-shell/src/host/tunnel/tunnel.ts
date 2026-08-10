/**
 * Cloudflare Tunnel — service brand-agnostic (TF2 tunnel.ts).
 * Provision URLs / tokens injectés via HostRuntimeContext.tunnelProvision.
 */

import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import {
  buildTunnelPublicUrls,
  deriveTunnelServiceUrl,
  HERMES_DESKTOP_WEBUI_PORT,
  N8N_DESKTOP_PORT,
  resolveTunnelHostMode,
  type TunnelEmbedService,
  type TunnelHostMode,
  type TunnelPublicUrls,
} from "@creezio/platform-core";
import type { HostRuntimeContext } from "../context.js";
import { hostLog, hostProductName } from "../context.js";
import { kitOsResourcesRoot } from "../kit-os-resources.js";
import type { LocalConfigStore, TunnelConfig } from "../local-config.js";
import { applyOsSandboxEnv } from "../sandbox/embed-sandbox.js";

export type TunnelRuntimeStatus = {
  configured: boolean;
  slug: string | null;
  hostname: string | null;
  publicUrl: string | null;
  publicUrls: TunnelPublicUrls | null;
  online: boolean;
  error: string | null;
  pcMustBeOn: true;
};

export type TunnelIngressPorts = {
  crmPort: number;
  n8nPort?: number | null;
  hermesPort?: number | null;
};

export type TunnelService = {
  getTunnelStatus: () => TunnelRuntimeStatus;
  checkTunnelSlug: (
    slug: string,
  ) => Promise<{ available: boolean; reason?: string; hostname?: string }>;
  reserveTunnel: (
    slug: string,
    localPort: number,
  ) => Promise<
    | { ok: true; hostname: string; publicUrl: string }
    | { ok: false; error: string }
  >;
  configureTunnelIngress: (ports: TunnelIngressPorts) => Promise<void>;
  /**
   * Surface publique locale (sans Cloudflare) — MCP = `{publicUrl}/mcp`.
   * Utilisé quand le provisioner distant n’est pas joignable / en harness.
   */
  enableLocalPublicSurface: (opts: {
    localPort: number;
    slug?: string;
  }) => { ok: true; publicUrl: string; publicMcp: string };
  /** CRM public URL + `/mcp` (tunnel réel ou surface locale). */
  publicMcpUrl: () => string | null;
  publicUrlForEmbedService: (service: TunnelEmbedService) => string | null;
  startCloudflared: () => Promise<void>;
  stopCloudflared: () => void;
  forgetTunnel: () => void;
  publicUrlForServer: () => string | null;
};

function httpJson(
  method: string,
  urlStr: string,
  token: string,
  body?: unknown,
): Promise<{ status: number; json: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const lib = u.protocol === "https:" ? https : http;
    const payload = body ? JSON.stringify(body) : null;
    const req = lib.request(
      {
        protocol: u.protocol,
        hostname: u.hostname,
        port: u.port || (u.protocol === "https:" ? 443 : 80),
        path: u.pathname + u.search,
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...(payload
            ? { "Content-Length": Buffer.byteLength(payload) }
            : {}),
        },
        timeout: 30000,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");
          let json: Record<string, unknown> = {};
          try {
            json = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
          } catch {
            json = { error: raw.slice(0, 200) };
          }
          resolve({ status: res.statusCode || 0, json });
        });
      },
    );
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Timeout provisioner tunnel"));
    });
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function cloudflaredBinary(
  ctx: HostRuntimeContext,
): string | null {
  const envKey = `${ctx.manifest.envPrefix}_CLOUDFLARED_BINARY`;
  if (!ctx.isPackaged) {
    // Override marque puis générique kit (image Docker : /opt/creezio/bin).
    for (const key of [envKey, "CREEZIO_CLOUDFLARED_BINARY"]) {
      const override = (process.env[key] || "").trim();
      if (override && fs.existsSync(override)) return override;
    }
  }
  const name =
    process.platform === "win32" ? "cloudflared.exe" : "cloudflared";
  const candidates = [
    path.join(ctx.resourcesRoot, "bin", name),
    path.join(ctx.resourcesRoot, "resources", "bin", name),
    path.join(kitOsResourcesRoot(), "bin", name),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export function createTunnelService(opts: {
  ctx: HostRuntimeContext;
  store: LocalConfigStore;
}): TunnelService {
  const { ctx, store } = opts;
  let child: ChildProcess | null = null;
  let lastError: string | null = null;
  let online = false;

  /**
   * Mode sidecar (M2) : cloudflared tourne dans un conteneur du stack
   * compose — le kernel ne spawn plus rien. L'ingress pointe le nom de
   * service (`CREEZIO_TUNNEL_SERVICE_HOST`, défaut "app") et la config
   * tunnel peut être seedée par env (stack provisionné par le CLI hôte).
   */
  const sidecar = /^(1|true|yes)$/i.test(
    String(process.env.CREEZIO_TUNNEL_SIDECAR || "").trim(),
  );
  const serviceHost = () =>
    String(process.env.CREEZIO_TUNNEL_SERVICE_HOST || "app").trim() || "app";

  function provision() {
    const p = ctx.tunnelProvision;
    if (!p?.baseUrl || !p?.token) {
      throw new Error(
        "tunnelProvision manquant sur HostRuntimeContext (baseUrl + token)",
      );
    }
    return p;
  }

  /** Env CREEZIO_TUNNEL_FLAT_HOSTS > manifest.tunnelHostMode > nested. */
  function brandHostMode(): TunnelHostMode {
    const env = String(process.env.CREEZIO_TUNNEL_FLAT_HOSTS || "").trim();
    if (env) return resolveTunnelHostMode();
    return resolveTunnelHostMode(ctx.manifest.tunnelHostMode);
  }

  function urlsForHostname(hostname: string): TunnelPublicUrls {
    return buildTunnelPublicUrls(hostname, brandHostMode());
  }

  function parseProvisionerPublicUrls(
    raw: unknown,
    hostname: string,
  ): TunnelPublicUrls {
    if (raw && typeof raw === "object") {
      const o = raw as Record<string, unknown>;
      const crm = typeof o.crm === "string" ? o.crm : "";
      const n8n = typeof o.n8n === "string" ? o.n8n : "";
      const hermes = typeof o.hermes === "string" ? o.hermes : "";
      if (crm && n8n && hermes) {
        return { crm, n8n, hermes };
      }
    }
    return urlsForHostname(hostname);
  }

  function getTunnelStatus(): TunnelRuntimeStatus {
    const cfg = store.getTunnelConfig();
    const isLocalSurface =
      Boolean(cfg?.publicUrl?.startsWith("http://127.0.0.1")) ||
      cfg?.tunnelToken === "local" ||
      String(cfg?.tunnelId || "").startsWith("local-");
    const mode = brandHostMode();
    // Exiger hostMode aligné — sinon rebuild (migration nested↔flat).
    const storedOk =
      Boolean(cfg?.publicUrls?.n8n && cfg?.publicUrls?.hermes) &&
      cfg?.hostMode === mode;
    const publicUrls = isLocalSurface
      ? cfg?.publicUrls || {
          crm: cfg!.publicUrl,
          n8n: `http://127.0.0.1:${N8N_DESKTOP_PORT}`,
          hermes: `http://127.0.0.1:${HERMES_DESKTOP_WEBUI_PORT}`,
        }
      : storedOk
        ? cfg!.publicUrls!
        : cfg?.hostname
          ? urlsForHostname(cfg.hostname)
          : null;
    return {
      configured: Boolean(cfg),
      slug: cfg?.slug ?? null,
      hostname: cfg?.hostname ?? null,
      publicUrl: cfg?.publicUrl ?? null,
      publicUrls,
      online: isLocalSurface
        ? online
        : sidecar
          ? online // sidecar : pas de child in-process — seed/configure suffisent
          : online && Boolean(child && !child.killed),
      error: lastError,
      pcMustBeOn: true,
    };
  }

  async function checkTunnelSlug(slug: string) {
    const p = provision();
    const { status, json } = await httpJson(
      "GET",
      `${p.baseUrl}/check?slug=${encodeURIComponent(slug)}`,
      p.token,
    );
    if (status !== 200) {
      return {
        available: false,
        reason: String(json.error || `HTTP ${status}`),
      };
    }
    return {
      available: Boolean(json.available),
      reason: json.reason ? String(json.reason) : undefined,
      hostname: json.hostname ? String(json.hostname) : undefined,
    };
  }

  async function reserveTunnel(slug: string, localPort: number) {
    // Stack compose : le tunnel est provisionné par le CLI hôte — le token
    // et le hostname arrivent par env (tunnel.env du stack). On seede le
    // store local sans re-réserver (le /reserve provisioner n'est pas
    // idempotent : un slug pris renvoie 409).
    if (sidecar) {
      const envToken = String(process.env.CREEZIO_TUNNEL_TOKEN || "").trim();
      if (!envToken) {
        return {
          ok: false as const,
          error:
            "CREEZIO_TUNNEL_SIDECAR=1 sans CREEZIO_TUNNEL_TOKEN — stack incomplet (creezio server-docker migrate-stack <nom>)",
        };
      }
      const hostname = (
        process.env.CREEZIO_TUNNEL_HOSTNAME || `${slug}.${ctx.manifest.tunnelRootDomain}`
      ).trim();
      const publicUrl = `https://${hostname}`;
      store.setTunnelConfig({
        slug,
        hostname,
        publicUrl,
        tunnelId: String(process.env.CREEZIO_TUNNEL_ID || "").trim(),
        tunnelToken: envToken,
        localPort,
        publicUrls: urlsForHostname(hostname),
        hostMode: brandHostMode(),
        emailDomain: `${slug}.mail.${ctx.manifest.tunnelRootDomain}`,
        servicePorts: {
          n8n: N8N_DESKTOP_PORT,
          hermes: HERMES_DESKTOP_WEBUI_PORT,
        },
      });
      return { ok: true as const, hostname, publicUrl };
    }
    const p = provision();
    const { status, json } = await httpJson(
      "POST",
      `${p.baseUrl}/reserve`,
      p.token,
      {
        slug,
        installId: ctx.getInstallId?.() ?? "unknown",
        localPort,
      },
    );
    if (status !== 200 || !json.ok) {
      return { ok: false as const, error: String(json.error || `HTTP ${status}`) };
    }
    const tunnelToken = String(json.tunnelToken || "");
    const hostname = String(json.hostname || "");
    const publicUrl = String(json.publicUrl || `https://${hostname}`);
    const tunnelId = String(json.tunnelId || "");
    if (!tunnelToken || !hostname || !tunnelId) {
      return { ok: false as const, error: "Réponse provisioner incomplete" };
    }
    const publicUrls = parseProvisionerPublicUrls(json.publicUrls, hostname);
    const hostMode =
      json.hostMode === "flat" || json.hostMode === "nested"
        ? (json.hostMode as TunnelHostMode)
        : brandHostMode();
    const mailRoot =
      p.mailRootDomain || `mail.${ctx.manifest.tunnelRootDomain}`;
    const emailDomain =
      typeof json.emailDomain === "string" && json.emailDomain
        ? String(json.emailDomain)
        : `${String(json.slug || slug)}.${mailRoot}`;
    const emailInboundSecret =
      typeof json.emailInboundSecret === "string"
        ? String(json.emailInboundSecret).trim()
        : "";
    if (emailInboundSecret) store.setEmailInboundSecret(emailInboundSecret);
    store.setTunnelConfig({
      slug: String(json.slug || slug),
      hostname,
      publicUrl,
      tunnelId,
      tunnelToken,
      localPort,
      publicUrls,
      hostMode,
      emailDomain,
      servicePorts: {
        n8n: N8N_DESKTOP_PORT,
        hermes: HERMES_DESKTOP_WEBUI_PORT,
      },
    });
    return { ok: true as const, hostname, publicUrl };
  }

  async function configureTunnelIngress(ports: TunnelIngressPorts) {
    const cfg = store.getTunnelConfig();
    if (!cfg) return;
    const p = provision();
    const n8nPort = ports.n8nPort ?? cfg.servicePorts?.n8n ?? N8N_DESKTOP_PORT;
    const hermesPort =
      ports.hermesPort ??
      cfg.servicePorts?.hermes ??
      HERMES_DESKTOP_WEBUI_PORT;
    const { status, json } = await httpJson(
      "POST",
      `${p.baseUrl}/configure`,
      p.token,
      {
        slug: cfg.slug,
        tunnelId: cfg.tunnelId,
        hostname: cfg.hostname,
        localPort: ports.crmPort,
        crmPort: ports.crmPort,
        n8nPort,
        hermesPort,
        ...(sidecar ? { serviceHost: serviceHost() } : {}),
      },
    );
    if (status !== 200 || !json.ok) {
      throw new Error(String(json.error || `configure tunnel HTTP ${status}`));
    }
    const publicUrls = parseProvisionerPublicUrls(
      json.publicUrls,
      cfg.hostname,
    );
    const hostMode =
      json.hostMode === "flat" || json.hostMode === "nested"
        ? (json.hostMode as TunnelHostMode)
        : brandHostMode();
    const mailRoot =
      p.mailRootDomain || `mail.${ctx.manifest.tunnelRootDomain}`;
    const emailDomain =
      typeof json.emailDomain === "string" && json.emailDomain
        ? String(json.emailDomain)
        : cfg.emailDomain || `${cfg.slug}.${mailRoot}`;
    const emailInboundSecret =
      typeof json.emailInboundSecret === "string"
        ? String(json.emailInboundSecret).trim()
        : "";
    if (emailInboundSecret) store.setEmailInboundSecret(emailInboundSecret);
    store.setTunnelConfig({
      ...cfg,
      localPort: ports.crmPort,
      servicePorts: { n8n: n8nPort, hermes: hermesPort },
      publicUrls,
      hostMode,
      emailDomain,
    });
    hostLog(
      ctx,
      "tunnel",
      `ingress CRM:${ports.crmPort} n8n:${n8nPort} hermes:${hermesPort}`,
    );
  }

  function publicUrlForEmbedService(
    service: TunnelEmbedService,
  ): string | null {
    const cfg = store.getTunnelConfig();
    if (!cfg?.hostname) return null;
    // Surface locale : hostname = 127.0.0.1:port → publicUrl déjà canonique.
    if (cfg.publicUrl?.startsWith("http://127.0.0.1")) {
      if (service === "n8n") {
        return `http://127.0.0.1:${N8N_DESKTOP_PORT}`;
      }
      if (service === "hermes") {
        return `http://127.0.0.1:${HERMES_DESKTOP_WEBUI_PORT}`;
      }
    }
    const mode = brandHostMode();
    if (cfg.publicUrls?.[service] && cfg.hostMode === mode) {
      return cfg.publicUrls[service];
    }
    return urlsForHostname(cfg.hostname)[service] || null;
  }

  function publicMcpUrl(): string | null {
    const cfg = store.getTunnelConfig();
    if (!cfg?.publicUrl) return null;
    return `${String(cfg.publicUrl).replace(/\/$/, "")}/mcp`;
  }

  function enableLocalPublicSurface(opts: {
    localPort: number;
    slug?: string;
  }): { ok: true; publicUrl: string; publicMcp: string } {
    const slug = (opts.slug || ctx.manifest.brandId || "local")
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-");
    const publicUrl = `http://127.0.0.1:${opts.localPort}`;
    const hostname = `127.0.0.1:${opts.localPort}`;
    store.setTunnelConfig({
      slug,
      hostname,
      publicUrl,
      tunnelId: `local-${slug}`,
      tunnelToken: "local",
      localPort: opts.localPort,
      publicUrls: {
        crm: publicUrl,
        n8n: `http://127.0.0.1:${N8N_DESKTOP_PORT}`,
        hermes: `http://127.0.0.1:${HERMES_DESKTOP_WEBUI_PORT}`,
      },
      emailDomain: `${slug}.mail.localhost`,
      servicePorts: {
        n8n: N8N_DESKTOP_PORT,
        hermes: HERMES_DESKTOP_WEBUI_PORT,
      },
    });
    online = true;
    lastError = null;
    hostLog(ctx, "tunnel", `surface locale MCP ${publicUrl}/mcp`);
    return { ok: true, publicUrl, publicMcp: `${publicUrl}/mcp` };
  }

  async function startCloudflared(): Promise<void> {
    const cfg = store.getTunnelConfig();
    if (sidecar) {
      // Le sidecar cloudflared du stack compose tourne déjà (tunnel.env) —
      // le kernel ne spawn rien. L'état online est confirmé par la 1re
      // requête publique ; ici on se fie à la config seedée.
      online = Boolean(cfg?.tunnelToken);
      lastError = null;
      hostLog(
        ctx,
        "tunnel",
        "cloudflared géré par le sidecar compose (CREEZIO_TUNNEL_SIDECAR=1)",
      );
      return;
    }
    if (!cfg?.tunnelToken) {
      lastError = null;
      online = false;
      return;
    }
    if (child && !child.killed) {
      online = true;
      return;
    }
    const bin = cloudflaredBinary(ctx);
    if (!bin) {
      lastError = `Binaire cloudflared introuvable (resources/bin). Réinstallez ${hostProductName(ctx)}.`;
      online = false;
      throw new Error(lastError);
    }
    lastError = null;
    hostLog(ctx, "tunnel", `spawn ${bin} tunnel run`);
    child = spawn(
      bin,
      ["tunnel", "--no-autoupdate", "run", "--token", cfg.tunnelToken],
      {
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
        env: applyOsSandboxEnv({
          env: { ...process.env },
          profileHome: path.join(ctx.userDataDir, "tunnel-home"),
          userData: ctx.userDataDir,
          toolDirs: [],
        }),
      },
    );
    const onLine = (line: string) => {
      hostLog(ctx, "tunnel", line);
      if (/Registered tunnel connection|Connected to Cloudflare/i.test(line)) {
        online = true;
        lastError = null;
      }
      if (/error|failed/i.test(line) && !/0 error/i.test(line)) {
        lastError = line.slice(0, 300);
      }
    };
    child.stdout?.on("data", (d: Buffer) =>
      d.toString().split("\n").filter(Boolean).forEach(onLine),
    );
    child.stderr?.on("data", (d: Buffer) =>
      d.toString().split("\n").filter(Boolean).forEach(onLine),
    );
    child.on("error", (e) => {
      lastError = e.message;
      online = false;
      hostLog(ctx, "tunnel", `error: ${e.message}`);
    });
    child.on("exit", (code) => {
      online = false;
      child = null;
      if (code && code !== 0) {
        lastError = `cloudflared exit ${code}`;
        hostLog(ctx, "tunnel", lastError);
      }
    });
    await new Promise((r) => setTimeout(r, 1500));
    if (child && !child.killed) online = true;
  }

  function stopCloudflared(): void {
    if (child) {
      try {
        child.kill();
      } catch {
        /* ignore */
      }
      child = null;
    }
    online = false;
  }

  function forgetTunnel(): void {
    stopCloudflared();
    store.clearTunnelConfig();
    lastError = null;
  }

  function publicUrlForServer(): string | null {
    return store.getTunnelConfig()?.publicUrl ?? null;
  }

  return {
    getTunnelStatus,
    checkTunnelSlug,
    reserveTunnel,
    configureTunnelIngress,
    enableLocalPublicSurface,
    publicMcpUrl,
    publicUrlForEmbedService,
    startCloudflared,
    stopCloudflared,
    forgetTunnel,
    publicUrlForServer,
  };
}

export { buildTunnelPublicUrls, deriveTunnelServiceUrl };
export type { TunnelConfig };
