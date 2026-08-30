/**
 * Contrat de version du protocole flotte agent ↔ backend (F4.4d).
 *
 * Header HTTP `x-creezio-fleet-protocol` porté dans les DEUX sens des
 * échanges backend flotte (server-admin) ↔ agent hôte (host-agent), et par
 * la boucle pull agent → app admin (module fleet-releases).
 *
 * Politique de compatibilité (introduite en 0.15.0, protocole v1) :
 *   - header présent et égal à FLEET_PROTOCOL_VERSION → OK ;
 *   - header ABSENT → accepté avec warn bruyant (composants déployés avant
 *     0.15.0 qui ne connaissent pas le header — dual-accept UNE version) ;
 *   - header présent mais différent → REFUS explicite avec message
 *     actionnable (jamais de dégradation silencieuse).
 *
 * Au prochain bump de FLEET_PROTOCOL_VERSION (v2), passer
 * FLEET_PROTOCOL_ACCEPT_MISSING à false : l'absence de header devient un
 * refus fail-closed (la génération sans header aura eu une version pleine
 * pour se mettre à jour).
 */

export const FLEET_PROTOCOL_VERSION = 1;

export const FLEET_PROTOCOL_HEADER = "x-creezio-fleet-protocol";

/** Dual-accept : true tant que la génération sans header (≤ 0.14) est tolérée. */
export const FLEET_PROTOCOL_ACCEPT_MISSING = true;

export type ProtocolDecision =
  | { action: "ok" }
  | { action: "warn-missing"; message: string }
  | { action: "refuse"; message: string };

/**
 * Décision de compatibilité pour un header de protocole reçu.
 * `peer` est un libellé lisible du composant distant (ex. "agent hostId=x").
 */
export function checkFleetProtocol(
  raw: string | null | undefined,
  peer: string,
): ProtocolDecision {
  const v = String(raw ?? "").trim();
  if (!v) {
    const message =
      `${peer} sans version de protocole flotte (header ${FLEET_PROTOCOL_HEADER} absent — génération ≤ 0.14). ` +
      `Accepté cette version (dual-accept), refus fail-closed au prochain bump de protocole — ` +
      `mettre à jour : agent hôte via \`creezio server-docker agent up\`, backend via \`creezio server-docker admin up\`.`;
    return FLEET_PROTOCOL_ACCEPT_MISSING
      ? { action: "warn-missing", message }
      : { action: "refuse", message };
  }
  if (Number(v) === FLEET_PROTOCOL_VERSION) return { action: "ok" };
  return {
    action: "refuse",
    message:
      `${peer} en protocole flotte v${v} ≠ v${FLEET_PROTOCOL_VERSION} supporté — geste refusé (pas de dégradation silencieuse). ` +
      `Mettre à jour le composant le plus ancien : agent hôte via \`creezio server-docker agent up\`, ` +
      `backend via \`creezio server-docker admin up\`, puis rejouer le geste.`,
  };
}

/* Warn throttlé — évite le spam des pollers (snapshot 30 s, pull 5 min). */
const lastWarnAt = new Map<string, number>();

/** true si un warn peut être émis pour cette clé (défaut : 1 / 10 min). */
export function shouldWarnProtocol(key: string, intervalMs = 600_000): boolean {
  const now = Date.now();
  const prev = lastWarnAt.get(key) || 0;
  if (now - prev < intervalMs) return false;
  lastWarnAt.set(key, now);
  return true;
}
