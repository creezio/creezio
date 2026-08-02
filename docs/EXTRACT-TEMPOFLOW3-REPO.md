# Extract `apps/tempoflow3` → `creezio/tempoflow3`

> Dépendances kit P1 : **mergées** (#26–#29).  
> Repo cible : https://github.com/creezio/tempoflow3 @ **`044002a`**  
> Source freeze : tag `archive/tf3-probe-65b9273` (`65b9273`).  
> Vendor pin : `kitSha=878c641` (creezio `main` au sync).

## Statut P2.1 — DONE (2026-08-02)

| Critère | Preuve |
|---------|--------|
| 113 fichiers app importés | `SOURCE.json` + sha256-identical vs tag |
| Docs expérience tip | `docs/experiences/tempoflow3/**` dans le repo TF3 |
| Vendor `@creezio/*` | `npm run electron:sync-vendor` → `vendor/creezio` (+ brand-spec, app-runtime) |
| Smoke | `typecheck` / `build:electron` / `build:ui` **PASS** — voir `docs/SMOKE-IMPORT.md` (TF3) |
| Push `main` | `044002a` |
| Clone local | `/opt/docker/tempoflow3` |
| Branche `cursor/tempoflow3-create-457d` | **gardée** (tag archive) |
| PR #25 | fermée « app extracted » — reste tip listé ci-dessous |

## Étapes (réalisées)

1. Worktree / archive lecture seule sur le tag (pas de merge #25).
2. Export :
   ```bash
   git archive archive/tf3-probe-65b9273 apps/tempoflow3 | tar -x -C /tmp/tf3-export
   # contenu → racine creezio/tempoflow3
   ```
3. `npm run build:packages` côté kit ; sync vendor TF3 (`scripts/sync-creezio-vendor.sh` marque) ; kit sync accepte packages ESM-only (pas de `dist-cjs`).
4. CI Linux / proofs complets : **pas encore verts** (half-state — allowlist/meili/harness) ; build tsc+Next OK.
5. **Ne pas** modifier tempoflow2 gold (pas de resync TF2 requis pour ce sync ESM-only).
6. PR #25 fermée superseded-by-extract ; tag archive conservé.

## Reste tip (uniquement sur tag / branche — **pas** dans tempoflow3)

Ces chemins restent sur `archive/tf3-probe-65b9273` / `cursor/tempoflow3-create-457d` — **pas une perte app** (kit / demobrand) :

| Zone | Action |
|------|--------|
| `scripts/test-os-*.mjs`, `scripts/reset-tempoflow3.mjs`, `scripts/test-phase-create-brand.mjs` | Cherry-pick kit éventuel (P3) |
| Tweaks tip `apps/demobrand/**` | Revue sélective |
| Diffs tip sur packages déjà mergés P1 | SoT = `main` ; tip = historique |

## Hors scope immédiat

- Windows shippable
- Remplacement TF2
- Delete branches `cursor/*` mortes (P3, après sign-off) — **ne pas** delete `cursor/tempoflow3-create-457d` avant relecture OK
