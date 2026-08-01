/**
 * creezio:owned-by-brand
 * Migrations brand tempoflow3 — cœur from-prd + bonus mini-PRDs 06–11.
 */
import { composeMigrations, type SqliteMigration } from "@creezio/platform-core";

export const BRAND_SCHEMA_SQL = `-- Schéma brand généré depuis ProductModel (tempoflow3)
-- Ne pas déplacer dans @creezio/platform-core (ADR no-brand-domain).

CREATE TABLE IF NOT EXISTS fournisseurs (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  archived_at TEXT,
  nom TEXT NOT NULL,
  contact TEXT,
  email TEXT,
  telephone TEXT,
  site_web TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS produits (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  archived_at TEXT,
  nom TEXT NOT NULL,
  unite TEXT,
  categorie TEXT,
  fournisseur_id TEXT
);

CREATE TABLE IF NOT EXISTS prix (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  produit_id TEXT NOT NULL,
  fournisseur_id TEXT NOT NULL,
  montant REAL NOT NULL,
  devise TEXT,
  promo INTEGER,
  promo_label TEXT
);

CREATE TABLE IF NOT EXISTS panier_lignes (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  produit_id TEXT NOT NULL,
  fournisseur_id TEXT NOT NULL,
  quantite REAL NOT NULL,
  prix_unitaire REAL
);

CREATE TABLE IF NOT EXISTS commandes (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  fournisseur_id TEXT NOT NULL,
  statut TEXT NOT NULL,
  total_ht REAL,
  notes TEXT
);
`;

/** Mini-PRDs 06–11 — écrit marque (schema-bonus.sql miroir). */
export const BRAND_BONUS_SQL = `-- Modules bonus TempoFlow3 (mini-PRDs 06–11)

CREATE TABLE IF NOT EXISTS stack_produits (
  produit_id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS releves (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  date_releve TEXT NOT NULL,
  fournisseur_id TEXT NOT NULL,
  source TEXT NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS releve_lignes (
  id TEXT PRIMARY KEY,
  releve_id TEXT NOT NULL,
  produit_id TEXT,
  libelle TEXT,
  montant REAL NOT NULL,
  devise TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS scan_sessions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  statut TEXT NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS scan_propositions (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  produit_nom TEXT,
  produit_id TEXT,
  fournisseur_id TEXT,
  montant REAL,
  validated INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS marketplaces (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  nom TEXT NOT NULL,
  url TEXT,
  notes TEXT,
  archived_at TEXT
);

CREATE TABLE IF NOT EXISTS marketplace_fournisseurs (
  marketplace_id TEXT NOT NULL,
  fournisseur_id TEXT NOT NULL,
  PRIMARY KEY (marketplace_id, fournisseur_id)
);

CREATE TABLE IF NOT EXISTS secteurs (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  nom TEXT NOT NULL,
  slug TEXT
);

CREATE TABLE IF NOT EXISTS produit_secteurs (
  produit_id TEXT NOT NULL,
  secteur_id TEXT NOT NULL,
  PRIMARY KEY (produit_id, secteur_id)
);

CREATE TABLE IF NOT EXISTS agregateurs (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  nom TEXT NOT NULL,
  url TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS agregateur_fournisseurs (
  agregateur_id TEXT NOT NULL,
  fournisseur_id TEXT NOT NULL,
  PRIMARY KEY (agregateur_id, fournisseur_id)
);

CREATE TABLE IF NOT EXISTS data_mappings (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  libelle_externe TEXT NOT NULL,
  fournisseur_id TEXT,
  produit_id TEXT NOT NULL
);
`;

/** Snapshot lignes commande (détail TF2-like). */
export const BRAND_COMMANDES_LIGNES_SQL = `
CREATE TABLE IF NOT EXISTS commande_lignes (
  id TEXT PRIMARY KEY,
  commande_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  produit_id TEXT,
  produit_nom TEXT,
  fournisseur_id TEXT,
  quantite REAL NOT NULL,
  prix_unitaire REAL,
  total_ligne REAL
);
`;

/** Historique versions commande (parité TF2). */
export const BRAND_COMMANDES_VERSIONS_SQL = `
CREATE TABLE IF NOT EXISTS commande_versions (
  id TEXT PRIMARY KEY,
  commande_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  statut TEXT,
  total_ht REAL,
  snapshot_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS produit_likes (
  produit_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (produit_id)
);
`;

export function brandMigrations(): SqliteMigration[] {
  return composeMigrations(
    {
      id: "fromprd_brand_001_schema",
      sql: BRAND_SCHEMA_SQL,
    },
    {
      id: "fromprd_brand_002_bonus_modules",
      sql: BRAND_BONUS_SQL,
    },
    {
      id: "fromprd_brand_003_commande_lignes",
      sql: BRAND_COMMANDES_LIGNES_SQL,
    },
    {
      id: "fromprd_brand_004_versions_likes",
      sql: BRAND_COMMANDES_VERSIONS_SQL,
    },
  );
}
