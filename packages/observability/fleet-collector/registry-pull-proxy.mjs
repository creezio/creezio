/**
 * [compat] registry-pull-proxy.mjs — la SoT vit désormais dans
 * `@creezio/fleet/registry-pull-proxy` (packages/fleet/src/registry-pull-proxy.ts).
 * Wrapper conservé UNE version (0.15.x), retrait au prochain minor.
 */
console.warn(
  "[deprecated] packages/observability/fleet-collector/registry-pull-proxy.mjs → importer @creezio/fleet/registry-pull-proxy (retrait au prochain minor)",
);
export * from "@creezio/fleet/registry-pull-proxy";
