# Journal de création TempoFlow3

Suivi des prompts de [HISTORIQUE-PROMPTS.md](./HISTORIQUE-PROMPTS.md).  
Problèmes : [PROBLEMES.md](./PROBLEMES.md).

| Prompt | Titre | Statut | Date | Notes |
|--------|-------|--------|------|-------|
| 0 | Cadre général | ✅ | 2026-08-01 | Contrat OS + anti-triche |
| 1 | Bootstrap `--from-prd` | ✅ | 2026-08-01 | `apps/tempoflow3` |
| 2 | Fournisseurs | ✅ | 2026-08-01 | CRUD, archive, site_web, recherche |
| 3 | Produits | ✅ | 2026-08-01 | Lien fournisseur/secteur, stack/panier |
| 4 | Prix | ✅ | 2026-08-01 | Historique + promos |
| 5 | Panier | ✅ | 2026-08-01 | Totaux, qté, commande |
| 6 | Commandes | ✅ | 2026-08-01 | from-panier + statuts |
| 7 | Optimiser | ✅ | 2026-08-01 | suggest/apply local |
| 8 | Stack | ✅ | 2026-08-01 | toggle + enriched |
| 9 | Relevés | ✅ | 2026-08-01 | apply → prix |
| 10 | Scan | ✅ | 2026-08-01 | propositions métier (IA = OS) |
| 11 | Dashboard | ✅ | 2026-08-01 | indicateurs + raccourcis |
| 12 | Marketplaces… | ✅ | 2026-08-01 | + secteurs, agrégateurs, mapping |
| 13 | Audit allowlist | ✅ | 2026-08-01 | `test:allowlist` vert |

## Preuves

```bash
cd apps/tempoflow3 && npm test
# OK test:metier-parcours TempoFlow3 (cœur + modules étendus)
# OK test:first-run-auth
# OK test:allowlist
```

## Livrables marque

- API : `scripts/metier-api.mjs`
- UI : `resources/renderer/index.html` (14 onglets)
- Schéma : `crm/src/brand/schema.{ts,sql}`
- Nav : `src/electron/vertical-slot.ts`
- Wiring OS mince : `src/lib/*` (pas de launchers recopiés)

## Reste (hors MVP expérience / F6)

- Packager Next host + Electron GUI E2E (P2).
- Parity visuelle/oracle complète 0.10.26 (optimiser avancé, dispatch multi…).
- Extraire `apps/tempoflow3` en repo marque externe + vendor sync.
