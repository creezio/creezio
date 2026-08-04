/**
 * Surface Hono plateforme — auth / tasks / assistant / desktop / users sur le
 * port unique du serveur marque (harness Docker ET desktop).
 *
 * Comble l'écart TF2 : ces routes vivaient dans le fork Next TF2 ; ici elles
 * sont servies par le kit lui-même (l'UI Next standalone rewrite /api/v1/*
 * vers ce serveur). SSE streamé (screencast, desktop-actions, runs).
 *
 * Chemins :
 * - /api/v1/auth/*                    login/logout/me/impersonation/ai-workspace-session
 * - /api/v1/tasks/*                   kanban + runs + activity + screencast SSE
 * - /api/v1/assistant/*               chat + ui-actions + desktop-actions SSE
 * - /api/v1/desktop/screencast/frame  frames POSTées par le bridge Electron
 * - /api/v1/platform/users            collaborateurs plateforme (owner)
 */

import { Hono, type Context } from "hono";
import { getCookie } from "hono/cookie";
import {
  configureAuth,
  createAuthRoutes,
  createSessionToken,
  getAuthConfig,
  sessionActorIsOwner,
  sessionIsImpersonating,
  verifySessionToken,
  type AuthRouteUser,
  type SessionPayload,
} from "@creezio/auth";
import { createAssistantRoutes, dispatchSupplierAction } from "@creezio/assistant";
import {
  createTasksHonoRoutes,
  type TasksBrandConfig,
  type TasksSession,
  type TasksWorkspaceAdapter,
} from "@creezio/tasks";
import {
  publishScreencastFrame,
  screencastViewerCount,
  subscribeScreencast,
} from "@creezio/browser-host";
import {
  openBrandPlatformStore,
  type BrandPlatformStore,
} from "./brand-platform-store.js";
import type { BrandBrowserSidecarHandle } from "./wire-brand-browser-sidecar.js";

export type BrandPlatformRuntime = {
  store: BrandPlatformStore;
  sessionCookieName: string;
  baseUrl: () => string;
  getSidecar: () => BrandBrowserSidecarHandle | null;
  presence: DesktopPresenceRegistry;
};

export type DesktopPresenceRegistry = {
  registerDesktopBridge: (opts: {
    userId: string;
    deviceId?: string;
    deviceLabel?: string | null;
    subscriptionId: string;
  }) => void;
  unregisterDesktopBridge: (
    userId: string,
    deviceId: string,
    subscriptionId?: string,
  ) => void;
  touchDesktopBridge: (userId: string, deviceId: string) => void;
  isDesktopOnline: (userId: string) => boolean;
  listOnlineBridges: () => Array<{
    userId: string;
    deviceId: string;
    deviceLabel?: string | null;
    bridgeConnected: boolean;
    online: boolean;
  }>;
};

const BRIDGE_STALE_MS = 90_000;

function createPresenceRegistry(
  getSidecar: () => BrandBrowserSidecarHandle | null,
): DesktopPresenceRegistry {
  type Bridge = {
    userId: string;
    deviceId: string;
    deviceLabel: string | null;
    subscriptionId: string;
    lastSeen: number;
  };
  const bridges = new Map<string, Bridge>();

  const alive = (b: Bridge) => Date.now() - b.lastSeen < BRIDGE_STALE_MS;

  return {
    registerDesktopBridge: (opts) => {
      bridges.set(opts.subscriptionId, {
        userId: opts.userId,
        deviceId: opts.deviceId || "host",
        deviceLabel: opts.deviceLabel ?? null,
        subscriptionId: opts.subscriptionId,
        lastSeen: Date.now(),
      });
    },
    unregisterDesktopBridge: (_userId, _deviceId, subscriptionId) => {
      if (subscriptionId) bridges.delete(subscriptionId);
    },
    touchDesktopBridge: (userId, deviceId) => {
      for (const b of bridges.values()) {
        if (b.userId === userId && b.deviceId === deviceId) {
          b.lastSeen = Date.now();
        }
      }
    },
    isDesktopOnline: (userId) => {
      for (const b of bridges.values()) {
        if (b.userId === userId && alive(b)) return true;
      }
      const sidecar = getSidecar();
      return Boolean(sidecar && userId === sidecar.serverHostUserId);
    },
    listOnlineBridges: () => {
      const out: Array<{
        userId: string;
        deviceId: string;
        deviceLabel?: string | null;
        bridgeConnected: boolean;
        online: boolean;
      }> = [];
      for (const b of bridges.values()) {
        if (!alive(b)) continue;
        out.push({
          userId: b.userId,
          deviceId: b.deviceId,
          deviceLabel: b.deviceLabel,
          bridgeConnected: true,
          online: true,
        });
      }
      const sidecar = getSidecar();
      if (sidecar) {
        // IA serveur = online sans desktop : host synthétique sidecar.
        out.push({
          userId: sidecar.serverHostUserId,
          deviceId: "server-browser",
          deviceLabel: "Navigateur IA serveur",
          bridgeConnected: true,
          online: true,
        });
      }
      return out;
    },
  };
}

