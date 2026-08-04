/**
 * Scaffold d'une app marque Client+Serveur consommant @creezio/*.
 *
 * Mode classique (`--name/--id/--domain`) : OS shell + slot métier vide.
 * Mode `--from-prd` : ProductModel → schéma / API / UI / nav / wiring / smokes.
 */

import fs from "node:fs";
import path from "node:path";
import {
  type AppManifest,
  buildElectronBuilderConfig,
  createAppManifest,
  renderNsisInstallerInclude,
  validateAppManifest,
} from "@creezio/brand-config";
import { MINIMAL_PNG_BASE64 } from "./minimal-png.js";
import type { ProductModel } from "./product-model.js";
import { writeFromPrdArtifacts } from "./scaffold-from-prd.js";
import { writeAppFile } from "./write-app-file.js";
import {
  serverDockerNpmScripts,
  renderCreezioCliProxyMjs,
} from "./generators/server-docker-scripts.js";

export type NewAppOptions = {
  brandId: string;
  productName: string;
  domain: string;
  outDir: string;
  envPrefix?: string;
  feedToken?: string;
  sandbox?: boolean;
  force?: boolean;
  kitRoot?: string;
  /**
   * Dossier d'icônes marque (`client.png`, `server.png`, optionnel `tray-icon.png`).
   * Sinon : `brand-spec/icons/` sous outDir / à côté, sinon placeholder minimal.
   */
  iconsDir?: string;
  /** Présent si `creezio new-app --from-prd` */
  productModel?: ProductModel;
  /** URL serveur pré-provisionnée dans le picker client join-only. */
  defaultServerUrl?: string;
};

export type ScaffoldResult = {
  outDir: string;
  manifest: AppManifest;
  writtenFiles: string[];
  productModel?: ProductModel;
};

function writeFile(
  filePath: string,
  content: string | Buffer,
  force: boolean,
  written: string[],
): void {
  writeAppFile(filePath, content, force, written);
}

function exportName(m: AppManifest): string {
  const id = m.brandId.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
  return `${id}Manifest`;
}

/** Sérialise un AppManifest en module TS exporté. */
export function renderManifestTs(
  manifest: AppManifest,
  name: string,
): string {
  const body = JSON.stringify(manifest, null, 2);
  return `import type { AppManifest } from "@creezio/brand-config";

/**
 * AppManifest généré par \`creezio new-app\` (Phase D).
 * Ne pas recycler les GUID / feeds des marques prod.
 */
export const ${name}: AppManifest = ${body} as AppManifest;
`;
}

