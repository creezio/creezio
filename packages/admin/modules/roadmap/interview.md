# Interview module roadmap

## 1. Identité & pages

- id : `roadmap` ; titre : « Roadmap produit ».
- Module natif kit (`@creezio/admin`), monté sous
  `/api/v1/modules/roadmap` par `registerAdminModules`.
- Page : à la charge de l'app admin (TempoFlow : `/roadmap`, nav
  `brand.roadmap`) — aucun client UI exporté par `@creezio/admin/ui` pour
  ce module.
- Permission : session OS admin (kernel).

## 2. Données & migrations

- Table `admin_roadmap_items` — migration historique
  `admin_001_native_modules` (**intouchable**). Schéma complet : prd.md.
- Nouvelle migration éventuelle : `mod_roadmap_00N_<slug>`.

## 3. API

- Mount EntitySpec `ADMIN_ENTITY_SPECS.roadmap` via
  `createAdminEntityMount` (ROAD-1) — dialecte `{ ok, items }` /
  `{ ok, item }` ; PUT mappé vers PATCH.
- Tri liste : `position ASC, created_at DESC` (hook `afterList`).
- `titre` requis à la création (`required: true` → 400 `titre_required`).

## 4. UI, nav & permissions — kit graphique imposé

- Aucune page kit. Référence d'implémentation marque (TempoFlow Admin,
  page /roadmap) : `EntityTable` (composant partagé app) construit sur
  `DataTable` de `@creezio/shell-ui/ui` — conforme au standard
  (data-table pour toute liste tabulaire).

## 5. Tools MCP & policies

Aucun.

## 6. Rôles & permissions

Session OS de l'app admin, pas de granularité par rôle.

## 7. Meili / n8n / plugins

Aucun.

## 8. Seeds & onboarding

Aucun.

## 9. Gates de validation

- `scripts/test-phase-admin-roadmap.mjs` : CRUD EntitySpec + tri
  position (ROAD-1). Wiring scaffold :
  `scripts/test-phase-factory-two-repos.mjs`.

## 10. i18n

Libellés en français côté apps ; `statut` stocké en identifiant technique
(défaut `idee`).
