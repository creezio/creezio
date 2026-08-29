/**
 * Cadre architecture Creezio (Phase H0+).
 * Bump uniquement au sign-off de phase (H0 → H1 → … → H5 ACL → H6 freeze I*
 * → H7 neutralisation des contrats marque, P1.c — codemods scripts/codemods/H7
 * → H8 extraction des manifests marque du kit, P1.d — codemods scripts/codemods/H8).
 */
export const ARCHITECTURE_VERSION = "H8" as const;

export type ArchitectureVersion = typeof ARCHITECTURE_VERSION;
