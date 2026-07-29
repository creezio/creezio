# Gate G1 — Certivan (Phase G — checklist, non exécutée en F)

> **Statut Phase F** : documentation prête uniquement.  
> **Ne pas exécuter** tant que Phase G n'est pas lancée explicitement.  
> Ordre : **G1 Certivan → G2 Fidu → G3 TempoFlow**.

## Cible

| Champ | Valeur |
|-------|--------|
| Marque | Certivan |
| Repo / chemin | `/opt/docker/certivan-app` |
| Manifest kit | `certivanManifest` (`@creezio/brand-config`) |
| envPrefix | `CERTIVAN` |
| Client+Serveur | oui (`buildServerArtifact: true`) |

## Prérequis kit

- [ ] Kit `creezio/creezio` sur `main` avec Phase F livrée
- [ ] `npm run kit:impact -- --package=<pkg>` passé en revue pour les bumps concernés
- [ ] Versions `@creezio/*` ciblées notées (console ou `collectKitInventory`)

## Checklist bascule (Phase G)

### 1. Dépendances

- [ ] Ajouter / bumper dans `crm/package.json` :
  - `@creezio/brand-config`
  - `@creezio/shell`
  - `@creezio/platform-core`
  - `@creezio/product-hub`
  - `@creezio/electron-shell`
  - `@creezio/desktop-tooling` (scripts publish)
- [ ] `npm install` dans l'app
- [ ] PR titre type : `chore(deps): bump @creezio/* — kit creezio [certivan]`
- [ ] Corps PR = template `.github/PULL_REQUEST_TEMPLATE/kit-bump.md` (kit) + payload `buildBrandPrPayload`

### 2. Remplacements code (cf. PLATFORM-VS-VERTICAL.md)

- [ ] Manifest / builder config → `buildElectronBuilderConfig` / manifest kit
- [ ] Preload bridge → `createDesktopApi` / `getDesktopBridge`
- [ ] Boot partiel → `prepareDesktopBoot` / host stack kit
- [ ] Product Hub : littéraux `certivan-plugin:` / grants → `productHubTokensFromManifest`
- [ ] Control plane plugins → `startHostPluginControlPlane`
- [ ] Scripts publish → wrappers `@creezio/desktop-tooling`
- [ ] **Garder** vertical : plugin-git, plugin-data, accept-check, test-runner, UI Admin, seeds métier

### 3. Validation Client + Serveur

- [ ] `npm run build` (CRM + electron compile)
- [ ] Smoke Client : boot, updater feed Certivan client
- [ ] Smoke Serveur : boot `buildServerArtifact`, feed serveur
- [ ] Feeds live :
  - `https://certivan.creez.io/dl-3c94d486b0efa7618fad5bdfff410c49/latest.yml`
  - `…/server/latest.yml`
- [ ] Product Hub health : service `certivan-plugins-api`
- [ ] ACL L3/L4 fail-closed inchangé côté comportement

### 4. Coupure legacy

- [ ] Runtime legacy encore disponible jusqu'à smoke vert
- [ ] Feature flag / branche de bascule documentée
- [ ] Seulement après verts : retirer modules dupliqués devenus morts
- [ ] Tag / note release Certivan mentionnant versions kit

### 5. Sign-off G1

- [ ] Console ops : versions kit + feed Certivan OK
- [ ] Aucune régression critique RTI / dossiers
- [ ] **Autorisation explicite** pour ouvrir G2 Fidu

## Interdits pendant G1

- ❌ Modifier le kit pour hardcoder `CERTIVAN_*` (injection manifest uniquement)
- ❌ Lancer G2/G3 avant sign-off G1
- ❌ Publier un exe sans smoke Client+Serveur

## Références

- [PROPAGATION.md](../PROPAGATION.md)
- [PHASE-F.md](../PHASE-F.md)
- [PHASE-E.md](../PHASE-E.md) (Product Hub)
- [PLATFORM-VS-VERTICAL.md](../PLATFORM-VS-VERTICAL.md)