function renderPackageJson(m: AppManifest): string {
  return (
    JSON.stringify(
      {
        name: `@creezio/app-${m.brandId}`,
        private: true,
        version: "0.1.0",
        description: `${m.client.productName} — squelette desktop Client+Serveur (kit Creezio)`,
        type: "module",
        main: "./build/electron/main.js",
        scripts: {
          build: "npm run build:runtime",
          // build:runtime = TS main+preload (alias historique build:electron).
          "build:runtime":
            "tsc -p tsconfig.electron.json && tsc -p tsconfig.preload.json",
          "build:electron": "npm run build:runtime",
          typecheck: "tsc -p tsconfig.electron.json --noEmit",
          "electron:config:client":
            "node scripts/build-builder-config.mjs client",
          "electron:config:server":
            "node scripts/build-builder-config.mjs server",
          "electron:stage-win-bins":
            "bash node_modules/@creezio/desktop-tooling/scripts/stage-win-bins.sh",
          "pack:win":
            "npm run electron:config:client && npm run build:electron && CSC_IDENTITY_AUTO_DISCOVERY=false electron-builder --config electron-builder.client.json --win nsis --x64 -c.win.signAndEditExecutable=false",
          "pack:win:server":
            "npm run electron:stage-win-bins && npm run electron:config:server && npm run build:electron && CSC_IDENTITY_AUTO_DISCOVERY=false electron-builder --config electron-builder.server.json --win nsis --x64 -c.win.signAndEditExecutable=false",
          "pack:linux":
            "node node_modules/@creezio/desktop-tooling/scripts/ensure-linux-icons.mjs && npm run electron:config:client && npm run build:electron && electron-builder --config electron-builder.client.json --linux AppImage dir --x64",
          "pack:linux:server":
            "node node_modules/@creezio/desktop-tooling/scripts/ensure-linux-icons.mjs && npm run electron:ensure-linux-native && npm run electron:config:server && npm run build:electron && electron-builder --config electron-builder.server.json --linux AppImage dir --x64",
          "electron:publish": `CREEZIO_BRAND=${m.brandId} bash node_modules/@creezio/desktop-tooling/scripts/publish-desktop.sh`,
          "electron:publish:linux": `CREEZIO_BRAND=${m.brandId} bash node_modules/@creezio/desktop-tooling/scripts/publish-desktop.sh --platform=linux`,
          "electron:publish:dry": `CREEZIO_BRAND=${m.brandId} bash node_modules/@creezio/desktop-tooling/scripts/publish-desktop.sh --dry-run`,
          "electron:remote-build": `CREEZIO_BRAND=${m.brandId} bash ../../packages/desktop-tooling/scripts/remote-build-win.sh`,
          "electron:remote-build:dry": `CREEZIO_BRAND=${m.brandId} bash ../../packages/desktop-tooling/scripts/remote-build-win.sh --dry-run`,
          // Serveur Docker headless — architecture par défaut (kit SoT).
          ...serverDockerNpmScripts(),
        },
        dependencies: {
          "@creezio/app-runtime": "0.1.0",
          "@creezio/brand-config": "0.1.0",
          "@creezio/shell": "0.1.0",
          "@creezio/platform-core": "0.1.0",
          "@creezio/product-hub": "0.1.0",
          "@creezio/shell-ui": "0.1.0",
          "@creezio/api-kernel": "0.1.0",
          "@creezio/mcp-facade": "0.1.0",
          "@creezio/auth": "0.1.0",
          "@creezio/electron-shell": "0.1.0",
          "@creezio/desktop-tooling": "0.1.0",
          "electron-updater": "^6.3.9",
          // Deps npm runtime main (asar FileSets kit) — pas seulement transitifs
          "hono": "^4.12.30",
          "zod": "^4.0.0",
          "jose": "^6.0.0",
          "better-sqlite3": "^12.11.1",
        },
        devDependencies: {
          "@types/node": "^22.15.3",
          // Requis par build:electron (types preload) même en flux Docker-only.
          electron: "35.7.5",
          "electron-builder": "^25.1.8",
          typescript: "^5.8.3",
        },
        peerDependencies: {
          electron: ">=28",
        },
        peerDependenciesMeta: {
          electron: { optional: true },
        },
        license: "UNLICENSED",
      },
      null,
      2,
    ) + "\n"
  );
}

function renderTsconfigBase(): string {
  // Copie locale — l’app générée doit compiler hors monorepo (/tmp smokes, extraction).
  return `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "lib": ["ES2022"],
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": false
  }
}
`;
}

function renderTsconfigElectron(): string {
  return `{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "outDir": "build/electron",
    "rootDir": "src/electron",
    "lib": ["ES2022", "DOM"],
    "types": ["node"],
    "skipLibCheck": true
  },
  "include": ["src/electron/**/*.ts", "src/electron/**/*.d.ts"],
  "exclude": ["src/electron/preload.ts"]
}
`;
}

/** Preload sandbox Electron = CommonJS (pas ESM). */
function renderTsconfigPreload(): string {
  return `{
  "extends": "./tsconfig.base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "Node",
    "outDir": "build/electron",
    "rootDir": "src/electron",
    "lib": ["ES2022", "DOM"],
    "types": ["node"],
    "skipLibCheck": true,
    "declaration": false,
    "declarationMap": false
  },
  "include": ["src/electron/preload.ts"]
}
`;
}

