# Gate G3 — TempoFlow (Phase G — checklist, non exécutée en F)

> **Statut Phase F** : documentation prête uniquement.  
> **Prérequis** : Gates **G1** et **G2** signées.  
> Source d'extraction historique du kit : `creezio/tempoflow2` @ v0.10.26.

## Cible

| Champ | Valeur |
|-------|--------|
| Marque | TempoFlow |
| Repo | `creezio/tempoflow2` (VPS lecture : `/opt/docker/creezio-kit-src`) |
| Manifest kit | `tempoflowManifest` |
| envPrefix | `TF2` |
| Client+Serveur | oui (`buildServerArtifact: true`) |

## Prérequis

- [ ] G1 + G2 sign-off
- [ ] Matrice [PLATFORM-VS-VERTICAL.md](../PLATFORM-VS-VERTICAL.md) revue ligne par ligne
- [ ] Décider workspace vs npm pour `@creezio/*`

## Checklist bascule (Phase G)

### 1. Dépendances

- [ ] Remplacer copies locales par `@creezio/*`
- [ ] Aligner scripts electron sur `@creezio/desktop-tooling`
- [ ] PR kit-bump `[tempoflow]`

### 2. Remplacements code (volume élevé)

- [ ] `electron/*` générique → electron-shell / platform-core / shell
- [ ] Product Hub : supprimer hardcodes `TEMPOFLOW_PLUGINS_*` / `tempoflow-plugin:` au profit des tokens kit
- [ ] plugin-control-api → control plane kit
- [ ] ACL L3/L4 : contrats kit + store SQLite vertical
- [ ] **Rester vertical** : catalogue-sync, supplier-tabs, seeds, UI Admin Plugins, plugin-git/data/accept/test

### 3. Validation Client + Serveur

- [ ] Build + compile electron
- [ ] Smoke Client + Serveur
- [ ] Feeds :
  - `https://crm.tempoflow.fr/dl-e660352fb04dbd5e2519f0e60897c548/latest.yml`
  - `…/server/latest.yml`
- [ ] Hermes / n8n / tunnel host stack
- [ ] Product Hub grant + ACL
- [ ] Régression métier catalogue / commandes (smoke ciblé)

### 4. Coupure legacy

- [ ] Migration progressive fichiers `crm/electron/*`
- [ ] Ne supprimer le code dupliqué qu'après parité comportementale
- [ ] Tag release TF2 mentionnant versions kit

### 5. Sign-off G3

- [ ] Console parc TempoFlow OK
- [ ] Kit = source de vérité plateforme ; TF2 = vertical + consommation
- [ ] Clôture Phase G documentée

## Interdits

- ❌ Skip G1/G2
- ❌ Remonter du métier catalogue dans le kit
- ❌ Hardcoder `TEMPOFLOW_` dans `@creezio/*`

## Références

- [PROPAGATION.md](../PROPAGATION.md)
- [PHASE-E.md](../PHASE-E.md)
- [PHASE-B2.md](../PHASE-B2.md)
- [PLATFORM-VS-VERTICAL.md](../PLATFORM-VS-VERTICAL.md)
