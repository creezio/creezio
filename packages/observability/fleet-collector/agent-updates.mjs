/**
 * [compat] agent-updates.mjs — la SoT vit désormais dans
 * `@creezio/fleet/agent-updates` (packages/fleet/src/agent-updates.ts).
 * Wrapper conservé UNE version (0.15.x), retrait au prochain minor.
 */
console.warn(
  "[deprecated] packages/observability/fleet-collector/agent-updates.mjs → importer @creezio/fleet/agent-updates (retrait au prochain minor)",
);
export * from "@creezio/fleet/agent-updates";
