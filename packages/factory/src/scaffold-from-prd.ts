/**
 * Orchestration scaffold --from-prd (F1–F4).
 *
 * Génère OS + CRUD générique depuis ProductModel.
 * Pas de templates métier TempoFlow / CHR riches (anti-triche évaluation).
 */
import fs from "node:fs";
import path from "node:path";
import type { AppManifest } from "@creezio/brand-config";
import { isChrModel, type ProductModel } from "./product-model.js";
import {
  renderBrandSchemaSql,
  renderBrandSchemaTs,
  renderMetierApiMjs,
  renderMetierQueriesTs,
  renderNextLayoutTsx,
  renderNextHomePage,
  renderNextEntityPage,
  renderMetierRendererHtml,
  renderVerticalSlotFromModel,
  renderPathsTs,
  renderConnectionProfileTs,
  renderTunnelServiceUrlsTs,
  renderBrandModuleApiTs,
  renderCreezioBootTs,
  renderHostStackBindingsTs,
  renderDesktopPresenceTs,
  renderMainFromPrdTs,
  renderPreloadFromPrdTs,
  renderMetierParcoursSmoke,
  renderFirstRunAuthSmoke,
  renderSetupLoginSmoke,
  renderAllowlistSmoke,
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
    "metier:api": "node scripts/metier-api.mjs",
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
    test:
      "npm run test:metier-parcours && npm run test:first-run-auth && npm run test:setup-login && npm run test:allowlist && npm run test:desktop-smoke-profile",
  };

  return (
    JSON.stringify(
      {
        name: `@creezio/app-${m.brandId}`,
        private: true,
        version: "0.1.0",
        description: `${m.client.productName} — app métier générée depuis PRD (kit Creezio)`,
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

Application métier bootstrapée par \`creezio new-app --from-prd\`
(${chr ? "cœur achats générique" : "métier générique"}).

## Identité

| Champ | Valeur |
|-------|--------|
| brandId | \`${m.brandId}\` |
| tagline | ${model.tagline} |
| vertical | \`${model.vertical || (chr ? "chr" : "generic")}\` |
| entities | ${model.entities.map((e) => e.id).join(", ")} |
| sandbox | \`${Boolean(m.sandbox)}\` |

## Tests

\`\`\`bash
npm test
npm run metier:api
\`\`\`

## Plateforme vs métier

- **OS** : \`@creezio/*\` (\`createDesktopSessionStore\`, boot, host-stack…).
- **Bootstrap factory** : CRUD générique depuis ProductModel — pas un clone produit.
- **Modules riches** : écrits dans ce repo à partir des mini-PRDs / brief, pas via templates TempoFlow.
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
assert.match(hostStack, /pluginsFeatureOff:\\s*true/);
const main = fs.readFileSync(path.join(root, "src/electron/main.ts"), "utf8");
assert.match(main, /prepareDesktopBoot/);
assert.match(main, /installBrandDesktopRuntime/);
assert.match(main, /createDesktopSessionStore/);
assert.match(main, /registerDesktopSessionIpc/);
console.log("OK test:desktop-smoke-profile (${model.brandId})");
`;
}

/**
 * Écrit les artefacts --from-prd (générateurs génériques uniquement).
 */
export function writeFromPrdArtifacts(opts: {
  outDir: string;
  manifest: AppManifest;
  model: ProductModel;
  force: boolean;
  written: string[];
}): void {
  const { outDir, manifest, model, force, written } = opts;

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
    path.join(outDir, "scripts/metier-api.mjs"),
    renderMetierApiMjs(model),
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
    renderMetierRendererHtml(model),
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
    path.join(outDir, "src/electron/main.ts"),
    renderMainFromPrdTs(manifest, model),
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
  writeFile(
    path.join(outDir, "src/lib/brand-module-api.ts"),
    renderBrandModuleApiTs(model),
    force,
    written,
  );
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

Marque légère bootstrapée via \`creezio new-app --from-prd\`.

- **OS** = \`@creezio/*\` (\`createDesktopSessionStore\`).
- **Bootstrap** = CRUD générique ProductModel (pas un template produit).
- **Modules** = écrits ici depuis les mini-PRDs / brief — ne pas importer
  de clone TempoFlow ni de templates métier riches du kit.

\`\`\`bash
npm test
npm run metier:api
\`\`\`
`,
    force,
    written,
  );
}
