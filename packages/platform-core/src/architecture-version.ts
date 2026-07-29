/**
 * Cadre architecture Creezio (Phase H0+).
 * Bump uniquement au sign-off de phase (H0 → H1 → … → H5 ACL → H6 freeze I*).
 */
export const ARCHITECTURE_VERSION = "H6" as const;

export type ArchitectureVersion = typeof ARCHITECTURE_VERSION;
