/**
 * Orchestration scaffold --from-prd (F1–F4).
 * Étend le squelette OS avec ProductModel → métier + wiring.
 */
import fs from "node:fs";
import path from "node:path";
import type { AppManifest } from "@creezio/brand-config";
import type { ProductModel } from "./product-model.js";
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
  renderMetierParcoursSmoke,
  renderFirstRunAuthSmoke,
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
  return (
    JSON.stringify(
      {
        name: `@creezio/app-${m.brandId}`,
        private: true,
        version: "0.1.0",
        description: `${m.client.productName} — app métier générée depuis PRD (kit Creezio)`,
        type: "module",
        main: "./build/electron/main.js",
        scripts: {
          build: "npm run build:electron",
          "build:electron": "tsc -p tsconfig.electron.json",
          typecheck: "tsc -p tsconfig.electron.json --noEmit",
          "metier:api": "node scripts/metier-api.mjs",
          "test:metier-parcours": "node scripts/test-metier-parcours.mjs",
          "test:first-run-auth": "node scripts/test-first-run-auth.mjs",
          "electron:config:client":
            "node scripts/build-builder-config.mjs client",
          "electron:config:server":
            "node scripts/build-builder-config.mjs server",
          "electron:publish": `CREEZIO_BRAND=${m.brandId} bash ../../packages/desktop-tooling/scripts/publish-desktop.sh`,
          "electron:publish:dry": `CREEZIO_BRAND=${m.brandId} bash ../../packages/desktop-tooling/scripts/publish-desktop.sh --dry-run`,
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
  return `# ${m.client.productName}

Application métier générée par \`creezio new-app --from-prd\`.

## Identité

| Champ | Valeur |
|-------|--------|
| brandId | \`${m.brandId}\` |
| tagline | ${model.tagline} |
| entities | ${model.entities.map((e) => e.id).join(", ")} |
| flow | ${model.flows.map((f) => f.label).join("; ") || "—"} |
| sandbox | \`${Boolean(m.sandbox)}\` |

## Parcours smoke

\`\`\`bash
npm run test:metier-parcours
npm run test:first-run-auth
\`\`\`

API métier locale :

\`\`\`bash
npm run metier:api
# → http://127.0.0.1:18791
\`\`\`

## Structure clé

- \`product-model.json\` — modèle issu du PRD
- \`crm/src/brand/schema.ts\` + \`schema.sql\` — schéma marque
- \`scripts/metier-api.mjs\` — API HTTP métier
- \`ui/app/\` — pages App Router
- \`src/lib/\` — wiring générique (paths, host-stack, boot…)
- \`src/electron/\` — desktop (\`installBrandDesktopRuntime\`)
- \`resources/renderer/index.html\` — UI SPA métier

## Plateforme

Le générique (auth, fenêtres, MAJ, assistant…) vient de \`@creezio/*\`.
Le métier (${model.entities.map((e) => e.id).join(", ")}) vit **dans ce repo**.
`;
}

/**
 * Écrit les artefacts --from-prd par-dessus / en complément du scaffold OS.
 * Doit être appelé après scaffoldNewApp de base (ou avec les mêmes outDir/force).
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
}
