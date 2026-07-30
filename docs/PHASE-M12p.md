# Phase M12p — `main.ts` marques via façade kit

| | |
|--|--|
| **Statut** | 🔄 **En cours** (Certivan → Fidu) |
| **Date** | 2026-07-30 |
| **Repo** | `creezio/creezio` + `certivan-app` + `fidu` |
| **Prérequis** | [PHASE-M12.md](PHASE-M12.md) |
| **ARCHITECTURE_VERSION** | `"H6"` (inchangé) |
| **Republish marques** | Non (pas de packing) — Fidu ship pipeline seulement si packing touché |

---

## Objectif

Même façade `installBrandDesktopRuntime` que M12 (TF) sur Certivan puis Fidu :
`electron/main.ts` = composition marque ≤ **800 LOC** ; runtime plateforme SoT kit.

---

## Travaux kit (deltas marque)

| Livrable | Note |
|----------|------|
| `BrandDesktopDeps` | `pluginsDirEnvKey`, `supplierFidQueryParam`, `apiKeyEnvName`, `nodeRuntimeLabel` |
| Strings produit | `manifest.client/server.productName` (plus de hardcode TempoFlow) |
| `maybeRestartNextAfterHermesSpawn` | Porté plateforme (delta Certivan) |
| `getHeartbeatExtras` | Hook vertical (dossierStats Certivan) |

---

## Travaux Certivan

| Fichier | Avant | Après |
|---------|------:|------:|
| `electron/main.ts` | **~4105** LOC | **≤800** (composition + deps) |
| Smokes | lisaient `main.ts` seul | `readDesktopRuntimeSrc()` |

Vertical inchangé (tabs, AI, brand-runtime, host-stack, fleet-dossier-samples…).

---

## Travaux Fidu

Même cutover après Certivan vert + push.

---

## Critères done vision

| Critère | Preuve |
|---------|--------|
| Certivan `main.ts` ≤ 800 LOC | ✅ |
| Fidu `main.ts` ≤ 800 LOC | ⏳ |
| Même façade kit | ✅ `installBrandDesktopRuntime` |
| Vendor liste complète | ✅ |
| Gates ci-dessous | ⏳ |
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
# puis Fidu (après Certivan push) :
cd /opt/docker/fidu/crm && bash scripts/electron/sync-creezio-vendor.sh
npm run electron:compile && npm run test:electron-main-graph
# (+ shell / first-run si présents)
```

---

## Push

| Repo | SHA |
|------|-----|
| kit `creezio/creezio` | _(après push)_ |
| Certivan `certivan-app` | _(après push)_ |
| Fidu `fidu` | _(après push)_ |

---

## Suite

**M13** — Audit TF métier-only (allowlist) ; supprimer orphelins plateforme.
