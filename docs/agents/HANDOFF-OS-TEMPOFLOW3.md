# HANDOFF AGENT — OS Creezio plug-and-play + TempoFlow3 = TF2 0.10.26

> **À coller tel quel** comme prompt système / brief d’un agent plus capable.  
> Date du handoff : **2026-08-01**.  
> Repo : `https://github.com/creezio/creezio`  
> Branche : `cursor/tempoflow3-create-457d`  
> PR : `https://github.com/creezio/creezio/pull/25` (base `main`)  
> Référence produit : TempoFlow2 tag **`v0.10.26` / `e36e4d0`** dans `/agent/repos/tempoflow2` (si présent) ou clone séparé.

---

## 0. Mission (non négociable)

**Prouver qu’un agent peut créer une marque sur OS Creezio** à partir d’un BrandSpec / PRD, et que cette marque démarre avec **toutes les fonctionnalités natives plug-and-play** (Hermes, n8n, tunnel/MCP, Meili, splash/tray/embeds, setup/auth, tasks/mails…), **sans recopier TempoFlow2** et **sans glue OS dans la marque**.

Puis **TempoFlow3** doit atteindre une **parité comportementale** avec TempoFlow 0.10.26 — pas une copie de structure monolithe.

### Règles absolues

1. **Marque** = métier + déclaration (migrations, API modules, UI pages, BrandSpec).  
2. **OS** = uniquement `@creezio/*` (`app-runtime`, `electron-shell`, …).  
3. **Interdit** : `resources/vendor` Hermes/n8n dans la marque ; `host-stack.ts` / `brand-runtime.ts` / `prepareDesktopBoot` dans `main.ts`.  
4. Gap OS → **fix le kit**, puis reset/regen la sonde. Ne jamais patcher l’OS dans `apps/tempoflow3`.  
5. **Pas de sous-agents Task/explore** si l’utilisateur les a désactivés — travailler en direct.  
6. Répondre en **français**. Quand tu recommandes du code, **envoyer le fichier complet**.  
7. Ne **jamais** déclarer SUCCESS sur des stubs HTTP 200 ou `existsSync`. Exiger comportement réel.

---

## 1. Vérité sur l’état actuel (lire avant de coder)

### Ce qui EST fait (preuve automatisée) — maj 2026-08-01 (session handoff exécutée)

| Preuve | Résultat | Limite |
|--------|----------|--------|
| `proof:hard` | étendu (+ optimiser commande GET/apply, dispatch graph) | pas GUI Electron |
| `proof:oracle` | **33/33** | Pages OK ; profondeur TF2 partielle |
| `test-os-owned-by-brand` | OK + merge `package.json` ownedByBrand | |
| `test-os-shell` | **6/6** | BYOK + recovery + updater + splash + vendors |
| `test-os-cold-warm` | OK `/os/ready` + n8n ensure | start : free-port kit durci (ss/lsof + retries) |
| `test-os-electron-runtime-smoke` | wiring OK | Launch xvfb optionnel |
| `scripts/reset-tempoflow3.mjs` | OK si markers présents | UI TF3 marquées `owned-by-brand` |
| Factory apply | skip fichiers marqués ; **merge** package.json owned | CREATE-BRAND §4b |

### Ce qui N’EST PAS fini (DoD incomplet)

#### A. OS kit

1. **Tunnel Cloudflare distant** — **bloqueur credentials** : pas de `CREEZIO_TUNNEL_PROVISION_URL` / `_TOKEN` dans cet environnement. Fallback local MCP **prouvé** (`enableLocalPublicSurface` + `/mcp`).  
2. **n8n start cold** — free-port durci dans kit (`ensureN8nDesktopPortFree`) ; à re-prouver en CI après zombies.  
3. **Plugins control plane** via `startBrandDesktop` non prouvé (`CREEZIO_PLUGINS=1`).  
4. **Electron GUI** AdsPower / xvfb systématique non vert en CI.  
5. **`test:shell` 0.10.26 complet** (~40 scripts) — agrégat kit partiel seulement.  
6. **BrandSpec modules → code auto** — owned-by-brand protège, mais ne génère pas le bonus depuis YAML.

#### B. TempoFlow3 profondeur TF2

- Optimiser commande GET/apply + dispatch score/graph **amorcés** (pas atelier canvas TF2)  
- Navigateur fournisseur / site riche  
- Admin MCP OAuth, analytics, request-logs  
- Tasks kanban + missions IA + mails inbox **comportement**  
- Parcours UI navigateur non prouvé  