function renderElectronShimDts(): string {
  return `/**
 * Déclarations Electron minimales — compile sans installer le binaire.
 * Au runtime packagé, le vrai module \`electron\` est fourni par Electron.
 */
declare module "electron" {
  export const app: {
    requestSingleInstanceLock: () => boolean;
    whenReady: () => Promise<void>;
    quit: () => void;
    exit: (code?: number) => void;
    isPackaged: boolean;
    getPath: (name: string) => string;
    setPath: (name: string, p: string) => void;
    setName: (name: string) => void;
    setAppUserModelId: (id: string) => void;
    getVersion: () => string;
    on: (event: string, listener: (...args: unknown[]) => void) => void;
  };

  export class BrowserWindow {
    constructor(opts: Record<string, unknown>);
    loadFile(filePath: string): Promise<void>;
    webContents: { send(channel: string, ...args: unknown[]): void };
  }

  export const contextBridge: {
    exposeInMainWorld: (apiKey: string, api: unknown) => void;
  };

  export const ipcMain: {
    handle: (
      channel: string,
      listener: (event: unknown, ...args: unknown[]) => unknown | Promise<unknown>,
    ) => void;
  };

  export const ipcRenderer: {
    invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
    send: (channel: string, ...args: unknown[]) => void;
    on: (
      channel: string,
      listener: (event: unknown, ...args: unknown[]) => void,
    ) => void;
    removeListener: (
      channel: string,
      listener: (...args: unknown[]) => void,
    ) => void;
  };
}

declare namespace NodeJS {
  interface Process {
    resourcesPath: string;
  }
}
`;
}

function renderElectronBuilderBase(m: AppManifest): string {
  return (
    JSON.stringify(
      {
        appId: m.client.appId,
        productName: m.client.productName,
        copyright: m.copyright,
        directories: {
          output: "dist-electron",
          buildResources: "resources",
        },
        // Parité TF2 : exclure node_modules (sinon bins kit + deps → asar ~450 Mo).
        // @creezio/* runtime ré-inclus via buildElectronBuilderConfig (vendor/).
        files: [
          "build/electron/**/*",
          "package.json",
          "!node_modules/**/*",
          "node_modules/electron-updater/**/*",
          "node_modules/builder-util-runtime/**/*",
          "node_modules/fs-extra/**/*",
          "node_modules/jsonfile/**/*",
          "node_modules/universalify/**/*",
          "node_modules/graceful-fs/**/*",
          "node_modules/js-yaml/**/*",
          "node_modules/argparse/**/*",
          "node_modules/semver/**/*",
          "node_modules/lazy-val/**/*",
          "node_modules/lodash.escaperegexp/**/*",
          "node_modules/lodash.isequal/**/*",
          "node_modules/tiny-typed-emitter/**/*",
          "node_modules/debug/**/*",
          "node_modules/ms/**/*",
          "node_modules/sax/**/*",
        ],
        extraResources: [
          {
            from: "build/electron",
            to: "build/electron",
            filter: ["**/*"],
          },
          {
            from: "resources/renderer",
            to: "renderer",
          },
        ],
        asar: true,
        nsis: {
          oneClick: false,
          allowToChangeInstallationDirectory: true,
          include: "installer.nsh",
        },
        win: {
          target: [{ target: "nsis", arch: ["x64"] }],
        },
      },
      null,
      2,
    ) + "\n"
  );
}

