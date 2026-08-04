# FILES — @creezio/browser-host

Inventaire fichier par fichier (`src/`).

| Fichier | Rôle | Exports clés |
|---------|------|--------------|
| `chromium-process.ts` | Spawn/supervision du binaire Chromium : args (`--remote-debugging-port=0`, `--user-data-dir`, sandbox, headless/Xvfb), détection binaire (`CREEZIO_CHROMIUM_BIN` prioritaire), purge des verrous `Singleton*` obsolètes, extraction de l'URL websocket CDP. | `launchChromium`, `findChromiumBinary`, `ChromiumProcess` |
| `cdp-connection.ts` | Client websocket CDP minimal (send/on, ids, sessions Target attachées, timeouts). | `CdpConnection` |
| `browser-host.ts` | Hôte navigateur : connexion CDP racine, création/attache de pages (`CdpPage` : navigate, cookies `Network.setCookie`, UA override, monde isolé persistant `evalIsolated`, screenshot, `startScreencast` avec `everyNthFrame: 1`). | `BrowserHost`, `CdpPage` |
| `chrome-ua.ts` | UA Chrome stable sans token Electron/Node — parité `electron-shell/browser-tabs/chrome-ua.ts` (sans import electron). | `CHROME_UA` |
| `driver-scripts.ts` | **SoT des scripts driver** injectés en monde isolé : registre de cibles, lecture page, faux curseur. Consommés ici ET par Electron (pas de fork). | `DRIVER_HELPERS`, `FAKE_CURSOR_INJECT` |
| `shared-driver.ts` | Exécution des verbes `external_*` au-dessus d'un transport CDP abstrait (`CdpTransport`) — partagé Electron/serveur. | `runDriverVerb`, `CdpTransport` |
| `ai-session-host.ts` | Sessions par IA : Chromium dédié + page CRM sidecar (cookie session persona) + onglets externes ; actions workspace (`ensure`, `openTab`, `listTabs`, `webAction`, `uiAction`). | `AiSessionHost` |
| `browser-screencaster.ts` | Capture screencast (~3 fps JPEG, re-ciblage surface active 1 s, stop auto sans spectateur / 30 min). | `BrowserScreencaster` |
| `screencast-hub.ts` | Hub frames in-process — même clé `globalThis` que `shell-ui/ui/lib/ai-screencast-hub.ts` (SSE côté tasks). | `publishScreencastFrame`, `subscribeScreencast`, `screencastViewerCount` |
| `index.ts` | Barrel exports. | — |

`scripts/smoke-live.mjs` — smoke local : lance Chromium, ouvre une page,
exécute `external_read`/`external_click`, vérifie une frame screencast.
