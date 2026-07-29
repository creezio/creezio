# Phase D4 — Fidu control-plane HTTP plugins

| | |
|--|--|
| **Statut** | ✅ **Sign-off code** (republish si standing ship) |
| **Date** | 2026-07-29 |
| **Repo** | `fidu` (+ doc kit) |
| **Prérequis** | [PHASE-I18.md](PHASE-I18.md), [PHASE-D3.md](PHASE-D3.md) |
| **ARCHITECTURE_VERSION** | `"H6"` |
| **Republish marques** | **Oui si** exe embarque le control-plane (bump **0.1.56**) |

---

## Objectif

Lever le N/A I18 : brancher un control-plane HTTP **minimal viable**
(`startPluginControlPlane` + `createFiduControlPlaneAcl`) — pas de stub vide,
pas de sidecars spawn (GED).

## Livrables

| # | Livrable | Statut |
|---|----------|--------|
| 1 | `electron/plugin-control-api.ts` minimal + ACL L3 | ✅ |
| 2 | Boot `main.ts` → `startFiduPluginControlApi` | ✅ |
| 3 | E2E `test:plugin-control-api-d4` (deny/allow install) | ✅ |
| 4 | `test:plugin-acl-l3` + `test:phase-h3` verts | ✅ |
| 5 | Bump + standing ship republish | 🔄 |

## Preuve ACL

- Sans Bearer → 401
- Create sans `isOwner` → 403 `acl_install_denied`
- Create owner + grant bypass lab → 201 + scaffold `plugins/<id>`

## Verdict

**Phase D4 code : TERMINÉE.** Republish Fidu après verts standing ship.