#### C. Checklist oracle OS encore `[ ]`

Boot Client/Serveur, recovery E2E desktop, MCP public distant+OAuth, plugins, embeds GUI, admin, `test:shell` complet.

---

## 2. Architecture cible (où coder)

| Couche | Package / chemin | Rôle |
|--------|------------------|------|
| Façade desktop/harness | `packages/app-runtime` | `startBrandDesktop`, `startBrandKernelHarness`, `composeBrandOs`, `listenBrandOsHttp`, `warmBrandNativeHosts`, `/api/v1/os/*` |
| Hosts natifs | `packages/electron-shell` | Hermes, n8n, tunnel, Meili, splash, tray, updater, plugins, `ensureKitOsBinaries`, `resources/vendor`, `resources/bin` |
| Factory / BrandSpec | `packages/factory`, `packages/brand-spec` | `creezio brand init/doctor/apply`, `new-app --from-prd` |
| Builder | `packages/brand-config` `ensureKitOsVendorExtraResources` | Injecte kit vendor+bin dans electron-builder |
| Sonde marque | `apps/tempoflow3` | Métier CHR + UI Next + scripts preuve |
| Sandbox H2 | `apps/demobrand` | Plugins/ACL — main via `startBrandDesktop` |
| Brief / oracle | `docs/experiences/tempoflow3/*` | PRD, mini-PRDs, ORACLE, ALLOWLIST, PREUVE-* |
| Création marque | `docs/agents/CREATE-BRAND.md` | Workflow nominal |

### Entrées marque attendues (main mince)

```ts
startBrandDesktop({
  manifest,
  electronDirname: __dirname,
  brandMigrations: brandMigrations(),
  registerModuleApi: registerBrandModuleApi,
  beforeBoot: applyBrandMeiliConfig,
  meiliFeed: brandMeiliFeed,
  navItems: verticalSlot.items,
  desktopShell:
    process.env.CREEZIO_DESKTOP_SHELL === "window" ? "window" : "runtime",
});
```

### Env OS utiles

| Variable | Effet |
|----------|--------|
| `CREEZIO_DESKTOP_SHELL=window` | Opt-out splash/tray |
| `CREEZIO_NATIVE_WARM=0` | Skip warm n8n/Hermes (smokes rapides) |
| `CREEZIO_NATIVE_WARM_HERMES=0` | Skip Hermes only |
| `CREEZIO_NATIVE_START=0` | Ensure sans start |
| `CREEZIO_TUNNEL_LOCAL=0` | Désactive surface MCP locale |
| `CREEZIO_TUNNEL_PROVISION_URL` / `_TOKEN` | Tunnel distant |
| `CREEZIO_PLUGINS=1` | Active host plugins (sinon feature-off) |
| `CREEZIO_SKIP_KIT_BINARIES=1` | Skip download Meili/cloudflared |
| `CREEZIO_ROOT` | Racine monorepo pour scripts |

### Endpoints OS HTTP (harness / desktop)

- `GET /api/v1/os/status`  
- `GET /api/v1/os/ready` ← agrégat P&P  
- `GET/POST …/hermes|n8n|tunnel/*`  
- `GET/POST /mcp`  

---

## 3. Plan de travail ordonné (ne pas s’arrêter avant DoD)

### Phase 1 — Kit OS vraiment P&P (bloquant)

1. Cold-start preuve : **répertoire userData vide** + pas de cache n8n/hermes → warm + `/os/ready` + ensure/start.  
2. Tunnel distant : avec credentials sandbox/prod, prouver hostname public + `/mcp` externe.  
3. Suite kit `test:shell` minimale (nouveaux `scripts/test-os-*.mjs` ou package) couvrant :  
   BYOK, updater, hermes-embed, n8n-embed, splash-ui, embed-sandbox, mcp-base-url, tunnel-slug, first-run-auth, recovery-key, connection-profile.  
4. Smoke **Electron** (même headless) : `desktopShell=runtime` ouvre splash → UI.  
5. `brand apply` d’une marque neuve **sans restore manuel** doit compiler (`tsc`) et booter harness ready.

**Critère sortie Phase 1** : une app créée via `creezio brand apply` seule (sans copier TF3) passe une gate `test-os-native-pnp` **avec** warm n8n (et Hermes si binaire dispo), plus contrats shell.

