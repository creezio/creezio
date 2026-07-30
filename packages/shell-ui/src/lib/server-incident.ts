/**
 * Remontée d'incidents serveur (app desktop) vers le collecteur de crash de
 * l'éditeur — ex. « Meilisearch indisponible alors que la recherche est
 * sollicitée ». Best-effort, jamais bloquant, dédupliqué (1 envoi max par
 * type d'incident par heure) pour ne pas inonder le collecteur.
 *
 * Actif uniquement si TF2_CRASH_ENDPOINT est injecté dans l'environnement
 * (fait par electron/server-launcher.ts) — en déploiement web classique,
 * cette fonction est un no-op.
 */

const ENDPOINT = process.env.TF2_CRASH_ENDPOINT || "";
const INSTALL_ID = process.env.TF2_INSTALL_ID || "server";
const DEDUP_MS = 3600_000;

const lastSent = new Map<string, number>();

export function reportServerIncident(kind: string, detail: Record<string, unknown>): void {
  if (!ENDPOINT) return;
  const now = Date.now();
  const prev = lastSent.get(kind) || 0;
  if (now - prev < DEDUP_MS) return;
  lastSent.set(kind, now);

  console.error(`[incident] ${kind}: ${JSON.stringify(detail).slice(0, 300)}`);
  void fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind: `server-${kind}`,
      installId: INSTALL_ID,
      appVersion: process.env.TF2_APP_VERSION || "unknown",
      platform: process.platform,
      bootStage: "running",
      timestamp: new Date().toISOString(),
      detail,
    }),
    signal: AbortSignal.timeout(5000),
  }).catch(() => {});
}
