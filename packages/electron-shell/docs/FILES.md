# packages/electron-shell — inventaire des fichiers

> Standard : [DOC-STANDARD.md](../../../docs/DOC-STANDARD.md) — maintenu via
> `node scripts/generate-files-md.mjs electron-shell` (gate `test-phase-docs-freshness`).
> Colonne « Rôle » éditable à la main : la régénération la préserve.

## `resources/scripts/`

| Fichier | Rôle |
|---|---|
| [`resources/scripts/meili-coherence-query.cjs`](../resources/scripts/meili-coherence-query.cjs) | (à documenter) |

## `resources/vendor/hermes-agent/`

| Fichier | Rôle |
|---|---|
| [`resources/vendor/hermes-agent/install.sh`](../resources/vendor/hermes-agent/install.sh) | (à documenter) |

## `scripts/`

| Fichier | Rôle |
|---|---|
| [`scripts/ensure-kit-binaries.mjs`](../scripts/ensure-kit-binaries.mjs) | (à documenter) |

## `src/`

| Fichier | Rôle |
|---|---|
| [`src/admin-window.ts`](../src/admin-window.ts) | Fenêtre « app admin » (cockpit serveur → /dashboard). Port paramétré de electron/admin-window.ts. |
| [`src/boot.ts`](../src/boot.ts) | Façade boot Electron plateforme — structure générique (pas le métier). Les apps marques appellent `prepareDesktopBoot(manifest)` **avant** `app.requestSingleInstanceLock()` pour isoler userData Client/Serveur. Le monolithe main.ts (catalogue, tabs fournisseurs, Hermes…) reste vertical. |
| [`src/factory-reset-runtime.ts`](../src/factory-reset-runtime.ts) | Wipe factory-reset (sessions Electron + chemins). Les cibles fichiers viennent de @creezio/platform-core. |
| [`src/index.ts`](../src/index.ts) | @creezio/electron-shell — runtime Electron plateforme (Phase B / B.2). |
| [`src/logger.ts`](../src/logger.ts) | Logger process principal — paramétré par logBasename (manifest). Port de electron/logger.ts (TF2), sans hardcode TempoFlow. |
| [`src/main-facade.ts`](../src/main-facade.ts) | Façades supplémentaires pour un `main.ts` mince (Phase B.2 / G). `prepareDesktopBoot` (boot.ts) + ces helpers couvrent le shell platform avant le métier vertical (catalogue, tabs, AI workspace…). |
| [`src/splash-ui.ts`](../src/splash-ui.ts) | Splash de démarrage — modèle + HTML riche (aucun import Electron). Port brand-agnostic de electron/splash-ui.ts (TF2) — productName / bridgeName / cssPrefix. |
| [`src/tray.ts`](../src/tray.ts) | Icône Tray générique — labels depuis AppManifest.productName. Port de electron/tray.ts (TF2) — setup/refresh sync (require electron). |
| [`src/updater.ts`](../src/updater.ts) | Auto-update via electron-updater (provider generic). Port de electron/updater.ts — feed URL fourni par l'appelant (manifest). Les apps marques appellent `setupAutoUpdater({ feedUrl, … })` après boot UI. |
| [`src/window-chrome.ts`](../src/window-chrome.ts) | Chrome fenêtre frameless — HTML/CSS/JS purs. Port de electron/window-chrome-html.ts, paramétré par bridgeName + cssPrefix. |

## `src/desktop/`

