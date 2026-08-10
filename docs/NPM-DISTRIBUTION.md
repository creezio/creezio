# Distribution npm — GitHub Packages (en vigueur)

Les packages `@creezio/*` sont publiés en **versions semver** sur
**GitHub Packages** (`https://npm.pkg.github.com`, owner `creezio`).
Les apps les consomment comme n'importe quelle dépendance npm :
`npm update @creezio/<pkg>` remplace le vendoring.

**Pourquoi** : le vendoring copiait du contenu sans changer de version —
invisible pour npm (copies `file:` jamais rafraîchies), pour le cache
webpack (`managedPaths`) et pour les humains. Incidents du 2026-08-09 :
bundle winhub servant un vendor vieux de 24 h, deploys bloqués par une
garde mtime. Une version qui bumpe à chaque changement rend le contenu
visible par TOUT l'écosystème standard.

## Versionnement (lockstep)

- Tous les packages publiés partagent la MÊME version (groupe `fixed` de
  changesets) — équivalent moderne de `ARCHITECTURE_VERSION` : une version
  de kit = un ensemble cohérent de packages.
- Version courante : **0.5.0** (bootstrap initial : 0.4.0).
- Outil : [changesets](https://github.com/changesets/changesets).
  Tout changement de `packages/` dans une PR doit être accompagné d'un
  changeset (`npx changeset`) — gate CI `changeset-status`.

## Flux de publication

1. Dev kit : modifier `packages/…`, puis `npx changeset` (patch/minor/major
   + description). Committer le fichier `.changeset/*.md` avec la PR.
2. Merge sur `main` → workflow `publish.yml` ouvre/actualise la PR
   « chore(release): version packages » (bump lockstep + CHANGELOG).
3. Merge de cette PR → `publish.yml` publie automatiquement sur
   GitHub Packages (auth `GITHUB_TOKEN`, aucun secret à gérer).

## Consommation côté app

`.npmrc` à la racine de l'app (le token N'EST PAS committé) :

```ini
@creezio:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${CREEZIO_NPM_TOKEN}
```

- **Token** : PAT (classic) avec scope `read:packages` d'un membre de
  l'org creezio. En CI : secret `CREEZIO_NPM_TOKEN` exporté en env du job.
  En local : `export CREEZIO_NPM_TOKEN=…` (shell) ou token dans le
  `~/.npmrc` utilisateur.
- `package.json` : `"@creezio/<pkg>": "^0.5.0"` (plus de `file:vendor/…`).
- Vérifier la disponibilité :
  `npm view @creezio/app-runtime versions --registry=https://npm.pkg.github.com`
- Mise à jour : `npm update "@creezio/*"` puis CI de l'app.

## Packages publiés (lockstep 0.5.0)

`admin`, `api-kernel`, `app-runtime`, `assistant`, `auth`, `automations`,
`brand-config`, `brand-spec`, `browser-host`, `cockpit`, `database`,
`desktop-tooling`, `electron-shell`, `integrations`, `interactive-demo`,
`landing`, `mails`, `mcp-facade`, `observability`, `onboarding`, `os-ui`,
`platform-core`, `product-hub`, `shell`, `shell-ui`, `support`, `tasks`.

Restent privés (outillage interne, non publiés) : `factory`, `propagation`,
apps `console` / `demobrand`.

## Migration depuis le vendoring (terminée)

L'ancien système (sync vendor, `SYNC.json`, `kit-compat`, `vendor-update`,
`install-server-deps`, symlinks trackés) est **SUPPRIMÉ** du kit
(feat/npm-deploy-tooling : Dockerfile + factory + CLI server-docker en mode
npm). Apps migrées : **winhub** (PR #4) et **tempoflow3** (PR #15) — toutes
deux en `^0.5.0`, déployées. Les repos admin (`winhub-admin`,
`tempoflow3-admin`) migrent à leur tour. Il n'existe plus d'app vendored
maintenue : toute app consomme les packages npm.
