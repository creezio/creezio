# Matrice Natif / Métier / Plugin

> Cartographie **Phase H0** (2026-07-29), **réalignée Phase D0** post
> I0→I18 (kit tip ~`520bb56`, TF 0.10.30 · Certivan 0.1.14 · Fidu 0.1.55).  
> Légende : **✅** livré / utilisable · **🟡** partiel (dette post-I18
> documentée D1–D6) · **❌** absent / hors scope volontaire.

Source cadre : [ARCHITECTURE-INTENTION.md](ARCHITECTURE-INTENTION.md).  
Dette post-I18 : [PHASE-D0.md](PHASE-D0.md) → D1…D6.

---

## 1. Natif Creezio — packages / capacités

| Capacité | Package cible (ou existant) | Statut | Preuve / écart |
|----------|-----------------------------|--------|----------------|
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
| Console ops | `apps/console` | ✅ | kit-versions (+ `ARCHITECTURE_VERSION` I0), feeds, gates, POST-H5 |
| **Auth** (session, login, recovery) | `@creezio/auth` | ✅ | Mémoire + **`createSqliteAuthStore` I1** + IPC + `AUTH_CORE_SQL` ; TF conso I13 (surface produit historique encore Hono — dette **D2**) |
| **Shell-UI / nav + slots** | `@creezio/shell-ui` | ✅ | **I7** : `createNavShellAdapter` + `NavRenderModel` ; TF/Certivan/Fidu I12/I16/I18 |
| **Assistant / chat** | `@creezio/assistant` | ✅ | Mémoire + **`createSqliteAssistantStore` I2** ; TF I13 (dette unif. **D2**) |
| **API kernel** (façade HTTP cœur) | `@creezio/api-kernel` | ✅ | ScopedDbAccess H2 + `authorizePluginAccess` H5 |
| **MCP façade / proxy** | `@creezio/mcp-facade` | ✅ | H4 aliases/policies + H5 deny plugin ; TF : dualité Hono `/mcp` vs façade Electron = dette **D1** |
| **Tasks** (natif plateforme) | `@creezio/tasks` | ✅ | CRUD + mount + **`createSqliteTasksStore` I3** ; TF mounts I13 (dette **D2**) |
| **Mails** (natif plateforme) | `@creezio/mails` | ✅ | SQLite + **`file-sink`** I3 ; TF I13 (dette **D2**) |
| Sync vendor standardisé | `scripts/sync-creezio-vendor.sh` | ✅ | **I0** — assert `ARCHITECTURE_VERSION=H6`, CJS, wrappers 3 marques |
| Politique republish | [REPUBLISH-POLICY.md](REPUBLISH-POLICY.md) | ✅ | I14/I16/I18 livrés ; suite D3/D4/D5 si runtime packaged |
| **SQLite multi-fichiers** (core / brand / plugin) | `@creezio/platform-core` | ✅ | paths H1 + `createSqliteRuntime` / migrations H2 |
| Splash / host stack (contrat lazy) | `@creezio/electron-shell` | ✅ | splash + host-stack pattern ; Fidu `clientSlim: false` — ADR I17, réouverture **D5** |

---

## 2. Modules métier TempoFlow (exemples) — **repo marque**, pas kit

Ces lignes restent dans **tempoflow2** (ou équivalent). Statut = existence
produit observée — **pas** une cible d’extraction kit.

| Module métier | Repo | Statut produit | Extraction / mounts brand | Notes kit / dette |
|---------------|------|----------------|---------------------------|-------------------|
| Panier | tempoflow2 | ✅ | ✅ `modules/panier` API+MCP+nav | Jamais dans `@creezio/*` |
| Dispatch | tempoflow2 | ✅ | ✅ `modules/dispatch` API+MCP+nav | Idem |
| Relevés | tempoflow2 | ✅ | ✅ `modules/releves` API+MCP+nav | Idem |
| Optimiser | tempoflow2 | ✅ | ✅ nav via dispatch (`brand.optimiser`) | Algo reste lib TF |
| Catalogue / catalog-sync | tempoflow2 | ✅ | ✅ **I11** API+MCP+nav (`createCatalogueMount`) | Plus 🟡 — faux écart corrigé D0 |
| Supplier tabs / marketplaces | tempoflow2 | ✅ | ✅ nav `brand.fournisseurs` (+ catalogue) | UI fournisseurs brand |
| Stack | tempoflow2 | ✅ | ✅ **I11** API+MCP+nav (`createStackMount`) | Plus 🟡 — faux écart corrigé D0 |
| Scan | tempoflow2 | ✅ | ✅ **I11** nav + mount status UI-only | Produit = UI → panier ; API métier réelle = **D3** si besoin |
| Fleet | tempoflow2 | ✅ | — (plateforme Electron) | Hors brand métier |