| Fichier | Rôle |
|---|---|
| [`src/desktop/assistant-chrome.ts`](../src/desktop/assistant-chrome.ts) | // @ts-nocheck — Electron BaseWindow / WebContentsView (shim kit mince) Chrome assistant Electron (FAB) — gold TempoFlow paramétré (deepLink / title). Electron chargé via loadElectron (pas d'import top-level — tests kit Node). |
| [`src/desktop/brand-desktop-runtime.ts`](../src/desktop/brand-desktop-runtime.ts) | Runtime desktop plateforme — extrait mécanique de tempoflow2/crm/electron/main.ts (M12). Comportement préservé ; la marque injecte deps (store, hosts, paths, vertical). |
| [`src/desktop/desktop-session.ts`](../src/desktop/desktop-session.ts) | (à documenter) |
| [`src/desktop/error-page-html.ts`](../src/desktop/error-page-html.ts) | Écran d’erreur boot / crash (hors React) — gold TempoFlow paramétré. |
| [`src/desktop/oauth-loopback.ts`](../src/desktop/oauth-loopback.ts) | // @ts-nocheck — Electron shell.openExternal (shim kit mince) OAuth 2.0 RFC 8252 (native apps) Google — gold TempoFlow paramétré. Store tokens injecté ; Electron via loadElectron (pas d'import top-level). |
| [`src/desktop/profile-picker-html.ts`](../src/desktop/profile-picker-html.ts) | Écran de profils au boot — gold TempoFlow paramétré (brand / bridge / tunnel). |
| [`src/desktop/remote-offline-html.ts`](../src/desktop/remote-offline-html.ts) | (à documenter) |

## `src/host/`

| Fichier | Rôle |
|---|---|
| [`src/host/brand-host-runtime.ts`](../src/host/brand-host-runtime.ts) | Factories host-runtime-ctx marque (O7) — singletons, fleet, CRM key surface, contexte HostRuntimeContext. Les brand opts restent dans la marque. |
| [`src/host/brand-host-stack.ts`](../src/host/brand-host-stack.ts) | Lazy host-stack marque — composition mince du kit (O7). Remplace ~220 LOC dupliqués TF/CV/Fidu par une factory + table de config. |
| [`src/host/brand-kernel-http.ts`](../src/host/brand-kernel-http.ts) | (à documenter) |
| [`src/host/brand-meili-boot.ts`](../src/host/brand-meili-boot.ts) | (à documenter) |
| [`src/host/bridge-client.ts`](../src/host/bridge-client.ts) | Pont serveur local ↔ Electron pour le pilotage bot des onglets fournisseurs. - S'authentifie auprès du serveur Next local (POST /api/v1/auth/login avec les credentials bootstrappés) et conserve le cookie de session. - S'abonne au flux SSE GET /api/v1/assistant/supplier-actions/stream (nouvelle route — voir src/server/routes/assistant.ts dans le fork). - Pour chaque événement `supplier_action`, exécute l'action via supplier-driver puis POST le résultat sur la route EXISTANTE /api/v1/assistant/ui-actions/:id/result (résout la promesse serveur). - Reconnexion automatique avec backoff. |
| [`src/host/context.ts`](../src/host/context.ts) | Contexte runtime hôte injecté dans tous les launchers B.2. Remplace les singletons TF2 (userDataDir(), paths.ts, logger). |
| [`src/host/contracts.ts`](../src/host/contracts.ts) | Contrats des launchers hôte (Hermes / n8n / tunnel) — Phase B / B.2. Les implémentations complètes sont dans host/hermes, host/n8n, host/tunnel. |
| [`src/host/crash-reporter.ts`](../src/host/crash-reporter.ts) | Rapport de crash : fichier local (userData/logs/) + envoi automatique au collecteur de l'éditeur (télémétrie de crash — service autonome sur le VPS, voir scripts/crash-collector/). Règles : - best-effort intégral : timeout court, try/catch partout, JAMAIS de throw ; - l'envoi ne bloque rien (fire-and-forget) ; - identifiant d'installation anonyme (uuid v4 généré au 1er lancement, persisté dans userData) pour regrouper les rapports d'une même machine. |
| [`src/host/ensure-kit-binaries.ts`](../src/host/ensure-kit-binaries.ts) | (à documenter) |
| [`src/host/feature-off-host.ts`](../src/host/feature-off-host.ts) | Feature-off host — contrat kit pour marques sans runtime plugins / flotte (Phase N5, extraits des signatures Fidu `host-na-stubs.ts`). Ne pas inventer de produit : réponses `ok: false` / listes vides honnêtes. Les marques à plugins réels (TF/CV) utilisent `createPluginsHost` / fleet. |
| [`src/host/host-stack.ts`](../src/host/host-stack.ts) | Accès PARESSEUX aux modules host-only — port du pattern TF2 host-stack.ts. Les apps marques construisent un HostStack via `createHostStack(deps)` et n'importent les launchers que sur les chemins allowLocalStack. |
| [`src/host/kit-os-resources.ts`](../src/host/kit-os-resources.ts) | (à documenter) |
| [`src/host/load-electron.ts`](../src/host/load-electron.ts) | Charge electron en sync pour le main CJS des marques. Évite `import "electron"` au top-level (casse les tests kit Node sans peer). |
| [`src/host/local-config.ts`](../src/host/local-config.ts) | Config locale + safeStorage — factory brand-agnostic (TF2 local-config.ts). Usage |
| [`src/host/meili-launcher.ts`](../src/host/meili-launcher.ts) | Meilisearch local OPTIONNEL — launcher générique (injecte chemins). Port de electron/meili-launcher.ts sans dépendances marque. |
| [`src/host/node-runtime.ts`](../src/host/node-runtime.ts) | Runtime Node propriété de la marque — port brand-agnostic TF2 node-runtime.ts. |
| [`src/host/npm-cli.ts`](../src/host/npm-cli.ts) | CLI npm sans PATH Windows — port brand-agnostic TF2 npm-cli.ts. |
| [`src/host/safe-storage.ts`](../src/host/safe-storage.ts) | Abstraction safeStorage Electron — chiffrement secrets local-config. Fallback plain si backend OS indisponible (documenté TF2). |
| [`src/host/server-env.ts`](../src/host/server-env.ts) | Contrats / helpers pour le lancement du serveur Next embarqué. Le spawn complet (node-runtime, secrets local-config) reste branché par l'app marque — ici le noyau brand-agnostic. |
| [`src/host/server-launcher.ts`](../src/host/server-launcher.ts) | Spawn serveur Next standalone — wrapper marque autour de `startNextServerCore` (N2). Secrets / ports / paths / spawn injectés (plus de hardcode TF2_*). |
| [`src/host/web-telemetry.ts`](../src/host/web-telemetry.ts) | // @ts-nocheck — WebContents events Electron (shim kit volontairement mince) Télémétrie des WebContents (UI CRM + onglets fournisseurs). Couvre les plantages "invisibles" côté rendu que les handlers process-level (uncaughtException…) ne voient pas : crash du process de rendu, preload qui ne charge pas, page qui échoue à charger, page qui ne répond plus, erreurs console. Chaque anomalie est loggée localement ET envoyée au collecteur |

