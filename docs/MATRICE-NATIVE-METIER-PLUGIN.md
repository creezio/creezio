# Matrice Natif / Métier / Plugin

> Cartographie **Phase H0** (2026-07-29), réalignée **D0** puis **C0**
> (correction post-audit). Versions courantes : TF **0.10.31** · Certivan
> **0.1.14** · Fidu **0.1.56**.  
> Légende : **✅** livré / utilisable · **🟡** partiel (demi-mesure —
> fermeture [PHASE-C0.md](PHASE-C0.md) → C1…C8) · **❌** absent / hors
> scope volontaire.

Source cadre : [ARCHITECTURE-INTENTION.md](ARCHITECTURE-INTENTION.md).  
Dette D* : [PHASE-D0.md](PHASE-D0.md). Correction : [PHASE-C0.md](PHASE-C0.md).

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
| **Fabrique plugins conversationnelle** | `@creezio/product-hub` (+ demobrand/console) | ✅ | **C3** scaffold réel (schema/api/mcp) + console SQLite persist + `PrdDrafter` LLM opt. (socle V1 supersédé) |
| **Observabilité** (activité / usages / CP) | `@creezio/observability` | 🟡 | **V2** package + demobrand ; console mémoire / pas vendor marques — **C4** persist + sync |
| **Automations** data-driven | `@creezio/automations` | 🟡 | **V3** package + demobrand ; rules/runs éphémères — **C4** SQLite + ≥1 marque |
| Plugins host (spawn, grants, events) | platform-core + electron-shell | ✅ | `plugins/*`, control plane + `acl` option H5 |
| Desktop tooling publish / remote-build | `@creezio/desktop-tooling` | ✅ | publish-desktop, remote-build-win, after-pack |
| Factory new-app | `@creezio/factory` | ✅ | scaffold Client+Serveur + demobrand |
| Propagation kit→marques | `@creezio/propagation` | ✅ | semver, impact, canaux, extension points, registre L3 |
| Console ops | `apps/console` | ✅ | kit-versions (+ `ARCHITECTURE_VERSION` I0), feeds, gates, POST-H5 |
| **Auth** (session, login, recovery) | `@creezio/auth` | ✅ | Mémoire + **`createSqliteAuthStore` I1** ; **TF C1** SoT kit credentials + JWT/ACL brand |
| **Shell-UI / nav + slots** | `@creezio/shell-ui` | ✅ | **I7** : `createNavShellAdapter` + `NavRenderModel` ; TF/Certivan/Fidu I12/I16/I18 |
| **Assistant / chat** | `@creezio/assistant` | ✅ | **I2** + **C1** rich schema ; **TF C1** chat-db façade kit (plus dual-write) |
| **API kernel** (façade HTTP cœur) | `@creezio/api-kernel` | ✅ | ScopedDbAccess H2 + `authorizePluginAccess` H5 |
| **MCP façade / proxy** | `@creezio/mcp-facade` | ✅ | H4 aliases/policies + H5 deny plugin ; **TF D1** + **Certivan C2** : exécuteur Hono `/mcp`, façade = adaptateur + proxy |
| **Tasks** (natif plateforme) | `@creezio/tasks` | ✅ | CRUD + mount I3 ; **TF C1** SoT kit UUID + kanban/AI brand |
| **Mails** (natif plateforme) | `@creezio/mails` | ✅ | SQLite + file-sink I3 ; **TF C1** index inbound kit + PJ brand |
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
| Scan | tempoflow2 | ✅ | ✅ **D3** API resolve/search/add-to-panier + nav | Produit figé UI→panier ; pas de tables dédiées |
| Fleet | tempoflow2 | ✅ | — (plateforme Electron) | Hors brand métier |

**Contrat d’accueil kit** : ✅ shell-ui + api-kernel + MCP scindé.  
**H3 / I11** : modules TF dans `tempoflow2/crm/electron/modules/` +
`brand-runtime.ts` (voir [PHASE-H3.md](PHASE-H3.md), [PHASE-I11.md](PHASE-I11.md)).

