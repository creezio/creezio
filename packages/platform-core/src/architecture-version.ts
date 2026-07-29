/**
 * Version du cadre d'architecture Creezio (docs H0+).
 * Bumpée au sign-off de chaque phase cadre (H0 → H1 → H2 → …).
 */
export const ARCHITECTURE_VERSION = "H2" as const;

export type ArchitectureVersion = typeof ARCHITECTURE_VERSION;