## `src/host/ai-workspace/`

| Fichier | Rôle |
|---|---|
| [`src/host/ai-workspace/actions.ts`](../src/host/ai-workspace/actions.ts) | // @ts-nocheck — IPC WebContents + hooks marque Exécuteur bridge des actions `ai_workspace_*` (N2 kit). Route vers AiWorkspaceManager (+ supplier-tabs marque via bindings). |
| [`src/host/ai-workspace/bindings.ts`](../src/host/ai-workspace/bindings.ts) | Injection marque pour ai-workspace (N2). Partitions / cookies / titres fenêtre — zéro hardcode TempoFlow. |
| [`src/host/ai-workspace/index.ts`](../src/host/ai-workspace/index.ts) | _(pas de cartouche JSDoc en tête — voir le code)_ |
| [`src/host/ai-workspace/manager.ts`](../src/host/ai-workspace/manager.ts) | // @ts-nocheck — Electron session/WebContentsView (shim kit mince) Espaces workspace dédiés aux collaborateurs IA sur le host Electron. Chaque IA a : - une WebContentsView CRM (partition `persist:{aiPartitionSlug}-<userId>`) avec JWT persona ; - son propre manager onglets (partitions isolées marque) ; - un TabWorkspaceProvider React isolé (sessionStorage de la partition). |
| [`src/host/ai-workspace/profile-window.ts`](../src/host/ai-workspace/profile-window.ts) | // @ts-nocheck Fenêtre profil collaborateur IA (P2 multi-profils, décision Q1 : in-process). Une BaseWindow dédiée par IA — « {productName} — <nom IA> » — qui porte la WebContentsView CRM persona + les onglets web de son SupplierTabManager, en PARALLÈLE de la fenêtre owner (jamais de masquage croisé). |
| [`src/host/ai-workspace/screencast.ts`](../src/host/ai-workspace/screencast.ts) | // @ts-nocheck Screencast des espaces IA — vue live à distance (lecture seule). Capture CDP `Page.startScreencast` (JPEG q55, 1280×800, everyNthFrame:2) sur la surface active de l'IA : son onglet web actif, sinon sa vue CRM. Chaque frame est ACKée immédiatement (`Page.screencastFrameAck` — sinon Chromium arrête d'en émettre), puis POSTée au serveur local (throttle |
| [`src/host/ai-workspace/types.ts`](../src/host/ai-workspace/types.ts) | Contrats mince pour découpler ai-workspace du métier supplier-tabs marque. N2 — extraction TF gold. |

