/**
 * Orchestration scaffold --from-prd.
 * Chemin natif OS : SQLite + api-kernel (pas de sidecar JSON métier).
 */
import fs from "node:fs";
import path from "node:path";
import type { AppManifest } from "@creezio/brand-config";
import { isChrModel, type ProductModel } from "./product-model.js";
import {
  renderBrandSchemaSql,
  renderBrandSchemaTs,
  renderMetierQueriesTs,
  renderNextHomePage,
  renderNextEntityPage,
  renderMetierRendererHtml,
  renderUiPackageJson,
  renderUiNextConfig,
  renderUiTsconfig,
  renderNextLayoutWithOsNav,
  renderMaterializeOsUiScript,
  renderVerticalSlotFromModel,
  renderPreloadFromPrdTs,
  renderBrandMigrationsTs,
  renderBrandModuleApiTs,
  renderBrandKernelHarnessMjs,
  renderMainFromPrdNativeTs,
  renderMeiliFeedTs,
  renderMetierParcoursSmoke,
  renderFirstRunAuthSmoke,
  renderSetupLoginSmoke,
  renderAllowlistSmoke,
  renderMiniPrdCoreSmoke,
  renderMeiliConfigSmoke,
} from "./generators/index.js";

import { writeAppFile, writeOsUiAppFile } from "./write-app-file.js";

function writeFile(
  filePath: string,
  content: string | Buffer,
  force: boolean,
  written: string[],
): void {
  writeAppFile(filePath, content, force, written);
}

