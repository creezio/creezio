# Standard module — unité de travail autonome

Contrat pour tout **module** d'une app Creezio : un module = un périmètre
métier autonome qu'un agent peut spécifier, implémenter, tester et livrer
**sans toucher aux fichiers des autres modules**. Complément du
[DOC-STANDARD.md](./DOC-STANDARD.md) (docs de packages) et du
[DOC-STANDARD-UI.md](./DOC-STANDARD-UI.md) (kit graphique imposé).

Vérifié par la gate `scripts/test-phase-module-docs.mjs` (kit `npm test`,
suite brands pour la partie repos marque).

## Où vivent les specs de module

| Type de module | Dossier spec |
|---|---|
| Module server d'une marque | `<brand>/brand-spec/modules/<id>/` |
| Module admin natif kit | `packages/admin/modules/<id>/` |
| Module propre au repo `<brand>-admin` | `<brand>-admin/admin-spec/modules/<id>/` |

`modules/_template/` est réservé aux templates (ignoré par la gate).

## Les 4 fichiers obligatoires

Chaque `modules/<id>/` porte exactement ces 4 fichiers :

| Fichier | Rôle | Niveau d'exigence |
|---|---|---|
| `prd.md` | vision + spec produit | un agent qui n'a jamais vu l'app doit pouvoir **recréer exactement le module** à partir de `prd.md` + `interview.md` |
| `interview.md` | questionnaire d'architecture **rempli** — SoT des décisions | toute décision structurante (table, endpoint, composant UI, tool MCP) y est tracée avec sa justification |
| `TODO.md` | milestones + tâches cochables | format normé ci-dessous (parsé par la gate) |
| `CHANGELOG.md` | une entrée datée par livraison | ID de tâche + gate qui prouve |

### `prd.md` — sections normalisées

```markdown
# Module <id> — <titre>

## Vision
## Utilisateurs & parcours
## Capacités (fonctionnel)
## Modèle de données          ← schémas complets : colonnes, types, contraintes, défauts
## API                        ← endpoints exhaustifs : méthode, chemin, params, comportement
## UI                         ← pages, composants du kit graphique utilisés
## Tools MCP                  ← noms, schémas d'entrée, scopes, policies
## Logique métier non triviale ← formules, scores, algorithmes décrits en clair
## Seeds & données initiales
## Cas limites & règles de gestion
## Hors périmètre
```

Une section sans objet reste présente avec « Aucun ». Les schémas de tables
sont donnés en SQL (copie de la migration) ou tableau colonne/type/contrainte.

### `interview.md` — questionnaire d'architecture

Questionnaire **rempli** (pas un formulaire vide). Sections :

```markdown
# Interview module <id>

## 1. Identité & pages
   id, titre, routes UI, entrée(s) de nav, permission nav.

## 2. Données & migrations
   Tables (schéma complet), index, FK logiques.
   IDs de migration : `mod_<module>_00N_<slug>` — JAMAIS renuméroter/renommer
   une migration appliquée, quel que soit son préfixe (`fromprd_brand_0XX`
   compris).
   Migrations cross-module interdites : une migration ne touche que les
   tables du module ; une colonne sur la table d'un autre module = tâche
   dans le module propriétaire.

## 3. API
   EntitySpec `createEntityApiMount` (défaut pour tout CRUD) vs mount
   manuscrit (justifier). Hooks, extraRoutes, mounts additionnels.

## 4. UI, nav & permissions — kit graphique imposé
   Chaque page déclarée liste les composants du kit qu'elle utilise
   (voir DOC-STANDARD-UI.md). Pas de style ad hoc, pas de lib UI tierce.

## 5. Tools MCP & policies
   Tools `module.<owner>.*` : readOnly/destructive hints, requiredScope,
   rôles par défaut, policies seedées.

## 6. Rôles & permissions

## 7. Meili / n8n / plugins
   Index Meili alimentés, workflows n8n, interactions plugins.

## 8. Seeds & onboarding

## 9. Gates de validation
   La (les) gate(s) qui prouvent le module, et ce qu'elles vérifient.

## 10. i18n
   Langue des libellés, conventions.
```

### `TODO.md` — format normé (parsé par la gate)

```markdown
# TODO — <module>

## Milestone M1 — <titre>            ← optionnel

### [todo] <MOD>-1 — <titre de tâche>
- priorite: P1
- depends: aucune
- fichiers: server/src/electron/modules/<id>.ts, server/ui/app/<route>/
- criteres:
  - [ ] <critère d'acceptation cochable>
  - [ ] gate <nom> verte
```

Règles :

- En-tête de tâche : `### [<statut>] <ID> — <titre>` ; statuts valides :
  `todo` | `in-progress` | `blocked` | `done`.
- **Convention de claim (verrou par conflit git)** : un agent qui prend une
  tâche passe `[todo]` → `[in-progress]` et ajoute
  `- claim: <identifiant-agent> <YYYY-MM-DD>` **dans le même commit que sa
  première modification de code**. Deux agents qui claiment la même tâche =
  conflit git → le second reroute.
- `[in-progress]` et `[blocked]` exigent une ligne `claim:` datée.
- `[done]` exige une ligne `done: <YYYY-MM-DD>` et une entrée `CHANGELOG.md`.

### `CHANGELOG.md`

```markdown
# CHANGELOG — <module>

## 2026-08-06 — <MOD>-1 — <titre>
- gate: npm run test:<gate> (verte)
- <ce qui a été livré, en 1-3 lignes>
```

Une entrée par livraison (merge sur `main`), la plus récente en haut.

## Périmètre de fichiers par agent

Un agent travaillant sur le module `<id>` ne modifie que :

1. son dossier spec `modules/<id>/` (les 4 fichiers) ;
2. son fichier de wiring `server/src/electron/modules/<id>.ts` ;
3. ses pages UI (`server/ui/app/<routes du module>/`) et ses composants
   dédiés (`server/ui/components/<id>/`) ;
4. sa gate (`scripts/test-module-<id>.mjs` ou la gate existante du module) ;
5. **une seule ligne** dans le registre `modules/index.ts` (son import).

Tout fichier partagé (registre au-delà de sa ligne, `brand-migrations.ts`,
`package.json`, composants UI partagés, `tool-registry.ts`…) = **tâche
séparée sérialisée** (une PR dédiée, jamais mélangée au flux module).

## Workflow

- Branche : `module/<id>/<tache>` (ex. `module/promotions/PROMO-3`).
- PR vers `main` ; la gate du module + la gate `module-docs` prouvent.
- Nouvelle marque / nouveau module : `creezio brand module init <id>`
  scaffolde les 4 fichiers + wiring + stub de gate
  (voir [docs/agents/CREATE-MODULE.md](./agents/CREATE-MODULE.md)).
