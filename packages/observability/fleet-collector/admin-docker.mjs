/**
 * [compat] admin-docker.mjs — la SoT vit désormais dans `@creezio/fleet/docker`
 * (packages/fleet/src/docker.ts). Wrapper conservé UNE version (0.15.x) pour
 * les consommateurs historiques, retrait au prochain minor.
 */
console.warn(
  "[deprecated] packages/observability/fleet-collector/admin-docker.mjs → importer @creezio/fleet/docker (retrait au prochain minor)",
);
export * from "@creezio/fleet/docker";