function renderPackageJsonFromPrd(m: AppManifest, model: ProductModel): string {
  const chr = isChrModel(model);
  const scripts: Record<string, string> = {
    build: "npm run build:electron && npm run build:ui",
    "build:electron": "tsc -p tsconfig.electron.json",
    "build:ui": "npm run build --prefix ui",
    "os-ui:materialize": "node scripts/materialize-os-ui.mjs",
    typecheck: "tsc -p tsconfig.electron.json --noEmit",
    "metier:api": "npm run build:electron && node scripts/brand-kernel-harness.mjs",
    "test:metier-parcours": "node scripts/test-metier-parcours.mjs",
    "test:first-run-auth": "node scripts/test-first-run-auth.mjs",
    "test:setup-login": "node scripts/test-setup-login.mjs",
    "test:desktop-smoke-profile": "node scripts/test-desktop-smoke-profile.mjs",
    "test:allowlist": "node scripts/test-allowlist.mjs",
    "test:meili-config": "node scripts/test-meili-config.mjs",
    "electron:config:client": "node scripts/build-builder-config.mjs client",
    "electron:config:server": "node scripts/build-builder-config.mjs server",
    "electron:stage-win-bins":
      "bash node_modules/@creezio/desktop-tooling/scripts/stage-win-bins.sh",
    "pack:win":
      "npm run electron:config:client && npm run build:electron && CSC_IDENTITY_AUTO_DISCOVERY=false electron-builder --config electron-builder.client.json --win nsis --x64 -c.win.signAndEditExecutable=false",
    "pack:win:server":
      "npm run electron:stage-win-bins && npm run electron:config:server && npm run build:electron && CSC_IDENTITY_AUTO_DISCOVERY=false electron-builder --config electron-builder.server.json --win nsis --x64 -c.win.signAndEditExecutable=false",
    "electron:publish": `CREEZIO_BRAND=${m.brandId} bash ../../packages/desktop-tooling/scripts/publish-desktop.sh`,
    "electron:publish:dry": `CREEZIO_BRAND=${m.brandId} bash ../../packages/desktop-tooling/scripts/publish-desktop.sh --dry-run`,
    "desktop:dev": "npm run build:electron && electron .",
  };
  if (chr) {
    scripts["test:mini-prd-core"] = "node scripts/test-mini-prd-core.mjs";
    scripts.test =
      "npm run test:metier-parcours && npm run test:mini-prd-core && npm run test:first-run-auth && npm run test:setup-login && npm run test:allowlist && npm run test:meili-config && npm run test:desktop-smoke-profile";
  } else {
    scripts.test =
      "npm run test:metier-parcours && npm run test:first-run-auth && npm run test:setup-login && npm run test:allowlist && npm run test:meili-config && npm run test:desktop-smoke-profile";
  }

  return (
    JSON.stringify(
      {
        name: `@creezio/app-${m.brandId}`,
        private: true,
        version: "0.1.0",
        description: `${m.client.productName} — marque métier sur OS Creezio (api-kernel + SQLite)`,
        type: "module",
        main: "./build/electron/main.js",
        scripts,
        dependencies: {
          "@creezio/app-runtime": "0.1.0",
          "@creezio/brand-config": "0.1.0",
          "@creezio/shell": "0.1.0",
          "@creezio/platform-core": "0.1.0",
          "@creezio/product-hub": "0.1.0",
          "@creezio/os-ui": "0.1.0",
          "@creezio/shell-ui": "0.1.0",
          "@creezio/api-kernel": "0.1.0",
          "@creezio/mcp-facade": "0.1.0",
          "@creezio/auth": "0.1.0",
          "@creezio/onboarding": "0.1.0",
          "@creezio/electron-shell": "0.1.0",
          "@creezio/desktop-tooling": "0.1.0",
          "electron-updater": "^6.3.9",
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
        creezio: {
          fromPrd: true,
          nativeKernel: true,
          brandId: m.brandId,
          vertical: model.vertical || (chr ? "chr" : "generic"),
          entities: model.entities.map((e) => e.id),
          flows: model.flows.map((f) => f.id),
        },
        license: "UNLICENSED",
      },
      null,
      2,
    ) + "\n"
  );
}

function renderReadmeFromPrd(m: AppManifest, model: ProductModel): string {
  const chr = isChrModel(model);
  return `# ${m.client.productName}

Marque métier sur **OS Creezio** (\`creezio new-app --from-prd\`).

## Architecture

| Couche | Technologie |
|--------|-------------|
| OS | \`@creezio/api-kernel\` + \`createSqliteRuntime\` + session desktop |
| Métier | schema brand + mounts \`/api/v1/modules/*\` |
| Desktop | \`@creezio/app-runtime\` \`startBrandDesktop\` (main mince) |
| Smoke | \`scripts/brand-kernel-harness.mjs\` → \`startBrandKernelHarness\` |

**Interdit** : sidecar \`metier-api.mjs\` / \`store.json\` comme source de vérité.
**Interdit** : jumeau d'orchestration OS dans \`main.ts\` (utiliser la façade).

## Identité

| Champ | Valeur |
|-------|--------|
| brandId | \`${m.brandId}\` |
| entities | ${model.entities.map((e) => e.id).join(", ")} |
| vertical | \`${model.vertical || (chr ? "chr" : "generic")}\` |

## Tests

\`\`\`bash
npm test
npm run metier:api   # harness kernel natif
\`\`\`
`;
}

function renderGitignore(): string {
  return `node_modules/
ui/node_modules/
ui/.next/
build/
dist-electron/
.data-metier/
*.log
.DS_Store
# Surfaces OS matérialisées depuis @creezio/os-ui — jamais versionnées dans la marque
ui/app/(creezio-os)/
`;
}

function renderDesktopSmokeGeneric(model: ProductModel): string {
  return `#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const main = fs.readFileSync(path.join(root, "src/electron/main.ts"), "utf8");
assert.match(main, /startBrandDesktop/);
assert.match(main, /brandMigrations|registerModuleApi/);
assert.match(main, /@creezio\\/app-runtime/);
assert.doesNotMatch(main, /spawnBrandMetierApi|listenBrandKernelHttp|prepareDesktopBoot|bootBrandKernel|brand-runtime/);
assert.ok(!fs.existsSync(path.join(root, "src/lib/host-stack.ts")), "glue OS host-stack interdit");
assert.ok(!fs.existsSync(path.join(root, "src/electron/brand-runtime.ts")), "brand-runtime interdit");
assert.ok(!fs.existsSync(path.join(root, "src/electron/product-hub-stub.ts")), "product-hub-stub interdit");
const harness = fs.readFileSync(
  path.join(root, "scripts/brand-kernel-harness.mjs"),
  "utf8",
);
assert.match(harness, /startBrandKernelHarness/);
assert.match(harness, /brandMigrations|registerModuleApi/);
const renderer = fs.readFileSync(
  path.join(root, "resources/renderer/index.html"),
  "utf8",
);
assert.match(renderer, /modules\\/search|global-search/);
assert.match(renderer, /metierBaseUrl|creezioDesktop/);
console.log("OK test:desktop-smoke-profile (${model.brandId} native)");
`;
}

export function writeFromPrdArtifacts(opts: {
  outDir: string;
  manifest: AppManifest;
  model: ProductModel;
  force: boolean;
  written: string[];
}): void {
  const { outDir, manifest, model, force, written } = opts;
  const chr = isChrModel(model);

  // Purge glue OS / stubs / sidecar — marque = métier + déclaration.
  if (force) {
    for (const rel of [
      "scripts/metier-api.mjs",
      "src/lib/brand-module-api.ts",
      "src/lib/paths.ts",
      "src/lib/connection-profile.ts",
      "src/lib/tunnel-service-urls.ts",
      "src/lib/creezio-boot.ts",
      "src/lib/host-stack.ts",
      "src/lib/desktop-presence.ts",
      "src/electron/brand-runtime.ts",
      "src/electron/product-hub-stub.ts",
      "src/electron/nav-core.ts",
      "scripts/test-oracle-mvp.mjs",
    ]) {
      const p = path.join(outDir, rel);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
    // src/lib vide après purge
    const libDir = path.join(outDir, "src/lib");
    if (fs.existsSync(libDir) && fs.readdirSync(libDir).length === 0) {
      fs.rmdirSync(libDir);
    }
  }

  writeFile(
    path.join(outDir, "product-model.json"),
    JSON.stringify(model, null, 2) + "\n",
    force,
    written,
  );
  writeFile(
    path.join(outDir, "package.json"),
    renderPackageJsonFromPrd(manifest, model),
    force,
    written,
  );
  writeFile(path.join(outDir, ".gitignore"), renderGitignore(), force, written);

  writeFile(
    path.join(outDir, "crm/src/brand/schema.ts"),
    renderBrandSchemaTs(model),
    force,
    written,
  );
  writeFile(
    path.join(outDir, "crm/src/brand/schema.sql"),
    renderBrandSchemaSql(model),
    force,
    written,
  );
  writeFile(
    path.join(outDir, "crm/src/lib/metier-queries.ts"),
    renderMetierQueriesTs(model),
    force,
    written,
  );

  writeFile(
    path.join(outDir, "scripts/brand-kernel-harness.mjs"),
    renderBrandKernelHarnessMjs(model),
    force,
    written,
  );
  writeFile(
    path.join(outDir, "scripts/test-metier-parcours.mjs"),
    renderMetierParcoursSmoke(model),
    force,
    written,
  );
  writeFile(
    path.join(outDir, "scripts/test-first-run-auth.mjs"),
    renderFirstRunAuthSmoke(model),
    force,
    written,
  );
  writeFile(
    path.join(outDir, "scripts/test-setup-login.mjs"),
    renderSetupLoginSmoke(model),
    force,
    written,
  );
  writeFile(
    path.join(outDir, "scripts/test-desktop-smoke-profile.mjs"),
    renderDesktopSmokeGeneric(model),
    force,
    written,
  );
  writeFile(
    path.join(outDir, "scripts/test-allowlist.mjs"),
    renderAllowlistSmoke(model),
    force,
    written,
  );
  if (chr) {
    writeFile(
      path.join(outDir, "scripts/test-mini-prd-core.mjs"),
      renderMiniPrdCoreSmoke(model),
      force,
      written,
    );
  }

  // Infra UI OS (deps kit + boot) — écrasable même si marque a pollué.
  writeOsUiAppFile(
    path.join(outDir, "ui/package.json"),
    renderUiPackageJson(manifest),
    written,
  );
  writeOsUiAppFile(
    path.join(outDir, "ui/next.config.mjs"),
    renderUiNextConfig(),
    written,
  );
  writeOsUiAppFile(
    path.join(outDir, "ui/tsconfig.json"),
    renderUiTsconfig(),
    written,
  );
  writeOsUiAppFile(
    path.join(outDir, "ui/app/layout.tsx"),
    renderNextLayoutWithOsNav(model),
    written,
  );
  writeFile(
    path.join(outDir, "ui/app/page.tsx"),
    renderNextHomePage(model),
    force,
    written,
  );
  for (const page of model.pages) {
    const seg = page.path.replace(/^\//, "") || page.id;
    writeFile(
      path.join(outDir, `ui/app/${seg}/page.tsx`),
      renderNextEntityPage(model, page.id),
      force,
      written,
    );
  }
  // Surfaces OS = @creezio/os-ui (matérialisées hors git). Pas de dossier OS versionné.
  writeFile(
    path.join(outDir, "scripts/materialize-os-ui.mjs"),
    renderMaterializeOsUiScript(),
    force,
    written,
  );

  writeFile(
    path.join(outDir, "resources/renderer/index.html"),
    renderMetierRendererHtml(model).replaceAll(
      "/api/v1/brand/",
      "/api/v1/modules/",
    ),
    force,
    written,
  );

  writeFile(
    path.join(outDir, "src/electron/vertical-slot.ts"),
    renderVerticalSlotFromModel(model),
    force,
    written,
  );
  writeFile(
    path.join(outDir, "src/electron/brand-migrations.ts"),
    renderBrandMigrationsTs(model),
    force,
    written,
  );
  writeFile(
    path.join(outDir, "src/electron/brand-module-api.ts"),
    renderBrandModuleApiTs(model),
    force,
    written,
  );
  writeFile(
    path.join(outDir, "src/electron/meili-feed.ts"),
    renderMeiliFeedTs(model),
    force,
    written,
  );
  writeFile(
    path.join(outDir, "scripts/test-meili-config.mjs"),
    renderMeiliConfigSmoke(model),
    force,
    written,
  );
  writeFile(
    path.join(outDir, "src/electron/main.ts"),
    renderMainFromPrdNativeTs(manifest, model),
    force,
    written,
  );
  writeFile(
    path.join(outDir, "src/electron/preload.ts"),
    renderPreloadFromPrdTs(manifest),
    force,
    written,
  );

  writeFile(
    path.join(outDir, "README.md"),
    renderReadmeFromPrd(manifest, model),
    force,
    written,
  );

  writeFile(
    path.join(outDir, "AGENTS.md"),
    `# AGENTS — ${manifest.client.productName}

Marque légère sur **OS Creezio**.

- Desktop = \`startBrandDesktop\` (@creezio/app-runtime)
- Déclaration = migrations + \`registerModuleApi\` + feed + nav métier
- API métier = \`/api/v1/modules/*\`
- UI OS (\`/mails\`, \`/taches\`, \`/setup\`, \`/login\`, MCP, admin…) =
  **wrappers** \`@creezio/*/ui\` générés factory — **ne pas** réécrire ni marquer
  \`owned-by-brand\`
- **Interdit** : glue OS (\`src/lib/*\`, \`brand-runtime\`), sidecar JSON,
  fetch maison vers \`/api/v1/os/*\` dans \`ui/app\`

\`\`\`bash
npm test
npm run metier:api
\`\`\`
`,
    force,
    written,
  );
}
