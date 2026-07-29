import type { AppManifest } from "../types.js";

/**
 * Manifest Certivan — extrait de /opt/docker/certivan-app (lecture seule)
 * (crm/electron-builder.yml, scripts/electron/build-builder-config.mjs,
 * electron/app-kind.ts, electron/paths.ts, electron/preload-app.ts).
 *
 * GUIDs = UUID.v5(appId, OID) hardcodés dans build-builder-config.mjs.
 */
export const certivanManifest: AppManifest = {
  brandId: "certivan",
  envPrefix: "CERTIVAN",
  bridgeName: "certivanDesktop",
  dbFileName: "certivan.db",
  localConfigFileName: "certivan-config.json",
  deepLinkProtocol: "certivan",
  sessionPartition: "certivan-app",
  logBasename: "certivan-main",
  tunnelRootDomain: "certivan.creez.io",
  domains: {
    primary: "certivan.creez.io",
    feedHost: "certivan.creez.io",
  },
  copyright: "© Certivan",
  client: {
    appId: "fr.certivan.desktop",
    productName: "Certivan",
    executableName: "Certivan",
    artifactName: "Certivan-Setup-${version}.${ext}",
    packageName: "certivan-crm",
    userDataSegment: "certivan-crm",
    feedUrl:
      "https://certivan.creez.io/dl-3c94d486b0efa7618fad5bdfff410c49/",
    nsisGuid: "7e7e4fec-5ff5-5997-a23a-1e5054bed061",
    appUserModelId: "fr.certivan.desktop",
  },
  server: {
    appId: "fr.certivan.desktop.server",
    productName: "Certivan Server",
    executableName: "Certivan-Server",
    artifactName: "Certivan-Server-Setup-${version}.${ext}",
    packageName: "certivan-crm-server",
    userDataSegment: "Certivan Server",
    feedUrl:
      "https://certivan.creez.io/dl-3c94d486b0efa7618fad5bdfff410c49/server/",
    nsisGuid: "793d6100-6458-5e93-80b2-7c3221147975",
    appUserModelId: "fr.certivan.desktop.server",
  },
  publish: {
    dockerDlName: "dl-certivan",
    hostDlDirDefault:
      "/var/lib/docker/volumes/nginx-proxy-manager_npm_data/_data/dl-certivan",
    npmContainer: "nginx-proxy-manager",
    remoteBuildHost: "deploy@104.168.10.36",
    remoteBuildRoot: "/opt/docker/certivan-build",
    remoteBinSrc: "/opt/docker/tempoflow2/crm",
    statusFile: "/tmp/certivan-build-status.json",
    remoteLogPrefix: "certivan-remote-build",
    buildServerArtifact: true,
    legacyClientAlias: "Certivan-Setup-0.1.0.exe",
    defaultAppRoot: "/opt/docker/certivan-app/crm",
  },
};
