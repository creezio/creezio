# Problèmes rencontrés — et corrections

## P1 — Factory MVP trop étroit → **REVISITÉ (P8)**

**Avant** : cœur trop mince, puis sur-correction via templates CHR riches (12
entités) = triche.  
**Cible** : cœur 5 entités génériques au Prompt 1 ; modules bonus via mini-PRDs
dans la marque (P8).

## P2 — Runtime desktop vs CI → **CORRIGÉ**

**Avant** : pas de smoke desktop sans GUI.  
**Fix kit** : `scripts/test-desktop-smoke-profile.mjs` généré (feature-off +
`createBrandHostStack` / `installBrandDesktopRuntime` / boot) — zéro Electron GUI.

## P3 — Scan / IA → **ACCEPTÉ (by design)**

Propositions métier dans l’API marque ; capture/IA = OS creezio (assistant).
Documenté dans l’UI SPA.

## P4 — Next vs SPA → **CORRIGÉ**

**Avant** : pages Next stubs vides.  
**Fix** : pages Next listent l’API brand (dashboard inclus) ; SPA
`resources/renderer/index.html` reste l’UI interactive complète — les deux
sont générés par la factory.

## P5 — Prix sur fournisseur archivé → **CORRIGÉ**

Smoke archive `f2` **après** création des prix (historique conserve l’id).

## P6 — Repo externe vs monorepo → **CLARIFIÉ**

`apps/tempoflow3` dans creezio = preuve OS kit. Allowlist mise à jour :
sandbox monorepo acceptée ; extraction repo externe = propagation ultérieure.

## P7 — First-run / login réimplémentés dans la marque → **CORRIGÉ**

**Avant** : store fichier + IPC setup/login inventés dans `apps/tempoflow3`
— frontière OS/métier violée.

**Fix kit** : `@creezio/electron-shell` expose `createDesktopSessionStore`,
`registerDesktopSessionIpc`. La factory `--from-prd` génère un main/preload
mince qui **consomme** ces APIs (+ `bootBrandKernel`, pas un sidecar métier).

## P8 — Templates CHR = triche évaluation → **CORRIGÉ**

**Avant** : `packages/factory/templates/chr/*` dumpait API/SPA/oracle TempoFlow
(12 entités, optimiser/scan…) au Prompt 1 — l’agent ne « créait » rien.

**Fix** : dossier `templates/chr` **supprimé**. Parse PRD → cœur 5 entités.
Générateurs génériques uniquement. Modules bonus = agent + mini-PRDs dans
la marque. Gate factory assert `templates/chr` absent.

## P9 — Sidecar JSON (`metier-api.mjs` / `store.json`) hors contrat → **CORRIGÉ**

**Avant** : factory `--from-prd` naissait avec un serveur Node + `store.json`
et des mounts kernel en 501 — TempoFlow « marchait » hors OS.

**Fix kit** : générateurs natifs (`brand-migrations`, `bootBrandKernel`, mounts
SQL, `brand-kernel-harness`). Smokes hors monorepo : `CREEZIO_ROOT` + symlink
`node_modules` + `tsconfig.base.json` local. Gates F3 + expérience 11/11.

---

## P10 — Meili hardcodé `tf2_*` dans le kit → **CORRIGÉ (socle)**

**Avant** : indexeur / UIDs / SQL agrégateurs TempoFlow dans
`@creezio/electron-shell` — TF3 ne pouvait pas « juste configurer ».

**Fix kit** : `BrandMeiliFeed` + `runFeedIndexation` + UIDs `catalog_*` ;
legacy `tf2_*` seulement si aucun feed. Factory génère `meili-feed.ts` ;
smoke `test:meili-config` (binaire absent → null ; fake HTTP → index/search).

---

## Vérification « delete + regen » (Prompt 1)

```bash
rm -rf apps/tempoflow3
creezio new-app --from-prd docs/experiences/tempoflow3/PRD-PRODUIT.md \
  --out apps/tempoflow3 --force
cd apps/tempoflow3
CREEZIO_ROOT=$(pwd)/../.. NODE_PATH=$CREEZIO_ROOT/node_modules npm test
```

Attendu : cœur uniquement (pas optimiser/scan) ; runtime `brand.db` +
`/api/v1/modules/*` ; **aucun** `metier-api.mjs` / `store.json` ; puis mini-PRDs.
