/**
 * HTTP OS + métier — kernel api-kernel + MCP JSON + status hosts.
 * Un seul port loopback pour SPA / preuves / agents.
 */
import http from "node:http";
import { findFreePort } from "@creezio/platform-core";
import type { ApiKernel } from "@creezio/api-kernel";
import type { McpFacade } from "@creezio/mcp-facade";
import type { BrandOsComposition } from "./compose-brand-os.js";

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

export async function listenBrandOsHttp(opts: {
  api: ApiKernel;
  mcp: McpFacade;
  os?: BrandOsComposition | null;
  port?: number;
  host?: string;
}): Promise<BrandOsHttpHandle> {
  const host = opts.host || "127.0.0.1";
  const port = opts.port && opts.port > 0 ? opts.port : await findFreePort();

  const server = http.createServer(async (req, res) => {
    try {
      if (req.method === "OPTIONS") {
        send(res, 204, {});
        return;
      }
      const url = new URL(req.url || "/", `http://${host}:${port}`);
      const pathname = url.pathname;

      if (pathname === "/api/v1/os/status" && req.method === "GET") {
        if (!opts.os) {
          send(res, 503, { ok: false, error: "os_not_composed" });
          return;
        }
        send(res, 200, opts.os.status());
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
        send(res, running ? 200 : 500, {
          ok: Boolean(running),
          running: Boolean(running),
          binary: hermes.findHermesBinary(),
          status: hermes.getHermesStatusPayload("local"),
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
          getStatus?: () => unknown;
          publicUrlForEmbedService?: (s: string) => string | null;
        };
        send(res, 200, {
          ok: true,
          status: tunnel.getStatus?.() ?? null,
          publicMcp: tunnel.publicUrlForEmbedService?.("mcp") ?? null,
        });
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
    baseUrl: `http://${host}:${port}`,
    server,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}
