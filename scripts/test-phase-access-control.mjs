#!/usr/bin/env node
/**
 * Gate — @creezio/access-control (visibilité modules/sidebar par rôle).
 *
 * Prouve, sur un core.db temporaire :
 *  1. résolution dynamique : défauts déclaratifs du rôle + overrides DB
 *     (deny l'emporte, allow ajoute), cache 30 s invalidé aux écritures ;
 *  2. rôle d'un compte : SoT métier (adaptateurs) > table interne
 *     access_user_roles > brandRole > defaultRole ;
 *  3. API /api/v1/access/* : garde platform.access.manage (owner OK,
 *     impersonation interdite, collaborateur sans la permission → 403,
 *     anonyme → 401) ;
 *  4. GET /matrix expose rôles (owner verrouillé), groupes (Plateforme natif
 *     + catalogue marque), défauts, effectifs et overrides ;
 *  5. PUT /matrix applique allow/deny/inherit, audit écrit, owner figé → 400,
 *     rôle/permission inconnus → 400 ;
 *  6. GET /users + PUT /users/:id/role (table interne ET adaptateurs métier),
 *     owner figé → 400, compte inconnu → 404 ;
 *  7. GET /audit paginé, plus récent d'abord ;
 *  8. module non configuré → 404 propre.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { test } from "node:test";

process.env.AUTH_SECRET = "gate-access-control-secret";

const { openNodeSqliteDatabase } = await import(
  "../packages/database/dist/index.js"
);
const {
  configureAccessControl,
  resetAccessControlForTests,
  createSqliteAccessStore,
  registerAccessControlStore,
  resetAccessControlStoreForTests,
  getAccessControlStore,
  resolvePermissions,
  resolveRoleEffectivePermissions,
  resolveUserRole,
  invalidateAccessControlCaches,
  createAccessControlRoutes,
  ACCESS_MANAGE_PERMISSION,
} = await import("../packages/access-control/dist/index.js");

const ROLE_DEFAULTS = {
  manager: ["nav.crm", "nav.catalogue", "nav.panier", ACCESS_MANAGE_PERMISSION],
  backoffice: ["nav.crm", "nav.catalogue", "nav.panier"],
  vitrine: [],
};
const OWNER_PERMS = [
  "nav.crm",
  "nav.catalogue",
  "nav.panier",
  ACCESS_MANAGE_PERMISSION,
  "platform.users.manage",
];

function setup({ adapters } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "creezio-acl-gate-"));
  const db = openNodeSqliteDatabase(path.join(dir, "core.db"));
  const store = createSqliteAccessStore({ db });
  registerAccessControlStore(store);
  configureAccessControl({
    roles: [
      { id: "manager", label: "Manager", defaultPermissions: ROLE_DEFAULTS.manager },
      { id: "backoffice", label: "Backoffice", defaultPermissions: ROLE_DEFAULTS.backoffice },
      { id: "vitrine", label: "Vitrine", defaultPermissions: [] },
    ],
    defaultRole: "vitrine",
    permissionGroups: [
      {
        id: "catalogue",
        label: "Catalogue",
        permissions: [
          { id: "nav.crm", label: "CRM" },
          { id: "nav.catalogue", label: "Catalogue" },
          { id: "nav.panier", label: "Panier" },
        ],
      },
    ],
    ...(adapters ?? {}),
  });
  invalidateAccessControlCaches();
  return {
    db,
    store,
    cleanup: () => {
      resetAccessControlForTests();
      resetAccessControlStoreForTests();
      db.close();
      fs.rmSync(dir, { recursive: true, force: true });
    },
  };
}

const ownerSession = {
  sub: "u-owner",
  email: "patron@gate.local",
  role: "owner",
  permissions: OWNER_PERMS,
};
const collabSession = {
  sub: "u-collab",
  email: "vendeur@gate.local",
  role: "collaborator",
  permissions: [],
};
const impersonatedOwner = {
  ...ownerSession,
  sub: "u-collab",
  role: "collaborator",
  actorSub: "u-owner",
  actorRole: "owner",
};

const USERS = [
  { id: "u-owner", username: "patron", role: "owner", kind: "human", active: true },
  { id: "u-collab", username: "vendeur", role: "collaborator", kind: "human", active: true },
];

function routeDeps(session) {
  return {
    getSession: async () => session,
    listUsers: () => USERS,
    getUserById: (id) => USERS.find((u) => u.id === id) ?? null,
    ownerPermissions: () => OWNER_PERMS,
    userAdminPermission: () => "platform.users.manage",
  };
}

async function call(app, routePath, init) {
  const res = await app.request(`http://localhost${routePath}`, init);
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

test("1. résolution : défauts du rôle, deny l'emporte, allow ajoute", async () => {
  const { store, cleanup } = setup();
  try {
    assert.deepEqual(await resolvePermissions("u-a", "backoffice"), ROLE_DEFAULTS.backoffice);
    assert.deepEqual(await resolvePermissions("u-a", "vitrine"), []);
    assert.deepEqual(await resolvePermissions("u-a", null), []); // defaultRole vitrine

    store.setOverride("backoffice", "nav.panier", "deny", "patron");
    store.setOverride("vitrine", "nav.crm", "allow", "patron");
    invalidateAccessControlCaches();
    assert.deepEqual(await resolvePermissions("u-b1", "backoffice"), ["nav.crm", "nav.catalogue"]);
    assert.deepEqual(await resolvePermissions("u-b2", "vitrine"), ["nav.crm"]);
    assert.deepEqual(resolveRoleEffectivePermissions("backoffice"), ["nav.crm", "nav.catalogue"]);
  } finally {
    cleanup();
  }
});

test("2. cache 30 s : override invisible tant que non invalidé", async () => {
  const { store, cleanup } = setup();
  try {
    assert.equal((await resolvePermissions("u-cache", "backoffice")).includes("nav.panier"), true);
    store.setOverride("backoffice", "nav.panier", "deny", "patron");
    assert.equal((await resolvePermissions("u-cache", "backoffice")).includes("nav.panier"), true);
    invalidateAccessControlCaches("u-cache");
    assert.equal((await resolvePermissions("u-cache", "backoffice")).includes("nav.panier"), false);
  } finally {
    cleanup();
  }
});

test("3. rôle compte : table interne > brandRole > defaultRole ; adaptateurs métier", async () => {
  const { store, cleanup } = setup();
  try {
    assert.equal(await resolveUserRole("u-x", null), "vitrine"); // defaultRole
    assert.equal(await resolveUserRole("u-x", "staff-legacy"), "staff-legacy"); // brandRole
    store.setUserRole("u-x", "manager", "patron");
    assert.equal(await resolveUserRole("u-x", "staff-legacy"), "manager"); // table gagne
    store.setUserRole("u-x", null, "patron");
    assert.equal(await resolveUserRole("u-x", null), "vitrine");
  } finally {
    cleanup();
  }

  const external = new Map([["u-y", "backoffice"]]);
  const calls = [];
  const { cleanup: cleanup2 } = setup({
    adapters: {
      getUserRole: (userId) => external.get(userId) ?? null,
      setUserRole: ({ userId, role, actor }) => {
        calls.push({ userId, role, actor });
        if (role === null) external.delete(userId);
        else external.set(userId, role);
      },
    },
  });
  try {
    assert.equal(await resolveUserRole("u-y", null), "backoffice"); // SoT métier
    assert.equal(await resolveUserRole("u-z", null), "vitrine"); // fallback défaut
    assert.equal(getAccessControlStore()?.getUserRole("u-y"), null); // pas de doublon interne
    void calls;
  } finally {
    cleanup2();
  }
});

test("4. garde API : owner OK, impersonation 403, collaborateur sans permission 403, anonyme 401", async () => {
  const { cleanup } = setup();
  try {
    const asOwner = createAccessControlRoutes(routeDeps(ownerSession));
    assert.equal((await call(asOwner, "/matrix")).status, 200);

    const asImpersonated = createAccessControlRoutes(routeDeps(impersonatedOwner));
    assert.equal((await call(asImpersonated, "/matrix")).status, 403);

    const asCollab = createAccessControlRoutes(routeDeps(collabSession));
    assert.equal((await call(asCollab, "/matrix")).status, 403);

    const anonymous = createAccessControlRoutes(routeDeps(null));
    assert.equal((await call(anonymous, "/matrix")).status, 401);
  } finally {
    cleanup();
  }
});

test("4b. collaborateur AVEC platform.access.manage (rôle manager) → 200", async () => {
  const { store, cleanup } = setup();
  try {
    store.setUserRole("u-collab", "manager", "patron");
    const asManager = createAccessControlRoutes(routeDeps(collabSession));
    assert.equal((await call(asManager, "/matrix")).status, 200);
  } finally {
    cleanup();
  }
});

test("5. GET /matrix : rôles (owner figé), groupes (Plateforme natif), défauts/effectifs/overrides", async () => {
  const { store, cleanup } = setup();
  try {
    store.setOverride("backoffice", "nav.panier", "deny", "patron");
    const app = createAccessControlRoutes(routeDeps(ownerSession));
    const { status, body } = await call(app, "/matrix");
    assert.equal(status, 200);
    assert.equal(body.managePermission, ACCESS_MANAGE_PERMISSION);

    const owner = body.roles.find((r) => r.id === "owner");
    assert.equal(owner.locked, true);
    assert.deepEqual(owner.defaults, OWNER_PERMS);

    const backoffice = body.roles.find((r) => r.id === "backoffice");
    assert.equal(backoffice.locked, false);
    assert.deepEqual(backoffice.defaults, ROLE_DEFAULTS.backoffice);
    assert.deepEqual(backoffice.effective, ["nav.crm", "nav.catalogue"]);

    const platformGroup = body.groups.find((g) => g.id === "platform");
    const platformIds = platformGroup.permissions.map((p) => p.id);
    assert.ok(platformIds.includes(ACCESS_MANAGE_PERMISSION));
    assert.ok(platformIds.includes("platform.users.manage"));
    const catalogue = body.groups.find((g) => g.id === "catalogue");
    assert.deepEqual(catalogue.permissions.map((p) => p.id), ["nav.crm", "nav.catalogue", "nav.panier"]);

    assert.equal(body.overrides.length, 1);
    assert.deepEqual(
      { role: body.overrides[0].role, permission: body.overrides[0].permission, effect: body.overrides[0].effect },
      { role: "backoffice", permission: "nav.panier", effect: "deny" },
    );
  } finally {
    cleanup();
  }
});

test("6. PUT /matrix : allow/deny/inherit + audit + validations", async () => {
  const { store, cleanup } = setup();
  try {
    const app = createAccessControlRoutes(routeDeps(ownerSession));
    const put = await call(app, "/matrix", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        changes: [
          { role: "backoffice", permission: "nav.panier", effect: "deny" },
          { role: "vitrine", permission: "nav.crm", effect: "allow" },
        ],
      }),
    });
    assert.equal(put.status, 200);
    assert.equal(put.body.ok, true);
    assert.equal(put.body.overrides.length, 2);
    // La route invalide le cache : résolution immédiate.
    assert.deepEqual(await resolvePermissions("u-c1", "backoffice"), ["nav.crm", "nav.catalogue"]);
    assert.deepEqual(await resolvePermissions("u-c2", "vitrine"), ["nav.crm"]);

    // inherit retire l'override (retour au défaut).
    const back = await call(app, "/matrix", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ changes: [{ role: "vitrine", permission: "nav.crm", effect: "inherit" }] }),
    });
    assert.equal(back.status, 200);
    assert.deepEqual(await resolvePermissions("u-c2", "vitrine"), []);

    const audit = store.listAudit(50);
    assert.deepEqual(audit.map((a) => a.action), ["override.clear", "override.set", "override.set"]);
    assert.ok(audit.every((a) => a.actor === "patron@gate.local"));
    assert.equal(audit[1].effect, "allow");

    // Validations.
    for (const [changes, expected] of [
      [[{ role: "owner", permission: "nav.crm", effect: "deny" }], 400],
      [[{ role: "nope", permission: "nav.crm", effect: "deny" }], 400],
      [[{ role: "backoffice", permission: "nav.nope", effect: "deny" }], 400],
      [[{ role: "backoffice", permission: "nav.crm", effect: "maybe" }], 400],
    ]) {
      const res = await call(app, "/matrix", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changes }),
      });
      assert.equal(res.status, expected, JSON.stringify(changes));
    }
  } finally {
    cleanup();
  }
});

test("7. GET /users + PUT /users/:id/role (table interne puis adaptateurs métier)", async () => {
  const { cleanup } = setup();
  try {
    const app = createAccessControlRoutes(routeDeps(ownerSession));
    const list = await call(app, "/users");
    assert.equal(list.status, 200);
    const vendeur = list.body.users.find((u) => u.username === "vendeur");
    assert.equal(vendeur.kitRole, "collaborator");
    assert.equal(vendeur.role, "vitrine"); // defaultRole
    assert.deepEqual(vendeur.permissions, []);
    const patron = list.body.users.find((u) => u.username === "patron");
    assert.equal(patron.role, "owner");
    assert.deepEqual(patron.permissions, OWNER_PERMS);
    assert.deepEqual(list.body.roles.map((r) => r.id), ["manager", "backoffice", "vitrine"]);
    assert.equal(list.body.defaultRole, "vitrine");

    const promote = await call(app, "/users/u-collab/role", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "backoffice" }),
    });
    assert.equal(promote.status, 200);
    assert.deepEqual(promote.body.user.permissions, ROLE_DEFAULTS.backoffice);

    const list2 = await call(app, "/users");
    assert.equal(list2.body.users.find((u) => u.id === "u-collab").role, "backoffice");

    // null → retour au rôle par défaut.
    const demote = await call(app, "/users/u-collab/role", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: null }),
    });
    assert.equal(demote.status, 200);
    assert.equal((await call(app, "/users")).body.users.find((u) => u.id === "u-collab").role, "vitrine");

    // Validations.
    assert.equal(
      (await call(app, "/users/u-collab/role", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "nope" }),
      })).status,
      400,
    );
    assert.equal(
      (await call(app, "/users/u-owner/role", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "vitrine" }),
      })).status,
      400,
    );
    assert.equal(
      (await call(app, "/users/u-ghost/role", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "vitrine" }),
      })).status,
      404,
    );

    const audit = (await call(app, "/audit?limit=10")).body.entries;
    assert.equal(audit.filter((a) => a.action === "user.role").length, 2);
    const last = audit[0];
    assert.equal(last.action, "user.role");
    assert.equal(last.targetUserId, "u-collab");
    assert.equal(last.detail.username, "vendeur");
  } finally {
    cleanup();
  }
});

test("7b. PUT /users/:id/role délègue au SoT métier quand adaptateurs déclarés", async () => {
  const external = new Map();
  const writes = [];
  const { cleanup } = setup({
    adapters: {
      getUserRole: (userId) => external.get(userId) ?? null,
      setUserRole: ({ userId, role, actor }) => {
        writes.push({ userId, role, actor });
        if (role === null) external.delete(userId);
        else external.set(userId, role);
      },
    },
  });
  try {
    const app = createAccessControlRoutes(routeDeps(ownerSession));
    const res = await call(app, "/users/u-collab/role", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "manager" }),
    });
    assert.equal(res.status, 200);
    assert.deepEqual(writes, [{ userId: "u-collab", role: "manager", actor: "patron@gate.local" }]);
    assert.equal(external.get("u-collab"), "manager");
    assert.equal(getAccessControlStore().getUserRole("u-collab"), null); // pas de doublon interne
  } finally {
    cleanup();
  }
});

test("8. GET /audit : limite et ordre desc", async () => {
  const { store, cleanup } = setup();
  try {
    for (let i = 0; i < 5; i += 1) {
      store.setOverride("backoffice", `nav.crm`, "deny", "patron");
      store.clearOverride("backoffice", "nav.crm");
      store.logAudit({ actor: "patron", action: "probe", permission: `nav.p${i}` });
    }
    const app = createAccessControlRoutes(routeDeps(ownerSession));
    const { status, body } = await call(app, "/audit?limit=3");
    assert.equal(status, 200);
    assert.equal(body.entries.length, 3);
    assert.equal(body.entries[0].permission, "nav.p4");
    const all = await call(app, "/audit");
    assert.equal(all.body.entries.length, 5);
  } finally {
    cleanup();
  }
});

test("9. module non configuré → 404 propre ; validations de config", async () => {
  resetAccessControlForTests();
  resetAccessControlStoreForTests();
  const app = createAccessControlRoutes(routeDeps(ownerSession));
  const res = await call(app, "/matrix");
  assert.equal(res.status, 404);
  assert.match(res.body.error, /non configuré/);

  assert.throws(() =>
    configureAccessControl({
      roles: [
        { id: "a", label: "A", defaultPermissions: [] },
        { id: "a", label: "B", defaultPermissions: [] },
      ],
    }),
  );
  assert.throws(() =>
    configureAccessControl({
      roles: [{ id: "a", label: "A", defaultPermissions: [] }],
      defaultRole: "missing",
    }),
  );
  assert.throws(() =>
    configureAccessControl({
      roles: [{ id: "a", label: "A", defaultPermissions: [] }],
      getUserRole: () => null,
    }),
  );
  resetAccessControlForTests();
});