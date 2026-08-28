# AGENTS.md — @creezio/electron-shell

## Mission

Maintenir le runtime Electron plateforme Creezio : host stack, desktop runtime, launchers locaux, plugins, browser-tabs, ai-workspace, crash/updater/tray/splash et bindings marque. Garder le package generique, testable et sans dependance metier verticale.

## Meili — composant CORE fail-closed (contrat marques)

**Meili = core, comme SQLite.** Quand un feed déclare ≥ 1 index :

1. **Boot fail-closed** : binaire absent / start KO ⇒ `maybeBootBrandMeili`
   **throw `MeiliRequiredError`** (échec de boot explicite, comme une DB
   absente). Plus de `engine:"sql-fallback"` par défaut. Unique
   échappatoire : `CREEZIO_ALLOW_NO_MEILI=1` (dev/tests hors-browse,
   warning bruyant, interdit en prod).
2. **Toujours Meili** pour lister/filtrer le catalogue dès que les
   filtres/tris sont dans `filterableAttributes` / `sortableAttributes` —
   **même avec `q` vide** (`/secteurs?categorie=`, `/produits?source=…`,
   pagination globale, recherche texte).
3. **Meili KO = erreur visible** : entité indexée + Meili injoignable ⇒
   **503 `{error:"meili_unavailable"}`** ; indexation initiale en cours ⇒
   `engine:"indexing"` (le client réessaie). **Zéro LIKE SQL de secours
   sur le catalogue.**
4. **SQL légitime UNIQUEMENT hors index** : entité non indexée, agrégats
   (`AVG(v_variation)`), bornes prix sur `releves_prix`, écritures, joins
   métier non projetés, EAN/`search-skus`, fiche GET by id, filtre rejeté
   par l'index (`filter_rejected` **visible**).
5. **Piège interdit** : `if (q) { meili } else { sql }` — le browse filtré
   sans texte doit aussi passer Meili (audit perf secteurs 3668bbbd).
6. Helpers publics : `browseMeiliIndexOutcome` (`@creezio/electron-shell/meili`,
   issue discriminée incident/hors-index) et `browseMeiliIndex` (compat,
   `null` = tout incident). **Ne pas** utiliser `searchMeiliIndexes` pour le
   browse (retourne `[]` si `q` vide). Entity-list kit : `configureEntityMeili`
   (`@creezio/api-kernel`) auto-branché depuis le feed
   (`configureEntityMeiliFromFeed`) — 503 fail-closed intégré.
7. **Schéma data + index par module** : chaque `BrandModuleDef` avec entité
   listable déclare `meiliIndexes` **ou** `horsIndexJustification` — doctor
   brand-spec `MODULE_MEILI_MISSING` fail-closed (0.10.13+).

Le launcher/indexer vivent ici ; la requête UI (`listProduits` etc.) reste
dans la marque mais **doit** respecter ce contrat.

## Ne pas faire

- Ne pas hardcoder `TF2`, `TEMPOFLOW`, `CERTIVAN` ou `FIDU` dans une nouvelle logique ; utiliser `envPrefix`, `AppManifest` ou bindings.
- Ne pas importer de code marque depuis ce package.
- Ne pas tirer le barrel principal dans des tests Node qui n'ont besoin que des browser-tabs ; utiliser `@creezio/electron-shell/browser-tabs`.
- Ne pas lancer un sidecar sans chemin, store, contexte et logs injectes.
- Ne pas exposer secrets BYOK, tokens control plane, cles CRM/n8n dans les logs.
- Ne pas casser les alias legacy existants sans migration explicite.
- `docs/FILES.md` est maintenu via `node scripts/generate-files-md.mjs electron-shell` (gate `test-phase-docs-freshness`) — la colonne Rôle s'édite à la main, ne pas inventer d'autre format.

## Points d'entrée

- `src/index.ts` : barrel public principal.
- `src/desktop/brand-desktop-runtime.ts` : runtime desktop complet.
- `src/host/host-stack.ts` : stack host directe.
- `src/host/brand-host-stack.ts` : wiring lazy marque.
- `src/host/brand-host-runtime.ts` : singletons et `HostRuntimeContext` marque.
- `src/host/plugins/brand-bindings.ts` : `configurePluginHost`.
- `src/host/plugins/launcher.ts` : start/stop/restart/scaffold/git plugins.
- `src/host/plugins/control-plane.ts` et `control-extras.ts` : API loopback plugins.
- `src/host/hermes/launcher.ts`, `src/host/n8n/launcher.ts`, `src/host/meili-launcher.ts`, `src/host/tunnel/tunnel.ts` : embeds.
- `src/host/meili/*` : indexer générique + schéma d'index — le **contrat
  catalogue** (filterable `categorie_id` / `famille_id` / `agregateur` /
  `fournisseur_id`, sortable `prix_min`) sert la recherche **et** le browse
  filtré sans `q` côté UI marque.
