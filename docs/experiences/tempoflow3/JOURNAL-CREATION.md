# Journal de création TempoFlow3

Suivi d’exécution des prompts de [HISTORIQUE-PROMPTS.md](./HISTORIQUE-PROMPTS.md).

| Prompt | Titre | Statut | Date | Notes |
|--------|-------|--------|------|-------|
| 0 | Cadre général | ✅ posé | 2026-08-01 | Contrat OS + anti-triche documenté |
| 1 | Bootstrap `--from-prd` | ✅ fait | 2026-08-01 | `apps/tempoflow3` généré ; smokes verts |
| 2 | Fournisseurs | ⏳ suivant | — | Mini-PRD prêt ; enrichissement itératif |
| 3 | Produits | ⏳ | — | |
| 4 | Prix | ⏳ | — | |
| 5 | Panier | ⏳ | — | MVP factory déjà présent |
| 6 | Commandes | ⏳ | — | Parcours smoke factory déjà vert |
| 7 | Optimiser | ⏳ | — | |
| 8 | Stack | ⏳ | — | |
| 9 | Relevés | ⏳ | — | |
| 10 | Scan | ⏳ | — | |
| 11 | Dashboard | ⏳ | — | |
| 12 | Marketplaces… | ⏳ | — | |
| 13 | Audit allowlist | ⏳ | — | |

## Prompt 1 — preuves

```text
creezio new-app \
  --from-prd docs/experiences/tempoflow3/PRD-PRODUIT.md \
  --out apps/tempoflow3 --force
```

- `brandId` : `tempoflow3`
- entities : `fournisseurs`, `produits`, `prix`, `panier_lignes`, `commandes`
- `npm run test:metier-parcours` → OK (`fournisseurs→prix→panier→commande`)
- `npm run test:first-run-auth` → OK

## Prochaine action agent

Envoyer le **Prompt 2** (mini-PRD Fournisseurs) pour enrichir au-delà du
MVP factory, toujours sans copier tempoflow2.
