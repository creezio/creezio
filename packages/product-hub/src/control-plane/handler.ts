/**
 * Handler HTTP control plane plugins — patterns génériques TF2/Certivan.
 * Bind 127.0.0.1 recommandé. Auth Bearer + grants Product Hub.
 */

import type http from "node:http";
import fs from "node:fs";
import { isValidPluginId } from "@creezio/platform-core";
import { grantProcessHint } from "../brand-tokens.js";
import {
  issueGrantFromProductDetails,
  requirePluginExecutionGrant,
} from "../grants-flow.js";
import {
  isProductHubManaged,
  markProductHubManaged,
} from "../managed-marker.js";
import { authOk, normalizeHeaders, readBody, sendJson } from "./http-utils.js";
import type { PluginControlPlaneOptions } from "./types.js";

export function createPluginControlPlaneHandler(
  opts: PluginControlPlaneOptions,
): (req: http.IncomingMessage, res: http.ServerResponse) => Promise<void> {
  const { tokens, controlToken, adapters, pluginsDir } = opts;

  return async (req, res) => {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    const method = (req.method || "GET").toUpperCase();
    const p = url.pathname.replace(/\/+$/, "") || "/";
    const headers = normalizeHeaders(req.headers);

    if (method === "GET" && (p === "/health" || p === "/v1/health")) {
      sendJson(res, 200, {
        ok: true,
        service: tokens.controlPlaneServiceName,
        brandId: tokens.brandId,
        pluginsDir,
      });
      return;
    }

    if (!authOk(req, controlToken)) {
      sendJson(res, 401, { ok: false, error: "unauthorized" });
      return;
    }

    if (method === "GET" && p === "/v1/plugins") {
      sendJson(res, 200, { ok: true, ...(await adapters.listStatus()) });
      return;
    }

    const grantMatch = p.match(/^\/v1\/products\/([A-Za-z0-9_-]{4,80})\/grant$/);
    if (method === "POST" && grantMatch) {
      const raw = await readBody(req);
      let body: { plugin_id?: string } = {};
      try {
        body = raw ? (JSON.parse(raw) as typeof body) : {};
      } catch {
        sendJson(res, 400, { ok: false, error: "JSON invalide" });
        return;
      }
      const pluginId = String(body.plugin_id || "").trim();
      if (!isValidPluginId(pluginId)) {
        sendJson(res, 400, { ok: false, error: "plugin_id invalide" });
        return;
      }
      if (!adapters.fetchProductDetails) {
        sendJson(res, 503, {
          ok: false,
          error: "CRM product details adapter manquant",
          hint: grantProcessHint(),
        });
        return;
      }
      let details;
      try {
        details = await adapters.fetchProductDetails(grantMatch[1]!);
      } catch (e) {
        sendJson(res, 502, {
          ok: false,
          error: e instanceof Error ? e.message : String(e),
        });
        return;
      }
      if (!details) {
        sendJson(res, 404, { ok: false, error: "Produit plugin introuvable" });
        return;
      }
      const result = issueGrantFromProductDetails({
        details,
        productId: grantMatch[1]!,
        pluginId,
        secret: controlToken,
        tokenPrefix: tokens.grantTokenPrefix,
      });
      if (!result.ok) {
        sendJson(res, result.code, {
          ok: false,
          error: result.error,
          hint: grantProcessHint(),
        });
        return;
      }
      sendJson(res, 200, {
        ok: true,
        execution_grant: result.token,
        expiresAt: result.expiresAt,
        grantId: result.grantId,
        prdRevisionId: result.prdRevisionId,
        hint: "Grant valable 10 minutes — POST /v1/plugins puis PUT files avec ce token. Ne pas le montrer à l'utilisateur.",
      });
      return;
    }

    if (method === "POST" && p === "/v1/plugins") {
      const raw = await readBody(req);
      let body: {
        id?: string;
        name?: string;
        description?: string;
        execution_grant?: string;
      } = {};
      try {
        body = raw ? (JSON.parse(raw) as typeof body) : {};
      } catch {
        sendJson(res, 400, { ok: false, error: "JSON invalide" });
        return;
      }
      const id = String(body.id || "").trim();
      const grant = requirePluginExecutionGrant({
        tokens,
        secret: controlToken,
        pluginId: id,
        action: "create",
        headers,
        body,
      });
      if (!grant.ok) {
        sendJson(res, 403, {
          ok: false,
          error: grant.error,
          hint: grant.hint,
        });
        return;
      }
      const r = await adapters.createPlugin({
        id,
        name: body.name,
        description: body.description,
      });
      if (!r.ok) {
        sendJson(res, 400, { ok: false, error: r.error });
        return;
      }
      try {
        markProductHubManaged(adapters.pluginDir(id));
      } catch {
        /* best-effort */
      }
      let running: unknown = null;
      if (adapters.restartPlugin) {
        const restarted = await adapters.restartPlugin(id);
        if (restarted.ok) running = restarted.running;
      }
      sendJson(res, 201, {
        ok: true,
        plugin: r.plugin,
        git: r.git,
        running,
        hint: "Plugin installé sous userData/plugins — visible Admin → Plugins",
      });
      return;
    }

    const filesMatch = p.match(/^\/v1\/plugins\/([a-z][a-z0-9-]{1,62})\/files$/);
    if (method === "PUT" && filesMatch) {
      const id = filesMatch[1]!;
      const raw = await readBody(req);
      let body: {
        files?: Record<string, string>;
        message?: string;
        execution_grant?: string;
      } = {};
      try {
        body = raw ? (JSON.parse(raw) as typeof body) : {};
      } catch {
        sendJson(res, 400, { ok: false, error: "JSON invalide" });
        return;
      }
      const dir = adapters.pluginDir(id);
      if (isProductHubManaged(dir) || fs.existsSync(dir)) {
        if (isProductHubManaged(dir)) {
          const grant = requirePluginExecutionGrant({
            tokens,
            secret: controlToken,
            pluginId: id,
            action: "write",
            headers,
            body,
          });
          if (!grant.ok) {
            sendJson(res, 403, {
              ok: false,
              error: grant.error,
              hint: grant.hint,
            });
            return;
          }
        }
      }
      const wr = await adapters.writeFiles(id, body.files || {}, body.message);
      if (!wr.ok) {
        sendJson(res, 400, { ok: false, error: wr.error });
        return;
      }
      sendJson(res, 200, { ok: true, written: wr.written, git: wr.git });
      return;
    }

    const actionMatch = p.match(
      /^\/v1\/plugins\/([a-z][a-z0-9-]{1,62})\/(enable|disable|restart)$/,
    );
    if (actionMatch && method === "POST") {
      const id = actionMatch[1]!;
      const action = actionMatch[2]!;
      if (action === "enable" || action === "disable") {
        if (!adapters.enablePlugin) {
          sendJson(res, 501, { ok: false, error: "enablePlugin non branché" });
          return;
        }
        const r = await adapters.enablePlugin(id, action === "enable");
        sendJson(res, r.ok ? 200 : 404, r);
        return;
      }
      if (action === "restart") {
        if (!adapters.restartPlugin) {
          sendJson(res, 501, { ok: false, error: "restartPlugin non branché" });
          return;
        }
        const r = await adapters.restartPlugin(id);
        sendJson(res, r.ok ? 200 : 400, r);
        return;
      }
    }

    const deleteMatch = p.match(/^\/v1\/plugins\/([a-z][a-z0-9-]{1,62})$/);
    if (method === "DELETE" && deleteMatch) {
      if (!adapters.deletePlugin) {
        sendJson(res, 501, { ok: false, error: "deletePlugin non branché" });
        return;
      }
      const r = await adapters.deletePlugin(deleteMatch[1]!);
      sendJson(res, r.ok ? 200 : 404, r);
      return;
    }

    sendJson(res, 404, { ok: false, error: "not found" });
  };
}