function renderBuildBuilderConfigMjs(brandId: string): string {
  return `#!/usr/bin/env node
/**
 * Génère electron-builder.client.json / .server.json via buildElectronBuilderConfig.
 * Préfère le registre kit ; sinon lit src/electron/app-manifest.ts via JSON export.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildElectronBuilderConfig,
  getManifest,
  listBrandIds,
  renderNsisInstallerInclude,
} from "@creezio/brand-config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const kind = process.argv[2] === "server" ? "server" : "client";
const brandId = process.env.CREEZIO_BRAND || "${brandId}";

let manifest;
if (listBrandIds().includes(brandId)) {
  manifest = getManifest(brandId);
} else {
  const genPath = path.join(root, "src/electron/app-manifest.json");
  if (!fs.existsSync(genPath)) {
    throw new Error(\`Manifest introuvable pour \${brandId} (registre + app-manifest.json)\`);
  }
  manifest = JSON.parse(fs.readFileSync(genPath, "utf8"));
}

const base = JSON.parse(
  fs.readFileSync(path.join(root, "electron-builder.base.json"), "utf8"),
);
const cfg = buildElectronBuilderConfig(manifest, kind, base);
const out = path.join(root, \`electron-builder.\${kind}.json\`);
fs.writeFileSync(out, JSON.stringify(cfg, null, 2) + "\\n");
console.log("wrote", out);

// Parité TF2 : options install (démarrage auto) + désinstall profonde.
const nsh = path.join(root, "installer.nsh");
fs.writeFileSync(nsh, renderNsisInstallerInclude(manifest));
console.log("wrote", nsh);
`;
}

function renderInstallerNsh(m: AppManifest): string {
  return renderNsisInstallerInclude(m);
}

function renderBareBrandMigrationsTs(): string {
  return `/**
 * Migrations brand vides — squelette sans --from-prd.
 * Remplacées par le schéma métier lors d'un apply / --from-prd.
 */
import type { SqliteMigration } from "@creezio/platform-core";

export function brandMigrations(): SqliteMigration[] {
  return [];
}
`;
}

function renderBareBrandModuleApiTs(): string {
  return `/**
 * Mounts métier vides — squelette. OS natif via startBrandDesktop.
 */
import type { ApiKernel } from "@creezio/api-kernel";

export function registerBrandModuleApi(_api: ApiKernel): void {
  /* marque : monter /api/v1/modules/* ici */
}
`;
}

function renderBareBrandHarnessMjs(brandId: string): string {
  return `#!/usr/bin/env node
/**
 * Harness Node — façade @creezio/app-runtime (OS natif P&P).
 */
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { startBrandKernelHarness } from "@creezio/app-runtime";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.METIER_PORT || process.env.PORT || 18791);
const electron = path.join(root, "build/electron");

const manifestMod = await import(
  pathToFileURL(path.join(electron, "app-manifest.js")).href
);
const migMod = await import(
  pathToFileURL(path.join(electron, "brand-migrations.js")).href
);
const apiMod = await import(
  pathToFileURL(path.join(electron, "brand-module-api.js")).href
);

const manifestExport = Object.keys(manifestMod).find((k) =>
  k.endsWith("Manifest"),
);
if (!manifestExport) throw new Error("AppManifest introuvable");

await startBrandKernelHarness({
  brandId: ${JSON.stringify(brandId)},
  appRoot: root,
  port: PORT,
  manifest: manifestMod[manifestExport],
  brandMigrations: migMod.brandMigrations(),
  registerModuleApi: apiMod.registerBrandModuleApi,
});
`;
}

function renderMainTs(m: AppManifest): string {
  const name = exportName(m);
  return `/**
 * Main Electron — déclaration marque uniquement.
 * Orchestration OS = @creezio/app-runtime (P&P natif).
 * Opt-out shell : CREEZIO_DESKTOP_SHELL=window
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { app } from "electron";
import { startBrandDesktop } from "@creezio/app-runtime";
import { ${name} as manifest } from "./app-manifest.js";
import { verticalSlot } from "./vertical-slot.js";
import { brandMigrations } from "./brand-migrations.js";
import { registerBrandModuleApi } from "./brand-module-api.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

startBrandDesktop({
  manifest,
  electronDirname: __dirname,
  brandMigrations: brandMigrations(),
  registerModuleApi: registerBrandModuleApi,
  navItems: verticalSlot.items,
  desktopShell:
    process.env.CREEZIO_DESKTOP_SHELL === "window" ? "window" : "runtime",
}).catch((err) => {
  console.error(err);
  app.exit(1);
});
`;
}

