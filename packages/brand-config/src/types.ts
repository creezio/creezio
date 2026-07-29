/**
 * Schéma AppManifest — identité d'une marque desktop Creezio.
 *
 * Le modèle standard est **toujours** multi-exe Client + Serveur
 * (deux appId, deux feeds, deux GUID NSIS, deux segments userData).
 * Ce n'est pas une option : brand-config l'exige pour chaque marque.
 */

/** Kind packagé (hors « legacy » tout-en-un réservé au dev / upgrades). */
export type AppKind = "client" | "server";

/** Identité d'un exe (client ou serveur). */
export type ExeIdentity = {
  /** electron-builder `appId` (stable → upgrades in-place). */
  appId: string;
  /** Nom produit affiché (NSIS / menu Démarrer). */
  productName: string;
  /** Nom du binaire Windows (évite les collisions StartsWith INSTDIR). */
  executableName: string;
  /** Motif artifactName (ex. `TempoFlow-Setup-${version}.${ext}`). */
  artifactName: string;
  /** `extraMetadata.name` → segment userData Electron par défaut. */
  packageName: string;
  /** Segment userData explicite (souvent = packageName ou productName). */
  userDataSegment: string;
  /** URL feed auto-update (generic provider), avec slash final. */
  feedUrl: string;
  /**
   * GUID NSIS (mutex + clé Uninstall).
   * Source de vérité : valeurs hardcodées dans build-builder-config.mjs
   * quand présentes ; sinon UUID.v5(appId, OID electron-builder).
   */
  nsisGuid: string;
  /** AppUserModelId Windows (distinct client/serveur). */
  appUserModelId: string;
};

/**
 * Manifeste complet d'une marque.
 * Paramètre tous les chemins / env / bridges sans hardcoder une marque
 * dans platform-core.
 */
export type AppManifest = {
  /** Identifiant court stable (`tempoflow` | `certivan` | `fidu`). */
  brandId: string;
  /** Préfixe variables d'env (ex. `TF2`, `CERTIVAN`, `FIDU`). */
  envPrefix: string;
  /** Nom contextBridge exposé sur `window` (ex. `tempoflowDesktop`). */
  bridgeName: string;
  /** Nom fichier SQLite principal sous userData. */
  dbFileName: string;
  /** Nom fichier config locale JSON sous userData. */
  localConfigFileName: string;
  /** Domaines / hosts publics (docs, feeds, tunnels). */
  domains: {
    /** Domaine produit principal (marketing / CRM). */
    primary: string;
    /** Domaine feed / infra Creezio si distinct. */
    feedHost: string;
  };
  /** Copyright electron-builder. */
  copyright: string;
  /**
   * Identités Client + Serveur — toujours les deux.
   * `legacy` (tout-en-un) n'est pas un exe packagé du modèle standard.
   */
  client: ExeIdentity;
  server: ExeIdentity;
};

/** Résout l'identité pour un kind packagé. */
export function exeForKind(manifest: AppManifest, kind: AppKind): ExeIdentity {
  return kind === "server" ? manifest.server : manifest.client;
}

/** Nom d'env override (ex. `TF2_USER_DATA_OVERRIDE`). */
export function envKey(manifest: AppManifest, suffix: string): string {
  return `${manifest.envPrefix}_${suffix}`;
}
