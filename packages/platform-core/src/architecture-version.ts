/**
 * Cadre architecture Creezio (Phase H0+).
 * Bump uniquement au sign-off de phase (H0 → H1 → … → H5 ACL → H6 freeze I*
 * → H7 neutralisation des contrats marque, P1.c — codemods scripts/codemods/H7
 * → H8 extraction des manifests marque du kit, P1.d — codemods scripts/codemods/H8
 * → H9 contrat de module importé du kit, P2.c — codemods scripts/codemods/H9
 * → H10 retrait de la compat desktop legacy, P2.a clôturé — codemods
 *   scripts/codemods/H10
 * → H11 purge de la compat desktop historique (dual-reads env première
 *   marque, manifests prod kit, créateur de feed CHR runtime, alias
 *   password WebUI historique, preload-app.js)
 *   — codemods scripts/codemods/H11).
 */
export const ARCHITECTURE_VERSION = "H11" as const;

export type ArchitectureVersion = typeof ARCHITECTURE_VERSION;
