/**
 * Surface Hono `/api/v1/email/*` — inbound Worker CF + inbox store kit.
 * Montée par listenBrandOsHttp (desktop + harness).
 *
 * Auth : session cookie/Bearer requise pour l'inbox (lecture/écriture).
 * `/inbound` reste protégé par secret partagé (Worker Cloudflare).
 */
import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import {
  getAuthConfig,
  isAuthDisabled,
  verifySessionToken,
} from "@creezio/auth";
import {
  createEmailInboxRoutes,
  type SqliteMailsStore,
} from "@creezio/mails";

export type BrandEmailSurface = {
  app: Hono;
};

async function sessionFromEmailContext(c: {
  req: {
    header: (name: string) => string | undefined;
  };
}): Promise<boolean> {
  if (isAuthDisabled()) return true;
  let token = "";
  try {
    const cookieName = getAuthConfig().cookieName;
    if (cookieName) token = getCookie(c as never, cookieName) || "";
  } catch {
    token = "";
  }
  if (!token) {
    const authz = c.req.header("authorization") || "";
    if (authz.toLowerCase().startsWith("bearer ")) {
      token = authz.slice(7).trim();
    }
  }
  if (!token) return false;
  const session = await verifySessionToken(token);
  return Boolean(session?.sub);
}

export function mountBrandEmailSurface(opts?: {
  /** Store kernel (sinon getKitMailsStore via CREEZIO_CORE_DB_PATH). */
  getStore?: () => SqliteMailsStore | null;
}): BrandEmailSurface {
  const app = new Hono();
  const inbox = new Hono();

  // Middleware AVANT les routes (Hono n'enveloppe pas les routes déjà posées).
  inbox.use("*", async (c, next) => {
    const path = c.req.path || "";
    if (path === "/inbound" || path.endsWith("/inbound")) {
      return next();
    }
    if (!(await sessionFromEmailContext(c))) {
      return c.json({ error: "Non authentifié" }, 401);
    }
    return next();
  });

  inbox.route(
    "/",
    createEmailInboxRoutes(
      opts?.getStore ? { getStore: opts.getStore } : {},
    ),
  );

  app.route("/api/v1/email", inbox);
  return { app };
}

/** Chemins proxifiés Node http → Hono inbox. */
export function emailSurfaceHandlesPath(pathname: string): boolean {
  return (
    pathname === "/api/v1/email" || pathname.startsWith("/api/v1/email/")
  );
}
