# Phase M12p — `main.ts` marques via façade kit

| | |
|--|--|
| **Statut** | 🔄 **Certivan ✅ / Fidu en cours** |
| **Date** | 2026-07-30 |
| **Repo** | `creezio/creezio` + `certivan-app` + `fidu` |
| **Prérequis** | [PHASE-M12.md](PHASE-M12.md) |
| **ARCHITECTURE_VERSION** | `"H6"` (inchangé) |
| **Republish marques** | Non (pas de packing) |

---

## Objectif

Même façade `installBrandDesktopRuntime` que M12 (TF) sur Certivan puis Fidu :
`electron/main.ts` = composition marque ≤ **800 LOC** ; runtime plateforme SoT kit.

---

## Travaux kit (deltas marque)

| Livrable | Note |
|----------|------|
| `BrandDesktopDeps` | `pluginsDirEnvKey`, `supplierFidQueryParam`, `apiKeyEnvName`, `nodeRuntimeLabel` (+ fallbacks) |
| Strings produit | `manifest.client/server.productName` |
| `maybeRestartNextAfterHermesSpawn` | Porté plateforme (delta Certivan) |
| `getHeartbeatExtras` | Hook vertical (dossierStats Certivan) |

---

## Travaux Certivan

| Fichier | Avant | Après |
|---------|------:|------:|
| `electron/main.ts` | **4105** LOC | **320** LOC |
| Smokes | `main.ts` seul | `readDesktopRuntimeSrc()` |

Gates : compile + main-graph + client-slim-boot + shell + first-run-auth ✅

---

## Travaux Fidu

Même cutover après Certivan. Fidu n’a pas encore `host-stack` ni surface
flotte/plugins complète (M7p N/A) ; Paperclip = vertical marque à brancher.

| Critère | Note |
|---------|------|
| `main.ts` ≤ 800 LOC | ⏳ |
| `host-stack` lazy | ⏳ requis pour la façade |
| Paperclip | ⏳ hook vertical kit |
| Gates | compile + shell (pas de main-graph aujourd’hui) |

---

## Critères done vision

| Critère | Preuve |
|---------|--------|
| Certivan `main.ts` ≤ 800 LOC | ✅ 320 |
| Fidu `main.ts` ≤ 800 LOC | ⏳ |
| Même façade kit | ✅ Certivan |
| Vendor liste complète | ✅ Certivan |
| PHASE-M12p.md | ✅ |

---

## Gates

```bash
cd /opt/docker/creezio && npm test   # incl. test-phase-m12p
cd /opt/docker/certivan-app/crm && bash scripts/electron/sync-creezio-vendor.sh
npm run electron:compile \
  && npm run test:electron-main-graph \
  && npm run test:client-slim-boot \
  && npm run test:shell \
  && npm run test:first-run-auth \
  && npm run electron:compile
cd /opt/docker/fidu/crm && bash scripts/electron/sync-creezio-vendor.sh
npm run electron:compile && npm run test:shell
```

---

## Push

| Repo | SHA |
|------|-----|
| kit `creezio/creezio` | `685bd89` |
| Certivan `certivan-app` | `15ae995` |
| TF (deps + vendor) | `3565524` |
| Fidu `fidu` | _(après cutover)_ |

---

## Suite

**M13** — Audit TF métier-only (après M12p Fidu vert).
