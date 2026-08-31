/**
 * Contrat d’alimentation Meili générique (Phase C).
 *
 * La marque fournit un feed (tables + indexes + mapping colonnes).
 * L’OS exécute startMeili / runIndexation / swap — sans SQL marque hardcodé.
 *
 * Le feed est OBLIGATOIRE : `runIndexation()` sans feed configuré lève une
 * erreur explicite (le kit n'embarque plus d'UIDs marque legacy).
 */

import { fingerprintCountKey } from "./index-schema.js";

export type BrandMeiliDocument = Record<string, unknown> & {
  id: string | number;
};

/** Handle SQLite minimal passé aux loaders custom (better-sqlite3 / node:sqlite). */
export type MeiliFeedSqliteDb = {
  prepare(sql: string): {
    get(...args: unknown[]): unknown;
    all(...args: unknown[]): unknown[];
    run(...args: unknown[]): unknown;
  };
};

export type BrandMeiliIndexSpec = {
  /** UID Meili (ex. catalog_products) — pas de préfixe marque hardcodé kit. */
  uid: string;
  settings: Record<string, unknown>;
  /**
   * Clé de compteur fingerprint — LIBRE, déclarée par la marque, doit
   * correspondre à une clé de `countTables`. Alias legacy lu UNE version :
   * `sites` (normalisé en `fournisseurs`, voir `fingerprintCountKey`).
   */
  countKey: string;
  /**
   * Mode CUSTOM : la marque génère elle-même les documents (jointures,
   * provenance, taxonomie…) — l'OS n'exécute aucun SQL marque hardcodé,
   * il itère simplement les documents retournés. Prioritaire sur le mode
   * déclaratif table/columns quand présent.
   */
  loadDocs?: (db: MeiliFeedSqliteDb) => Iterable<BrandMeiliDocument>;
  /** Table SQL source (mode déclaratif — ignoré si loadDocs). */
  table?: string;
  /**
   * Échappatoire déclarative du doctor brand-spec
   * (`MODULE_MEILI_TABLE_UNKNOWN`) : la table n'est **pas** créée par une
   * migration statique de l'app (provisionnée à l'exécution — import
   * distant, matérialisation runtime, table temporaire de sync…).
   * Texte actionnable : QUI provisionne la table, et quand.
   * Si ce champ est posé (non vide), le check table↔migrations ne
   * déclenche pas. **Pas** d'env de bypass.
   */
  tableProvisionedBy?: string;
  /** Colonnes indexées, id toujours forcé (mode déclaratif). */
  columns?: string[];
  /** Champ `type` du document Meili (mode déclaratif). */
  docType?: string;
  /** Exclure lignes soft-archivées si colonne archived_at. */
  excludeArchived?: boolean;
};

export type BrandMeiliFeed = {
  id: string;
  schemaVersion: number;
  /** Préfixe stdout progression (ex. ACME → `ACMEPROGRESS …`). */
  progressPrefix: string;
  /**
   * Tables SQL pour compteurs cohérence — mapping LIBRE
   * `clé de compteur → nom de table` (clés alignées sur les `countKey`
   * des indexes ; alias legacy `sites` lu une version).
   */
  countTables: Record<string, string>;
  indexes: readonly BrandMeiliIndexSpec[];
  obsoleteIndexUids?: readonly string[];
  /** Index miroir fingerprint (défaut catalog_meta). */
  metaIndexUid?: string;
};

/** UIDs génériques recommandés. */
export const GENERIC_CATALOG_INDEXES = [
  "catalog_products",
  "catalog_sites",
] as const;

export type GenericCatalogIndexUid = (typeof GENERIC_CATALOG_INDEXES)[number];

let configuredFeed: BrandMeiliFeed | null = null;

/** Enregistre le feed marque pour runIndexation / helpers (process courant). */
export function configureMeiliBrandFeed(feed: BrandMeiliFeed): void {
  configuredFeed = feed;
}

export function getMeiliBrandFeed(): BrandMeiliFeed | null {
  return configuredFeed;
}

export function resetMeiliBrandFeedForTests(): void {
  configuredFeed = null;
}

/**
 * @deprecated H7 — le preset catalogue CHR vit désormais dans le générateur
 * factory (`renderMeiliFeedTs`, feed inliné dans le code de la marque). Cet
 * export est conservé UNE version pour les marques qui l'importent encore
 * (codemod H7 : inliner le feed côté marque) ; suppression au prochain bump.
 */
export function createChrCatalogMeiliFeed(opts: {
  brandId: string;
  progressPrefix?: string;
  schemaVersion?: number;
}): BrandMeiliFeed {
  const prefix = (
    opts.progressPrefix ||
    opts.brandId.replace(/[^A-Za-z0-9]/g, "").toUpperCase()
  ).slice(0, 32);
  return {
    id: `${opts.brandId}-catalog`,
    schemaVersion: opts.schemaVersion ?? 1,
    progressPrefix: prefix,
    countTables: { produits: "produits", fournisseurs: "fournisseurs" },
    indexes: [
      {
        uid: "catalog_products",
        countKey: "produits",
        table: "produits",
        columns: ["id", "nom", "categorie", "fournisseur_id", "unite"],
        docType: "product",
        excludeArchived: true,
        settings: {
          searchableAttributes: ["nom", "categorie", "unite"],
          filterableAttributes: ["type", "fournisseur_id", "categorie"],
          displayedAttributes: [
            "id",
            "type",
            "nom",
            "categorie",
            "fournisseur_id",
            "unite",
          ],
        },
      },
      {
        uid: "catalog_sites",
        countKey: "fournisseurs",
        table: "fournisseurs",
        columns: ["id", "nom", "contact", "email", "telephone", "site_web"],
        docType: "site",
        excludeArchived: true,
        settings: {
          searchableAttributes: ["nom", "contact", "email"],
          filterableAttributes: ["type"],
          displayedAttributes: [
            "id",
            "type",
            "nom",
            "contact",
            "email",
            "telephone",
            "site_web",
          ],
        },
      },
    ],
    obsoleteIndexUids: [],
    metaIndexUid: "catalog_meta",
  };
}

/**
 * Compteurs attendus par UID depuis counts SQL fingerprint.
 * Lookup générique : `countKey` brut puis clé fingerprint normalisée
 * (alias legacy `sites` → `fournisseurs`, une version).
 */
export function expectedCountsForFeed(
  feed: BrandMeiliFeed,
  sql: Record<string, number>,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const idx of feed.indexes) {
    out[idx.uid] =
      sql[idx.countKey] ?? sql[fingerprintCountKey(idx.countKey)] ?? 0;
  }
  return out;
}
