/**
 * Compat desktop héritée — PÉRIMÈTRE GELÉ (P2.a).
 *
 * Ce module feuille regroupe TOUTE la compat marque héritée du moteur
 * desktop (`brand-desktop-runtime.ts`) : défauts d'env legacy, ordre des
 * preloads historiques, alias de contrat host. Les clients desktop legacy
 * (repos hors kit, non migrés sur `startBrandDesktop`) appellent
 * `installBrandDesktopRuntime` directement et dépendent de ces défauts ;
 * les marques modernes (factory / `startBrandDesktop`) passent des deps
 * explicites et n'empruntent jamais ces branches.
 *
 * POLITIQUE (gate `test-phase-legacy-desktop-frozen`) :
 *  - GELÉ : aucune feature n'entre ici — fixes sécurité uniquement ;
 *  - tout diff = gate rouge ; un fix sécurité assume la mise à jour de
 *    l'empreinte dans `scripts/legacy-desktop-frozen.json` DANS LE MÊME
 *    commit, documentée dans le message de commit ;
 *  - candidat retrait H9 : au prochain bump `ARCHITECTURE_VERSION`, les
 *    clients legacy migrent sur des deps explicites (codemod) et ce module
 *    disparaît (voir docs/BACKLOG.md).
 */

/** Env Next du dossier plugins — défaut d'env legacy. */
export function legacyPluginsDirEnvKey(envPrefix: string): string {
  return envPrefix === "TF2"
    ? "TEMPOFLOW_PLUGINS_DIR"
    : `${envPrefix}_PLUGINS_DIR`;
}

/** Query param SiteLink — défaut legacy, sinon `<brandId>fid`. */
export function legacySupplierFidQueryParam(
  envPrefix: string,
  brandId: string,
): string {
  return envPrefix === "TF2" ? "tf2fid" : `${brandId || "app"}fid`;
}

/** Clé API CRM dans process.env — défaut d'env legacy. */
export function legacyApiKeyEnvName(envPrefix: string): string {
  return envPrefix === "TF2" ? "TEMPOFLOW_API_KEY" : `${envPrefix}_API_KEY`;
}

/**
 * Basenames preload, par priorité : `preload-app.js` (clients legacy)
 * puis `preload.js` (factory / marques modernes).
 */
export function legacyPreloadBasenames(): readonly string[] {
  return ["preload-app.js", "preload.js"];
}

type EnsureNodeFn = (o: unknown) => Promise<{ ok: boolean; detail?: string }>;

/**
 * Contrat host nodeRuntime : `ensureDesktopNode` (nom plateforme) avec
 * alias legacy (hosts historiques non renommés).
 */
export function resolveLegacyEnsureDesktopNode(nodeRt: {
  ensureDesktopNode?: EnsureNodeFn;
  ensureTempoflowNode?: EnsureNodeFn;
}): EnsureNodeFn | undefined {
  return nodeRt.ensureDesktopNode || nodeRt.ensureTempoflowNode;
}
