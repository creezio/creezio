# Phase M12p — `main.ts` marques via façade kit

| | |
|--|--|
| **Statut** | ✅ **Sign-off** (Certivan + Fidu) |
| **Date** | 2026-07-30 |
| **Repo** | `creezio/creezio` + `certivan-app` + `fidu` |
| **Prérequis** | [PHASE-M12.md](PHASE-M12.md) |
| **ARCHITECTURE_VERSION** | `"H6"` (inchangé) |
| **Republish marques** | Non (pas de packing / pas de ship Fidu exe) |

## Objectif

Même façade `installBrandDesktopRuntime` que M12 (TF) sur Certivan puis Fidu :
`electron/main.ts` = composition marque ≤ **800 LOC** ; runtime plateforme SoT kit.

## Travaux kit

| Livrable | Note |
|----------|------|
| deps marque | `pluginsDirEnvKey`, `supplierFidQueryParam`, `apiKeyEnvName`, `nodeRuntimeLabel` |
| `getHeartbeatExtras` / `maybeRestartNextAfterHermesSpawn` | hooks plateforme |
| `paperclip` / `vertical.paperclip` | vertical Fidu optionnel |
| Fix `supplierFidQueryParam` | `deps.supplierFidQueryParam` |

## Travaux marques

| Marque | main.ts | Notes |
|--------|--------:|-------|
| Certivan | 320 LOC | ✅ `15ae995` |
| Fidu | ≤800 LOC | ✅ host-stack + Paperclip vertical |

## Gates

```bash
cd /opt/docker/creezio && npm test
cd /opt/docker/fidu/crm && bash scripts/electron/sync-creezio-vendor.sh
npm run electron:compile && npm run test:shell
```

## Push

| Repo | SHA |
|------|-----|
| kit | _(après push)_ |
| Certivan | `15ae995` |
| TF | `3565524` |
| Fidu | _(après push)_ |

## Suite

**M13** — Audit TF métier-only.
