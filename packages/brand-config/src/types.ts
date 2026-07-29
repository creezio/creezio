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
 * dans platform-core / electron-shell.
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
  /**
   * Protocole deep-link OS (sans `://`) — ex. `tempoflow`, `certivan`, `fidu`.
   * Utilisé pour `tempoflow://join/<host>` et les argv `--{prefix}-profile=`.
   */
  deepLinkProtocol: string;
  /**
   * Segment partition Chromium app (sans préfixe `persist:`).
   * Ex. `tempoflow-app` → `persist:tempoflow-app`.
   */
  sessionPartition: string;
  /** Préfixe des fichiers log main (ex. `tempoflow-main` → `tempoflow-main.log`). */
  logBasename: string;
  /**
   * Domaine racine pour tunnels Cloudflare multi-niveau
   * (`{slug}.{tunnelRootDomain}`, `n8n.{slug}.{tunnelRootDomain}`…).
   */
  tunnelRootDomain: string;
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
  /**
   * Infra publish / remote-build (Phase C) — chemins DL, hôte distant, statut.
   * Les tokens secrets restent hors repo (env de l'app marque).
   */
  publish: BrandPublishInfra;
};

/**
 * Infra de publication Windows (feeds + remote-build).
 * Paramètre les scripts `@creezio/desktop-tooling` sans hardcoder une marque.
 */
export type BrandPublishInfra = {
  /** Nom sous `/data/` dans le conteneur NPM (ex. `dl-tempoflow`). */
  dockerDlName: string;
  /** Chemin hôte du volume DL (fallback si pas de docker cp). */
  hostDlDirDefault: string;
  /** Conteneur Docker NPM pour `docker cp` (ex. `nginx-proxy-manager`). */
  npmContainer: string;
  /** Hôte SSH remote-build (`user@host`). */
  remoteBuildHost: string;
  /** Workdir distant parent de `crm/` (ex. `/opt/docker/certivan-build`). */
  remoteBuildRoot: string;
  /** Source binaires Windows sur l'hôte distant (infra only). */
  remoteBinSrc: string;
  /** Fichier JSON de statut build (lu par la console). */
  statusFile: string;
  /** Préfixe logs `/tmp/{prefix}-{version}.log`. */
  remoteLogPrefix: string;
  /**
   * Si true, `remote-build-win` produit aussi `dist-electron-server`
   * (modèle Client+Serveur). Fidu peut rester `false` tant que le split
   * packagé n'est pas branché (Phase G).
   */
  buildServerArtifact: boolean;
  /**
   * Alias legacy client optionnel republie sous ce nom
   * (ex. Certivan `Certivan-Setup-0.1.0.exe`).
   */
  legacyClientAlias?: string;
  /** Chemin `crm/` local typique pour la console ops (lecture seule). */
  defaultAppRoot: string;
};

/** Résout l'identité pour un kind packagé. */
export function exeForKind(manifest: AppManifest, kind: AppKind): ExeIdentity {
  return kind === "server" ? manifest.server : manifest.client;
}

/** Nom d'env override (ex. `TF2_USER_DATA_OVERRIDE`). */
export function envKey(manifest: AppManifest, suffix: string): string {
  return `${manifest.envPrefix}_${suffix}`;
}

/** Partition persist Chromium pour la vue CRM principale. */
export function appSessionPartition(manifest: AppManifest): string {
  return `persist:${manifest.sessionPartition}`;
}

/** Prefixe argv profil (`--tf2-profile=` / `--certivan-profile=`…). */
export function profileArgPrefix(manifest: AppManifest): string {
  return `--${manifest.envPrefix.toLowerCase()}-profile=`;
}

/** Prefixe argv profil-dir. */
export function profileDirArgPrefix(manifest: AppManifest): string {
  return `--${manifest.envPrefix.toLowerCase()}-profile-dir=`;
}

/** Résout `artifactName` → nom de fichier (`${version}` / `${ext}`). */
export function resolveArtifactFileName(
  exe: ExeIdentity,
  version: string,
  ext = "exe",
): string {
  return exe.artifactName
    .replaceAll("${version}", version)
    .replaceAll("${ext}", ext);
}

/** Alias `*-Setup-latest.exe` dérivé du motif artifactName. */
export function resolveLatestAlias(exe: ExeIdentity, ext = "exe"): string {
  return resolveArtifactFileName(exe, "latest", ext);
}

/** URL feed sans slash final. */
export function feedBaseUrl(exe: ExeIdentity): string {
  return exe.feedUrl.replace(/\/+$/, "");
}

/** URL `latest.yml` pour un kind. */
export function latestYmlUrl(manifest: AppManifest, kind: AppKind): string {
  return `${feedBaseUrl(exeForKind(manifest, kind))}/latest.yml`;
}

/** Variable d'env kind packagé (`TF2_APP_KIND`, …). */
export function appKindEnvKey(manifest: AppManifest): string {
  return `${manifest.envPrefix}_APP_KIND`;
}

/** Variable d'env plateforme serveur embarqué (`TF2_SERVER_PLATFORM`, …). */
export function serverPlatformEnvKey(manifest: AppManifest): string {
  return `${manifest.envPrefix}_SERVER_PLATFORM`;
}

/** Dossier dist electron-builder selon kind. */
export function distDirForKind(kind: AppKind): string {
  return kind === "server" ? "dist-electron-server" : "dist-electron";
}
