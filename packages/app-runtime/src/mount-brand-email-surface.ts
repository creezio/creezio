/**
 * Surface Hono `/api/v1/email/*` — inbound Worker CF + inbox store kit.
 * Montée par listenBrandOsHttp (desktop + harness).
 */
import { Hono } from "hono";
import {
  createEmailInboxRoutes,
  type SqliteMailsStore,
} from "@creezio/mails";

export type BrandEmailSurface = {
  app: Hono;
};

export function mountBrandEmailSurface(opts?: {
  /** Store kernel (sinon getKitMailsStore via CREEZIO_CORE_DB_PATH). */
  getStore?: () => SqliteMailsStore | null;
}): BrandEmailSurface {
  const app = new Hono();
  app.route(
    "/api/v1/email",
    createEmailInboxRoutes(
      opts?.getStore ? { getStore: opts.getStore } : {},
    ),
  );
  return { app };
}

/** Chemins proxifiés Node http → Hono inbox. */
export function emailSurfaceHandlesPath(pathname: string): boolean {
  return (
    pathname === "/api/v1/email" || pathname.startsWith("/api/v1/email/")
  );
}
