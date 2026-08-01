# AGENTS — BrandSpec tempoflow3

## Mission agent créateur

Ce dossier est la **SoT déclarative** de la sonde TempoFlow.

```bash
creezio brand doctor --spec apps/tempoflow3/brand-spec
creezio brand apply --spec apps/tempoflow3/brand-spec --out apps/tempoflow3 --force
creezio brand smoke --app apps/tempoflow3
```

## Règles

1. Métier seulement — jamais de launcher OS / sidecar JSON.
2. Modules = `modules/<id>/prd.md` (+ schema/api si besoin).
3. Runtime desktop = `startBrandDesktop` — pas de jumeau dans `main.ts`.
4. Gap OS → fix kit creezio, reset sonde, regen.

Voir `docs/agents/CREATE-BRAND.md`.
