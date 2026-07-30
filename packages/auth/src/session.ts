/**
 * Helpers session JWT cookie Next — génériques, cookieName via configureAuth.
 */

import { SignJWT, jwtVerify } from "jose";
import { getAuthConfig, getAuthCookieName } from "./config.js";
import type {
  AuthSessionUser,
  NavAccessAdapters,
  SessionCookieOptions,
  SessionCookieSecureOpts,
  SessionPayload,
  SessionUserLookup,
} from "./session-types.js";

export type {
  AuthSessionUser,
  NavAccessAdapters,
  SessionCookieOptions,
  SessionCookieSecureOpts,
  SessionPayload,
  SessionUserLookup,
} from "./session-types.js";

export function isAuthDisabled(): boolean {
  // Fail-closed : variable absente = auth active.
  const v = (process.env.AUTH_DISABLED || "0").toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET || "dev-insecure-secret-change-me";
  return new TextEncoder().encode(secret);
}

export function getAuthCredentials(): { user: string; password: string } {
  return {
    user: process.env.AUTH_USER || "",
    password: process.env.AUTH_PASSWORD || "",
  };
}

/** Vérifie uniquement les credentials env (legacy / MCP). */
export function validateEnvCredentials(
  email: string,
  password: string,
): boolean {
  const creds = getAuthCredentials();
  if (!creds.password || !creds.user) return false;
  return email === creds.user && password === creds.password;
}

function ownerPermissions(): string[] {
  return [...getAuthConfig().ownerPermissions];
}

function normalizePayload(raw: Record<string, unknown>): SessionPayload | null {
  const email = typeof raw.email === "string" ? raw.email : "";
  // Legacy JWT { email, role: "admin" }
  if (raw.role === "admin" || (!raw.sub && email)) {
    return {
      sub: typeof raw.sub === "string" ? raw.sub : "legacy-owner",
      email,
      role: "owner",
      permissions: ownerPermissions(),
    };
  }
  const role = raw.role === "collaborator" ? "collaborator" : "owner";
  const sub = typeof raw.sub === "string" ? raw.sub : "";
  if (!sub && !email) return null;
  const permissions = Array.isArray(raw.permissions)
    ? (raw.permissions.filter((p) => typeof p === "string") as string[])
    : role === "owner"
      ? ownerPermissions()
      : [];
  const out: SessionPayload = {
    sub: sub || "unknown",
    email,
    role,
    permissions: role === "owner" ? ownerPermissions() : permissions,
  };
  if (typeof raw.actorSub === "string" && raw.actorSub) {
    out.actorSub = raw.actorSub;
    out.actorRole = "owner";
  }
  return out;
}

export async function createSessionToken(input: {
  user: AuthSessionUser;
  actor?: AuthSessionUser | null;
}): Promise<string> {
  const { user, actor } = input;
  const permissions =
    user.role === "owner" ? ownerPermissions() : [...user.permissions];
  const claims: Record<string, unknown> = {
    sub: user.id,
    email: user.username,
    role: user.role,
    permissions,
  };
  if (actor && actor.id !== user.id) {
    claims.actorSub = actor.id;
    claims.actorRole = "owner";
  }
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

/**
 * Compat MCP OAuth : mint session depuis username (SQLite users marque).
 * Lookup injecté — le kit n'embarque pas le métier users.
 */
export async function createSessionTokenForUsername(
  username: string,
  users: SessionUserLookup,
): Promise<string> {
  users.ensureOwnerSynced();
  const row = users.getUserByUsername(username);
  if (row && row.active === 1) {
    const pub = users.getUserById(row.id);
    if (pub) return createSessionToken({ user: pub });
  }
  const owner = users.ensureOwnerSynced();
  if (owner) return createSessionToken({ user: owner });
  // Legacy fallback admin claim (Fidu MCP)
  return new SignJWT({
    email: username,
    role: "admin",
    permissions: ownerPermissions(),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return normalizePayload(payload as Record<string, unknown>);
  } catch {
    return null;
  }
}

/**
 * Lit le cookie session Next.js.
 * Nécessite peer `next` (import dynamique de next/headers).
 */
export async function getSession(): Promise<SessionPayload | null> {
  if (isAuthDisabled()) {
    return {
      sub: "auth-disabled",
      email: "auth-disabled",
      role: "owner",
      permissions: ownerPermissions(),
    };
  }
  try {
    const { cookies } = await import("next/headers");
    const token = cookies().get(getAuthCookieName())?.value;
    if (!token) return null;
    return verifySessionToken(token);
  } catch {
    return null;
  }
}

function resolveSecure(opts?: SessionCookieSecureOpts): boolean {
  return typeof opts?.secure === "boolean"
    ? opts.secure
    : process.env.NODE_ENV === "production";
}

export function sessionCookieOptions(
  token: string,
  opts?: SessionCookieSecureOpts,
): SessionCookieOptions {
  return {
    name: getAuthCookieName(),
    value: token,
    httpOnly: true,
    secure: resolveSecure(opts),
    sameSite: "lax",
    path: "/",
    maxAge: getAuthConfig().cookieMaxAge,
  };
}

export function clearSessionCookieOptions(
  opts?: SessionCookieSecureOpts,
): SessionCookieOptions {
  return {
    name: getAuthCookieName(),
    value: "",
    httpOnly: true,
    secure: resolveSecure(opts),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  };
}

export function sessionActorIsOwner(session: SessionPayload | null): boolean {
  if (!session) return false;
  if (session.actorSub) return session.actorRole === "owner";
  return session.role === "owner";
}

export function sessionIsImpersonating(
  session: SessionPayload | null,
): boolean {
  return Boolean(session?.actorSub && session.actorSub !== session.sub);
}

export function sessionCanAccessPath(
  session: SessionPayload | null,
  pathname: string,
  nav: NavAccessAdapters,
): boolean {
  if (!session) return false;
  if (session.role === "owner" && !sessionIsImpersonating(session)) return true;
  const required = nav.permissionForPath(pathname);
  return nav.hasPermission(session.permissions, required);
}

/** Options cookie → setCookie Hono. */
export function toHonoCookie(opts: SessionCookieOptions): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "Lax";
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: opts.httpOnly,
    secure: opts.secure,
    sameSite: "Lax",
    path: opts.path,
    maxAge: opts.maxAge,
  };
}
