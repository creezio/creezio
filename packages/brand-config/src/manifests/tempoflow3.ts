import type { AppManifest } from "../types.js";

/**
 * Manifest sandbox TempoFlow3 (sonde CHR / frère tempoflow2).
 * SoT identité = repo marque `src/electron/app-manifest.ts` — recopié ici
 * pour `listBrandIds` / `electron:publish` natif (`CREEZIO_BRAND=tempoflow3`).
 *
 * Ne pas confondre avec `tempoflow` (prod TF2). sandbox=true → hors parc feeds prod.
 */
export const tempoflow3Manifest: AppManifest = {
  brandId: "tempoflow3",
  envPrefix: "TEMPOFLOW3",
  bridgeName: "tempoflow3Desktop",
  dbFileName: "tempoflow3.db",
  localConfigFileName: "tempoflow3-config.json",
  deepLinkProtocol: "tempoflow3",
  sessionPartition: "tempoflow3-app",
  logBasename: "tempoflow3-main",
  tunnelRootDomain: "tempoflow.fr",
  domains: {
    primary: "crm.tempoflow.fr",
    feedHost: "crm.tempoflow.fr",
  },
  features: {
    plugins: true,
    fleet: true,
  },
  copyright: "© TempoFlow",
  client: {
    appId: "io.creezio.tempoflow3",
    productName: "TempoFlow",
    executableName: "TempoFlow",
    artifactName: "TempoFlow-Setup-${version}.${ext}",
    packageName: "tempoflow3",
    userDataSegment: "tempoflow3",
    feedUrl:
      "https://crm.tempoflow.fr/dl-e660352fb04dbd5e2519f0e60897c548/tf3/",
    nsisGuid: "74a5d40a-b8af-5f20-8b3d-23ccc8149548",
    appUserModelId: "io.creezio.tempoflow3",
  },
  server: {
    appId: "io.creezio.tempoflow3.server",
    productName: "TempoFlow Server",
    executableName: "TempoFlow-Server",
    artifactName: "TempoFlow-Server-Setup-${version}.${ext}",
    packageName: "tempoflow3-server",
    userDataSegment: "TempoFlow Server",
    feedUrl:
      "https://crm.tempoflow.fr/dl-e660352fb04dbd5e2519f0e60897c548/tf3/server/",
    nsisGuid: "1fdf0752-43e8-54dd-8a79-fdbc4abf1a15",
    appUserModelId: "io.creezio.tempoflow3.server",
  },
  publish: {
    dockerDlName: "dl-tempoflow",
    hostDlDirDefault:
      "/var/lib/docker/volumes/nginx-proxy-manager_npm_data/_data/dl-tempoflow/tf3",
    npmContainer: "nginx-proxy-manager",
    remoteBuildHost: "deploy@104.168.10.36",
    remoteBuildRoot: "/opt/docker/tempoflow3-build",
    remoteBinSrc: "/opt/docker/tempoflow3",
    statusFile: "/tmp/tempoflow3-build-status.json",
    remoteLogPrefix: "tempoflow3-remote-build",
    buildServerArtifact: true,
    defaultAppRoot: "/opt/docker/tempoflow3",
  },
  sandbox: true,
};
