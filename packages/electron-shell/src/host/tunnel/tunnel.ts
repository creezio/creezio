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
  type TunnelEmbedService,
} from "@creezio/platform-core";
import type { HostRuntimeContext } from "../context.js";
import { hostLog, hostProductName } from "../context.js";
import type { LocalConfigStore, TunnelConfig } from "../local-config.js";
import { applyOsSandboxEnv } from "../sandbox/embed-sandbox.js";

export type TunnelRuntimeStatus = {
  configured: boolean;
  slug: string | null;
  hostname: string | null;
  publicUrl: string | null;
  publicUrls: ReturnType<typeof buildTunnelPublicUrls> | null;
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
    const override = (process.env[envKey] || "").trim();
    if (override && fs.existsSync(override)) return override;
  }
  const candidates = [
    path.join(
      ctx.resourcesRoot,
      "bin",
      process.platform === "win32" ? "cloudflared.exe" : "cloudflared",
    ),
    path.join(
      ctx.resourcesRoot,
      "resources",
      "bin",
      process.platform === "win32" ? "cloudflared.exe" : "cloudflared",
    ),
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

  function provision() {
    const p = ctx.tunnelProvision;
    if (!p?.baseUrl || !p?.token) {
      throw new Error(
        "tunnelProvision manquant sur HostRuntimeContext (baseUrl + token)",
      );
    }
    return p;
  }

  function getTunnelStatus(): TunnelRuntimeStatus {
    const cfg = store.getTunnelConfig();
    const publicUrls = cfg?.hostname
      ? buildTunnelPublicUrls(cfg.hostname)
      : null;
    return {
      configured: Boolean(cfg),
      slug: cfg?.slug ?? null,
      hostname: cfg?.hostname ?? null,
      publicUrl: cfg?.publicUrl ?? null,
      publicUrls,
      online: online && Boolean(child && !child.killed),
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
    const publicUrls = buildTunnelPublicUrls(hostname);
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
      },
    );
    if (status !== 200 || !json.ok) {
      throw new Error(String(json.error || `configure tunnel HTTP ${status}`));
    }
    const publicUrls = buildTunnelPublicUrls(cfg.hostname);
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
    return buildTunnelPublicUrls(cfg.hostname)[service] || null;
  }

  async function startCloudflared(): Promise<void> {
    const cfg = store.getTunnelConfig();
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
    publicUrlForEmbedService,
    startCloudflared,
    stopCloudflared,
    forgetTunnel,
    publicUrlForServer,
  };
}

export { buildTunnelPublicUrls, deriveTunnelServiceUrl };
export type { TunnelConfig };
