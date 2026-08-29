/**
 * Cadre architecture Creezio (Phase H0+).
 * Bump uniquement au sign-off de phase (H0 → H1 → … → H5 ACL → H6 freeze I*
 * → H7 neutralisation des contrats marque, P1.c — codemods scripts/codemods/H7).
 */
export const ARCHITECTURE_VERSION = "H7" as const;

export type ArchitectureVersion = typeof ARCHITECTURE_VERSION;
