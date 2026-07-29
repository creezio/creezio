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
| Product Hub / plugins lifecycle + ACL L3/L4 | `@creezio/product-hub` | ✅ | lifecycle, PRD, grants, control-plane, schema-sql contrat |
| Plugins host (spawn, grants, events) | platform-core + electron-shell | ✅ | `plugins/*`, control plane host |
| Desktop tooling publish / remote-build | `@creezio/desktop-tooling` | ✅ | publish-desktop, remote-build-win, after-pack |
| Factory new-app | `@creezio/factory` | ✅ | scaffold Client+Serveur + demobrand |
| Propagation kit→marques | `@creezio/propagation` | ✅ | semver, impact, canaux, extension points, registre L3 |
| Console ops | `apps/console` | ✅ | kit-versions, feeds, gates |
| **Auth** (session, login, recovery) | `@creezio/auth` *(à créer)* | 🟡 | Canaux IPC `auth:*` + secrets local-config ; handlers/UI encore marques |
| **Shell-UI / nav + slots** | `@creezio/shell-ui` *(à créer)* | 🟡 | Placeholders factory `nav-core` + `vertical-slot` ; pas de package slots typé |
| **Assistant / chat** | `@creezio/assistant` *(à créer)* | 🟡 | IPC `assistant:*` / `llm:*`, `assistant_chats.db`, Hermes ; pas de package unifié |
| **API kernel** (façade HTTP cœur) | `@creezio/api-kernel` *(à créer)* | ❌ | APIs encore dans Next des marques |
| **MCP façade / proxy** | `@creezio/mcp-facade` *(à créer)* | ❌ | `mcpJwtSecret` en config ; pas de proxy tools cœur+modules+plugins |
| **Tasks** (natif plateforme) | `@creezio/tasks` *(à créer)* | 🟡 | Tasks Product Hub (plugins) en mémoire/SQL vertical ; pas de module tasks app natif kit |
| **Mails** (natif plateforme) | `@creezio/mails` *(à créer)* | ❌ | Présent côté marques (ex. TF) ; hors kit |
| **SQLite multi-fichiers** (core / brand / plugin) | extension `@creezio/platform-core` (+ stores) | 🟡 | `resolveDbPath` + `assistant_chats.db` ; pas encore `core`/`brand`/`plugin/<id>` |
| Splash / host stack (contrat lazy) | `@creezio/electron-shell` | ✅ | splash + host-stack pattern |

---

## 2. Modules métier TempoFlow (exemples) — **repo marque**, pas kit

Ces lignes restent dans **tempoflow2** (ou équivalent). Statut = existence
produit observée au gate G3 / matrice vertical — **pas** une cible d’extraction
kit.

| Module métier | Repo | Statut produit | Notes kit |
|---------------|------|----------------|-----------|
| Panier | tempoflow2 | ✅ | Vertical — ne pas monter dans `@creezio/*` |
| Dispatch | tempoflow2 | ✅ | Idem |
| Relevés | tempoflow2 | ✅ | Idem |
| Optimiser | tempoflow2 | ✅ | Idem |
| Catalogue / catalog-sync | tempoflow2 | ✅ | Idem |
| Supplier tabs / marketplaces | tempoflow2 | ✅ | Idem |
| Fleet | tempoflow2 | ✅ | Idem |
| Scan | tempoflow2 | ✅ | Idem |

**Contrat d’accueil kit** (slots / façade) : 🟡 placeholders factory uniquement.

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
| Lifecycle / PRD / impact / n8n tags / ACL | `@creezio/product-hub` | ✅ | Store SQLite = encore vertical (mémoire en demobrand) |
| Control plane HTTP host | `@creezio/electron-shell` + product-hub | 🟡 | Tokens kit prêts ; runtime partiellement local marques (dette DoD A–G) |
| Registre org L3 | `@creezio/propagation` | 🟡 | Mémoire + extension points ; pas de persistance prod kit |
| DB `plugin/<id>` à l’install | — | ❌ | Décision H0 ; à implémenter H1+ |
| ACL granulaire qui voit/utilise | product-hub `acl` | 🟡 | Contrats L3/L4 ; persistance SQL marques |
| Univers perso totalement séparé | — | ❌ *(volontaire)* | Hors scope — plugins = **orga** |

Promotion plugin → module natif **marque** : processus humain (voir architecture) ;
point d’extension `vertical.plugin.promoted` / `kit.plugin.accepted` déjà
nommés dans `@creezio/propagation` (contrats, pas automation).

---

## 4. Synthèse rapide

| Couche | ✅ | 🟡 | ❌ |
|--------|----|----|-----|
| Natif (socle A–G) | brand-config, shell, platform-core, electron-shell hosts, product-hub, tooling, factory, propagation, console | auth, shell-ui/slots, assistant, tasks, sqlite multi-fichiers, control-plane runtime | api-kernel, mcp-facade, mails |
| Métier TF (repo marque) | modules listés | slots d’accueil kit | — |
| Plugins | contrats hub + host | store/ACL runtime, registre L3 | DB par plugin, auto-promotion |

**Prêt pour H1** = combler les ❌ natifs prioritaires et solidifier les 🟡
(auth, shell-ui, assistant, api-kernel, mcp-facade, sqlite layout) sans
déplacer le métier TempoFlow dans le kit.
