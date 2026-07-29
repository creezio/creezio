import type { ApiMount } from "@creezio/api-kernel";
import type { PlatformMailsStore } from "./types.js";

function actorFromReq(req: {
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
}): string | null {
  const h = req.headers?.["x-creezio-user-id"];
  if (typeof h === "string" && h.trim()) return h.trim();
  const body = req.body as { userId?: string } | undefined;
  if (body?.userId) return String(body.userId);
  return null;
}

export function createMailsApiMount(store: PlatformMailsStore): ApiMount {
  return {
    handle: async ({ req, subPath }) => {
      const method = req.method.toUpperCase();
      const userId = actorFromReq(req);
      if (!userId) {
        return { status: 401, body: { ok: false, error: "user_required" } };
      }

      if ((subPath === "" || subPath === "list") && method === "GET") {
        return { status: 200, body: { ok: true, mails: store.list(userId) } };
      }

      if ((subPath === "" || subPath === "draft") && method === "POST") {
        const body = (req.body || {}) as {
          to?: string;
          subject?: string;
          body?: string;
        };
        const mail = store.createDraft({
          userId,
          to: String(body.to || ""),
          subject: String(body.subject || ""),
          body: body.body,
        });
        return { status: 201, body: { ok: true, mail } };
      }

      const sendMatch = subPath.match(/^([0-9a-f-]{36})\/send$/i);
      if (sendMatch && method === "POST") {
        try {
          const mail = await store.queueSend(sendMatch[1]!, userId);
          return { status: 200, body: { ok: true, mail } };
        } catch (e) {
          const msg = e instanceof Error ? e.message : "error";
          return {
            status: msg === "forbidden" ? 403 : 404,
            body: { ok: false, error: msg },
          };
        }
      }

      return { status: 404, body: { ok: false, error: "not_found" } };
    },
  };
}
