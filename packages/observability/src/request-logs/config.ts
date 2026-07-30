/**
 * Injection host pour request-logs (évite imports `@/` marque).
 * O5 — gold TempoFlow générique.
 */

export type RequestLogsConfig = {
  /**
   * Répertoire miroir jsonl pour l’agent flotte Electron.
   * Défaut : CREEZIO_FLEET_STATE_DIR | TF2_FLEET_STATE_DIR |
   * CERTIVAN_FLEET_STATE_DIR | FIDU_FLEET_STATE_DIR.
   */
  getFleetStateDir?: () => string | undefined;
};

let config: RequestLogsConfig = {};

export function configureRequestLogs(next: RequestLogsConfig): void {
  config = next ?? {};
}

export function getRequestLogsConfig(): RequestLogsConfig {
  return config;
}

export function resetRequestLogsConfigForTests(): void {
  config = {};
}

/** Résout le dir miroir (config marque ou env génériques). */
export function resolveFleetStateDir(): string | undefined {
  const custom = config.getFleetStateDir?.();
  if (custom) return custom;
  return (
    process.env.CREEZIO_FLEET_STATE_DIR ||
    process.env.TF2_FLEET_STATE_DIR ||
    process.env.CERTIVAN_FLEET_STATE_DIR ||
    process.env.FIDU_FLEET_STATE_DIR ||
    undefined
  );
}