function renderPreloadTs(m: AppManifest): string {
  return `/**
 * Preload — bridge desktop générique (pas d'API catalogue TF).
 *
 * Zéro import @creezio/* : ce fichier est copié hors asar (extraResources).
 * Le bridge name est figé au scaffold (manifest.bridgeName = ${JSON.stringify(m.bridgeName)}).
 */
import { contextBridge, ipcRenderer } from "electron";

const BRIDGE_NAME = ${JSON.stringify(m.bridgeName)};

/** Sous-ensemble générique — étendre localement selon la marque. */
const api = {
  isDesktop: true as const,
  getInfo: () => ipcRenderer.invoke("desktop:info"),
  getConnectionProfile: () => ipcRenderer.invoke("connection:get"),
  chooseConnection: (profile: unknown) =>
    ipcRenderer.invoke("connection:choose", profile),
  getSetupStatus: () => ipcRenderer.invoke("setup:status"),
  completeSetup: (payload: unknown) =>
    ipcRenderer.invoke("setup:complete", payload),
};

contextBridge.exposeInMainWorld(BRIDGE_NAME, api);
`;
}

function renderNavCoreTs(): string {
  return `/**
 * Navigation cœur plateforme — délègue à \`@creezio/shell-ui\`.
 * PAS de catalogue TempoFlow ni d'entrées métier marque.
 */
export type { CoreNavItem as NavItem } from "@creezio/shell-ui";
export { CORE_NAV_ITEMS, coreNavItems } from "@creezio/shell-ui";
`;
}

function brandPascal(brandId: string): string {
  return brandId
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
}

function renderProductHubStubTs(m: AppManifest): string {
  const manifestExport = exportName(m);
  const pascal = brandPascal(m.brandId);
  return `/**
 * Stub Product Hub sandbox — store mémoire + jetons marque.
 * Pas de SQLite / UI Admin (vertical Phase G).
 */

import {
  buildPluginImpactReport,
  createMemoryProductHubStore,
  productHubTokensFromManifest,
  type ProductHubStore,
} from "@creezio/product-hub";
import { ${manifestExport} as manifest } from "./app-manifest.js";

export const ${m.brandId.replace(/-/g, "")}ProductHubTokens =
  productHubTokensFromManifest(manifest);

let store: ProductHubStore | null = null;

export function get${pascal}ProductHubStore(): ProductHubStore {
  if (!store) {
    store = createMemoryProductHubStore({ conversationPrefix: "${m.brandId}" });
  }
  return store;
}

export function createDemoPluginRequest(input: {
  name: string;
  description?: string;
}) {
  const hub = get${pascal}ProductHubStore();
  const impact = buildPluginImpactReport({
    name: input.name,
    description: input.description || "",
    evidence: [],
  });
  return hub.createRequest({
    name: input.name,
    description: input.description,
    impact,
  });
}
`;
}

function renderVerticalSlotTs(m: AppManifest): string {
  const pascal = brandPascal(m.brandId);
  const tokensName = `${m.brandId.replace(/-/g, "")}ProductHubTokens`;
  return `/**
 * Slot métier vertical — ${m.client.productName}.
 * Nav brand via \`@creezio/shell-ui\` ; Product Hub stub ; domaine métier vide.
 */
import {
  createNavRegistry,
  type CoreNavItem,
  type NavRegistry,
} from "@creezio/shell-ui";
import {
  createDemoPluginRequest,
  ${tokensName},
  get${pascal}ProductHubStore,
} from "./product-hub-stub.js";

export type VerticalSlot = {
  /** Identifiant marque. */
  brandId: string;
  /** Entrées de nav métier (vide = squelette factory). */
  items: CoreNavItem[];
  /** Registre slots shell-ui. */
  nav: NavRegistry;
  /** Accès Product Hub sandbox. */
  productHub: {
    tokens: typeof ${tokensName};
    getStore: typeof get${pascal}ProductHubStore;
    createRequest: typeof createDemoPluginRequest;
  };
};

const nav = createNavRegistry();
nav.registerBrandNav([]);

export const verticalSlot: VerticalSlot = {
  brandId: "${m.brandId}",
  items: nav.getBrandNav(),
  nav,
  productHub: {
    tokens: ${tokensName},
    getStore: get${pascal}ProductHubStore,
    createRequest: createDemoPluginRequest,
  },
};
`;
}

