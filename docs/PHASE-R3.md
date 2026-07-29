# Phase R3 — Electron host cutover (`@creezio/electron-shell`)

| | |
|--|--|
| **Statut** | ✅ **Sign-off MVP shell + meili** (R3.3 launchers lourds = suite) |
| **Date** | 2026-07-29 |
| **Repo** | `creezio/creezio` + `tempoflow2` |
| **Prérequis** | [PHASE-R2.md](PHASE-R2.md) |
| **ARCHITECTURE_VERSION** | `"H6"` (inchangé) |
| **Republish exe TF** | **Non** (cutover lib + vendor ; pas de nécessité) |

---

## Objectif

Couper TempoFlow du **fork shell/host** : consommer
`@creezio/electron-shell` (SoT kit) avec **hooks brand** (labels, feeds,
paths, basename logs), sans réécrire un 3ᵉ launcher Hermes/n8n et sans
casser les chemins produit gold.

**Intention** : commun = kit ; TF = min métier ; **extraire**, ne pas inventer.

---

## Plan de cutover (ordre obligatoire)

| Étape | Contenu | Statut |
|-------|---------|--------|
| **R3.0** | Doc + inventaire forks TF vs kit | ✅ |
| **R3.1 MVP shell** | `logger` / `splash-ui` / `tray` / `updater` / `window-chrome` → kit | ✅ |
| **R3.2 Hosts légers** | `meili-launcher` → kit `startMeili` + paths/sandbox/crash | ✅ |
| **R3.3 Launchers lourds** | Hermes / n8n / tunnel / node / npm via factories kit + hooks | ⏳ suite |
| **R3.4 Verify** | compile + smokes shell | ✅ |
| **R3.5 Push** | kit + TF ; vendor sync | ✅ |

---

## Livrables

| # | Livrable | Statut |
|---|----------|--------|
| 1 | `docs/PHASE-R3.md` + plan cutover | ✅ |
| 2 | Kit logger : `scoped` / `recentLines` / `logFileTail` + format TF | ✅ |
| 3 | Kit splash HTML riche + `cssPrefix` / `runtime` step option | ✅ |
| 4 | Kit window-chrome IDs préfixés ; tray setup sync CJS-safe | ✅ |
| 5 | TF stubs shell → `@creezio/electron-shell` | ✅ |
| 6 | TF `meili-launcher` → kit | ✅ |
| 7 | `scripts/test-phase-r3.mjs` | ✅ |
| 8 | Smokes TF verts (ops / splash / updater / node / main-graph) | ✅ |
| 9 | Push kit + TF | ✅ |

---

## Frontière

| Dans `@creezio/electron-shell` | Reste TF (marque / vertical) |
|--------------------------------|------------------------------|
| logger, splash modèle+HTML, tray, updater, window-chrome | Labels splash, `cssPrefix: tf`, feed/onTrack/fleet updater |
| `startMeili` | Injection paths + sandbox + crash-reporter |
| `createHostRuntime` / `createHostStack` / factories hermes·n8n | **Encore forks TF** (R3.3) — product paths gold |
| Control plane host (C7) | Seeds Hermes, clés CRM, n8n-api-key, plugin-git/data |

---

## Hooks brand TempoFlow

| Hook | Source |
|------|--------|
| `logBasename` | `tempoflowManifest.logBasename` → `tempoflow-main` |
| Tray / splash productName | `tempoflowManifest.client.productName` |
| Feed updater | `client.feedUrl` / `server.feedUrl` via `resolveAppKind` |
| Splash labels | catalogue / Node TempoFlow + `includeRuntime: true` |
| cssPrefix chrome | `"tf"` |
| Meili | `meiliBinary` / `meiliDataDir` / `applyOsSandboxEnv` / `reportCrash` |

---

## Forks restants (documentés, pas skippés)

| Module TF | LOC | Action R3.3 |
|-----------|-----|-------------|
| `hermes-launcher.ts` | ~1070 | `createHermesHost` + hooks seed/bridge |
| `n8n-launcher.ts` | ~1111 | `createN8nHost` + n8n-api-key vertical |
| `tunnel.ts` | ~342 | `createTunnelService` + provision TF |
| `node-runtime.ts` | ~291 | adapter `HostRuntimeContext` |
| `npm-cli.ts` | ~296 | idem |
| `host-stack.ts` | ~78 | **garde** lazy graphe client (filtre host-only) |
| `local-config.ts` | ~814 | `createLocalConfigStore` kit (déjà B.2) |
| `admin-window.ts` | ~97 | thin wrapper kit (+ `destroy` TF) |

**Interdit R3.3** : inventer un 3ᵉ launcher ; casser Hermes→Product Hub / n8n gold.

---

## Cutover TempoFlow (ops)

```bash
cd /opt/docker/creezio && npm run build -w @creezio/electron-shell && npx tsc -p packages/electron-shell/tsconfig.cjs.json
cd /opt/docker/tempoflow2/crm && npm run electron:sync-vendor   # liste complète, pas un seul package
npm run electron:compile
npm run test:ops-journal && npm run test:splash-ui && npm run test:updater && npm run test:node-runtime
npm run test:electron-main-graph
```

⚠️ `CREEZIO_VENDOR_PACKAGES=electron-shell` seul **vide** le vendor — toujours sync baseline complète.

---

## Suite

**R3.3** — cutover hermes/n8n/tunnel/node/npm (factories kit + hooks).
**R4** — Observabilité unifiée (`@creezio/observability`).

---

## Verdict

**Phase R3 (MVP shell + meili) : TERMINÉE.** TempoFlow consomme
`@creezio/electron-shell` pour logger / splash / tray / updater / chrome /
meili ; forks shell réduits à des stubs brand ; launchers Hermes/n8n/tunnel
encore en fork TF (documentés pour R3.3) — product paths gold intacts.
