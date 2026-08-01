# Problèmes rencontrés — et corrections

## P1 — Factory MVP trop étroit → **CORRIGÉ**

**Avant** : `--from-prd` ne générait que 5 entités CHR.  
**Fix kit** : `ProductModel.vertical = "chr"` avec 12 entités + 14 pages ;
templates versionnés `packages/factory/templates/chr/*` (API, SPA, smokes, SQL).

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

---

## Vérification « delete + regen »

```bash
rm -rf apps/tempoflow3
creezio new-app --from-prd docs/experiences/tempoflow3/PRD-PRODUIT.md \
  --out apps/tempoflow3 --force
cd apps/tempoflow3 && npm test
```

Résultat attendu : 4 smokes verts sans retouche manuelle marque.