## `src/host/browser-tabs/`

| Fichier | Rôle |
|---|---|
| [`src/host/browser-tabs/browser-tab-driver.ts`](../src/host/browser-tabs/browser-tab-driver.ts) | // @ts-nocheck — Electron WebContents/session (shim kit mince, N7) Exécuteur des actions `external_*` (alias déprécié `supplier_*`) sur les onglets sites externes. Architecture hybride (portage de src/components/assistant/ui-driver.tsx) : - ÉNUMÉRATION / RÉSOLUTION des cibles : JavaScript exécuté dans un MONDE ISOLÉ de la page (executeJavaScriptInIsolatedWorld) — même logique que |
| [`src/host/browser-tabs/browser-tab-manager.ts`](../src/host/browser-tabs/browser-tab-manager.ts) | // @ts-nocheck — Electron WebContents/session (shim kit mince, N7) Onglets sites externes : une WebContentsView par onglet, chacune dans une partition persistante `persist:fournisseur-<id>` (cookies/sessions isolés par outil, conservés entre les lancements). Layout : la vue UI CRM occupe toute la fenêtre ; la vue site active n'occupe QUE la content area du workspace (`ContentRect` : x, y, width, |
| [`src/host/browser-tabs/browser-tab-preload-path.ts`](../src/host/browser-tabs/browser-tab-preload-path.ts) | Chemin absolu du preload onglet kit (O1 — plus de façade marque). Consommé en CJS Electron (`dist-cjs`) — `__dirname` = dossier émis. |
| [`src/host/browser-tabs/browser-tab-preload.ts`](../src/host/browser-tabs/browser-tab-preload.ts) | Preload onglet navigateur (WebContentsView) — gold TF `preload-supplier`. Volontairement MINIMAL : contextIsolation + sandbox actifs, rien n'est exposé au site tiers. Le pilotage bot passe par CDP + monde isolé (browser-tab-driver), pas par ce preload. O1 : SoT kit — marques hors TF pointent ici via `browserTabPreloadPath()`. |
| [`src/host/browser-tabs/chrome-ua.ts`](../src/host/browser-tabs/chrome-ua.ts) | // @ts-nocheck — Electron WebContents/session (shim kit mince, N7) User-Agent cohérent pour toutes les vues (CRM + onglets fournisseurs). Objectif : ne PAS exposer le token `Electron/x.y` ni le nom de l'app dans l'UA (certains sites le refusent), tout en restant COHÉRENT avec les Client Hints (`Sec-CH-UA`) que Chromium renseigne déjà (brands Chromium). |
| [`src/host/browser-tabs/fake-cursor-inject.ts`](../src/host/browser-tabs/fake-cursor-inject.ts) | Script injectable (monde isolé fournisseur) — même curseur visuel que le chatbot CRM (`server/ui/components/assistant/fake-cursor.ts` côté repo marque — SVG + badge IA + halo de clic). Nécessaire car la WebContentsView fournisseur est AU-DESSUS de la vue CRM : le singleton DOM du chatbot ne peut pas peindre par-dessus. On réutilise donc le même design / timing dans la page fournisseur avant le clic CDP. |
| [`src/host/browser-tabs/index.ts`](../src/host/browser-tabs/index.ts) | Onglets sites externes génériques (N7). Vocabulaire natif = site externe / BrowserTab — pas « fournisseur » (métier TF). Alias Supplier* conservés dépréciés pour compat marques. |
| [`src/host/browser-tabs/tab-load-state.ts`](../src/host/browser-tabs/tab-load-state.ts) | Machine d'état pure du chargement d'onglet site externe (WebContentsView). Objectif UX : spinner React uniquement pour un chargement **intentionnel** (openTab / loadAndWait → intent-load). Les navigations main-frame initiées par le site (liens, redirects SPA mal classées, History API) ne doivent PAS masquer la WebContentsView — sinon flash « Chargement du site… » et impression de reload de toute la zone contenu. Ne jamais rebloquer l'UI sur did-start-loading parasite (iframes, sous-ressources) après did-finish-load. |
| [`src/host/browser-tabs/tab-url.ts`](../src/host/browser-tabs/tab-url.ts) | Comparaison d'URL « même document » pour onglets sites externes. Garder aligné avec src/lib/tab-document-url.ts (rootDir Electron isolé). |

