/**
 * Scaffold d'une app marque Client+Serveur consommant @creezio/*.
 * Pas de catalogue TempoFlow — nav core placeholder + slot métier vide.
 */

import fs from "node:fs";
import path from "node:path";
import {
  type AppManifest,
  buildElectronBuilderConfig,
  createAppManifest,
  validateAppManifest,
} from "@creezio/brand-config";
import { MINIMAL_PNG_BASE64 } from "./minimal-png.js";

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
};

export type ScaffoldResult = {
  outDir: string;
  manifest: AppManifest;
  writtenFiles: string[];
};

function writeFile(
  filePath: string,
  content: string | Buffer,
  force: boolean,
  written: string[],
): void {
  if (fs.existsSync(filePath) && !force) {
    throw new Error(`Fichier existe déjà (utilisez --force): ${filePath}`);
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
  written.push(filePath);
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
          build: "npm run build:electron",
          "build:electron": "tsc -p tsconfig.electron.json",
          typecheck: "tsc -p tsconfig.electron.json --noEmit",
          "electron:config:client":
            "node scripts/build-builder-config.mjs client",
          "electron:config:server":
            "node scripts/build-builder-config.mjs server",
          "electron:publish": `CREEZIO_BRAND=${m.brandId} bash ../../packages/desktop-tooling/scripts/publish-desktop.sh`,
          "electron:publish:dry": `CREEZIO_BRAND=${m.brandId} bash ../../packages/desktop-tooling/scripts/publish-desktop.sh --dry-run`,
          "electron:remote-build": `CREEZIO_BRAND=${m.brandId} bash ../../packages/desktop-tooling/scripts/remote-build-win.sh`,
          "electron:remote-build:dry": `CREEZIO_BRAND=${m.brandId} bash ../../packages/desktop-tooling/scripts/remote-build-win.sh --dry-run`,
        },
        dependencies: {
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
        },
        devDependencies: {
          "@types/node": "^22.15.3",
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

function renderTsconfigElectron(): string {
  return `{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "build/electron",
    "rootDir": "src/electron",
    "lib": ["ES2022", "DOM"],
    "types": ["node"],
    "skipLibCheck": true
  },
  "include": ["src/electron/**/*.ts", "src/electron/**/*.d.ts"]
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
  };

  export class BrowserWindow {
    constructor(opts: Record<string, unknown>);
    loadFile(filePath: string): Promise<void>;
    webContents: { send(channel: string, ...args: unknown[]): void };
  }

  export const contextBridge: {
    exposeInMainWorld: (apiKey: string, api: unknown) => void;
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
        files: ["build/electron/**/*", "package.json"],
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
`;
}

function renderInstallerNsh(): string {
  return `; NSIS include généré — placeholder (custom macros marque).
!macro customInstall
!macroend
!macro customUnInstall
!macroend
`;
}

function renderMainTs(m: AppManifest): string {
  const name = exportName(m);
  return `/**
 * Main Electron mince — boot plateforme uniquement.
 * Le métier vit dans vertical-slot.ts (vide par défaut).
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow } from "electron";
import {
  initLogger,
  log,
  prepareDesktopBoot,
  writeAppKindFile,
} from "@creezio/electron-shell";
import { ${name} as manifest } from "./app-manifest.js";
import { createApiKernel } from "@creezio/api-kernel";
import { createMcpFacade } from "@creezio/mcp-facade";
import { createMemoryAuthStore } from "@creezio/auth";
import { mergeNav } from "@creezio/shell-ui";
import { coreNavItems } from "./nav-core.js";
import { verticalSlot } from "./vertical-slot.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main(): Promise<void> {
  const boot = await prepareDesktopBoot(manifest);
  initLogger(boot.userDataDir, manifest.logBasename);
  log("boot", \`kind=\${boot.appKind} product=\${manifest.client.productName}\`);

  writeAppKindFile(
    __dirname,
    boot.appKind === "legacy" ? "client" : boot.appKind,
  );

  // Wiring H1 — api-kernel + mcp-facade + auth (stores prêts, handlers à brancher).
  const api = createApiKernel({ brandId: manifest.brandId });
  const mcp = createMcpFacade({
    brandId: manifest.brandId,
    allowUnauthenticated: true,
    listApiMounts: () => api.listMounts(),
  });
  const auth = createMemoryAuthStore();
  const navItems = mergeNav(coreNavItems, verticalSlot.items);
  void mcp;
  void auth;

  const gotLock = app.requestSingleInstanceLock();
  if (!gotLock) {
    app.quit();
    return;
  }

  await app.whenReady();

  const win = new BrowserWindow({
    width: 1100,
    height: 720,
    title:
      boot.appKind === "server"
        ? manifest.server.productName
        : manifest.client.productName,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      partition: boot.sessionPartition,
    },
  });

  const renderer = app.isPackaged
    ? path.join(process.resourcesPath, "renderer", "index.html")
    : path.join(__dirname, "../../resources/renderer/index.html");
  await win.loadFile(renderer);

  log(
    "nav",
    \`core=\${coreNavItems.length} vertical=\${verticalSlot.items.length} merged=\${navItems.length} apiMounts=\${api.listMounts().length}\`,
  );
}

main().catch((err) => {
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

## Suite

- Remplir \`vertical-slot.ts\` + UI métier
- Brancher CRM Next + store SQLite Product Hub (Phase G)
- Control plane : \`startHostPluginControlPlane\` (@creezio/electron-shell)
`;
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
  });

  const errors = validateAppManifest(manifest);
  if (errors.length) {
    throw new Error(`Manifest invalide:\n- ${errors.join("\n- ")}`);
  }

  const outDir = path.resolve(opts.outDir);
  const force = Boolean(opts.force);
  const written: string[] = [];
  const png = Buffer.from(MINIMAL_PNG_BASE64, "base64");
  const name = exportName(manifest);

  writeFile(
    path.join(outDir, "package.json"),
    renderPackageJson(manifest),
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
    path.join(outDir, "electron-builder.base.json"),
    renderElectronBuilderBase(manifest),
    force,
    written,
  );
  writeFile(
    path.join(outDir, "installer.nsh"),
    renderInstallerNsh(),
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
  writeFile(
    path.join(outDir, "resources/icons/client.png"),
    png,
    force,
    written,
  );
  writeFile(
    path.join(outDir, "resources/icons/server.png"),
    png,
    force,
    written,
  );
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

  return { outDir, manifest, writtenFiles: written };
}
