# TempoFlow3

Application métier **légère** pour restaurateurs / achats CHR, sur OS
**Creezio**. Bootstrap factory + enrichissement prompts 2–13
(`docs/experiences/tempoflow3/HISTORIQUE-PROMPTS.md`).

## Identité

| Champ | Valeur |
|-------|--------|
| brandId | `tempoflow3` |
| Métier | fournisseurs, catalogue, prix, panier, commandes, optimiser, stack, relevés, scan, marketplaces… |
| OS | `@creezio/*` (auth, desktop, assistant, tasks, mails, plugins…) |

## Démarrage rapide

```bash
# API métier locale
npm run metier:api

# Smokes
npm test
```

Parcours validé : **fournisseurs → prix → panier → commande** (+ modules étendus).

## Structure

- `crm/src/brand/` — schéma métier
- `scripts/metier-api.mjs` — API HTTP brand
- `resources/renderer/index.html` — UI SPA tous onglets
- `ui/app/` — pages App Router
- `src/lib/` — wiring mince OS
- `src/electron/` — boot desktop (`installBrandDesktopRuntime`)

## Anti-triche

Pas de copie de launchers depuis tempoflow2. Gaps génériques → creezio.
Voir `docs/experiences/tempoflow3/PROBLEMES.md` et `JOURNAL-CREATION.md`.
