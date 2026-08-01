-- Modules bonus TempoFlow3 (mini-PRDs 06–11) — marque uniquement.
-- Appliqué via brand-migrations (pas de template factory CHR).

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