### Phase 2 — Automatiser métier post-apply

1. BrandSpec `modules/*` → générateurs ou script `creezio brand apply-modules` qui pose bonus API + pages sans wipe silencieux.  
2. Ou : apply ne doit plus écraser les fichiers marque tagués `// creezio:owned-by-brand`.  
3. Documenter le contrat dans `CREATE-BRAND.md`.

### Phase 3 — Parité TF3 ↔ TF2 0.10.26 (profondeur)

1. Lire oracle + mini-PRDs `docs/experiences/tempoflow3/mini-prds/`.  
2. Comparer comportements (pas fichiers) avec TempoFlow2 `v0.10.26`.  
3. Enrichir **marque** : optimiser, dispatch, commandes versions, site fournisseur, likes/nav si métier.  
4. Brancher **kit** pour tasks/mails/admin/MCP OAuth/plugins — pas de jumeau.  
5. Étendre `proof:hard` / oracle pour **échouer** si profondeur absente (pas seulement `page.tsx` existe).

### Phase 4 — Preuve opérateur

1. Reset clean : wipe app sauf `brand-spec` → apply → modules → build → proof.  
2. Parcours manuel (ou AdsPower si dispo) : first-run → catalogue → panier → commande → optimiser → MCP public.  
3. Mettre à jour `ORACLE-0.10.26.md` checklist OS en `[x]` **uniquement** avec preuves.

---

## 4. Commandes de démarrage

```bash
cd /agent/repos/creezio   # ou clone
git fetch origin
git checkout cursor/tempoflow3-create-457d
git pull origin cursor/tempoflow3-create-457d

npm run build:packages

# Gates OS kit
node --test scripts/test-os-native-pnp.mjs
node --test scripts/test-os-shell-contracts.mjs
node --test scripts/test-phase-app-runtime.mjs scripts/test-phase-create-brand.mjs

# Binaires kit
node packages/electron-shell/scripts/ensure-kit-binaries.mjs

# TempoFlow3
cd apps/tempoflow3
npm run build:electron
npm run build:ui
npm test
npm run proof:oracle
npm run proof:hard
```

### Reset clean-room (attention perte métier)

```bash
cd /agent/repos/creezio
# BACKUP obligatoire du métier avant apply
cp -a apps/tempoflow3 /tmp/tf3-backup-$(date +%Y%m%d)

node packages/factory/bin/creezio.js brand doctor --spec apps/tempoflow3/brand-spec
node packages/factory/bin/creezio.js brand apply \
  --spec apps/tempoflow3/brand-spec \
  --out apps/tempoflow3 --force

# Aujourd’hui : re-coucher manuellement brand-bonus-api, migrations riches,
# brand-module-api (registerBrandBonusApi), UI interactive, scripts proof, package.json
# → Phase 2 doit supprimer ce restore manuel.
```

### Harness natif (warm réel)

```bash
cd apps/tempoflow3
npm run build:electron
CREEZIO_ROOT=../.. CREEZIO_NATIVE_WARM=1 CREEZIO_NATIVE_WARM_HERMES=1 \
  METIER_PORT=18791 node scripts/brand-kernel-harness.mjs
# puis curl http://127.0.0.1:18791/api/v1/os/ready
```

---

## 5. Pièges connus (ne pas reproduire)

1. **HTTP 200 ≠ natif** — vérifier `nativeReady`, `findN8nEntry`, `findHermesBinary`, process running.  
2. **`proof:hard` avec `CREEZIO_NATIVE_WARM=0`** — le warm est refait via POST ensure/start ; cold CI sans cache npm peut timeout (~2–5 min n8n).  
3. **`pkill -f n8n`** peut tuer le shell agent.  
4. **`npm install` / npx `tsc`** hors workspace casse les bins — utiliser `node_modules/typescript/bin/tsc` du monorepo + symlink `node_modules`.  
5. **Vendor dans la marque** = échec architectural même si ça marche.  
6. **Demobrand** n’est pas le modèle produit CHR ; c’est la preuve H2 plugins.  
7. **Ne pas** utiliser de sous-agents si l’utilisateur les a abort.  
8. **Ne pas** committer `apps/*/node_modules` (symlink accidentel déjà arrivé).  
9. Après `brand apply`, **vérifier** que `registerBrandBonusApi` est toujours appelé — apply l’a déjà effacé une fois.

