/**
 * Routes Hono boîte mail plateforme — équivalent fonctionnel `/api/v1/email/*` gold TF.
 * Auth session reste côté marque (montage) ; inbound protégé par secret partagé.
 */

import { timingSafeEqual } from "node:crypto";
import { Hono } from "hono";
import {
  getMailsConfig,
  resolveEmailDomain,
  resolveEmptyStateNoDomainHint,
  resolveInboundSecret,
  resolvePageSubtitle,
} from "./config.js";
import { getKitMailsStore } from "./env-store.js";
import type { SqliteMailsStore } from "./sqlite-store.js";
import type { InboundEmailInput } from "./types.js";

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

function parseInboundBody(body: unknown):
  | { ok: true; data: InboundEmailInput }
  | { ok: false; error: string; details?: unknown } {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "Requête invalide" };
  }
  const b = body as Record<string, unknown>;
  const from = String(b.from || "").trim();
  const to = String(b.to || "").trim();
  if (!from || !to) {
    return { ok: false, error: "Requête invalide", details: "from et to requis" };
  }
  const attachments = Array.isArray(b.attachments)
    ? b.attachments
        .map((raw) => {
          if (!raw || typeof raw !== "object") return null;
          const a = raw as Record<string, unknown>;
          const content_base64 = String(a.content_base64 || "");
          if (!content_base64) return null;
          return {
            filename: a.filename != null ? String(a.filename) : undefined,
            content_type:
              a.content_type != null ? String(a.content_type) : undefined,
            content_base64,
          };
        })
        .filter((x): x is NonNullable<typeof x> => Boolean(x))
    : undefined;

  let headers: Record<string, string> | null = null;
  if (b.headers && typeof b.headers === "object" && !Array.isArray(b.headers)) {
    headers = {};
    for (const [k, v] of Object.entries(b.headers as Record<string, unknown>)) {
      headers[k] = String(v ?? "");
    }
  }

  return {
    ok: true,
    data: {
      message_id:
        b.message_id == null ? null : String(b.message_id),
      from,
      to,
      subject: b.subject != null ? String(b.subject) : undefined,
      text: b.text == null ? null : String(b.text),
      html: b.html == null ? null : String(b.html),
      received_at: b.received_at == null ? null : String(b.received_at),
      headers,
      attachments,
    },
  };
}

export type EmailInboxRouteDeps = {
  /** Store kit (défaut : getKitMailsStore via CREEZIO_CORE_DB_PATH). */
  getStore?: () => SqliteMailsStore | null;
};

/**
 * Factory Hono `/email` — marques montent :
 *   `api.route("/email", createEmailInboxRoutes())`
 */
export function createEmailInboxRoutes(deps: EmailInboxRouteDeps = {}): Hono {
  const app = new Hono();
  const resolveStore = deps.getStore || getKitMailsStore;

  app.post("/inbound", async (c) => {
    const expected = resolveInboundSecret();
    if (!expected) {
      return c.json({ error: "EMAIL_INBOUND_SECRET non configuré" }, 503);
    }
    const auth = c.req.header("authorization") || "";
    const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
    const alt = c.req.header("x-email-inbound-secret") || "";
    const got = bearer || alt;
    if (!got || !safeEqual(got, expected)) {
      return c.json({ error: "Non autorisé" }, 401);
    }

    const store = resolveStore();
    if (!store || !store.emailsReady()) {
      return c.json({ error: "Schema emails kit absent" }, 503);
    }

    const body = await c.req.json().catch(() => null);
    const parsed = parseInboundBody(body);
    if (!parsed.ok) {
      return c.json({ error: parsed.error, details: parsed.details }, 400);
    }
    const result = store.insertInboundFull(parsed.data);
    if (!result.ok) return c.json({ error: result.error }, 422);
    return c.json(
      { ok: true, id: result.id, duplicate: Boolean(result.duplicate) },
      result.duplicate ? 200 : 201,
    );
  });

  app.get("/meta", async (c) => {
    const store = resolveStore();
    const cfg = getMailsConfig();
    return c.json({
      ready: Boolean(store?.emailsReady()),
      domain: resolveEmailDomain(),
      inboundConfigured: Boolean(resolveInboundSecret()),
      uiEnabled: cfg.uiEnabled !== false,
      pageSubtitle: resolvePageSubtitle(),
      emptyStateNoDomainHint: resolveEmptyStateNoDomainHint(),
    });
  });

  app.get("/", async (c) => {
    const store = resolveStore();
    if (!store?.emailsReady()) return c.json({ rows: [], total: 0, unread: 0 });
    const q = c.req.query("q") || undefined;
    const folder = c.req.query("folder") || "inbox";
    const unreadOnly = c.req.query("unread") === "1";
    const limit = Number(c.req.query("limit") || "50");
    const offset = Number(c.req.query("offset") || "0");
    return c.json(store.listInbox({ folder, q, unreadOnly, limit, offset }));
  });

  app.get("/:id/attachments/:attId", async (c) => {
    const id = String(c.req.param("id") || "").trim();
    const attId = String(c.req.param("attId") || "").trim();
    if (!id || !attId) return c.json({ error: "id invalide" }, 400);
    const store = resolveStore();
    if (!store) return c.json({ error: "Store mails indisponible" }, 503);
    const att = store.getAttachment(id, attId);
    if (!att) return c.json({ error: "Pièce jointe introuvable" }, 404);
    return new Response(new Uint8Array(att.data), {
      status: 200,
      headers: {
        "Content-Type": att.content_type || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${att.filename.replace(/"/g, "")}"`,
        "Content-Length": String(att.data.length),
      },
    });
  });

  app.get("/:id", async (c) => {
    const id = String(c.req.param("id") || "").trim();
    if (!id) return c.json({ error: "id invalide" }, 400);
    const store = resolveStore();
    if (!store) return c.json({ error: "Store mails indisponible" }, 503);
    const row = store.getInbox(id);
    if (!row) return c.json({ error: "Mail introuvable" }, 404);
    return c.json(row);
  });

  app.patch("/:id", async (c) => {
    const id = String(c.req.param("id") || "").trim();
    if (!id) return c.json({ error: "id invalide" }, 400);
    const store = resolveStore();
    if (!store) return c.json({ error: "Store mails indisponible" }, 503);
    const body = await c.req.json().catch(() => ({}));
    if (typeof (body as { read?: unknown }).read === "boolean") {
      if (!store.markRead(id, (body as { read: boolean }).read)) {
        return c.json({ error: "Mail introuvable" }, 404);
      }
    }
    const row = store.getInbox(id);
    if (!row) return c.json({ error: "Mail introuvable" }, 404);
    return c.json(row);
  });

  app.delete("/:id", async (c) => {
    const id = String(c.req.param("id") || "").trim();
    if (!id) return c.json({ error: "id invalide" }, 400);
    const store = resolveStore();
    if (!store) return c.json({ error: "Store mails indisponible" }, 503);
    if (!store.deleteMail(id)) return c.json({ error: "Mail introuvable" }, 404);
    return c.json({ ok: true });
  });

  return app;
}
