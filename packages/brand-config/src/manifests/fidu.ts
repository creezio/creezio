import type { AppManifest } from "../types.js";

/**
 * Manifest Fidu — identité lue dans /opt/docker/fidu (lecture seule).
 *
 * Aujourd'hui Fidu publie un exe unique (`fr.fidu.desktop`, feed racine).
 * Le modèle kit impose quand même Client + Serveur : les champs `server`
 * sont la cible Phase B/G (mêmes conventions que TF2/Certivan).
 *
 * GUIDs : UUID.v5(appId, OID electron-builder) — pas encore hardcodés
 * dans un build-builder-config.mjs Fidu (pas de split packagé à ce jour).
 * Ne pas recycler les GUID TempoFlow / Certivan.
 */
export const fiduManifest: AppManifest = {
  brandId: "fidu",
  envPrefix: "FIDU",
  bridgeName: "fiduDesktop",
  dbFileName: "fidu.db",
  localConfigFileName: "fidu-config.json",
  domains: {
    primary: "fidu.creez.io",
    feedHost: "fidu.creez.io",
  },
  copyright: "© Fidu",
  client: {
    appId: "fr.fidu.desktop",
    productName: "Fidu",
    executableName: "Fidu",
    artifactName: "Fidu-Setup-${version}.${ext}",
    packageName: "fidu",
    userDataSegment: "fidu",
    feedUrl: "https://fidu.creez.io/dl-e660352fb04dbd5e2519f0e60897c548/",
    nsisGuid: "f124e69d-95f4-5dd2-b199-5b89c875649d",
    appUserModelId: "fr.fidu.desktop",
  },
  server: {
    appId: "fr.fidu.desktop.server",
    productName: "Fidu Server",
    executableName: "Fidu-Server",
    artifactName: "Fidu-Server-Setup-${version}.${ext}",
    packageName: "fidu-server",
    userDataSegment: "Fidu Server",
    feedUrl:
      "https://fidu.creez.io/dl-e660352fb04dbd5e2519f0e60897c548/server/",
    nsisGuid: "9a6b4565-45b5-5572-a867-74ab1954e3da",
    appUserModelId: "fr.fidu.desktop.server",
  },
};