/** Singleton globalThis — adapters marque lus paresseusement (beforeBoot). */
const RUNTIME_KEY = "__creezioBrandPlatformRuntime";

function runtimeSlot(): { current: BrandPlatformRuntime | null } {
  const g = globalThis as unknown as {
    [RUNTIME_KEY]?: { current: BrandPlatformRuntime | null };
  };
  if (!g[RUNTIME_KEY]) g[RUNTIME_KEY] = { current: null };
  return g[RUNTIME_KEY]!;
}

export function getBrandPlatformRuntime(): BrandPlatformRuntime | null {
  return runtimeSlot().current;
}

/* ── Session helpers (cookie ou Bearer) ── */

async function sessionFromContext(
  c: Context,
): Promise<SessionPayload | null> {
  let token = "";
  try {
    token = getCookie(c, getAuthConfig().cookieName) || "";
  } catch {
    token = "";
  }
  if (!token) {
    const authz = c.req.header("authorization") || "";
    if (authz.toLowerCase().startsWith("bearer ")) token = authz.slice(7).trim();
  }
  if (!token) return null;
  return verifySessionToken(token);
}

/* ── Adapters tasks plateforme (configureTasksBrand côté marque) ── */

/**
 * Adapters plateforme LAZY (globalThis) : la marque les branche dans
 * `configureTasksBrand` au beforeBoot, la surface les alimente au boot.
 * Sans surface montée → erreurs propres (jamais de throw sauvage).
 */
export function createPlatformTasksBrandAdapters(): Pick<
  TasksBrandConfig,
  "db" | "users" | "presence" | "workspace" | "screencast" | "auth"
