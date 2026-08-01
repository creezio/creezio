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
  renderNextLayoutTsx,
  renderNextHomePage,
  renderNextEntityPage,
  renderMetierRendererHtml,
  renderVerticalSlotFromModel,
  renderPathsTs,
  renderConnectionProfileTs,
  renderTunnelServiceUrlsTs,
  renderCreezioBootTs,
  renderHostStackBindingsTs,
  renderDesktopPresenceTs,
  renderPreloadFromPrdTs,
  renderBrandMigrationsTs,
  renderBrandModuleApiTs,
  renderBrandRuntimeTs,
  renderBrandKernelHarnessMjs,
  renderMainFromPrdNativeTs,
  renderMetierParcoursSmoke,
  renderFirstRunAuthSmoke,
  renderSetupLoginSmoke,
  renderAllowlistSmoke,
  renderMiniPrdCoreSmoke,
} from "./generators/index.js";

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

function renderPackageJsonFromPrd(m: AppManifest, model: ProductModel): string {
  const chr = isChrModel(model);
  const scripts: Record<string, string> = {
    build: "npm run build:electron",
    "build:electron": "tsc -p tsconfig.electron.json",
    typecheck: "tsc -p tsconfig.electron.json --noEmit",
    "metier:api": "npm run build:electron && node scripts/brand-kernel-harness.mjs",
    "test:metier-parcours": "node scripts/test-metier-parcours.mjs",
    "test:first-run-auth": "node scripts/test-first-run-auth.mjs",
    "test:setup-login": "node scripts/test-setup-login.mjs",
    "test:desktop-smoke-profile": "node scripts/test-desktop-smoke-profile.mjs",
    "test:allowlist": "node scripts/test-allowlist.mjs",
    "electron:config:client": "node scripts/build-builder-config.mjs client",
    "electron:config:server": "node scripts/build-builder-config.mjs server",
    "electron:publish": `CREEZIO_BRAND=${m.brandId} bash ../../packages/desktop-tooling/scripts/publish-desktop.sh`,
    "electron:publish:dry": `CREEZIO_BRAND=${m.brandId} bash ../../packages/desktop-tooling/scripts/publish-desktop.sh --dry-run`,
    "desktop:dev": "npm run build:electron && electron .",
  };
  if (chr) {
    scripts["test:mini-prd-core"] = "node scripts/test-mini-prd-core.mjs";
    scripts.test =
      "npm run test:metier-parcours && npm run test:mini-prd-core && npm run test:first-run-auth && npm run test:setup-login && npm run test:allowlist && npm run test:desktop-smoke-profile";
  } else {
    scripts.test =
      "npm run test:metier-parcours && npm run test:first-run-auth && npm run test:setup-login && npm run test:allowlist && npm run test:desktop-smoke-profile";
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
          "@creezio/brand-config": "0.1.0",
          "@creezio/shell": "0.1.0",
          "@creezio/platform-core": "0.1.0",
          "@creezio/product-hub": "0.1.0",
          "@creezio/shell-ui": "0.1.0",
          "@creezio/api-kernel": "0.1.0",
          "@creezio/mcp-facade": "0.1.0",
          "@creezio/auth": "0.1.0",
          "@creezio/onboarding": "0.1.0",
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
| Smoke | \`scripts/brand-kernel-harness.mjs\` (même kernel, sans Electron) |

**Interdit** : sidecar \`metier-api.mjs\` / \`store.json\` comme source de vérité.

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
build/
dist-electron/
.data-metier/
*.log
.DS_Store
`;
}

function renderDesktopSmokeGeneric(model: ProductModel): string {
  return `#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const hostStack = fs.readFileSync(path.join(root, "src/lib/host-stack.ts"), "utf8");
assert.match(hostStack, /createBrandHostStack/);
const main = fs.readFileSync(path.join(root, "src/electron/main.ts"), "utf8");
assert.match(main, /prepareDesktopBoot/);
assert.match(main, /bootBrandKernel/);
assert.match(main, /createDesktopSessionStore/);
const runtime = fs.readFileSync(path.join(root, "src/electron/brand-runtime.ts"), "utf8");
assert.match(runtime, /createSqliteRuntime/);
assert.match(runtime, /createApiKernel/);
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

  // Purge legacy sidecar JSON si --force (chemin natif uniquement).
  if (force) {
    for (const rel of [
      "scripts/metier-api.mjs",
      "src/lib/brand-module-api.ts",
      "scripts/test-oracle-mvp.mjs",
    ]) {
      const p = path.join(outDir, rel);
      if (fs.existsSync(p)) fs.unlinkSync(p);
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

  writeFile(
    path.join(outDir, "ui/app/layout.tsx"),
    renderNextLayoutTsx(model),
    force,
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
    path.join(outDir, "src/electron/brand-runtime.ts"),
    renderBrandRuntimeTs(manifest, model),
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
    path.join(outDir, "src/lib/paths.ts"),
    renderPathsTs(manifest),
    force,
    written,
  );
  writeFile(
    path.join(outDir, "src/lib/connection-profile.ts"),
    renderConnectionProfileTs(manifest),
    force,
    written,
  );
  writeFile(
    path.join(outDir, "src/lib/tunnel-service-urls.ts"),
    renderTunnelServiceUrlsTs(manifest),
    force,
    written,
  );
  // Plus de brand-module-api stub dans src/lib — mounts = src/electron
  writeFile(
    path.join(outDir, "src/lib/creezio-boot.ts"),
    renderCreezioBootTs(manifest),
    force,
    written,
  );
  writeFile(
    path.join(outDir, "src/lib/host-stack.ts"),
    renderHostStackBindingsTs(manifest),
    force,
    written,
  );
  writeFile(
    path.join(outDir, "src/lib/desktop-presence.ts"),
    renderDesktopPresenceTs(manifest),
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

- Runtime = \`bootBrandKernel\` (SQLite + api-kernel)
- API métier = \`/api/v1/modules/*\`
- Session = \`createDesktopSessionStore\`
- **Interdit** : \`metier-api.mjs\`, \`store.json\`, launchers OS recopiés

\`\`\`bash
npm test
npm run metier:api
\`\`\`
`,
    force,
    written,
  );
}
