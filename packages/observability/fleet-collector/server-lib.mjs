/**
 * [compat] server-lib.mjs — la SoT vit désormais dans `@creezio/fleet/server-lib`
 * (packages/fleet/src/server-lib.ts). Wrapper conservé UNE version (0.15.x)
 * pour les consommateurs historiques (CLI server-docker, images), retrait au
 * prochain minor.
 */
console.warn(
  "[deprecated] packages/observability/fleet-collector/server-lib.mjs → importer @creezio/fleet/server-lib (retrait au prochain minor)",
);
export * from "@creezio/fleet/server-lib";
