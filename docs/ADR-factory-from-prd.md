# ADR — Factory `new-app --from-prd`

**Statut** : accepté  
**Date** : 2026-08-01  
**Lié** : `ADR-no-brand-domain-in-native-packages.md`, expérience `docs/experiences/tempoflow3/`

## Contexte

Le brief produit non technique (restaurateurs / fournisseurs / panier / commandes)
ne pouvait pas produire une app : la factory ne gérait que des flags techniques
et un squelette OS sans métier.

## Décision

1. **`creezio new-app --from-prd <prd.md>`** parse un brief → `ProductModel`
   (entities, pages, flows, platformNeeds) puis scaffold une app marque.
2. **Les générateurs** (`packages/factory/src/generators/*`) vivent dans le kit.
3. **Le code métier généré** (SQL brand, API, pages, nav) est écrit **dans le
   repo / dossier marque**, jamais dans `@creezio/platform-core` ni autre package
   natif (ADR no-brand-domain).
4. Les ids réservés (`tempoflow`, `certivan`, `fidu`) sont suffixés (`tempoflow3`)
   pour les sandboxes issues d’un PRD.

## Conséquences

- Un agent peut suivre uniquement `PROMPT-PRODUIT.md` + cette commande.
- Enrichir le catalogue CHR = enrichir les heuristiques / générateurs kit, pas
  le prompt utilisateur.
- DemoBrand reste la sandbox OS « notes » ; TempoFlow3-like vient du PRD.
