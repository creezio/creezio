/**
 * ACL plugins — contrats L3 (org/tenant) et L4 (user).
 *
 * Port du modèle Certivan/TF2 `plugin_acl` (L4) + extension kit L3 (org).
 * FAIL-CLOSED : sans grant explicite, seul l'owner (ou clé service) voit.
 * Persistance SQL = vertical (apps) ; ce module reste pur.
 */

/** Niveau L3 = organisation / tenant. */
export const PLUGIN_ACL_LEVEL_ORG = "L3" as const;
/** Niveau L4 = utilisateur collaborateur. */
export const PLUGIN_ACL_LEVEL_USER = "L4" as const;

export type PluginAclLevel =
  | typeof PLUGIN_ACL_LEVEL_ORG
  | typeof PLUGIN_ACL_LEVEL_USER;

export type PluginAclActor = {
  /** Tenant / org (L3). */
  orgId?: string | null;
  /** Utilisateur (L4) — session.sub ou apiKeyUserId. */
  userId?: string | null;
  /** Owner non impersoné. */
  isOwner?: boolean;
  /** Clé API service sans user_id (= niveau owner). */
  isServiceKey?: boolean;
  /** Impersonation active → refuse le shortcut owner. */
  isImpersonating?: boolean;
};

export type PluginAclEntry = {
  pluginId: string;
  /** L3 — orgs autorisées. */
  orgIds: string[];
  /** L4 — users autorisés. */
  userIds: string[];
};

export type PluginAclPolicy = {
  pluginId: string;
  allowedOrgIds: string[];
  allowedUserIds: string[];
  /** Défaut true — aucun enregistrement ⇒ owner seul. */
  failClosed?: boolean;
};

/** Acteur « niveau owner » : owner non impersoné, ou clé API service. */
export function actorIsPluginAdmin(actor: PluginAclActor): boolean {
  if (actor.isServiceKey) return true;
  if (actor.isOwner && !actor.isImpersonating) return true;
  return false;
}

/**
 * L'acteur peut-il voir ce plugin ?
 * - admin → oui ;
 * - org listée (L3) → oui ;
 * - user listé (L4) → oui ;
 * - sinon non (fail-closed).
 */
export function canActorSeePlugin(
  policy: PluginAclPolicy,
  actor: PluginAclActor,
): boolean {
  if (actorIsPluginAdmin(actor)) return true;
  const failClosed = policy.failClosed !== false;
  const orgId = actor.orgId ? String(actor.orgId) : null;
  const userId = actor.userId ? String(actor.userId) : null;

  if (orgId && policy.allowedOrgIds.includes(orgId)) return true;
  if (userId && policy.allowedUserIds.includes(userId)) return true;

  if (!failClosed) return true;
  return false;
}

/** Filtre ids visibles. */
export function filterVisiblePluginIds(
  pluginIds: string[],
  policies: Map<string, PluginAclPolicy> | PluginAclPolicy[],
  actor: PluginAclActor,
): string[] {
  if (actorIsPluginAdmin(actor)) return pluginIds;
  const map =
    policies instanceof Map
      ? policies
      : new Map(policies.map((p) => [p.pluginId, p]));
  return pluginIds.filter((id) => {
    const policy = map.get(id) || {
      pluginId: id,
      allowedOrgIds: [],
      allowedUserIds: [],
      failClosed: true,
    };
    return canActorSeePlugin(policy, actor);
  });
}

/** Agrège lignes SQL L3+L4 → entrées. */
export function aggregateAclRows(rows: Array<{
  plugin_id: string;
  org_id?: string | null;
  user_id?: string | null;
}>): PluginAclEntry[] {
  const map = new Map<string, { orgIds: Set<string>; userIds: Set<string> }>();
  for (const r of rows) {
    const cur = map.get(r.plugin_id) || {
      orgIds: new Set<string>(),
      userIds: new Set<string>(),
    };
    if (r.org_id) cur.orgIds.add(String(r.org_id));
    if (r.user_id) cur.userIds.add(String(r.user_id));
    map.set(r.plugin_id, cur);
  }
  return Array.from(map.entries()).map(([pluginId, sets]) => ({
    pluginId,
    orgIds: Array.from(sets.orgIds).sort(),
    userIds: Array.from(sets.userIds).sort(),
  }));
}

export function aclEntryToPolicy(entry: PluginAclEntry): PluginAclPolicy {
  return {
    pluginId: entry.pluginId,
    allowedOrgIds: entry.orgIds,
    allowedUserIds: entry.userIds,
    failClosed: true,
  };
}