Autres marques (indicatif, hors extraction) :

| Marque | Exemples métier | Repo | Conso H6 |
|--------|-----------------|------|----------|
| Fidu | GED, CRM fiduciaire… | `/opt/docker/fidu` | I17–I18 + D4/D5 **0.1.56** ; mounts métier minces → **C5** ; CP host unifié → **C7** |
| Certivan | RTI / VASP… | `/opt/docker/certivan-app` | I15–I16 **0.1.14** ; D6 aliases ; **C2** MCP+stores cutover ; RTI UI-only → **C6** |

---

## 3. Plugins — sidecars organisation

| Capacité | Où | Statut | Notes |
|----------|-----|--------|-------|
| Manifest / events / execution grant | `@creezio/platform-core` | ✅ | Contrats purs |
| Lifecycle / PRD / impact / n8n tags / ACL | `@creezio/product-hub` | ✅ | + `createSqliteProductHubStore` (H1.8) ; demobrand opt-in sqlite |
| Fabrique conversationnelle (intention→plugin) | product-hub factory + demobrand | ✅ | **C3** scaffold réel + console SQLite + PrdDrafter |
| Control plane HTTP host | `@creezio/electron-shell` + product-hub | 🟡 | **I4** + TF/Certivan/Fidu présents mais **3 styles** — unifier `startHostPluginControlPlane` = **C7** |
| Registre org L3 | `@creezio/propagation` | ✅ | **I6** : `createFileOrgPluginRegistry` + console `/api/org-plugins` |
| UI Admin Plugins multi-org | demobrand + product-hub admin | ✅ | **I5** : `admin-plugins` API + HTML ; caps see/install/execute |
| DB `plugin/<id>` à l’install | `@creezio/platform-core` `ensurePluginDb` | ✅ | Fichier créé à l’install uniquement |
| ACL granulaire qui voit/utilise | product-hub `acl` + sqlite store | ✅ | **L3 livré** TF/Certivan/Fidu (I10/I16/I18) — plus « L4 user-only » |
| Univers perso totalement séparé | — | ❌ *(volontaire)* | Hors scope — plugins = **orga** |

Promotion plugin → module natif **marque** : processus humain (voir architecture) ;
point d’extension `vertical.plugin.promoted` / `kit.plugin.accepted` déjà
nommés dans `@creezio/propagation` (contrats, pas automation).

---

## 4. Synthèse rapide (post-audit / C0)

| Couche | ✅ | 🟡 (correction C*) | ❌ |
|--------|----|-------------------|-----|
| Natif socle | brand-config, shell, platform-core, electron-shell, product-hub ACL H5, tooling, factory, propagation, api-kernel, mcp-facade TF D1/C2, shell-ui, fabrique C3 | V2/V3 console/vendor (**C4**) ; CP multi-styles (**C7**) | — |
| Métier TF | panier, dispatch, releves, catalogue, stack, scan D3, MCP D1, ACL L3, republish **0.10.31** | stores D2 pas cutover (**C1**) | — |
| Métier Fidu / Certivan | foundation + ACL + feeds | Fidu mounts (**C5**) ; Certivan dualités (**C2**) + RTI (**C6**) | — |
| Plugins | hub + ACL L3 3 marques + Fidu D4 HTTP ; clientSlim false D5 ; fabrique C3 | obs/automations non vendor (**C4**) ; CP unifié (**C7**) | auto-promotion / univers perso / cloud registry *(volontaire)* |

**Socle** H0–H5 + I0–I18 + D0–D6 + V1–V3 = **signé** (pas « 100 % produit »).  
**Correction** : [PHASE-C0.md](PHASE-C0.md) → C1…C8.  
Vision sign-off + addendum : [VISION-V1-V3.md](VISION-V1-V3.md).
