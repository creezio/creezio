import type { AppManifest } from "../types.js";

/**
 * Manifest TempoFlow — extrait de creezio/tempoflow2 @ v0.10.26
 * (crm/electron-builder.yml, scripts/electron/build-builder-config.mjs,
 * electron/app-kind.ts, electron/paths.ts, electron/preload-app.ts).
 *
 * GUIDs NSIS = valeurs hardcodées production (pas le UUID.v5 recomputé).
 *
 * @deprecated (P1.d — à matérialiser dans le repo marque via le codemod H8,
 * retrait du kit au prochain bump d'architecture).
 */
export const tempoflowManifest: AppManifest = {
  brandId: "tempoflow",
  envPrefix: "TF2",
  bridgeName: "tempoflowDesktop",
  dbFileName: "tempoflow2.db",
  localConfigFileName: "tempoflow-config.json",
  deepLinkProtocol: "tempoflow",
  sessionPartition: "tempoflow-app",
  logBasename: "tempoflow-main",
  tunnelRootDomain: "tempoflow.fr",
  domains: {
    primary: "crm.tempoflow.fr",
    feedHost: "crm.tempoflow.fr",
  },
  copyright: "© TempoFlow",
  client: {
    appId: "fr.tempoflow.desktop",
    productName: "TempoFlow",
    executableName: "TempoFlow",
    artifactName: "TempoFlow-Setup-${version}.${ext}",
    packageName: "tempoflow2-crm",
    userDataSegment: "tempoflow2-crm",
    feedUrl:
      "https://crm.tempoflow.fr/dl-e660352fb04dbd5e2519f0e60897c548/",
    nsisGuid: "b0d127b0-d522-5ccc-9432-f74bc07821b9",
    appUserModelId: "fr.tempoflow.desktop",
  },
  server: {
    appId: "fr.tempoflow.desktop.server",
    productName: "TempoFlow Server",
    executableName: "TF2-Server",
    artifactName: "TempoFlow-Server-Setup-${version}.${ext}",
    packageName: "tempoflow2-crm-server",
    userDataSegment: "TempoFlow Server",
    feedUrl:
      "https://crm.tempoflow.fr/dl-e660352fb04dbd5e2519f0e60897c548/server/",
    nsisGuid: "1eada1b2-84e4-5bc4-9615-9317aa380c2b",
    appUserModelId: "fr.tempoflow.desktop.server",
  },
  publish: {
    dockerDlName: "dl-tempoflow",
    hostDlDirDefault:
      "/var/lib/docker/volumes/nginx-proxy-manager_npm_data/_data/dl-tempoflow",
    npmContainer: "nginx-proxy-manager",
    remoteBuildHost: "deploy@104.168.10.36",
    remoteBuildRoot: "/opt/docker/tempoflow2-build",
    remoteBinSrc: "/opt/docker/tempoflow2/crm",
    statusFile: "/tmp/tempoflow-build-status.json",
    remoteLogPrefix: "tempoflow-remote-build",
    buildServerArtifact: true,
    defaultAppRoot: "/opt/docker/tempoflow2/crm",
  },
  features: {
    plugins: true,
    fleet: true,
  },
};
