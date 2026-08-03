/**
 * HTTP OS + métier — kernel api-kernel + MCP JSON + status hosts.
 * Un seul port loopback pour SPA / preuves / agents.
 */
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import {
  kitBinaryPaths,
  kitOsVendorDir,
} from "@creezio/electron-shell";
import {
  findFreePort,
  generateRecoveryKey,
  sanitizeConnectionProfile,
  testRemoteHealth,
  type ConnectionProfile,
} from "@creezio/platform-core";
import type { ApiKernel } from "@creezio/api-kernel";
import type { McpFacade } from "@creezio/mcp-facade";
import type { SqliteMailsStore } from "@creezio/mails";
import type { BrandOsComposition } from "./compose-brand-os.js";
import {
  emailSurfaceHandlesPath,
  mountBrandEmailSurface,
} from "./mount-brand-email-surface.js";

export type BrandOsHttpHandle = {
  port: number;
  baseUrl: string;
  server: http.Server;
  close: () => Promise<void>;
};

function readBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve(undefined);
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function send(
  res: http.ServerResponse,
  status: number,
  body: unknown,
  headers?: Record<string, string>,
) {
  const payload = JSON.stringify(body ?? {});
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-headers":
      "content-type, authorization, x-creezio-user-id",
    "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
    ...(headers || {}),
  });
  res.end(payload);
}

/** Bind HTTP — Docker/headless : `CREEZIO_HTTP_HOST=0.0.0.0` (ou METIER_HOST). */
export function resolveBrandOsHttpHost(explicit?: string): string {
  const raw = String(
    explicit ||
      process.env.CREEZIO_HTTP_HOST ||
      process.env.METIER_HOST ||
      "127.0.0.1",
  ).trim();
  if (raw === "0.0.0.0" || raw === "*" || raw === "::") return "0.0.0.0";
  return raw || "127.0.0.1";
}

function advertiseBaseUrl(host: string, port: number): string {
  const advertise = host === "0.0.0.0" ? "127.0.0.1" : host;
  return `http://${advertise}:${port}`;
}

