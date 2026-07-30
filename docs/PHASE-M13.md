# Phase M13 — Audit TF métier-only

| | |
|--|--|
| **Statut** | ✅ **Audit go** (implémentation delete restante = docs stale / wirings gras hors scope delete-stub) |
| **Date** | 2026-07-30 |
| **Repo** | `creezio/creezio` + `tempoflow2` |
| **Prérequis** | [PHASE-M12p.md](PHASE-M12p.md) Fidu vert |
| **ARCHITECTURE_VERSION** | `"H6"` |
| **Republish** | Non |

---

## Objectif

Vérifier que TempoFlow n’a plus de **jumeaux / stubs plateforme** : le métier
reste dans TF ; le runtime plateforme est SoT kit.

---

## Preuves audit (TF2)

| Critère | Résultat |
|---------|----------|
| `electron/main.ts` | **309 LOC** + `installBrandDesktopRuntime` (M12) |
| Jumeaux launchers (`meili/hermes/n8n/fleet/ops/local-config/node-runtime/tunnel`) | **Absents** |
| `src/lib/database` shim | **Absent** |
| `core-migrations` jumeau | **Absent** — `platformCoreMigrations()` kit |
| `host-stack` / `host-runtime-ctx` | Wiring lazy légitime (pas jumeaux) |
| `modules` | Symlink M10 → `electron/modules` |

### Zones grises (hors delete-stub M13)

- Wirings encore volumineux : `plugin-control-extras.ts`, `brand-runtime.ts`, …
- Runner `electron/migrations/steps/*` historique (socle DB)
- Docs TF stale citant d’anciens chemins

---

## Done vision M13

| Critère | Preuve |
|---------|--------|
| Inventaire jumeaux plateforme TF = 0 | ✅ audit |
| `PHASE-M13.md` | ✅ |
| Suite claire | M14+ (gold / freeze) selon PLAN-M |

---

## Suite

Selon [PLAN-M.md](PLAN-M.md) : **M14** marques gold / suite vision.
