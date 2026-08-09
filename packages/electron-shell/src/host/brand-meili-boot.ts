/**
 * Boot Meili optionnel pour marques from-prd.
 * Sans binaire → null (recherche SQL via mount /search).
 * Avec binaire → startMeili + runFeedIndexation(feed).
 */
import type { BrandMeiliFeed } from "./meili/feed.js";
import { configureMeiliBrandFeed } from "./meili/feed.js";
import { startMeili, type RunningMeili } from "./meili-launcher.js";
import { runFeedIndexation } from "./meili/generic-indexer.js";
import {
  configureMeiliCoherencePaths,
  decideMeiliReady,
  type MeiliCoherencePaths,
} from "./meili/coherence.js";

export type BrandMeiliBootResult = {
  meili: RunningMeili | null;
  engine: "meili" | "sql-fallback";
  indexed?: Record<string, number>;
  /**
   * Mode background : résolue à la fin de l'indexation (null si échec).
   * Le boot ne doit PAS l'attendre — une réindexation complète (bump de
   * schemaVersion sur un gros catalogue) peut dépasser les timeouts de
   * health des updates flotte ; /search sert `source:"indexing"` entre-temps.
   */
  indexation?: Promise<Record<string, number> | null>;
  /**
   * true quand l'indexation a été sautée parce que le fingerprint persisté
   * est à jour (option `skipIfCoherent`) — aucune fenêtre dégradée au boot.
   */
  indexSkipped?: boolean;
};

/**
 * Démarre Meili si le binaire existe, indexe le feed, pose MEILI_HOST/KEY.
 */
export async function maybeBootBrandMeili(opts: {
  binaryPath: string | null;
  dataDir: string;
  userDataDir: string;
  dbPath: string;
  feed: BrandMeiliFeed;
  log?: (line: string) => void;
  /** Si false, ne lance pas l'indexation (défaut true). */
  index?: boolean;
  /** Si true, l'indexation part en tâche de fond (résultat via `indexation`). */
  backgroundIndex?: boolean;
  /**
   * Si true, sonde la cohérence fingerprint + compteurs (stricts) avant
   * d'indexer : index persistant à jour → indexation sautée (les ~7 min de
   * réindexation complète à chaque boot de container sur un gros catalogue
   * dégradent tout le serveur pour rien). Nécessite `coherencePaths`.
   */
  skipIfCoherent?: boolean;
  /** Chemins de la sonde de cohérence (harness serveur : Node courant). */
  coherencePaths?: MeiliCoherencePaths;
}): Promise<BrandMeiliBootResult> {
  const log = opts.log ?? ((l: string) => console.log(`[meili-boot] ${l}`));
  const meili = await startMeili({
    binaryPath: opts.binaryPath,
    dataDir: opts.dataDir,
    userDataDir: opts.userDataDir,
    log,
  });

  if (!meili) {
    delete process.env.MEILI_HOST;
    delete process.env.MEILI_MASTER_KEY;
    return { meili: null, engine: "sql-fallback" };
  }

  process.env.MEILI_HOST = meili.host;
  process.env.MEILI_MASTER_KEY = meili.masterKey;

  if (opts.index === false) return { meili, engine: "meili" };

  if (opts.skipIfCoherent) {
    try {
      if (!opts.coherencePaths) {
        throw new Error("coherencePaths requis pour skipIfCoherent");
      }
      configureMeiliCoherencePaths(opts.coherencePaths);
      configureMeiliBrandFeed(opts.feed);
      const decision = await decideMeiliReady(meili, opts.dbPath, {
        strictCounts: true,
      });
      if (decision.ready) {
        log(
          `fingerprint à jour (${decision.reason}) — indexation sautée, ` +
            `compteurs ${JSON.stringify(decision.meili)}`,
        );
        return { meili, engine: "meili", indexSkipped: true };
      }
      log(`réindexation requise: ${decision.reason}`);
    } catch (err) {
      // La sonde est une optimisation : indécidable → comportement historique.
      log(
        `cohérence indécidable (${err instanceof Error ? err.message : err}) — indexation complète`,
      );
    }
  }

  const runOnce = async (): Promise<Record<string, number> | null> => {
    try {
      const result = await runFeedIndexation({
        feed: opts.feed,
        dbPath: opts.dbPath,
        meiliHost: meili.host,
        masterKey: meili.masterKey,
        log,
      });
      return result.indexed;
    } catch (err) {
      log(
        `indexation échouée — fallback SQL (${err instanceof Error ? err.message : err})`,
      );
      return null;
    }
  };

  if (opts.backgroundIndex) {
    return { meili, engine: "meili", indexation: runOnce() };
  }
  const indexed = await runOnce();
  return { meili, engine: "meili", indexed: indexed ?? undefined };
}
