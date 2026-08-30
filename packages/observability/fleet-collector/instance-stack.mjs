/**
 * [compat] instance-stack.mjs — la SoT vit désormais dans
 * `@creezio/fleet/instance-stack` (packages/fleet/src/instance-stack.ts).
 * Wrapper conservé UNE version (0.15.x) pour les consommateurs historiques
 * (CLI server-docker), retrait au prochain minor.
 */
console.warn(
  "[deprecated] packages/observability/fleet-collector/instance-stack.mjs → importer @creezio/fleet/instance-stack (retrait au prochain minor)",
);
export * from "@creezio/fleet/instance-stack";
