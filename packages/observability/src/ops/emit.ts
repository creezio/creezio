/**
 * Émission d'événements ops depuis un SOUS-PROCESS Node vanilla
 * (meili-indexer, migrations…) : ligne `TF2EVENT {json}` sur stdout.
 * Extrait de TempoFlow ops-emit.ts (R4).
 */

import { TF2EVENT_PREFIX, type OpsEventInput } from "./types.js";

export function emitOpsEvent(evt: OpsEventInput): void {
  try {
    console.log(`${TF2EVENT_PREFIX}${JSON.stringify(evt)}`);
  } catch {
    /* best-effort : jamais de throw depuis l'instrumentation */
  }
}
