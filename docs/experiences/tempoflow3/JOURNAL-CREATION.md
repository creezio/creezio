# Journal de création TempoFlow3

| Étape | Statut | Notes |
|-------|--------|-------|
| Corrections P1–P6 dans creezio factory | ✅ | templates CHR + desktop smoke |
| Suppression `apps/tempoflow3` | ✅ | wipe complet |
| Regen `new-app --from-prd` | ✅ | zero retouche manuelle |
| `npm test` post-regen | ✅ | 4/4 smokes |

## Preuve regen

```bash
rm -rf apps/tempoflow3
creezio new-app \
  --from-prd docs/experiences/tempoflow3/PRD-PRODUIT.md \
  --out apps/tempoflow3 --force
cd apps/tempoflow3 && npm test
```

Sortie :

```
OK test:metier-parcours TempoFlow (cœur + modules étendus)
OK test:first-run-auth (wiring portable tempoflow3)
OK test:allowlist TempoFlow (marque légère, pas de launchers OS)
OK test:desktop-smoke-profile (feature-off, no Electron GUI)
```

Voir [PROBLEMES.md](./PROBLEMES.md), [RAPPORT.md](./RAPPORT.md).
