# Rapport TempoFlow3 — après correction + regen

**Date** : 2026-08-01

## Verdict

La solution **fonctionne mieux** : après correction des gaps factory, un
`rm -rf` + `creezio new-app --from-prd` reproduit l’app complète **sans
édition manuelle** de la marque.

| Critère | Avant | Après |
|---------|-------|-------|
| Onglets CHR via factory | 5 entités | 12 entités / 14 pages |
| Smoke desktop sans GUI | ❌ | ✅ `test:desktop-smoke-profile` |
| Pages Next utiles | stubs | listes API + dashboard |
| Smoke archive/prix | ordre fragile | archive après prix |
| Regen from scratch | retouches marque | **1 commande** |

## Ce qui vient de creezio

Factory templates `packages/factory/templates/chr/*` + ProductModel `vertical: chr`
+ wiring `@creezio/*`.

## Ce qui est dans tempoflow3

Uniquement le résultat généré (métier + wiring mince) — regenerate anytime.
