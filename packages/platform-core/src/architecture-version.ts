/**
 * Version du cadre d'architecture Creezio (docs H0+).
 * Bumpée au sign-off de chaque phase cadre (H0 → H1 → …).
 */
export const ARCHITECTURE_VERSION = "H1" as const;

export type ArchitectureVersion = typeof ARCHITECTURE_VERSION;