- `src/host/sandbox/embed-sandbox.ts` : blocs `config.yaml` Hermes upsertés au boot — sandbox (`CREEZIO-SANDBOX`) et `mcp_servers` (`CREEZIO-MCP`, H1 Hermes cerveau unique : URL `/mcp` loopback + Bearer clé CRM via `ctx.getHermesMcpServerConfig`) ; `reapplyHermesBridge` redémarre si le bloc manque/pointe ailleurs.
- `src/host/hermes/skills-seed.ts` : seed skills vendor — le namespace `site-*` est RÉSERVÉ aux skills appris par Hermes (jamais seedé depuis un vendor, H3). Skills kit : `resources/vendor/hermes-skills/` (`creezio-computer-use`, `creezio-site-skills`, …).
- `src/host/browser-tabs/index.ts` : sous-export browser-tabs.
- `src/host/ai-workspace/index.ts` : workspaces IA.

## Modifier sans casser

- Preserver les types publics exportes par `src/index.ts`.
- Garder les modules host-only lazy : ne pas charger Electron/sidecars au simple import si evitable.
- Pour les plugins, toute nouvelle env doit passer par `assignPluginEnv` afin de couvrir prefixe primaire et aliases legacy.
- `restartPlugin` doit rester race-safe : un ancien child ne doit pas effacer un process plus recent.
- Les preloads et partitions browser-tabs/IA doivent rester isoles.
- Les launchers doivent retourner des payloads de statut stables meme en mode remote ou feature-off.
- En cas d'erreur onglet externe, afficher/rapporter sans crash fatal du runtime.

## Config brand

Sur une marque complete, verifier l'ordre :

1. Construire `AppManifest`, paths, local config store.
2. Creer `createBrandHostRuntime` ou `createBrandHostRuntimeContext`.
3. Appeler `configurePluginHost` avant `startEnabledPlugins`, `restartPlugin`, control extras ou git plugins.
4. Appeler `configureAiWorkspaceHost` avant `AiWorkspaceManager.ensure`.
5. Appeler `configureBrowserTabs` si le preload par defaut n'est pas celui de la marque.
6. Construire `createBrandHostStack` puis passer ses getters a `installBrandDesktopRuntime`.

Verifier que `envPrefix`, `secretFilePrefix`, noms de cookies, protocoles deep-link, ports et chemins de binaires viennent de la marque.

## Tests/gates

Avant validation :

```bash
npm run typecheck -w @creezio/electron-shell
npm run build -w @creezio/electron-shell
```

Si la modification touche Electron reel, completer par un smoke de marque :

- boot client local ;
- boot serveur si supporte ;
- status Hermes/n8n/Meili/tunnel ;
- start/restart plugin avec panel ;
- browser-tab open + action simple ;
- workspace IA `ensure` + `show`.

## Fichiers sensibles

- `src/desktop/brand-desktop-runtime.ts` : boot global, IPC, restart Next, BYOK.
- `src/host/plugins/brand-bindings.ts` : contrat d'injection marque.
- `src/host/plugins/launcher.ts` : spawn sidecars plugins, env secrets, ecriture fichiers.
- `src/host/plugins/control-token.ts` et `execution-grant.ts` : tokens/grants.
- `src/host/hermes/crm-key.ts`, `src/host/n8n/api-key.ts`, `src/host/n8n/agent-isolation.ts` : secrets.
- `src/host/tunnel/tunnel.ts` : provisioner, token tunnel, ingress public.
- `src/host/browser-tabs/browser-tab-driver.ts` : CDP trusted input.
- `src/host/ai-workspace/manager.ts` : partitions IA et cookies session.
- `src/host/sandbox/*` et `src/host/node-runtime.ts` : confinement process.

## Liens

- `README.md`
- `docs/FILES.md`
- `packages/desktop-tooling/README.md`
- `packages/brand-config/README.md` si present