**Contrat d’accueil kit** : ✅ shell-ui + api-kernel + MCP scindé.  
**H3 / I11** : modules TF dans `tempoflow2/crm/electron/modules/` +
`brand-runtime.ts` (voir [PHASE-H3.md](PHASE-H3.md), [PHASE-I11.md](PHASE-I11.md)).

Autres marques (indicatif, hors extraction) :

| Marque | Exemples métier | Repo | Conso H6 |
|--------|-----------------|------|----------|
| Fidu | GED, CRM fiduciaire… | `/opt/docker/fidu` | I17–I18 **0.1.55** ; HTTP control-plane plugins = **D4** |
| Certivan | RTI / VASP… | `/opt/docker/certivan-app` | I15–I16 **0.1.14** ; polish gaps = **D6** |

---

## 3. Plugins — sidecars organisation

| Capacité | Où | Statut | Notes |
|----------|-----|--------|-------|
| Manifest / events / execution grant | `@creezio/platform-core` | ✅ | Contrats purs |
| Lifecycle / PRD / impact / n8n tags / ACL | `@creezio/product-hub` | ✅ | + `createSqliteProductHubStore` (H1.8) ; demobrand opt-in sqlite |
| Control plane HTTP host | `@creezio/electron-shell` + product-hub | ✅ | **I4** kit + demobrand ; **TF I10** + **Certivan I16** branchés ACL L3 ; **Fidu** store prêt, HTTP = **D4** |
| Registre org L3 | `@creezio/propagation` | ✅ | **I6** : `createFileOrgPluginRegistry` + console `/api/org-plugins` |
| UI Admin Plugins multi-org | demobrand + product-hub admin | ✅ | **I5** : `admin-plugins` API + HTML ; caps see/install/execute |
| DB `plugin/<id>` à l’install | `@creezio/platform-core` `ensurePluginDb` | ✅ | Fichier créé à l’install uniquement |
| ACL granulaire qui voit/utilise | product-hub `acl` + sqlite store | ✅ | **L3 livré** TF/Certivan/Fidu (I10/I16/I18) — plus « L4 user-only » |
| Univers perso totalement séparé | — | ❌ *(volontaire)* | Hors scope — plugins = **orga** |

Promotion plugin → module natif **marque** : processus humain (voir architecture) ;
point d’extension `vertical.plugin.promoted` / `kit.plugin.accepted` déjà
nommés dans `@creezio/propagation` (contrats, pas automation).

---

## 4. Synthèse rapide (post-I18 / D0)

| Couche | ✅ | 🟡 (dette D*) | ❌ |
|--------|----|---------------|-----|
| Natif (socle A–G + H1–H6 + I0–I8) | brand-config, shell, platform-core, electron-shell, product-hub ACL H5, tooling, factory, propagation, console, api-kernel, mcp-facade, auth, shell-ui, assistant, tasks, mails | Dualité MCP TF (**D1**) ; stores kit vs Hono historiques TF (**D2**) | — |
| Métier TF (repo marque) | panier, dispatch, releves, catalogue, stack, scan (status), MCP H4, ACL L3 I10, shell-ui I12, republish 0.10.30 | Scan API métier si produit l’exige (**D3**) | — |
| Plugins | hub + host + DB `plugin/<id>` + ACL L3 kit + conso TF/Certivan/Fidu + E2E demobrand | Fidu HTTP control-plane (**D4**) ; Fidu `clientSlim` ADR (**D5**) ; Certivan polish (**D6**) | auto-promotion *(volontaire)* ; univers perso *(volontaire)* ; cloud registry *(volontaire)* |

**H5 terminée** = ACL plugins durcie.  
**Plan H0–H5 + I0–I18** = **complet** (conso 3 marques 100 %).  
**D0** = alignement docs/matrice (ce fichier) — pas de code runtime.  
Suite code : [PHASE-D0.md](PHASE-D0.md) → **D1** (MCP une stack).
