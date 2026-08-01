-- Schéma brand TempoFlow3 — métier CHR (hors @creezio/platform-core).

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
  secteur_id TEXT,
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
  promo INTEGER DEFAULT 0,
  promo_label TEXT,
  promo_fin TEXT
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
  notes TEXT,
  lignes_json TEXT
);

CREATE TABLE IF NOT EXISTS stack_items (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  produit_id TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS releves (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  date_releve TEXT NOT NULL,
  fournisseur_id TEXT NOT NULL,
  source TEXT,
  lignes_json TEXT
);

CREATE TABLE IF NOT EXISTS scan_sessions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  statut TEXT NOT NULL,
  note TEXT,
  propositions_json TEXT
);

CREATE TABLE IF NOT EXISTS marketplaces (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  nom TEXT NOT NULL,
  url TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS secteurs (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  nom TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS agregateurs (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  nom TEXT NOT NULL,
  url TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS data_mappings (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  libelle_fournisseur TEXT NOT NULL,
  fournisseur_id TEXT,
  produit_id TEXT NOT NULL
);
