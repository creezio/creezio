# Matrice Natif / Métier / Plugin

> Cartographie initiale **Phase H0** (2026-07-29).  
> Statuts basés sur l’audit kit post Phases A→G + vertical TempoFlow observé
> (sans modifier les repos marques).  
> Légende : **✅** livré / utilisable · **🟡** partiel (contrats, stubs, ou
> runtime encore dans la marque) · **❌** absent du kit / non démarré.

Source cadre : [ARCHITECTURE-INTENTION.md](ARCHITECTURE-INTENTION.md).

---

## 1. Natif Creezio — packages / capacités cibles H1

| Capacité | Package cible H1 (ou existant) | Statut | Preuve / écart |
|----------|--------------------------------|--------|----------------|
| Identité marque / manifests | `@creezio/brand-config` | ✅ | `AppManifest`, Client+Serveur, manifests TF/Certivan/Fidu/DemoBrand |
| Paths / ports / profiles / local-config schéma | `@creezio/platform-core` | ✅ | paths, app-kind, connection, updater-state, embeds catalog |
| Preload / IPC / DesktopBridge | `@creezio/shell` | ✅ | `IpcChannels`, `createDesktopApi`, types bridge |
| Runtime Electron (boot, updater, tray, splash, window) | `@creezio/electron-shell` | ✅ | splash-ui, tray, updater, prepareDesktopBoot |
| Host Meili / search | `@creezio/electron-shell` (+ paths) | ✅ | `host/meili-launcher`, `resolveMeiliDataDir` |
| Host tunnel | `@creezio/electron-shell` + platform-core | ✅ | `host/tunnel`, `tunnel-urls` |
| Host n8n | `@creezio/electron-shell` | ✅ | `host/n8n/*` (B.2) |
| Host Hermes | `@creezio/electron-shell` | ✅ | `host/hermes/*` (B.2) |
| Product Hub / plugins lifecycle + ACL L3/L4 | `@creezio/product-hub` | ✅ | H5 : `decidePluginAccess` see/install/execute + binding org + deny cross-org |
| Plugins host (spawn, grants, events) | platform-core + electron-shell | ✅ | `plugins/*`, control plane + `acl` option H5 |
| Desktop tooling publish / remote-build | `@creezio/desktop-tooling` | ✅ | publish-desktop, remote-build-win, after-pack |
| Factory new-app | `@creezio/factory` | ✅ | scaffold Client+Serveur + demobrand |
| Propagation kit→marques | `@creezio/propagation` | ✅ | semver, impact, canaux, extension points, registre L3 |
| Console ops | `apps/console` | ✅ | kit-versions, feeds, gates |
| **Auth** (session, login, recovery) | `@creezio/auth` | ✅ | Store + IPC bind + `AUTH_CORE_SQL` ; UI marques encore verticale |
| **Shell-UI / nav + slots** | `@creezio/shell-ui` | ✅ | `CORE_NAV_ITEMS` + `registerBrandNav` ; demobrand/factory branchés |
| **Assistant / chat** | `@creezio/assistant` | ✅ | Store mémoire + surface IPC ; persistance sqlite core = raffinement |
| **API kernel** (façade HTTP cœur) | `@creezio/api-kernel` | ✅ | ScopedDbAccess H2 + `authorizePluginAccess` H5 |
| **MCP façade / proxy** | `@creezio/mcp-facade` | ✅ | H4 aliases/policies + H5 `createDenyUnauthorizedPluginToolPolicy` + JWT `orgId` |
| **Tasks** (natif plateforme) | `@creezio/tasks` | ✅ | CRUD + mount api-kernel ; distinct Product Hub tasks |
| **Mails** (natif plateforme) | `@creezio/mails` | ✅ | Draft/send stub + providers ; pas de templates marque |
| **SQLite multi-fichiers** (core / brand / plugin) | `@creezio/platform-core` | ✅ | paths H1 + `createSqliteRuntime` / migrations H2 |
| Splash / host stack (contrat lazy) | `@creezio/electron-shell` | ✅ | splash + host-stack pattern |

---

## 2. Modules métier TempoFlow (exemples) — **repo marque**, pas kit

Ces lignes restent dans **tempoflow2** (ou équivalent). Statut = existence
produit observée au gate G3 / matrice vertical — **pas** une cible d’extraction
kit.

