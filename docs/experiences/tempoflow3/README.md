# Expérience TempoFlow3 — prouver l’OS Creezio (from scratch)

## Intention

Donner des **prompts produit** (cadre + mini-PRDs par onglet), **sans code
à coller**, et obtenir une app TempoFlow3 :

- repo marque **léger** (métier seulement) ;
- capacités **lourdes** via creezio ;
- **construction visible** module par module (pas un dump template).

Si l’agent doit tricher (copier tempoflow2, ou s’appuyer sur un template kit
qui contient déjà tout TempoFlow) → **expérience invalide**.

## Chemin agent

1. **[HISTORIQUE-PROMPTS.md](./HISTORIQUE-PROMPTS.md)** — suite ordonnée.
2. **[mini-prds/](./mini-prds/)** — un mini-PRD par onglet / module.
3. **[JOURNAL-CREATION.md](./JOURNAL-CREATION.md)** — raisonnement d’exécution.
4. **[PRD-PRODUIT.md](./PRD-PRODUIT.md)** + **[PROMPT-PRODUIT.md](./PROMPT-PRODUIT.md)**.

## Ce que fait `--from-prd` (Prompt 1)

| Produit | Non |
|---------|-----|
| OS wiring kit (`createDesktopSessionStore`…) | Clone SPA/API TempoFlow |
| ProductModel **cœur** (5 entités achats) | 12 entités oracle pré-cuites |
| CRUD générique + smoke parcours | `optimiser/suggest`, `scan/start`… |
| | Dossier `packages/factory/templates/chr` |

Les modules bonus viennent des **mini-PRDs** (prompts 2+), écrits dans la marque.

```bash
rm -rf apps/tempoflow3
creezio new-app --from-prd docs/experiences/tempoflow3/PRD-PRODUIT.md \
  --out apps/tempoflow3 --force
cd apps/tempoflow3 && npm test
```

## Documents

| Fichier | Rôle |
|---------|------|
| [HISTORIQUE-PROMPTS.md](./HISTORIQUE-PROMPTS.md) | Playbook prompts |
| [mini-prds/](./mini-prds/) | Mini-PRDs par onglet |
| [JOURNAL-CREATION.md](./JOURNAL-CREATION.md) | Suivi + raisonnement |
| [ALLOWLIST.md](./ALLOWLIST.md) | Ce qui a le droit d’exister |
| [PROBLEMES.md](./PROBLEMES.md) | Gaps kit + fixes |
| [ORACLE-0.10.26.md](./ORACLE-0.10.26.md) | Checklist capacités (cible, pas source code) |
