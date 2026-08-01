# Preuve TempoFlow3 vs TempoFlow 0.10.26 — statut

> Critère utilisateur : app **similaire** à TempoFlow2 Locale **0.10.26**
> (`e36e4d0`), fonctionnalités testées fonctionnelles, **fichier compilé**
> livré avec architecture légère. Sans ça → **échec**.

## Verdict

# MISSION = ÉCHEC

| Critère | Statut | Preuve |
|---------|--------|--------|
| Architecture légère (pas glue OS) | OK partiel | `proof-oracle` arch.* PASS |
| Parcours API cœur fournisseurs→commande | OK | oracle-proof.json |
| Modules bonus API (stack/relevés/scan/…) | partiel | optimiser 400, data-mapping 404 |
| Parity pages UI 0.10.26 (52 pages) | **ÉCHEC** | 14+ pages OS/métier absentes |
| Surfaces OS (login, tâches, mails, MCP, tunnel…) | **ÉCHEC** | non branchées |
| Binaire compilé | **artefact produit mais non conforme** | AppImage 112 Mo |
| Boot binaire packagé | **ÉCHEC** | crash `writeAppKindFile` dans asar |
| Oracle automatisé | **FAILURE 19 pass / 14 fail** | `PREUVE-ORACLE-RUN.md` |

## Artefacts (preuve d’échec documentée)

| Fichier | Chemin |
|---------|--------|
| Rapport oracle | `/opt/cursor/artifacts/tempoflow3-proof/oracle-proof.md` |
| JSON checks | `/opt/cursor/artifacts/tempoflow3-proof/oracle-proof.json` |
| Log run | `/opt/cursor/artifacts/tempoflow3-proof/oracle-run.log` |
| AppImage (non validé fonctionnellement) | `/opt/cursor/artifacts/tempoflow3-proof/TempoFlow-Setup-0.1.0.AppImage` |
| SHA256 | `/opt/cursor/artifacts/tempoflow3-proof/SHA256SUMS` |
| Doc statut | `docs/experiences/tempoflow3/PREUVE-STATUS.md` |

## Process exécuté (agent)

1. Reset `apps/tempoflow3`
2. `creezio brand apply` depuis BrandSpec
3. Fix glue OS kit (`createBrandKernel`) + reset
4. Métier mini-PRDs 01–11 (API)
5. Compilation `electron-builder` → AppImage Linux
6. Suite `scripts/proof-oracle-0.10.26.mjs` → **FAILURE**

## Pourquoi ce n’est pas TempoFlow 0.10.26

0.10.26 = Next.js (~52 pages) + Electron monolithe métier/OS + `test:shell` (~40)
+ tests métier dispatch/optimiser/skus/promotions/site.

TF3 actuel = façade mince + mounts SQL MVP + SPA 6 onglets + quelques pages
stub. **Ce n’est pas un produit équivalent**, même si le binaire existe.

## Conditions de réussite (non atteintes)

1. Matrix oracle **0 fail** (métier + OS kit branché).
2. Binaire qui **boot** et parcours manuel/E2E fournisseurs→commande + bonus.
3. UI utilisable (pas seulement API) pour les surfaces 0.10.26 listées dans
   `ORACLE-0.10.26.md`.
