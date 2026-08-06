# Interview module prospects

## 1. Identité & pages

- id : `prospects` ; titre : « Prospection kanban ».
- Module natif kit (`@creezio/admin`), monté sous
  `/api/v1/modules/prospects` par `registerAdminModules` (ou à la carte).
- Page : matérialisée par l'app admin (TempoFlow : `/prospects`, nav
  `brand.prospects`) rendant `ProspectsKanbanClient` avec ses labels.
- Permission : session OS admin (kernel).

## 2. Données & migrations

- Table `admin_prospects` — créée par la migration historique
  `admin_001_native_modules` (**intouchable**, partagée avec roadmap,
  support, billing). Schéma complet dans prd.md (copie migration).
- Pas d'index dédié (volumétrie prospection faible, tri en mémoire SQLite).
- Nouvelle migration éventuelle : `mod_prospects_00N_<slug>` — une
  migration ne touche que les tables de ce module.

## 3. API

- Mount EntitySpec `ADMIN_ENTITY_SPECS.prospects` via
  `createAdminEntityMount` (PROSP-1) — moteur kit
  `@creezio/api-kernel` + wrapper dialecte admin.
- `archivable: true` + `softDeleteOnly: true` (PROSP-2) :
  `POST /:id/archive` écrit `archived_at` ; `DELETE` → 400 `use_archive`.
- Liste : filtre `archived_at` NULL par défaut ; tri
  `position ASC, created_at DESC` (hook `afterList`).
- Dialecte de réponse : `{ ok, items }` / `{ ok, item }` (le client UI
  accepte aussi le dialecte nu des mounts métier générés).
- `nom` requis à la création (`required: true` → 400 `nom_required`).

## 4. UI, nav & permissions — kit graphique imposé

### Page /prospects (matérialisée marque, client `ProspectsKanbanClient`)

- gabarit : layout flex plein largeur (pas de section-view-shell — client
  kit autonome)
- colonnes kanban : `card` (cartes prospect) + `badge` (compteurs)
- toolbar création : `input` ×2 + `button`
- détail : `card` + `button` (ghost/destructive) + `<textarea>` brut
  (écart au kit : pas de primitive textarea — dette PROSP-4) ;
  archivage = `POST /:id/archive` uniquement (plus de DELETE)
- DnD : HTML5 natif, aucune lib tierce (conforme aux interdits du
  standard UI)

## 5. Tools MCP & policies

Aucun.

## 6. Rôles & permissions

Session OS de l'app admin ; pas de granularité par rôle dans le module.

## 7. Meili / n8n / plugins

Aucun dans le kit. (Côté TempoFlow Admin, le feed Meili marque indexe
`admin_prospects` — voir `tempoflow-admin/admin-spec/modules/wiring/`.)

## 8. Seeds & onboarding

Aucun.

## 9. Gates de validation

- `scripts/test-phase-admin-prospects.mjs` : CRUD EntitySpec + tri
  kanban + `POST /:id/archive` (PROSP-1/2). Couverture scaffold :
  `scripts/test-phase-factory-two-repos.mjs` (page `/prospects`).

## 10. i18n

Libellés des colonnes kanban et messages en français, codes de colonnes
(`a_contacter`, `contacte`, `rdv`, `client`, `perdu`) en identifiants
techniques stables (ne pas traduire — persistés en DB).
