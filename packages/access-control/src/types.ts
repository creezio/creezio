/** Types publics @creezio/access-control. */

/** Rôle métier déclaratif de la marque (seule part « config » du système). */
export type AccessRoleDef = {
  /** Identifiant stable (ex. "pos", "backoffice", "staff"). */
  id: string;
  label: string;
  /** Permissions du rôle avant overrides DB. */
  defaultPermissions: readonly string[];
};

export type AccessPermissionDef = {
  id: string;
  label?: string;
};

/** Groupe de permissions affiché dans la matrice (un module = un groupe). */
export type AccessPermissionGroup = {
  id: string;
  label: string;
  permissions: readonly (string | AccessPermissionDef)[];
};

export type AccessEffect = "allow" | "deny";

/** Override DB : ajustement d'une permission pour un rôle. */
export type AccessOverride = {
  role: string;
  permission: string;
  effect: AccessEffect;
  updatedBy: string | null;
  updatedAt: string;
};

/** Assignation explicite rôle ↔ compte (table interne, si pas de SoT métier). */
export type AccessUserRole = {
  userId: string;
  role: string;
  updatedBy: string | null;
  updatedAt: string;
};

export type AccessAuditEntry = {
  id: number;
  actor: string;
  action: string;
  role: string | null;
  permission: string | null;
  effect: string | null;
  targetUserId: string | null;
  detail: Record<string, unknown> | null;
  createdAt: string;
};

/** Utilisateur tel que vu par l'API /access/users. */
export type AccessRouteUser = {
  id: string;
  username: string;
  role: "owner" | "collaborator";
  kind?: string;
  active?: boolean;
};