/**
 * Garde session HTTP pour `/api/v1/modules/*` (BACKLOG F3 / DASH-5).
 *
 * Default-deny à la bordure `listenBrandOsHttp` — le kernel reste
 * framework-agnostique. Allowlist explicite des chemins machine/public
 * (webhooks signés, register/heartbeat Bearer, agent releases, LP public).
 */
import type { IncomingHttpHeaders } from "node:http";
import {
  getAuthConfig,
  isAuthDisabled,
  verifySessionToken,
  type SessionPayload,
} from "@creezio/auth";

export type PublicModulePathRule = {
  /** Méthode HTTP ; omit = toutes. */
  method?: string;
  match: (pathname: string) => boolean;
};

/**
 * Chemins volontairement joignables sans session plateforme.
 * L'auth machine (HMAC / Bearer secret) reste dans le mount.
 */
export const PUBLIC_MODULE_PATHS: readonly PublicModulePathRule[] = [
  {
    method: "POST",
    match: (p) => p === "/api/v1/modules/billing-webhook/stripe",
  },
  {
    method: "POST",
    match: (p) => p === "/api/v1/modules/fleet-registry/register",
  },
  {
    method: "POST",
    match: (p) => p === "/api/v1/modules/fleet-registry/heartbeat",
  },
  {
    method: "GET",
    match: (p) => p === "/api/v1/modules/fleet-releases/next",
  },
  {
    method: "POST",
    match: (p) => p === "/api/v1/modules/fleet-releases/slots",
  },
  {
    method: "DELETE",
    match: (p) => /^\/api\/v1\/modules\/fleet-releases\/slots\//.test(p),
  },
  {
    method: "POST",
    match: (p) => p === "/api/v1/modules/fleet-releases/report",
  },
  {
    method: "POST",
    match: (p) => p === "/api/v1/modules/fleet-releases/maintenance",
  },
  {
    method: "GET",
    match: (p) => p === "/api/v1/modules/landing/public",
  },
];

export function isModuleApiPath(pathname: string): boolean {
  return (
    pathname === "/api/v1/modules" || pathname.startsWith("/api/v1/modules/")
  );
}

export function isPublicModulePath(method: string, pathname: string): boolean {
  const m = (method || "GET").toUpperCase();
  return PUBLIC_MODULE_PATHS.some(
    (r) => (!r.method || r.method === m) && r.match(pathname),
  );
}

function cookieValue(
  header: string | string[] | undefined,
  name: string,
): string {
  if (!name || !header) return "";
  const raw = Array.isArray(header) ? header.join("; ") : header;
  for (const part of raw.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    const k = part.slice(0, idx).trim();
    if (k !== name) continue;
    try {
      return decodeURIComponent(part.slice(idx + 1).trim());
    } catch {
      return part.slice(idx + 1).trim();
    }
  }
  return "";
}

function bearerToken(header: string | string[] | undefined): string {
  const authz = Array.isArray(header) ? header[0] || "" : header || "";
  if (!authz.toLowerCase().startsWith("bearer ")) return "";
  return authz.slice(7).trim();
}

/** JWT session (3 segments) — ignore les Bearer opaques (API keys / agent). */
function looksLikeJwt(token: string): boolean {
  return token.split(".").length === 3;
}

/**
 * Session plateforme depuis headers Node (cookie configuré ou Bearer JWT).
 * `AUTH_DISABLED` → session owner virtuelle (harness / sandbox).
 */
export async function sessionFromNodeHeaders(
  headers: IncomingHttpHeaders,
): Promise<SessionPayload | null> {
  if (isAuthDisabled()) {
    return {
      sub: "auth-disabled",
      email: "auth-disabled",
      role: "owner",
      permissions: [],
    };
  }
  const cookieName = getAuthConfig().cookieName;
  let token = cookieName
    ? cookieValue(headers.cookie, cookieName)
    : "";
  if (!token) token = bearerToken(headers.authorization);
  if (!token || !looksLikeJwt(token)) return null;
  return verifySessionToken(token);
}

export type ModuleMountAuthDecision =
  | { ok: true; public?: boolean; session?: SessionPayload }
  | { ok: false; status: 401; body: Record<string, unknown> };

/**
 * Décision garde mounts modules — à appeler avant `api.handle` sur la
 * surface HTTP. Les appels in-process (`api.handle` direct) ne passent pas ici.
 */
export async function assertModuleMountSession(input: {
  method: string;
  pathname: string;
  headers: IncomingHttpHeaders;
}): Promise<ModuleMountAuthDecision> {
  if (!isModuleApiPath(input.pathname)) return { ok: true };
  if (isPublicModulePath(input.method, input.pathname)) {
    return { ok: true, public: true };
  }
  const session = await sessionFromNodeHeaders(input.headers);
  if (!session) {
    return {
      ok: false,
      status: 401,
      body: {
        ok: false,
        error: "unauthorized",
        hint: "session cookie or Bearer JWT required",
      },
    };
  }
  return { ok: true, session };
}