| Module métier | Repo | Statut produit | Extraction H3 (brand mounts) | Notes kit |
|---------------|------|----------------|------------------------------|-----------|
| Panier | tempoflow2 | ✅ | ✅ `modules/panier` API+MCP+nav | Jamais dans `@creezio/*` |
| Dispatch | tempoflow2 | ✅ | ✅ `modules/dispatch` API+MCP+nav | Idem |
| Relevés | tempoflow2 | ✅ | ✅ `modules/releves` API+MCP+nav | Idem |
| Optimiser | tempoflow2 | ✅ | ✅ nav via dispatch (`brand.optimiser`) | Algo reste lib TF |
| Catalogue / catalog-sync | tempoflow2 | ✅ | 🟡 nav + mig catalog_min | Mount API suite |
| Supplier tabs / marketplaces | tempoflow2 | ✅ | 🟡 nav `brand.fournisseurs` | Idem |
| Stack | tempoflow2 | ✅ | 🟡 nav + mig `stack_items` | Mount API suite |
| Scan | tempoflow2 | ✅ | 🟡 nav `brand.scan` | UI → panier |
| Fleet | tempoflow2 | ✅ | — (plateforme Electron) | Hors brand métier |

**Contrat d’accueil kit** : ✅ shell-ui + api-kernel + MCP scindé.
**H3** : modules TF dans `tempoflow2/crm/electron/modules/` +
`brand-runtime.ts` (voir [PHASE-H3.md](PHASE-H3.md)).

Autres marques (indicatif, hors extraction) :

| Marque | Exemples métier | Repo |
|--------|-----------------|------|
| Fidu | GED, CRM fiduciaire, Paperclip… | `/opt/docker/fidu` |
| Certivan | RTI / VASP… | `/opt/docker/certivan-app` |

---

## 3. Plugins — sidecars organisation

| Capacité | Où | Statut | Notes |
|----------|-----|--------|-------|
| Manifest / events / execution grant | `@creezio/platform-core` | ✅ | Contrats purs |
| Lifecycle / PRD / impact / n8n tags / ACL | `@creezio/product-hub` | ✅ | + `createSqliteProductHubStore` (H1.8) ; demobrand opt-in sqlite |
| Control plane HTTP host | `@creezio/electron-shell` + product-hub | 🟡 | Tokens kit prêts ; runtime partiellement local marques (dette DoD A–G) |
| Registre org L3 | `@creezio/propagation` | 🟡 | Mémoire + extension points ; pas de persistance prod kit |
| DB `plugin/<id>` à l’install | `@creezio/platform-core` `ensurePluginDb` | ✅ | Fichier créé à l’install uniquement |
| ACL granulaire qui voit/utilise | product-hub `acl` + sqlite store | ✅ | Contrats L3/L4 + persistance core kit |
| Univers perso totalement séparé | — | ❌ *(volontaire)* | Hors scope — plugins = **orga** |

Promotion plugin → module natif **marque** : processus humain (voir architecture) ;
point d’extension `vertical.plugin.promoted` / `kit.plugin.accepted` déjà
nommés dans `@creezio/propagation` (contrats, pas automation).

---

## 4. Synthèse rapide

| Couche | ✅ | 🟡 | ❌ |
|--------|----|----|-----|
| Natif (socle A–G + H1–H5) | brand-config, shell, platform-core (+ SqliteRuntime + uninstallPlugin), electron-shell, product-hub (ACL H5), tooling, factory, propagation, console, api-kernel, mcp-facade, auth, shell-ui, assistant, tasks, mails | control-plane runtime marques (sans `acl` tant que non branché) | — |
| Métier TF (repo marque) | panier, dispatch, releves + MCP unifié H4 | catalogue/stack mounts API | — |
| Plugins | hub + host + DB `plugin/<id>` + ACL L3 kit (see/install/execute, deny cross-org) + E2E demobrand | TF `plugin-acl` encore L4 user-only → conso L3 progressive | auto-promotion *(volontaire)* |

**H5 terminée** = ACL plugins durcie (L3 + policies API/MCP/control-plane).
**Plan H0–H5** = complet ; gaps post = consommation marques progressive.