---

## 6. Fichiers clés à lire en premier (ordre)

1. Ce handoff  
2. `docs/experiences/tempoflow3/ORACLE-0.10.26.md`  
3. `docs/experiences/tempoflow3/ALLOWLIST.md`  
4. `docs/experiences/tempoflow3/AUDIT-NATIVE-OS.md`  
5. `docs/agents/CREATE-BRAND.md`  
6. `docs/ADR-brand-spec-app-runtime.md`  
7. `packages/app-runtime/AGENTS.md` + `src/start-brand-desktop.ts`  
8. `packages/electron-shell/src/host/ensure-kit-binaries.ts` + `kit-os-resources.ts`  
9. `apps/tempoflow3/src/electron/{main,brand-module-api,brand-bonus-api,brand-migrations}.ts`  
10. `apps/tempoflow3/scripts/proof-e2e-hard.mjs`  
11. TempoFlow2 `v0.10.26` (comportement, pas copie)

---

## 7. Definition of Done (DoD) — quand tu as le droit de t’arrêter

Tu t’arrêtes **uniquement** si **tous** les points suivants sont vrais :

### DoD-OS (kit)

- [ ] `creezio brand apply` d’une marque **neuve** (pas TF3) → `tsc` OK, harness boot, `GET /os/ready` = 200 **avec** vendors kit + Meili + MCP surface, **sans** restore manuel de fichiers OS.  
- [ ] Cold userData : n8n ensure+start OK (documenter durée) ; Hermes ensure documenté (OK ou bloqueur kit explicite).  
- [ ] Tunnel : soit distant public prouvé, soit bloqueur credentials documenté + local MCP prouvé comme fallback **explicite**.  
- [ ] Suite shell kit ≥ contrats + au moins 1 smoke Electron runtime shell.  
- [ ] Aucun `resources/vendor` dans la marque générée ; builder embarque kit vendor+bin.

### DoD-TF3 (produit)

- [ ] Checklist OS de `ORACLE-0.10.26.md` entièrement cochée avec preuves (ou tickets kit liés).  
- [ ] Parcours métier TF2 cœur : fournisseurs→prix→panier→commande→optimiser→dispatch→stack→relevés→scan, **profondeur** pas stubs.  
- [ ] `proof:hard` et `proof:oracle` verts **après** un reset apply **reproductible** (scripté).  
- [ ] Doc `PREUVE-STATUS.md` mise à jour sans mensonge (séparer « gate » vs « parity produit »).

### DoD-process

- [ ] PR à jour, commits poussés, pas de `node_modules` tracké.  
- [ ] Si tu ne finis pas : ce handoff est mis à jour (section 1 + 3) avant de rendre la main — **pas** un SUCCESS cosmétique.

---

## 8. Prompt court à coller pour l’agent suivant

```text
Tu travailles sur github.com/creezio/creezio branche cursor/tempoflow3-create-457d (PR #25).
Lis docs/agents/HANDOFF-OS-TEMPOFLOW3.md en entier puis exécute le plan Phase 1→4.
Objectif : OS Creezio plug-and-play pour toute future marque + TempoFlow3 parité comportementale TempoFlow2 v0.10.26.
Interdit : glue OS dans la marque ; vendor Hermes/n8n dans apps/* ; déclarer SUCCESS sur stubs.
Réponds en français. Envoie le code complet des fichiers modifiés.
Ne t’arrête pas tant que le Definition of Done (section 7 du handoff) n’est pas rempli ;
si bloqué, mets à jour le handoff avec l’état réel et les bloqueurs précis.
```

---

## 9. Historique compact des agents précédents

1. Scaffold TF3 + façade `startBrandDesktop` + métier CHR bonus.  
2. Preuves `proof:hard` 54/54 (souvent avec warm contrôlé / cache).  
3. Fix P&P kit : `ensureKitOsBinaries`, shell runtime défaut, `/os/ready`, factory types, gate `test-os-native-pnp`.  
4. Hors-scope partiel : demobrand P&P, warm retries, shell contracts, pages UI manquantes, reset apply + restore métier.  
5. **Arrêt prématuré** : gates vertes ≠ produit fini ; oracle OS encore largement `[ ]`.

---

*Fin du handoff. Toute mise à jour de statut doit modifier la section 1 et le DoD, pas seulement PREUVE-STATUS.md.*