> {
  const rt = () => getBrandPlatformRuntime();

  const workspace: TasksWorkspaceAdapter = {
    ensureOnHost: async ({ aiUserId, hostUserId, show, label }) => {
      const runtime = rt();
      const sidecar = runtime?.getSidecar();
      if (sidecar) {
        const info = await sidecar.host.ensure({ aiUserId, ...(label ? { label } : {}) });
        sidecar.syncAiExecutors();
        return { ok: true, workspace: info };
      }
      if (!runtime) return { ok: false, error: "platform_surface_unmounted" };
      // Fallback desktop Electron (parité TF2) : dispatch bridge ciblé host.
      const user = runtime.store.getUserById(aiUserId);
      if (!user) return { ok: false, error: `Collaborateur IA introuvable: ${aiUserId}` };
      const owner = runtime.store.getOwner();
      const token = await createSessionToken({
        user: {
          id: user.id,
          username: user.username,
          role: "collaborator",
          permissions: user.permissions,
        },
        actor: owner
          ? { id: owner.id, username: owner.username, role: "owner", permissions: [...owner.permissions] }
          : null,
      });
      return dispatchSupplierAction(
        "ai_workspace_ensure",
        {
          ai_user_id: aiUserId,
          token,
          base_url: runtime.baseUrl(),
          label: label || user.username,
          ...(show ? { show: true } : {}),
        },
        undefined,
        { targetUserId: hostUserId, requireTargetOnline: true },
      );
    },
    navigate: async ({ aiUserId, hostUserId, href }) => {
      const sidecar = rt()?.getSidecar();
      if (sidecar) return sidecar.host.navigate({ aiUserId, href });
      return dispatchSupplierAction(
        "ai_workspace_navigate",
        { ai_user_id: aiUserId, href },
        undefined,
        { targetUserId: hostUserId, requireTargetOnline: true },
      );
    },
    openTab: async ({ aiUserId, hostUserId, params }) => {
      const sidecar = rt()?.getSidecar();
      if (sidecar) return sidecar.host.openTab({ aiUserId, params });
      return dispatchSupplierAction(
        "ai_workspace_open_tab",
        { ai_user_id: aiUserId, ...params },
        undefined,
        { targetUserId: hostUserId, requireTargetOnline: true },
      );
    },
    listTabs: async ({ aiUserId, hostUserId }) => {
      const sidecar = rt()?.getSidecar();
      if (sidecar) return { ok: true, tabs: sidecar.host.listTabs(aiUserId) };
      return dispatchSupplierAction(
        "ai_workspace_list_tabs",
        { ai_user_id: aiUserId },
        undefined,
        { targetUserId: hostUserId, requireTargetOnline: true },
      );
    },
    webAction: async ({ aiUserId, hostUserId, webType, params, tabId }) => {
      const sidecar = rt()?.getSidecar();
      if (sidecar) {
        return sidecar.host.webAction({
          aiUserId,
          webType,
          ...(params ? { params } : {}),
          ...(tabId ? { tabId } : {}),
        });
      }
      return dispatchSupplierAction(
        "ai_workspace_web_action",
        {
          ai_user_id: aiUserId,
          web_type: webType,
          web_params: params || {},
          ...(tabId ? { tab_id: tabId } : {}),
        },
        undefined,
        { targetUserId: hostUserId, requireTargetOnline: true },
      );
    },
    startScreencast: async (aiUserId) => {
      const runtime = rt();
      const sidecar = runtime?.getSidecar();
      if (sidecar) return sidecar.host.startScreencast(aiUserId);
      const host = runtime?.presence.listOnlineBridges()[0]?.userId;
      if (!host) return { ok: false, error: "Aucun hôte desktop/serveur en ligne" };
      return dispatchSupplierAction(
        "ai_workspace_screencast_start",
        { ai_user_id: aiUserId },
        undefined,
        { targetUserId: host, requireTargetOnline: true },
      );
    },
    stopScreencast: async (aiUserId) => {
      const runtime = rt();
      const sidecar = runtime?.getSidecar();
      if (sidecar) return sidecar.host.stopScreencast(aiUserId);
      const host = runtime?.presence.listOnlineBridges()[0]?.userId;
      if (!host) return { ok: true, already: true };
      return dispatchSupplierAction(
        "ai_workspace_screencast_stop",
        { ai_user_id: aiUserId },
        undefined,
        { targetUserId: host },
      );
    },
  };

  return {
    db: {
      getWriteDb: () => {
        const runtime = rt();
        if (!runtime) throw new Error("platform_surface_unmounted");
        return runtime.store.dbAdapter.getWriteDb();
      },
      queryAll: (sql, params) =>
        rt()?.store.dbAdapter.queryAll(sql, params) ?? [],
      queryOne: (sql, params) =>
        rt()?.store.dbAdapter.queryOne(sql, params) ?? null,
      tableExists: (name) =>
        rt()?.store.dbAdapter.tableExists(name) ?? false,
    },
    users: {
      getById: (id) => rt()?.store.getUserById(id) ?? null,
      list: () => rt()?.store.listUsers() ?? [],
      getOwner: () => rt()?.store.getOwner() ?? null,
      ready: () => Boolean(rt()),
    },
    presence: {
      isDesktopOnline: (userId) =>
        rt()?.presence.isDesktopOnline(userId) ?? false,
      listOnlineBridges: () => rt()?.presence.listOnlineBridges() ?? [],
    },
    workspace,
    screencast: {
      viewerCount: (aiUserId) => screencastViewerCount(aiUserId),
      subscribe: (aiUserId, listener) => subscribeScreencast(aiUserId, listener),
    },
    auth: {
      getSessionFromContext: async (c) =>
        (await sessionFromContext(c)) as TasksSession | null,
      sessionActorIsOwner: (session) =>
        sessionActorIsOwner(session as SessionPayload | null),
      sessionIsImpersonating: (session) =>
        sessionIsImpersonating(session as SessionPayload | null),
    },
  };
}