## `src/host/hermes/`

| Fichier | Rôle |
|---|---|
| [`src/host/hermes/crm-key.ts`](../src/host/hermes/crm-key.ts) | Clé API CRM dédiée à Hermes — fichier local + upsert SQLite via sous-process. Gold TempoFlow paramétré (prefix / file / env keys / paths injectés). |
| [`src/host/hermes/ensure-crm-key-db.ts`](../src/host/hermes/ensure-crm-key-db.ts) | Sous-process Node vanilla — upsert clé service dans api_keys. Usage : node ensure-crm-key-db.js <dbPath> <apiKey> <name> [scopes] Ne jamais importer depuis electron/main (ABI better-sqlite3). |
| [`src/host/hermes/launcher.ts`](../src/host/hermes/launcher.ts) | Sidecar Hermes Agent + WebUI — factory brand-agnostic. SoT extrait de TempoFlow hermes-launcher.ts (R3.3) — chemins gold intacts. |
| [`src/host/hermes/runtime-bootstrap.ts`](../src/host/hermes/runtime-bootstrap.ts) | Bootstrap runtime Hermes (agent CLI + WebUI) — download-on-first-run. Le full Python/venv n’est PAS dans l’exe (taille / remote-build). Au premier Héberger sans CLI, on lance l’installeur officiel NousResearch, puis on récupère l’archive WebUI pinée (checksum SHA-256) sous userData. Chemins injectés via HostRuntimeContext (SoT kit — jumeau marque interdit). |
| [`src/host/hermes/skills-seed.ts`](../src/host/hermes/skills-seed.ts) | (à documenter) |

## `src/host/meili/`

| Fichier | Rôle |
|---|---|
| [`src/host/meili/coherence-db.ts`](../src/host/meili/coherence-db.ts) | Accès SQLite pour la cohérence Meili — process Node vanilla uniquement (better-sqlite3 ABI Node). Ne jamais importer depuis electron/main.ts. Compteurs alignés sur l'indexeur catalogue (tables via `configureMeiliCatalogSqlTables` — défaut TF produits + fournisseurs). |
| [`src/host/meili/coherence-query.ts`](../src/host/meili/coherence-query.ts) | CLI Node vanilla : lit counts SQL + fingerprint (JSON sur stdout). Spawn depuis electron/main via nodeBinary() + NODE_PATH (better-sqlite3). DB_PATH=... node …/meili/coherence-query.js Dual-build safe : pas d'`import.meta` (CJS Electron). |
| [`src/host/meili/coherence.ts`](../src/host/meili/coherence.ts) | Cohérence SQLite ↔ Meili au boot Electron. IMPORTANT : pas de better-sqlite3 ici (ABI Node ≠ Electron). Les lectures SQLite passent par un spawn Node vanilla (meili-coherence-query.js). |
| [`src/host/meili/feed.ts`](../src/host/meili/feed.ts) | (à documenter) |
| [`src/host/meili/generic-indexer.ts`](../src/host/meili/generic-indexer.ts) | (à documenter) |
| [`src/host/meili/index-schema.ts`](../src/host/meili/index-schema.ts) | Schéma logique des index Meili catalogue (TF gold — N2). Bumper INDEX_SCHEMA_VERSION à chaque changement d'indexes / settings / docs pour forcer une réindexation au boot. Index réels (voir electron/meili-indexer.ts) : - tf2_produits - tf2_marketplaces - tf2_all (unifié keyword = marketplaces uniquement) Les marques injectent leur propre schema via `configureMeiliCatalogSqlTables` (tables SQL comptées). |
| [`src/host/meili/index.ts`](../src/host/meili/index.ts) | _(pas de cartouche JSDoc en tête — voir le code)_ |
| [`src/host/meili/indexer.ts`](../src/host/meili/indexer.ts) | // @ts-nocheck — better-sqlite3 runtime (cwd marque) Indexeur Meilisearch catalogue (TF gold N2) — portage TypeScript de scripts/index_meilisearch.py (v2 « agrégateurs », ~464k produits). Exécuté comme script Node autonome (PAS dans Electron) : DB_PATH=… MEILI_HOST=… node build/electron/meili-indexer.js |

