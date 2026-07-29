# Gate G2 — Fidu (Phase G — checklist, non exécutée en F)

> **Statut Phase F** : documentation prête uniquement.  
> **Prérequis** : Gate **G1 Certivan** signée.  
> Ordre : G1 → **G2 Fidu** → G3 TempoFlow.

## Cible

| Champ | Valeur |
|-------|--------|
| Marque | Fidu |
| Repo / chemin | `/opt/docker/fidu` (`crm/`) |
| Manifest kit | `fiduManifest` |
| envPrefix | `FIDU` |
| Client+Serveur | Client obligatoire ; Serveur = **cible** (`buildServerArtifact: false` aujourd'hui) |

## Prérequis

- [ ] G1 Certivan sign-off
- [ ] Kit Phase F/G patches nécessaires déjà sur `main`
- [ ] Pipeline ship Fidu respectée (`fidu-desktop-ship-pipeline`) **après** verts

## Checklist bascule (Phase G)

### 1. Dépendances

- [ ] Bumper `@creezio/*` dans `crm/package.json`
- [ ] Scripts npm → `desktop-tooling` (`electron:publish`, `remote-build`, `build-status`)
- [ ] PR template kit-bump `[fidu]`

### 2. Remplacements code

- [ ] brand-config / shell / platform-core / electron-shell
- [ ] Product Hub si/quand branché (tokens `FIDU_*`, pas de hardcode kit)
- [ ] **Rester vertical** : Paperclip, GED métier, seeds cabinet, UI CRM
- [ ] Ne pas casser le standing ship pipeline (tests → bump → remote-build --publish)

### 3. Validation

- [ ] `npm run build` + `npm run electron:compile`
- [ ] Smoke `/clients` et routes critiques touchées
- [ ] `npm run test:fidu` si pertinent
- [ ] Feed client : `https://fidu.creez.io/dl-e660352fb04dbd5e2519f0e60897c548/latest.yml`
- [ ] Feed serveur : documenter 404 actuel ; ne pas prétendre publié
- [ ] Dry-run remote-build via console / CLI avant publish réel

### 4. Coupure legacy

- [ ] Dual-run possible jusqu'à smoke vert
- [ ] Publish feed uniquement après verts (règle ship pipeline)
- [ ] Sign-off G2 avant d'ouvrir G3

### 5. Sign-off G2

- [ ] Console : feed Client Fidu OK
- [ ] Exe publié versionné si release
- [ ] **Autorisation explicite** pour G3 TempoFlow

## Interdits

- ❌ Skip G1
- ❌ Publish sans tests verts
- ❌ Modifier tempoflow2 / certivan pendant G2 sauf hotfix hors kit

## Références

- [PROPAGATION.md](../PROPAGATION.md)
- [PHASE-C.md](../PHASE-C.md) (publish tooling)
- Pipeline : `crm/docs/REMOTE-BUILD.md` (repo fidu)