/* ── Surface Hono ── */

export type BrandPlatformSurface = {
  app: Hono;
  runtime: BrandPlatformRuntime;
  attachSidecar: (sidecar: BrandBrowserSidecarHandle | null) => void;
  close: () => void;
};

const PLATFORM_PREFIXES = [
  "/api/v1/auth",
  "/api/v1/tasks",
  "/api/v1/assistant",
  "/api/v1/desktop",
  "/api/v1/platform/users",
  "/api/v1/platform/workspace",
  "/api/v1/platform/presence",
  "/api/v1/platform/desktop",
];

/** Chemins proxifiés Node http → surface plateforme (streaming SSE). */
export function platformSurfaceHandlesPath(pathname: string): boolean {
  return PLATFORM_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function mountBrandPlatformSurface(opts: {
  brandId: string;
  coreDbPath: string;
  baseUrl: () => string;
  /** Défaut : `${brandId}_session` (aligné cookie desktop marque). */
  sessionCookieName?: string;
  ownerPermissions?: readonly string[];
  onLog?: (line: string) => void;
}): BrandPlatformSurface {
  const log =
    opts.onLog || ((line: string) => console.log(`[platform-surface] ${line}`));
  const cookieName =
    opts.sessionCookieName || `${opts.brandId.replace(/[^a-z0-9_]/gi, "_")}_session`;

  // configureAuth idempotent : ne pas écraser une config marque existante.
  if (!getAuthConfig().cookieName) {
    configureAuth({
      cookieName,
      ...(opts.ownerPermissions
        ? { ownerPermissions: opts.ownerPermissions }
        : {}),
    });
  }
  const effectiveCookieName = getAuthConfig().cookieName || cookieName;

  const store = openBrandPlatformStore({
    coreDbPath: opts.coreDbPath,
    ...(opts.ownerPermissions
      ? { ownerPermissions: opts.ownerPermissions }
      : {}),
  });

  let sidecar: BrandBrowserSidecarHandle | null = null;
  const getSidecar = () => sidecar;
  const presence = createPresenceRegistry(getSidecar);

  const runtime: BrandPlatformRuntime = {
    store,
    sessionCookieName: effectiveCookieName,
    baseUrl: opts.baseUrl,
    getSidecar,
    presence,
  };
  runtimeSlot().current = runtime;

  const app = new Hono();

  /* Auth (login/logout/me/impersonate/ai-workspace-session). */
  const toRouteUser = (u: {
    id: string;
    username: string;
    role: "owner" | "collaborator";
    kind: "human" | "ai";
    active: boolean;
    permissions: string[];
  }): AuthRouteUser => ({
    id: u.id,
    username: u.username,
    role: u.role,
    permissions: u.permissions,
    active: u.active,
    kind: u.kind,
  });

  app.route(
    "/api/v1/auth",
    createAuthRoutes({
      // Kit-first (authenticateViaKit) porte le login owner ; pas de table
      // credentials marque ici → projection par username.
      authenticateUser: () => null,
      ensureOwnerSynced: () => {
        const owner = store.getOwner();
        return owner ? toRouteUser(owner) : null;
      },
      getUserById: (id) => {
        const u = store.getUserById(id);
        return u ? toRouteUser(u) : null;
      },
      getUserByUsername: (username) => {
        const lc = username.trim().toLowerCase();
        const u = store
          .listUsers()
          .find((x) => x.username.toLowerCase() === lc);
        return u ? { id: u.id, active: u.active ? 1 : 0 } : null;
      },
      listUsers: () => store.listUsers().map(toRouteUser),
      ownerPermissions: getAuthConfig().ownerPermissions,
      resolveCookieSecure: (c) =>
        (c.req.header("x-forwarded-proto") || "").toLowerCase() === "https",
      getSessionFromContext: sessionFromContext,
    }),
  );

  /* Assistant (chat, ui-actions résultats, flux desktop-actions SSE). */
  app.route(
    "/api/v1/assistant",
    createAssistantRoutes({
      getSession: (c) => sessionFromContext(c),
      desktopPresence: presence,
      desktopStreamAuth: "session",
      resolveDeviceMeta: (c) => ({
        deviceId:
          c.req.query("device_id") || c.req.header("x-device-id") || "desktop",
        deviceLabel:
          c.req.query("device_label") ||
          c.req.header("x-device-label") ||
          null,
      }),
    }),
  );

  /* Tasks (kanban + runs + activity + screencast SSE). */
  app.route("/api/v1/tasks", createTasksHonoRoutes());

  /* Frames screencast POSTées par le bridge Electron (session requise). */
  app.post("/api/v1/desktop/screencast/frame", async (c) => {
    const session = await sessionFromContext(c);
    if (!session) return c.json({ error: "Non authentifié" }, 401);
    const body = (await c.req.json().catch(() => ({}))) as {
      ai_user_id?: string;
      data?: string;
    };
    const aiUserId = String(body.ai_user_id || "").trim();
    const data = typeof body.data === "string" ? body.data : "";
    if (!aiUserId || !data) {
      return c.json({ error: "ai_user_id et data requis" }, 400);
    }
    const { viewers, seq } = publishScreencastFrame(aiUserId, data);
    return c.json({ ok: true, viewers, seq });
  });

  /* Collaborateurs plateforme (owner) — création IA / liste. */
  app.get("/api/v1/platform/users", async (c) => {
    const session = await sessionFromContext(c);
    if (!session) return c.json({ error: "Non authentifié" }, 401);
    return c.json({ ok: true, users: store.listUsers() });
  });

  app.post("/api/v1/platform/users", async (c) => {
    const session = await sessionFromContext(c);
    if (!session || !sessionActorIsOwner(session)) {
      return c.json({ error: "Réservé au compte principal" }, 403);
    }
    const body = (await c.req.json().catch(() => ({}))) as {
      username?: string;
      kind?: string;
      permissions?: string[];
    };
    try {
      const user = store.createCollaborator({
        username: String(body.username || ""),
        kind: body.kind === "ai" ? "ai" : "human",
        ...(Array.isArray(body.permissions)
          ? { permissions: body.permissions.filter((p) => typeof p === "string") }
          : {}),
      });
      sidecar?.syncAiExecutors();
      return c.json({ ok: true, user }, 201);
    } catch (e) {
      return c.json(
        { error: e instanceof Error ? e.message : String(e) },
        400,
      );
    }
  });

  /* Workspace IA (owner) — mêmes adapters que tasks : sidecar serveur
   * prioritaire, sinon dispatch bridge desktop (client thin / TF2). Sert
   * l'admin, les gates hybrides et « Voir comme IA ». */
  const platformWorkspace = createPlatformTasksBrandAdapters().workspace;
  const resolveHostUserId = (given?: string): string =>
    (given || "").trim() ||
    presence.listOnlineBridges()[0]?.userId ||
    "";

  const workspaceGuard = async (c: Context) => {
    const session = await sessionFromContext(c);
    if (!session || !sessionActorIsOwner(session)) return null;
    return session;
  };

  app.post("/api/v1/platform/workspace/ensure", async (c) => {
    if (!(await workspaceGuard(c))) {
      return c.json({ error: "Réservé au compte principal" }, 403);
    }
    const body = (await c.req.json().catch(() => ({}))) as {
      ai_user_id?: string;
      host_user_id?: string;
      label?: string;
      show?: boolean;
    };
    const aiUserId = String(body.ai_user_id || "").trim();
    if (!aiUserId) return c.json({ error: "ai_user_id requis" }, 400);
    const r = await platformWorkspace.ensureOnHost({
      aiUserId,
      hostUserId: resolveHostUserId(body.host_user_id),
      ...(body.label ? { label: body.label } : {}),
      ...(body.show ? { show: true } : {}),
    });
    return c.json(r, r?.ok === true ? 200 : 502);
  });

  app.post("/api/v1/platform/workspace/open-tab", async (c) => {
    if (!(await workspaceGuard(c))) {
      return c.json({ error: "Réservé au compte principal" }, 403);
    }
    const body = (await c.req.json().catch(() => ({}))) as {
      ai_user_id?: string;
      host_user_id?: string;
      [k: string]: unknown;
    };
    const aiUserId = String(body.ai_user_id || "").trim();
    if (!aiUserId) return c.json({ error: "ai_user_id requis" }, 400);
    const { ai_user_id: _a, host_user_id: hostId, ...params } = body;
    const r = await platformWorkspace.openTab({
      aiUserId,
      hostUserId: resolveHostUserId(hostId),
      params: params as Record<string, unknown>,
    });
    return c.json(r, r?.ok === true ? 200 : 502);
  });

  app.post("/api/v1/platform/workspace/web-action", async (c) => {
    if (!(await workspaceGuard(c))) {
      return c.json({ error: "Réservé au compte principal" }, 403);
    }
    const body = (await c.req.json().catch(() => ({}))) as {
      ai_user_id?: string;
      host_user_id?: string;
      web_type?: string;
      web_params?: Record<string, unknown>;
      tab_id?: string;
    };
    const aiUserId = String(body.ai_user_id || "").trim();
    const webType = String(body.web_type || "").trim();
    if (!aiUserId || !webType) {
      return c.json({ error: "ai_user_id et web_type requis" }, 400);
    }
    const r = await platformWorkspace.webAction({
      aiUserId,
      hostUserId: resolveHostUserId(body.host_user_id),
      webType,
      ...(body.web_params ? { params: body.web_params } : {}),
      ...(body.tab_id ? { tabId: body.tab_id } : {}),
    });
    return c.json(r, r?.ok === true ? 200 : 502);
  });

  /* Presence bridges (owner) — inclut l'hôte synthétique sidecar serveur. */
  app.get("/api/v1/platform/presence", async (c) => {
    if (!(await workspaceGuard(c))) {
      return c.json({ error: "Réservé au compte principal" }, 403);
    }
    return c.json({ ok: true, bridges: presence.listOnlineBridges() });
  });

  // Dispatch desktop générique (owner) — actions external_* / supplier_*
  // vers le poste d'un humain connecté (client thin / TF2) ou l'IA serveur.
  app.post("/api/v1/platform/desktop/dispatch", async (c) => {
    if (!(await workspaceGuard(c))) {
      return c.json({ error: "Réservé au compte principal" }, 403);
    }
    const body = (await c.req.json().catch(() => ({}))) as {
      target_user_id?: string;
      type?: string;
      params?: Record<string, unknown>;
    };
    const targetUserId = String(body.target_user_id || "").trim();
    const type = String(body.type || "").trim();
    if (!targetUserId || !type) {
      return c.json({ error: "target_user_id et type requis" }, 400);
    }
    const r = await dispatchSupplierAction(
      type as Parameters<typeof dispatchSupplierAction>[0],
      body.params || {},
      undefined,
      { targetUserId, requireTargetOnline: true },
    );
    return c.json(r, (r as { ok?: boolean })?.ok === true ? 200 : 502);
  });

  app.get("/api/v1/platform/workspace/:aiUserId/tabs", async (c) => {
    if (!(await workspaceGuard(c))) {
      return c.json({ error: "Réservé au compte principal" }, 403);
    }
    const r = await platformWorkspace.listTabs({
      aiUserId: c.req.param("aiUserId"),
      hostUserId: resolveHostUserId(c.req.query("host_user_id")),
    });
    return c.json(r, r?.ok === true ? 200 : 502);
  });

  log(
    `surface plateforme montée (cookie=${effectiveCookieName}, core=${opts.coreDbPath})`,
  );

  return {
    app,
    runtime,
    attachSidecar: (next) => {
      sidecar = next;
      sidecar?.syncAiExecutors();
    },
    close: () => {
      if (runtimeSlot().current === runtime) runtimeSlot().current = null;
      store.close();
    },
  };
}