## `src/host/n8n/`

| Fichier | Rôle |
|---|---|
| [`src/host/n8n/agent-isolation.ts`](../src/host/n8n/agent-isolation.ts) | Étanchéité par collaborateur IA (Q2 multi-profils) — gold TempoFlow paramétré. |
| [`src/host/n8n/api-key.ts`](../src/host/n8n/api-key.ts) | Provisionnement silencieux d’une API key n8n (REST public /api/v1). Gold TempoFlow — labels / fichier paramétrables par marque. |
| [`src/host/n8n/launcher.ts`](../src/host/n8n/launcher.ts) | Sidecar n8n — factory brand-agnostic. SoT extrait de TempoFlow n8n-launcher.ts (R3.3) — chemins gold intacts. Clés API / agent = hooks verticaux (onN8nReady, getN8nNextEnvExtra, n8nAgentKeys). |
| [`src/host/n8n/runtime-bootstrap.ts`](../src/host/n8n/runtime-bootstrap.ts) | Bootstrap runtime n8n — download-on-first-run via npm (Node embarqué). L’arbre npm n’est PAS dans l’exe (taille). Au premier mode embedded sans entry, on `npm install n8n@pin` sous userData/n8n-runtime. Chemins injectés via HostRuntimeContext (SoT kit — jumeau marque interdit). |

## `src/host/plugins/`

