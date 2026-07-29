# Plateforme vs vertical — matrice de portage

Source d'extraction : `creezio/tempoflow2` @ **v0.10.26** (`/opt/docker/creezio-kit-src`), lecture seule Certivan / Fidu.

Légende :

- **Kit** = ira dans `@creezio/*` (Phase B runtime, déjà contrats en Phase A)
- **Vertical** = reste dans l'app marque
- **A** = déjà extrait (contrats) en Phase A
- **B** = portage runtime prévu Phase B

## Matrice TF2 → package cible

| Fichier source TF2 (crm/) | Cible kit | Phase | Notes |
|---------------------------|-----------|-------|-------|
| `scripts/electron/build-builder-config.mjs` | `@creezio/brand-config` (+ helper build) | A (ids) / B (générateur) | Client+Serveur obligatoire |
| `electron/app-kind.ts` | `@creezio/platform-core` | A (ids via manifest) / B | Logique pure + bootBehavior |
| `electron/paths.ts` | `@creezio/platform-core` | A | Paramétré par manifest |
| `electron/local-config.ts` | `@creezio/platform-core` (schema) + runtime B | A / B | Secrets / safeStorage = B |
| `electron/preload-app.ts` | `@creezio/shell` | A (contrats) / B | `bridgeName` depuis manifest |
| `src/types/desktop.d.ts` | `@creezio/shell` | A | `DesktopBridge` générique |
| `electron/preload-supplier.ts` | `@creezio/shell` | B | Onglets fournisseurs |
| `electron/main.ts` | `@creezio/shell` / runtime | B | Gros fichier — découpe |
| `electron/updater.ts` | platform-core / shell | B | Feed depuis manifest |
| `electron/connection-profile.ts` | platform-core | B | |
| `electron/server-launcher.ts` | platform-core (host) | B | Serveur only |
| `electron/meili-*` | platform-core (host) | B | Serveur only |
| `electron/hermes-*` / `n8n-*` | platform-core (host) | B | Serveur only |
| `electron/tunnel-*` | platform-core (host) | B | Serveur only |
| `electron/factory-reset.ts` | platform-core | B | |
| `scripts/electron/after-pack.cjs` | tooling kit | B | |
| `scripts/electron/publish-desktop.sh` | tooling kit | B | Feeds client+server |
| `electron-builder.yml` | généré depuis manifest | B | |
| Seeds / templates métier | **vertical** | — | Certivan VASP, Fidu seeds… |
| Routes Next CRM / UI métier | **vertical** | — | |
| `vendor/hermes-skills` marque | **vertical** | — | |
| Paperclip (Fidu) | **vertical** | — | Hors noyau kit |

## Identités lues (Phase A)

| Marque | bridgeName | envPrefix | appId client | appId serveur |
|--------|------------|-----------|--------------|---------------|
| TempoFlow | `tempoflowDesktop` | `TF2` | `fr.tempoflow.desktop` | `fr.tempoflow.desktop.server` |
| Certivan | `certivanDesktop` | `CERTIVAN` | `fr.certivan.desktop` | `fr.certivan.desktop.server` |
| Fidu | `fiduDesktop` | `FIDU` | `fr.fidu.desktop` | `fr.fidu.desktop.server` (cible) |

## Ce qui reste vertical (ne jamais monter dans le kit)

- Domaine métier (GED Fidu, RTI Certivan, catalogue TempoFlow…)
- Seeds / templates / skills Hermes spécifiques
- Pages Next, API métier, migrations SQL produit
- Credentials / tokens de feed (seuls les **URLs** publiques sont dans brand-config)

## Consommation future (Phase G)

```ts
import { fiduManifest } from "@creezio/brand-config";
import { getDesktopBridge } from "@creezio/shell";
import { resolveDbPath } from "@creezio/platform-core";

const bridge = getDesktopBridge(fiduManifest.bridgeName);
```

Les apps continueront de vivre sous `/opt/docker/{fidu,certivan-app}` et `creezio/tempoflow2` ; elles ajouteront une dépendance workspace/npm vers ce repo.
