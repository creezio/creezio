# Phase M12p — `main.ts` marques via façade kit

| | |
|--|--|
| **Statut** | ✅ **Certivan + Fidu** |
| **Date** | 2026-07-30 |
| **Repo** | `creezio/creezio` + `certivan-app` + `fidu` |
| **Prérequis** | [PHASE-M12.md](PHASE-M12.md) |
| **ARCHITECTURE_VERSION** | `"H6"` (inchangé) |
| **Republish marques** | Fidu oui (packing : retrait Paperclip `extraResources`) |

---

## Objectif

Même façade `installBrandDesktopRuntime` que M12 (TF) sur Certivan puis Fidu :
`electron/main.ts` = composition marque ≤ **800 LOC** ; runtime plateforme SoT kit.

---

## Travaux kit (deltas marque)

| Livrable | Note |
|----------|------|
| `BrandDesktopDeps` | `pluginsDirEnvKey`, `supplierFidQueryParam`, `apiKeyEnvName`, `nodeRuntimeLabel` |
| Strings produit | `manifest.client/server.productName` |
| `maybeRestartNextAfterHermesSpawn` | Porté plateforme |
| `getHeartbeatExtras` | Hook vertical (dossierStats Certivan) |
| Fix `supplierFidQueryParam` | TDZ → `deps.supplierFidQueryParam` |
| Paperclip | **Aucun** hook kit (produit retiré) |

---

## Travaux Certivan

| Fichier | Avant | Après |
|---------|------:|------:|
| `electron/main.ts` | **4105** LOC | **320** LOC |

Gates : compile + main-graph + client-slim-boot + shell + first-run-auth ✅

---

## Travaux Fidu

| Fichier | Avant | Après |
|---------|------:|------:|
| `electron/main.ts` | **2371** LOC | **~303** LOC |
| `host-stack.ts` | absent | lazy + stubs flotte/plugins (M7p N/A) |
| Paperclip | câblé | **supprimé** |

Gates : `electron:compile` + `test:shell` + `test:fidu` ✅

---

## Critères done vision

| Critère | Preuve |
|---------|--------|
| Certivan `main.ts` ≤ 800 LOC | ✅ 320 |
| Fidu `main.ts` ≤ 800 LOC | ✅ ~303 |
| Même façade kit | ✅ |
| Paperclip Fidu | ✅ retiré |
| PHASE-M12p.md | ✅ |

---

## Gates

```bash
cd /opt/docker/creezio && npm test   # incl. test-phase-m12p
cd /opt/docker/fidu/crm && bash scripts/electron/sync-creezio-vendor.sh
npm run electron:compile && npm run test:shell && npm run test:fidu
```

---

## Push

| Repo | SHA |
|------|-----|
| kit `creezio/creezio` | `63f516e` |
| Certivan `certivan-app` | `15ae995` |
| TF | `3565524` |
| Fidu `fidu` | `9f139f2` |


---

## Suite

**M13** — Audit TF métier-only.