function renderRendererHtml(m: AppManifest): string {
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' 'unsafe-inline'" />
    <title>${m.client.productName}</title>
    <style>
      :root { color-scheme: light; font-family: "Segoe UI", system-ui, sans-serif; }
      body { margin: 0; min-height: 100vh; background: linear-gradient(160deg, #e8f1f0, #f7f4ee 55%, #eef2f7); color: #1a2421; }
      main { max-width: 42rem; margin: 0 auto; padding: 3rem 1.5rem; }
      h1 { font-size: 2rem; letter-spacing: -0.02em; margin: 0 0 0.5rem; }
      p { line-height: 1.5; opacity: 0.85; }
      code { font-size: 0.9em; background: rgba(0,0,0,0.06); padding: 0.1em 0.35em; border-radius: 4px; }
      ul { padding-left: 1.2rem; }
    </style>
  </head>
  <body>
    <main>
      <h1>${m.client.productName}</h1>
      <p>Sandbox factory Creezio — squelette Client + Serveur (<code>${m.brandId}</code>).</p>
      <p>Nav cœur placeholder · slot métier vide · kit <code>@creezio/*</code>.</p>
      <ul>
        <li>bridge <code>${m.bridgeName}</code></li>
        <li>env <code>${m.envPrefix}_*</code></li>
        <li>deep-link <code>${m.deepLinkProtocol}://</code></li>
      </ul>
    </main>
  </body>
</html>
`;
}

function renderReadme(m: AppManifest): string {
  return `# ${m.client.productName}

Squelette desktop **Client + Serveur** généré par \`creezio new-app\` (Phase D).

## Identité

| Champ | Valeur |
|-------|--------|
| brandId | \`${m.brandId}\` |
| bridgeName | \`${m.bridgeName}\` |
| envPrefix | \`${m.envPrefix}\` |
| deepLink | \`${m.deepLinkProtocol}://\` |
| tunnel | \`*.${m.tunnelRootDomain}\` |
| client appId | \`${m.client.appId}\` |
| server appId | \`${m.server.appId}\` |
| client NSIS GUID | \`${m.client.nsisGuid}\` |
| server NSIS GUID | \`${m.server.nsisGuid}\` |
| feed client | \`${m.client.feedUrl}\` |
| feed server | \`${m.server.feedUrl}\` |
| sandbox | \`${Boolean(m.sandbox)}\` |

## Structure

\`\`\`
src/electron/
  app-manifest.ts       # AppManifest embarqué
  main.ts               # boot mince (@creezio/electron-shell)
  preload.ts            # bridge (@creezio/shell)
  nav-core.ts           # nav via @creezio/shell-ui
  vertical-slot.ts      # slots shell-ui + Product Hub stub
  product-hub-stub.ts   # store mémoire @creezio/product-hub
  (wiring H1)           # deps api-kernel / mcp-facade / auth
resources/
  icons/{client,server}.png
  renderer/index.html
scripts/build-builder-config.mjs
electron-builder.{base,client,server}.json
\`\`\`

## Build

\`\`\`bash
cd /opt/docker/creezio
npm install
npm run build -w @creezio/app-${m.brandId}
\`\`\`

Configs electron-builder :

\`\`\`bash
cd apps/${m.brandId}
npm run electron:config:client
npm run electron:config:server
\`\`\`

## Publish (sandbox — dry-run)

Les feeds sandbox sont **jetables** et distincts des feeds prod TF / Fidu / Certivan.
Tant que le vhost \`dl-${m.brandId}\` n'existe pas sur NPM, utiliser uniquement le dry-run :

\`\`\`bash
npm run desktop:resolve-config -- --brand=${m.brandId} --kind=client --pretty
npm run desktop:publish -- --brand=${m.brandId} --kind=client --dry-run --app-root /opt/docker/creezio/apps/${m.brandId}
\`\`\`

Ne **jamais** pointer \`dockerDlName\` / feedToken vers \`dl-tempoflow\`, \`dl-fidu\` ou \`dl-certivan\`.

## Suite (kit H6 / I*)

- Remplir \`vertical-slot.ts\` via \`registerBrandNav\` (\`brand.*\` only)
- Brancher demobrand-like : SqliteRuntime + auth/assistant/tasks/mails sqlite
- Control plane : \`startHostPluginControlPlane\` + \`createPluginControlPlaneAclFromStore\`
- Admin plugins L3 : helpers \`upsertPluginAclAdmin\`
- Voir \`docs/archive/FEATURE-PARITY-DEMOBRAND-H6.md\`
`;
}

/** PNG 1×1 = placeholder factory (à remplacer avant publish). */
const MINIMAL_PNG = Buffer.from(MINIMAL_PNG_BASE64, "base64");

function resolveIconsDir(outDir: string, iconsDir?: string): string | null {
  const candidates = [
    iconsDir,
    path.join(outDir, "brand-spec", "icons"),
    path.join(outDir, "resources", "brand-icons"),
  ].filter(Boolean) as string[];
  for (const dir of candidates) {
    const abs = path.resolve(dir);
    if (
      fs.existsSync(path.join(abs, "client.png")) ||
      fs.existsSync(path.join(abs, "server.png"))
    ) {
      return abs;
    }
  }
  return null;
}

function isSubstantialPng(filePath: string): boolean {
  try {
    const st = fs.statSync(filePath);
    if (st.size < 2000) return false;
    const buf = fs.readFileSync(filePath);
    if (buf.length < 24 || buf[0] !== 0x89) return false;
    return buf.readUInt32BE(16) >= 128;
  } catch {
    return false;
  }
}

/**
 * Pose client/server (+ tray) marque si fournis ; sinon conserve des PNG
 * déjà substantiels ; sinon placeholder minimal (ne pas publier tel quel).
 */
function writeBrandIcons(
  outDir: string,
  opts: NewAppOptions,
  force: boolean,
  written: string[],
): void {
  const iconsOut = path.join(outDir, "resources", "icons");
  fs.mkdirSync(iconsOut, { recursive: true });
  const srcDir = resolveIconsDir(outDir, opts.iconsDir);
  const names = ["client.png", "server.png"] as const;

  for (const name of names) {
    const dest = path.join(iconsOut, name);
    const fromSrc = srcDir ? path.join(srcDir, name) : "";
    if (fromSrc && fs.existsSync(fromSrc)) {
      fs.copyFileSync(fromSrc, dest);
      written.push(dest);
      continue;
    }
    if (isSubstantialPng(dest)) {
      // Ne pas écraser une icône marque déjà en place par le placeholder 1×1.
      continue;
    }
    writeFile(dest, MINIMAL_PNG, force, written);
  }

  const trayDest = path.join(outDir, "resources", "tray-icon.png");
  const trayCandidates = srcDir
    ? [
        path.join(srcDir, "tray-icon.png"),
        path.join(srcDir, "..", "tray-icon.png"),
      ]
    : [];
  for (const traySrc of trayCandidates) {
    if (fs.existsSync(traySrc)) {
      fs.copyFileSync(traySrc, trayDest);
      written.push(trayDest);
      break;
    }
  }
}

/**
 * Génère l'arborescence app + configs Client/Serveur.
 */
export function scaffoldNewApp(opts: NewAppOptions): ScaffoldResult {
  const manifest = createAppManifest({
    brandId: opts.brandId,
    productName: opts.productName,
    domain: opts.domain,
    envPrefix: opts.envPrefix,
    feedToken: opts.feedToken,
    sandbox: opts.sandbox !== false,
    defaultAppRoot: opts.outDir,
    defaultServerUrl: opts.defaultServerUrl,
  });

  const errors = validateAppManifest(manifest);
  if (errors.length) {
    throw new Error(`Manifest invalide:\n- ${errors.join("\n- ")}`);
  }

  const outDir = path.resolve(opts.outDir);
  const force = Boolean(opts.force);
  const written: string[] = [];
  const name = exportName(manifest);

  writeFile(
    path.join(outDir, "package.json"),
    renderPackageJson(manifest),
    force,
    written,
  );
  writeFile(
    path.join(outDir, "tsconfig.base.json"),
    renderTsconfigBase(),
    force,
    written,
  );
  writeFile(
    path.join(outDir, "tsconfig.electron.json"),
    renderTsconfigElectron(),
    force,
    written,
  );
  writeFile(
    path.join(outDir, "tsconfig.preload.json"),
    renderTsconfigPreload(),
    force,
    written,
  );
  writeFile(
    path.join(outDir, "electron-builder.base.json"),
    renderElectronBuilderBase(manifest),
    force,
    written,
  );
  writeFile(
    path.join(outDir, "installer.nsh"),
    renderInstallerNsh(manifest),
    force,
    written,
  );
  writeFile(
    path.join(outDir, "scripts/build-builder-config.mjs"),
    renderBuildBuilderConfigMjs(manifest.brandId),
    force,
    written,
  );
  writeFile(
    path.join(outDir, "src/electron/electron-shim.d.ts"),
    renderElectronShimDts(),
    force,
    written,
  );
  writeFile(
    path.join(outDir, "src/electron/app-manifest.ts"),
    renderManifestTs(manifest, name),
    force,
    written,
  );
  writeFile(
    path.join(outDir, "src/electron/app-manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
    force,
    written,
  );
  writeFile(
    path.join(outDir, "src/electron/brand-migrations.ts"),
    renderBareBrandMigrationsTs(),
    force,
    written,
  );
  writeFile(
    path.join(outDir, "src/electron/brand-module-api.ts"),
    renderBareBrandModuleApiTs(),
    force,
    written,
  );
  writeFile(
    path.join(outDir, "scripts/brand-kernel-harness.mjs"),
    renderBareBrandHarnessMjs(manifest.brandId),
    force,
    written,
  );
  writeFile(
    path.join(outDir, "scripts/creezio-cli.mjs"),
    renderCreezioCliProxyMjs(),
    force,
    written,
  );
  writeFile(
    path.join(outDir, "src/electron/main.ts"),
    renderMainTs(manifest),
    force,
    written,
  );
  writeFile(
    path.join(outDir, "src/electron/preload.ts"),
    renderPreloadTs(manifest),
    force,
    written,
  );
  writeFile(
    path.join(outDir, "src/electron/nav-core.ts"),
    renderNavCoreTs(),
    force,
    written,
  );
  writeFile(
    path.join(outDir, "src/electron/product-hub-stub.ts"),
    renderProductHubStubTs(manifest),
    force,
    written,
  );
  writeFile(
    path.join(outDir, "src/electron/vertical-slot.ts"),
    renderVerticalSlotTs(manifest),
    force,
    written,
  );
  writeFile(
    path.join(outDir, "resources/renderer/index.html"),
    renderRendererHtml(manifest),
    force,
    written,
  );
  writeBrandIcons(outDir, opts, force, written);
  writeFile(path.join(outDir, "README.md"), renderReadme(manifest), force, written);

  const base = JSON.parse(
    fs.readFileSync(path.join(outDir, "electron-builder.base.json"), "utf8"),
  );
  for (const kind of ["client", "server"] as const) {
    const cfg = buildElectronBuilderConfig(manifest, kind, base);
    writeFile(
      path.join(outDir, `electron-builder.${kind}.json`),
      JSON.stringify(cfg, null, 2) + "\n",
      force,
      written,
    );
  }

  if (opts.productModel) {
    writeFromPrdArtifacts({
      outDir,
      manifest,
      model: opts.productModel,
      force,
      written,
    });
  }

  return {
    outDir,
    manifest,
    writtenFiles: written,
    productModel: opts.productModel,
  };
}