export async function listenBrandOsHttp(opts: {
  api: ApiKernel;
  mcp: McpFacade;
  os?: BrandOsComposition | null;
  port?: number;
  host?: string;
  /**
   * Surface OAuth/admin MCP (Hono) — chemins /.well-known, /oauth, /api/v1/admin/mcp.
   */
  mcpSurfaceFetch?: (request: Request) => Promise<Response>;
  mcpSurfaceHandlesPath?: (pathname: string) => boolean;
  /**
   * Store mails kernel (sinon routes email via CREEZIO_CORE_DB_PATH).
   * Expose POST /api/v1/email/inbound (Worker Cloudflare).
   */
  getMailsStore?: () => SqliteMailsStore | null;
}): Promise<BrandOsHttpHandle> {
  const host = resolveBrandOsHttpHost(opts.host);
  const port = opts.port && opts.port > 0 ? opts.port : await findFreePort();
  const emailSurface = mountBrandEmailSurface(
    opts.getMailsStore ? { getStore: opts.getMailsStore } : undefined,
  );

  async function proxyHono(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    url: URL,
    fetchFn: (request: Request) => Promise<Response>,
  ): Promise<void> {
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const bodyBuf = Buffer.concat(chunks);
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (v == null) continue;
      if (Array.isArray(v)) v.forEach((x) => headers.append(k, x));
      else headers.set(k, v);
    }
    const request = new Request(url.toString(), {
      method: req.method || "GET",
      headers,
      body:
        ["GET", "HEAD"].includes(req.method || "GET") || bodyBuf.length === 0
          ? undefined
          : bodyBuf,
    });
    const response = await fetchFn(request);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    const ab = Buffer.from(await response.arrayBuffer());
    res.end(ab);
  }

  const server = http.createServer(async (req, res) => {
    try {
      if (req.method === "OPTIONS") {
        send(res, 204, {});
        return;
      }
      const url = new URL(req.url || "/", `http://${host}:${port}`);
      const pathname = url.pathname;

      // Inbox Worker path — avant api-kernel (sinon 404 platform_not_mounted).
      if (emailSurfaceHandlesPath(pathname)) {
        await proxyHono(req, res, url, async (request) =>
          emailSurface.app.fetch(request),
        );
        return;
      }

      // Proxy Hono OAuth / admin MCP (avant handlers JSON OS).
      if (
        opts.mcpSurfaceFetch &&
        opts.mcpSurfaceHandlesPath?.(pathname)
      ) {
        await proxyHono(req, res, url, opts.mcpSurfaceFetch);
        return;
      }

      if (pathname === "/api/v1/os/status" && req.method === "GET") {
        if (!opts.os) {
          send(res, 503, { ok: false, error: "os_not_composed" });
          return;
        }
        send(res, 200, opts.os.status());
        return;
      }

      // Agrégat prêt-à-l'emploi — une seule sonde pour preuves P&P multi-marques.
      if (pathname === "/api/v1/os/ready" && req.method === "GET") {
        if (!opts.os) {
          send(res, 503, {
            ok: false,
            ready: false,
            error: "os_not_composed",
          });
          return;
        }
        const bins = kitBinaryPaths();
        const hermes = opts.os.hostRuntime.hermesHost() as unknown as {
          findHermesBinary: () => string | null;
          getHermesStatusPayload: (mode: "local" | "remote") => {
            status?: string;
          };
        };
        const n8n = opts.os.hostRuntime.n8nHost() as unknown as {
          findN8nEntry: () => string | null;
          getN8nStatusPayload: (mode: "local" | "remote") => {
            status?: string;
          };
        };
        const tunnel = opts.os.hostRuntime.tunnelService() as unknown as {
          getTunnelStatus?: () => {
            publicUrl?: string | null;
            configured?: boolean;
          };
          publicMcpUrl?: () => string | null;
          enableLocalPublicSurface?: (o: {
            localPort: number;
          }) => { publicMcp: string };
        };
        if (
          process.env.CREEZIO_TUNNEL_LOCAL !== "0" &&
          typeof tunnel.enableLocalPublicSurface === "function" &&
          !tunnel.publicMcpUrl?.()
        ) {
          tunnel.enableLocalPublicSurface({ localPort: port });
        }
        const hermesBinary = hermes.findHermesBinary();
        const n8nEntry = n8n.findN8nEntry();
        const n8nVendorManifest = path.join(
          kitOsVendorDir("n8n"),
          "runtime-manifest.json",
        );
        const hermesVendorManifest = path.join(
          kitOsVendorDir("hermes-agent"),
          "runtime-manifest.json",
        );
        const publicMcp = tunnel.publicMcpUrl?.() ?? null;
        const mcpTools = await opts.mcp.listTools();
        const mounts = opts.api.listMounts();
        const checks = {
          osComposed: true,
          kitMeili: Boolean(bins.meili),
          kitCloudflared: Boolean(bins.cloudflared),
          kitN8nVendor: fs.existsSync(n8nVendorManifest),
          kitHermesVendor: fs.existsSync(hermesVendorManifest),
          n8nEntry: Boolean(n8nEntry),
          hermesBinary: Boolean(hermesBinary),
          tunnelMcpSurface: Boolean(publicMcp),
          mcpTools: mcpTools.tools.length > 0,
          apiMounts: mounts.length > 0,
        };
        // Ready P&P = composition + vendors/binaires kit + surface MCP + mounts.
        // Entry/binary installés = soft (ensure first-run peut les poser).
        const ready =
          checks.osComposed &&
          checks.kitMeili &&
          checks.kitN8nVendor &&
          checks.kitHermesVendor &&
          checks.tunnelMcpSurface &&
          checks.mcpTools &&
          checks.apiMounts;
        send(res, ready ? 200 : 503, {
          ok: ready,
          ready,
          checks,
          publicMcp,
          hermesBinary,
          n8nEntry,
          hermesStatus: hermes.getHermesStatusPayload("local")?.status ?? null,
          n8nStatus: n8n.getN8nStatusPayload("local")?.status ?? null,
          mcpToolCount: mcpTools.tools.length,
          apiMountCount: mounts.length,
          soft: {
            n8nEntry: checks.n8nEntry,
            hermesBinary: checks.hermesBinary,
            kitCloudflared: checks.kitCloudflared,
          },
        });
        return;
      }

      if (pathname === "/api/v1/os/hosts" && req.method === "GET") {
        if (!opts.os) {
          send(res, 503, { ok: false, error: "os_not_composed" });
          return;
        }
        const st = opts.os.status();
        // Instanciation lazy pour prouver que les factories kit existent
        const hermes = opts.os.hostRuntime.hermesHost();
        const n8n = opts.os.hostRuntime.n8nHost();
        const tunnel = opts.os.hostRuntime.tunnelService();
        send(res, 200, {
          ok: true,
          ...st.hosts,
          constructed: {
            hermes: Boolean(hermes),
            n8n: Boolean(n8n),
            tunnel: Boolean(tunnel),
            hermesMethods: Object.keys(hermes || {}).slice(0, 12),
            n8nMethods: Object.keys(n8n || {}).slice(0, 12),
            tunnelMethods: Object.keys(tunnel || {}).slice(0, 12),
          },
        });
        return;
      }

      if (pathname === "/api/v1/os/hermes/status" && req.method === "GET") {
        if (!opts.os) {
          send(res, 503, { ok: false, error: "os_not_composed" });
          return;
        }
        const hermes = opts.os.hostRuntime.hermesHost() as unknown as {
          getHermesStatusPayload: (
            mode: "local" | "remote",
          ) => unknown;
          findHermesBinary: () => string | null;
        };
        const binary = hermes.findHermesBinary();
        send(res, 200, {
          ok: true,
          status: hermes.getHermesStatusPayload("local"),
          binary,
          nativeReady: Boolean(binary),
        });
        return;
      }

      if (pathname === "/api/v1/os/hermes/ensure" && req.method === "POST") {
        if (!opts.os) {
          send(res, 503, { ok: false, error: "os_not_composed" });
          return;
        }
        const hermes = opts.os.hostRuntime.hermesHost() as unknown as {
          ensureHermesRuntimeFromUi: (opts?: {
            onLog?: (line: string) => void;
          }) => Promise<{
            ok: boolean;
            detail?: string;
            binary?: string | null;
            phase?: string;
          }>;
          findHermesBinary: () => string | null;
        };
        const logs: string[] = [];
        const result = await hermes.ensureHermesRuntimeFromUi({
          onLog: (line) => {
            logs.push(line);
            if (logs.length > 80) logs.shift();
          },
        });
        send(res, result.ok ? 200 : 500, {
          ok: result.ok,
          detail: result.detail,
          phase: result.phase,
          binary: result.binary ?? hermes.findHermesBinary(),
          logs: logs.slice(-20),
        });
        return;
      }

      if (pathname === "/api/v1/os/hermes/start" && req.method === "POST") {
        if (!opts.os) {
          send(res, 503, { ok: false, error: "os_not_composed" });
          return;
        }
        const hermes = opts.os.hostRuntime.hermesHost() as unknown as {
          startHermes: (opts: {
            connectionMode: "local" | "remote";
            autoBootstrap?: boolean;
          }) => Promise<unknown>;
          getHermesStatusPayload: (mode: "local" | "remote") => unknown;
          findHermesBinary: () => string | null;
        };
        const running = await hermes.startHermes({
          connectionMode: "local",
          autoBootstrap: true,
        });
        const status = hermes.getHermesStatusPayload("local") as {
          detail?: string;
          status?: string;
          logs?: string[];
        };
        send(res, running ? 200 : 500, {
          ok: Boolean(running),
          running: Boolean(running),
          binary: hermes.findHermesBinary(),
          status,
          detail: status?.detail || null,
        });
        return;
      }

      if (pathname === "/api/v1/os/n8n/status" && req.method === "GET") {
        if (!opts.os) {
          send(res, 503, { ok: false, error: "os_not_composed" });
          return;
        }
        const n8n = opts.os.hostRuntime.n8nHost() as unknown as {
          getN8nStatusPayload: (mode: "local" | "remote") => unknown;
          findN8nEntry: () => string | null;
        };
        const entry = n8n.findN8nEntry();
        send(res, 200, {
          ok: true,
          status: n8n.getN8nStatusPayload("local"),
          entry,
          nativeReady: Boolean(entry),
        });
        return;
      }

      if (pathname === "/api/v1/os/n8n/ensure" && req.method === "POST") {
        if (!opts.os) {
          send(res, 503, { ok: false, error: "os_not_composed" });
          return;
        }
        const n8n = opts.os.hostRuntime.n8nHost() as unknown as {
          ensureN8nRuntimeFromUi: (opts?: {
            onLog?: (line: string) => void;
          }) => Promise<{
            ok: boolean;
            detail?: string;
            entryPath?: string | null;
            phase?: string;
          }>;
          findN8nEntry: () => string | null;
        };
        const logs: string[] = [];
        const result = await n8n.ensureN8nRuntimeFromUi({
          onLog: (line) => {
            logs.push(line);
            if (logs.length > 80) logs.shift();
          },
        });
        send(res, result.ok ? 200 : 500, {
          ok: result.ok,
          detail: result.detail,
          phase: result.phase,
          entry: result.entryPath ?? n8n.findN8nEntry(),
          logs: logs.slice(-20),
        });
        return;
      }

      if (pathname === "/api/v1/os/n8n/start" && req.method === "POST") {
        if (!opts.os) {
          send(res, 503, { ok: false, error: "os_not_composed" });
          return;
        }
        const n8n = opts.os.hostRuntime.n8nHost() as unknown as {
          startN8n: (opts: {
            connectionMode: "local" | "remote";
            autoBootstrap?: boolean;
          }) => Promise<unknown>;
          getN8nStatusPayload: (mode: "local" | "remote") => unknown;
          findN8nEntry: () => string | null;
        };
        const running = await n8n.startN8n({
          connectionMode: "local",
          autoBootstrap: true,
        });
        send(res, running ? 200 : 500, {
          ok: Boolean(running),
          running: Boolean(running),
          entry: n8n.findN8nEntry(),
          status: n8n.getN8nStatusPayload("local"),
        });
        return;
      }

      if (pathname === "/api/v1/os/tunnel/status" && req.method === "GET") {
        if (!opts.os) {
          send(res, 503, { ok: false, error: "os_not_composed" });
          return;
        }
        const tunnel = opts.os.hostRuntime.tunnelService() as unknown as {
          getTunnelStatus?: () => {
            publicUrl?: string | null;
            online?: boolean;
            configured?: boolean;
          };
          publicMcpUrl?: () => string | null;
          publicUrlForEmbedService?: (s: string) => string | null;
          enableLocalPublicSurface?: (o: {
            localPort: number;
          }) => { publicMcp: string };
        };
        let status = tunnel.getTunnelStatus?.() ?? null;
        // Fullstack ready : surface MCP locale dès le premier status si non configuré.
        if (
          process.env.CREEZIO_TUNNEL_LOCAL !== "0" &&
          !status?.configured &&
          typeof tunnel.enableLocalPublicSurface === "function"
        ) {
          tunnel.enableLocalPublicSurface({ localPort: port });
          status = tunnel.getTunnelStatus?.() ?? status;
        }
        const publicMcp =
          tunnel.publicMcpUrl?.() ??
          (status?.publicUrl
            ? `${String(status.publicUrl).replace(/\/$/, "")}/mcp`
            : null);
        send(res, 200, {
          ok: true,
          status,
          publicMcp,
          publicN8n: tunnel.publicUrlForEmbedService?.("n8n") ?? null,
          publicHermes: tunnel.publicUrlForEmbedService?.("hermes") ?? null,
        });
        return;
      }

      // Profil connexion Héberger / Rejoindre (store local-config).
      if (pathname === "/api/v1/os/connection" && req.method === "GET") {
        if (!opts.os) {
          send(res, 503, { ok: false, error: "os_not_composed" });
          return;
        }
        const profile = opts.os.store.getConnectionProfile();
        send(res, 200, {
          ok: true,
          profile,
          public: {
            mode: profile.mode,
            remoteUrl: profile.remoteUrl ?? null,
            localBind: profile.localBind ?? "127.0.0.1",
            chosen: profile.chosen === true,
            activeBaseUrl:
              profile.mode === "remote"
                ? profile.remoteUrl ?? null
                : `http://127.0.0.1:${port}`,
            serverPort: port,
          },
        });
        return;
      }

      if (pathname === "/api/v1/os/connection" && req.method === "POST") {
        if (!opts.os) {
          send(res, 503, { ok: false, error: "os_not_composed" });
          return;
        }
        const body = (await readBody(req)) as Partial<ConnectionProfile>;
        try {
          const ready = sanitizeConnectionProfile(body);
          if (ready.mode === "remote" && !ready.remoteUrl) {
            send(res, 400, { ok: false, error: "remote_url_required" });
            return;
          }
          const saved = opts.os.store.setConnectionProfile(ready);
          send(res, 200, { ok: true, profile: saved });
        } catch (err) {
          send(res, 400, {
            ok: false,
            error: err instanceof Error ? err.message : String(err),
          });
        }
        return;
      }

      if (pathname === "/api/v1/os/connection/test" && req.method === "POST") {
        const body = (await readBody(req)) as { remoteUrl?: string };
        const result = await testRemoteHealth(String(body?.remoteUrl || ""));
        send(res, result.ok ? 200 : 400, result);
        return;
      }

      // First-run setup (équivalent SetupWizard sans IPC Electron).
      if (pathname === "/api/v1/os/setup" && req.method === "GET") {
        if (!opts.os) {
          send(res, 503, { ok: false, error: "os_not_composed" });
          return;
        }
        const store = opts.os.store;
        const keys = store.getLlmKeys?.() ?? {};
        const auth = store.getLocalAuth?.();
        send(res, 200, {
          ok: true,
          setupComplete: store.isSetupComplete(),
          hasOpenai: Boolean(keys.openai),
          username: auth?.authUser ?? null,
          recoveryHint: store.isSetupComplete()
            ? "recovery key déjà enregistrée"
            : null,
        });
        return;
      }

      if (pathname === "/api/v1/os/setup" && req.method === "POST") {
        if (!opts.os) {
          send(res, 503, { ok: false, error: "os_not_composed" });
          return;
        }
        const body = (await readBody(req)) as {
          username?: string;
          password?: string;
          openaiKey?: string;
          recoveryKey?: string;
          stayLoggedIn?: boolean;
        };
        try {
          const recoveryKey =
            String(body.recoveryKey || "").trim() || generateRecoveryKey();
          opts.os.store.applyFirstRunSetup({
            username: String(body.username || ""),
            password: String(body.password || ""),
            openaiKey: String(body.openaiKey || "sk-setup-placeholder"),
            recoveryKey,
            stayLoggedIn: body.stayLoggedIn !== false,
          });
          send(res, 200, {
            ok: true,
            setupComplete: true,
            recoveryKey,
            username: String(body.username || "").trim(),
          });
        } catch (err) {
          send(res, 400, {
            ok: false,
            error: err instanceof Error ? err.message : String(err),
          });
        }
        return;
      }

      if (pathname === "/api/v1/os/plugins" && req.method === "GET") {
        if (!opts.os) {
          send(res, 503, { ok: false, error: "os_not_composed" });
          return;
        }
        const mode = opts.os.status().hosts.plugins;
        if (mode === "feature-off") {
          send(res, 200, {
            ok: true,
            mode: "feature-off",
            plugins: [],
            hint: "CREEZIO_PLUGINS=1 pour activer le control plane kit",
          });
          return;
        }
        try {
          const host = opts.os.hostStack.hostPlugins() as {
            listPlugins: () => unknown[];
            getStatus?: () => unknown;
          };
          const plugins = host.listPlugins();
          send(res, 200, {
            ok: true,
            mode: "enabled",
            plugins,
            count: plugins.length,
            status: host.getStatus?.() ?? null,
          });
        } catch (err) {
          send(res, 500, {
            ok: false,
            mode: "enabled",
            error: err instanceof Error ? err.message : String(err),
          });
        }
        return;
      }

      if (pathname === "/api/v1/os/tunnel/local" && req.method === "POST") {
        if (!opts.os) {
          send(res, 503, { ok: false, error: "os_not_composed" });
          return;
        }
        const tunnel = opts.os.hostRuntime.tunnelService() as unknown as {
          enableLocalPublicSurface: (o: {
            localPort: number;
            slug?: string;
          }) => { ok: true; publicUrl: string; publicMcp: string };
          getTunnelStatus: () => unknown;
        };
        const body = (await readBody(req)) as {
          localPort?: number;
          slug?: string;
        };
        const localPort =
          Number(body?.localPort) > 0 ? Number(body.localPort) : port;
        const enabled = tunnel.enableLocalPublicSurface({
          localPort,
          slug: body?.slug,
        });
        send(res, 200, {
          ...enabled,
          status: tunnel.getTunnelStatus(),
        });
        return;
      }

      if (pathname === "/api/v1/os/tunnel/start" && req.method === "POST") {
        if (!opts.os) {
          send(res, 503, { ok: false, error: "os_not_composed" });
          return;
        }
        const tunnel = opts.os.hostRuntime.tunnelService() as unknown as {
          startCloudflared: () => Promise<void>;
          getTunnelStatus: () => { online?: boolean; error?: string | null };
          publicMcpUrl: () => string | null;
          enableLocalPublicSurface: (o: {
            localPort: number;
          }) => { ok: true; publicUrl: string; publicMcp: string };
        };
        try {
          await tunnel.startCloudflared();
          let status = tunnel.getTunnelStatus();
          // Sans token/bin cloudflared → surface locale MCP (fullstack ready).
          if (!status.online && !tunnel.publicMcpUrl()) {
            tunnel.enableLocalPublicSurface({ localPort: port });
            status = tunnel.getTunnelStatus();
          }
          send(res, 200, {
            ok: true,
            status,
            publicMcp: tunnel.publicMcpUrl(),
          });
        } catch (err) {
          tunnel.enableLocalPublicSurface({ localPort: port });
          send(res, 200, {
            ok: true,
            fallback: "local",
            detail: err instanceof Error ? err.message : String(err),
            status: tunnel.getTunnelStatus(),
            publicMcp: tunnel.publicMcpUrl(),
          });
        }
        return;
      }

      if (
        (pathname === "/mcp" || pathname === "/api/v1/mcp") &&
        (req.method === "GET" || req.method === "POST")
      ) {
        if (req.method === "GET") {
          const listed = await opts.mcp.listTools();
          send(res, 200, {
            ok: true,
            transport: "json",
            tools: listed.tools,
          });
          return;
        }
        const body = (await readBody(req)) as {
          method?: string;
          params?: { name?: string; arguments?: Record<string, unknown> };
          name?: string;
          arguments?: Record<string, unknown>;
        };
        const method = body?.method || "tools/call";
        if (method === "tools/list") {
          const listed = await opts.mcp.listTools();
          send(res, 200, { ok: true, tools: listed.tools });
          return;
        }
        const name = body?.params?.name || body?.name;
        const args = body?.params?.arguments || body?.arguments || {};
        if (!name) {
          send(res, 400, { ok: false, error: "tool_name_required" });
          return;
        }
        const result = await opts.mcp.callTool(name, args);
        send(res, result.ok ? 200 : 400, result);
        return;
      }

      const query = Object.fromEntries(url.searchParams.entries());
      const body = ["POST", "PUT", "PATCH"].includes(req.method || "")
        ? await readBody(req)
        : undefined;
      const result = await opts.api.handle({
        method: req.method || "GET",
        path: pathname,
        body,
        query,
        headers: req.headers as Record<
          string,
          string | string[] | undefined
        >,
      });
      send(res, result.status || 200, result.body, result.headers);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      send(res, 500, { error: message });
    }
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => resolve());
  });

  return {
    port,
    baseUrl: advertiseBaseUrl(host, port),
    server,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}
