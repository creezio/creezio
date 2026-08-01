# Journal de création TempoFlow3

| Étape | Statut | Notes |
|-------|--------|-------|
| Factory CHR + clean-room regen | ✅ | templates métier kit |
| Gap OS first-run/login (P7) | ✅ | remonté dans `@creezio/electron-shell` |
| Reset + regen sans OS marque | ✅ | pas de `local-config-store` / `ipc-bridge` |
| Suite `npm test` | ✅ | 6 smokes, zéro retouche OS |

## Règle d’or

TempoFlow3 = **sonde creezio**. Si un besoin n’est pas métier CHR et doit
être codé dans la marque → gap kit → reset marque → fix creezio → regen.

## Smokes

```bash
rm -rf apps/tempoflow3
creezio new-app --from-prd docs/experiences/tempoflow3/PRD-PRODUIT.md \
  --out apps/tempoflow3 --force
cd apps/tempoflow3 && npm test
# metier-parcours, first-run-auth, setup-login, allowlist,
# desktop-smoke-profile, oracle-mvp
```

## Desktop local (si Electron installé)

```bash
cd apps/tempoflow3 && npm run desktop:dev
```

## Suite

- Packager Next host réel (pas seulement SPA)
- Parity oracle restante (dispatch avancé, MCP OAuth…)
- Extraction repo marque externe
