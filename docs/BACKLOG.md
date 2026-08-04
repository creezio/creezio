# BACKLOG — dettes restantes assumées

Liste unique et honnête des dettes connues du kit. Une dette listée ici est
**assumée** : pas de contournement caché dans le code, pas d'assert de gate
affaibli pour la masquer. (Backlogs d'époque : `docs/archive/BACKLOG-*.md`.)

## Produit / distribution

- **Validation packagée Windows réelle** : la chaîne updater / preload
  onglets / NSIS est couverte par gates statiques (`after-pack`, `test:kit`),
  mais aucun E2E sur machine Windows n'est exécuté — machine requise.
- **Widevine/DRM** : les onglets externes (Electron) et le navigateur IA
  (Chromium serveur) ne lisent pas les contenus DRM.
- **Rotation du token feed `dl-e660352…`** : décision utilisateur — on ne
  touche ni la rotation ni la sortie du code pour l'instant.
- **Licence** : repos privés, pas de fichier LICENSE (décision utilisateur).

## Navigateur IA (`browser-host`)

- **Proxy résidentiel** : `CREEZIO_BROWSER_PROXY` est plombé jusqu'à
  `--proxy-server=`, mais une IP datacenter (VPS/cloud) reste détectée par
  beaucoup de sites ; aucune offre proxy résidentiel n'est incluse.
- **Chiffrement au repos des profils** : les profils Chromium (cookies,
  sessions) sont en clair sur disque (créés `0700`). Le chiffrement volume
  (LUKS/fscrypt) est à la charge de l'hébergeur — non fourni par le kit.
  Voir « Modèle de menace » dans `packages/browser-host/README.md`.

## Tests / environnement

- **`test:brands` sur ce VPS** : l'oracle `tempoflow2` local est en état
  pré-cutover (pas de `crm/vendor/creezio`) et `certivan-app`/`fidu` sont
  absents — les 55 gates marques skippent (raison affichée). Les exécuter
  sur un poste avec les repos marque synchronisés.
- **`test:env`** : `test-os-cold-warm` (réseau embeds + ~4 Go /tmp) et
  `test-phase-factory-prd*` (npm install d'une app générée, binaire Electron
  téléchargeable) sont opt-in (`CREEZIO_COLD_WARM=1` / `CREEZIO_FACTORY_PRD=1`).
  Les gates factory-prd échouent aujourd'hui hors ligne car l'app générée n'a
  pas de `node_modules` (types `electron` introuvables au `tsc`) — piste :
  lien vers le `node_modules` du kit ou install dédiée dans la gate.

## Documentation

- **`@creezio/brand-spec`** : pas encore de `README.md` / `docs/FILES.md`
  (AGENTS.md existe) — voir `docs/PACKAGES.md`.
- **Liens internes des docs archivées** : les documents de
  `docs/archive/` gardent leurs liens d'époque (certains pointent vers des
  emplacements déplacés) — assumé, l'archive est un journal.

## Divers

- **`packages/observability/fleet-collector/configure-fleet-npm.sh`** et les
  manifests `brand-config` contiennent l'IP du collector fleet historique
  (`104.168.10.36`) — c'est de la config fonctionnelle (tf2-fleet-collector
  en prod), pas une fuite doc ; à paramétrer proprement le jour où le
  collector bouge.