| Fichier | Rôle |
|---|---|
| [`src/host/plugins/accept-check.ts`](../src/host/plugins/accept-check.ts) | Accept-check plugins — port TF gold plugin-accept-check.ts (N1). |
| [`src/host/plugins/brand-bindings.ts`](../src/host/plugins/brand-bindings.ts) | Injection marque pour le runtime plugins kit (N1). Les modules sous `host/plugins` ne hardcodent plus TEMPOFLOW_/TF2_ : la marque appelle `configurePluginHost(bindings)` au boot. Aliases documentés : - primaire : `${envPrefix}_*` (ex. TEMPOFLOW_PLUGIN_ID, CERTIVAN_API_URL) - legacy optionnels : `legacyEnvAliases` (ex. TF2_* pour TempoFlow) |
| [`src/host/plugins/control-adapters.ts`](../src/host/plugins/control-adapters.ts) | Factory adapters control-plane — port générique TF plugin-control-adapters (N1). Injection marque : readHostCrmApiKey, envPrefix (+ aliases), plugins CRM port. |
| [`src/host/plugins/control-extras.ts`](../src/host/plugins/control-extras.ts) | Control-plane plugins — boot kit + extras verticaux (N1). Port TF gold plugin-control-extras.ts avec injection marque. |
| [`src/host/plugins/control-plane.ts`](../src/host/plugins/control-plane.ts) | Control plane plugins — façade electron-shell sur @creezio/product-hub. C7 : point d'entrée unifié `startHostPluginControlPlane` (4 boots). |
| [`src/host/plugins/control-token.ts`](../src/host/plugins/control-token.ts) | Token Bearer control plane plugins — brand-agnostic (TF2 plugin-control-token). Env bridge : clés génériques + `{ENV_PREFIX}_*` (plus de hardcode TEMPOFLOW_). |
| [`src/host/plugins/crm-key.ts`](../src/host/plugins/crm-key.ts) | Clé API CRM dédiée par plugin — port TF gold plugin-crm-key.ts (N1). Injection : apiKeyPrefix, crmKeyFileName, dbPath, nodeBinary, nodeScript. |
| [`src/host/plugins/data.ts`](../src/host/plugins/data.ts) | Migrations SQLite des plugins — port TF gold plugin-data.ts (N1). NE JAMAIS importer depuis le main Electron : exécuter en sous-process Node vanilla via `bindings.nodeScript("plugin-data.js")` (cf. migratePluginData dans control-extras). Utilise `node:sqlite` (kit) — les marques peuvent injecter better-sqlite3 via `openDatabase`. |
| [`src/host/plugins/events.ts`](../src/host/plugins/events.ts) | Réexport platform-core — équivalent TF plugin-events (N1). Pas de duplication : SoT = `@creezio/platform-core`. |
| [`src/host/plugins/execution-grant.ts`](../src/host/plugins/execution-grant.ts) | Réexport platform-core — équivalent TF plugin-execution-grant (N1). Pas de duplication : SoT = `@creezio/platform-core`. |
| [`src/host/plugins/git.ts`](../src/host/plugins/git.ts) | Versioning Git local par plugin — port TF gold plugin-git.ts (N1). Injection marque : gitBinary / userDataDir / isPackaged / applyOsSandboxEnv / identité git. |
| [`src/host/plugins/host.ts`](../src/host/plugins/host.ts) | Host plugins runtime — spawn sidecars minimal (boots C7 sans bindings). Runtime riche TF (scaffold / git / control-extras / accept-check…) → `host/plugins/{runtime,launcher,git,control-extras,...}` + `configurePluginHost` (Phase N1). Product Hub → `@creezio/product-hub` + `startHostPluginControlPlane`. Reste côté marque : le wiring (`configurePluginHost`, barrels ≤40 LOC) et l'UI Admin Plugins / MCP analytics |
| [`src/host/plugins/launcher.ts`](../src/host/plugins/launcher.ts) | Spawn / stop des plugins (sidecars Node) — port TF gold plugin-launcher.ts (N1). Env brandés via `${envPrefix}_*` (+ aliases legacy TF2_*). |
| [`src/host/plugins/runtime.ts`](../src/host/plugins/runtime.ts) | Runtime plugins kit — scaffold UI + wrappers discover (N1). Types / parse / discover purs → `@creezio/platform-core`. Scaffold (CSS kit + index.js proxy CRM) porté depuis TF gold plugin-runtime.ts avec injection `envPrefix` / `productName` via brand-bindings. |
| [`src/host/plugins/test-runner.ts`](../src/host/plugins/test-runner.ts) | Runner tests plugins (`node --test`) — port TF gold plugin-test-runner.ts (N1). |

## `src/host/sandbox/`

| Fichier | Rôle |
|---|---|
| [`src/host/sandbox/embed-sandbox.ts`](../src/host/sandbox/embed-sandbox.ts) | Confinement « OS desktop » — tout ce que Hermes / n8n voient comme HOME, workspace, temp et cache npm doit vivre sous userData. Aucun import Electron : testable depuis Node. |
| [`src/host/sandbox/os-sandbox.ts`](../src/host/sandbox/os-sandbox.ts) | Politique « OS desktop Creezio » — périmètre d'exécution strict. Principe : un build packagé ne doit JAMAIS résoudre un binaire via le PATH utilisateur, ni accepter un override d'environnement pointant hors du sandbox. Les seuls exécutables légitimes sont : - ceux packagés sous `process.resourcesPath` (Node, Meili, git, cloudflared…) - ceux installés par desktop sous `{userData}` (venv Hermes, npm-cli…) - les utilitaires système FONDAMENTAUX de l'OS, résolus par CHEMIN ABSOLU connu (jamais par nom sur le PATH) : PowerShell, tar, cmd, bash. Aucun import Electron ici : module pur, test |

## `src/host/tunnel/`

| Fichier | Rôle |
|---|---|
| [`src/host/tunnel/tunnel.ts`](../src/host/tunnel/tunnel.ts) | Cloudflare Tunnel — service brand-agnostic (TF2 tunnel.ts). Provision URLs / tokens injectés via HostRuntimeContext.tunnelProvision. |
