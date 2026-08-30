#!/usr/bin/env node
/**
 * [compat] host-agent.mjs — la SoT vit désormais dans `@creezio/fleet`
 * (packages/fleet/src/host-agent.ts). Wrapper exécutable conservé UNE
 * version (0.15.x) pour les consommateurs historiques (lancements manuels) ;
 * les images Docker pointent désormais directement sur
 * `@creezio/fleet/dist/bin/host-agent-main.js`. Retrait au prochain minor.
 */
console.warn(
  "[deprecated] packages/observability/fleet-collector/host-agent.mjs → node node_modules/@creezio/fleet/dist/bin/host-agent-main.js (retrait au prochain minor)",
);
const { startHostAgent } = await import("@creezio/fleet/host-agent");
startHostAgent();
