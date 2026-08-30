#!/usr/bin/env node
/**
 * [compat] server-admin.mjs — la SoT vit désormais dans `@creezio/fleet`
 * (packages/fleet/src/server-admin.ts). Wrapper exécutable conservé UNE
 * version (0.15.x) pour les consommateurs historiques (bin npm, lancements
 * manuels) ; les images Docker pointent désormais directement sur
 * `@creezio/fleet/dist/bin/server-admin-main.js`. Retrait au prochain minor.
 */
console.warn(
  "[deprecated] packages/observability/fleet-collector/server-admin.mjs → node node_modules/@creezio/fleet/dist/bin/server-admin-main.js (retrait au prochain minor)",
);
const { startServerAdmin } = await import("@creezio/fleet/server-admin");
startServerAdmin();
