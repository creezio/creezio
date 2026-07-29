# Phase M6p — Hosts Certivan puis Fidu (vision stricte)

| | |
|--|--|
| **Statut** | 🟡 **Partiel** — Certivan ✅ ; Fidu ⏳ |
| **Date** | 2026-07-30 |
| **Repo** | `creezio/creezio` + `certivan-app` (+ `fidu` ensuite) |
| **Prérequis** | [PHASE-M6.md](PHASE-M6.md) (TF gold) |
| **ARCHITECTURE_VERSION** | `"H6"` (inchangé) |
| **Republish marques** | Non (packing inchangé) — sauf Fidu si packing touché + verts |

---

## Objectif

Même cutover que M4+M5+M6 TF sur **Certivan puis Fidu** (séquentiel) :
jumeaux pleins / bootstraps / launchers / chrome → SoT
`@creezio/electron-shell` + wiring `local-config-store` + `host-runtime-ctx`
+ `host-stack` kit. Fichiers listés **absents** ; `rg "stub R3|stub R3.3" electron/` → **0**.

---

## Travaux kit (préalable cutover marques)

| Livrable | Détail |
|----------|--------|
| `host/n8n/launcher.ts` | Dual-read legacy `.${prefix}-encryption-key` / `.${prefix}-owner.json` (Certivan) |
| `host/hermes/launcher.ts` | `ensureApiKey` brand-aware (`.${prefix}-api-server-key`) ; clear `.certivan-webui-password` |
| `host/hermes/runtime-bootstrap.ts` | `WEBUI_DEPS_MARKER_LEGACY_CERTIVAN` + pin Certivan |
| Export `WEBUI_DEPS_MARKER_LEGACY_CERTIVAN` | index electron-shell |

---

## M6p-Certivan

| Fichier | Avant | Après |
|---------|------:|------:|
| `electron/local-config.ts` | **814** | **absent** |
| `electron/hermes-runtime-bootstrap.ts` | **768** | **absent** |
| `electron/n8n-runtime-bootstrap.ts` | **256** | **absent** |
| `electron/hermes-launcher.ts` | **1084** | **absent** |
| `electron/n8n-launcher.ts` | **1111** | **absent** |
| `electron/{meili-launcher,logger,splash-ui,tray,updater,node-runtime,npm-cli,tunnel,admin-window}.ts` | jumeaux | **absents** |
| `electron/local-config-store.ts` | — | **≤40** |
| `electron/host-runtime-ctx.ts` | — | **≤200** (`cv*` factories) |
| `electron/host-stack.ts` | require jumeaux | kit + `cvHermesHost` / `cvN8nHost` / `cvTunnelService` / hostMeili |
| `fleet-telemetry.ts` | jumeau logique | labels marque + `@creezio/platform-core` |

### Gates Certivan

| Gate | Preuve |
|------|--------|
| `npm run electron:compile` | ✅ |
| `test:hermes-embed` / `test:n8n-embed` / `test:node-runtime` | ✅ |
| `test:splash-ui` / `test:electron-main-graph` / `test:app-kind` | ✅ |
| first-run / recovery / profile / agent-isolation / embed-sandbox / byok / updater | ✅ |
| 14 jumeaux listés absents | ✅ |
| `rg "stub R3\|stub R3.3" electron/` → 0 | ✅ |
| Vendor liste complète | ✅ |

---

## M6p-Fidu

⏳ Après Certivan poussé — même logique (incl. dual-reads `secretFilePrefix: "fidu"`).

---

## Push

| Repo | SHA |
|------|-----|
| kit `creezio/creezio` | _(à remplir)_ |
| Certivan `certivan-app` | _(à remplir)_ |
| Fidu | _(après)_ |

---

## Verdict

**Certivan : TERMINÉ** (cutover M4+M5+M6). Suite : **Fidu**, puis M7 si session.
