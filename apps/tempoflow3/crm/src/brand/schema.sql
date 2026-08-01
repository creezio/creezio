-- Schéma brand généré depuis ProductModel (tempoflow3)
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

-- Prix : une ligne = un relevé (historique). Pas d'upsert silencieux.
CREATE TABLE IF NOT EXISTS prix (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  produit_id TEXT NOT NULL,
  fournisseur_id TEXT NOT NULL,
  montant REAL NOT NULL,
  devise TEXT,
  promo INTEGER,
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
  notes TEXT
);
