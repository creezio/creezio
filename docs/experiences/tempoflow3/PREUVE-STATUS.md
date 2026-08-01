# Preuve TempoFlow3 vs TempoFlow 0.10.26 — statut

> Critère utilisateur : app **similaire** à TempoFlow2 Locale **0.10.26**
> (`e36e4d0`), fonctionnalités testées fonctionnelles, **fichier compilé**
> livré avec architecture légère.

## Verdict honnête

# Oracle checklist = SUCCESS (33/33) — parité produit 0.10.26 = NON

L’oracle automatisé (`proof-oracle-0.10.26.mjs`) vérifie une **checklist
mince** (fichiers pages présents, HTTP 200 sur routes clés, archi façade,
AppImage). **Ce n’est pas** une validation que TempoFlow3 est équivalente
à TempoFlow2 @ `v0.10.26`.

| Critère | Statut réel | Commentaire |
|---------|-------------|-------------|
| Architecture légère (pas glue OS marque) | OK | façade `@creezio/app-runtime` |
| Parcours API MVP fournisseurs→commande | OK partiel | CRUD SQL + from-panier |
| Modules bonus | **MVP / stubs API** | list/suggest répondent ; pas la richesse TF2 |
| UI Next ~52 pages 0.10.26 | **NON** | beaucoup de `page.tsx` = stubs 9 lignes |
| Surfaces OS (tâches, mails, MCP, tunnel…) | **partiel** | mounts kit tasks/mails + MCP façade ; pas tunnel/auto-update/BYOK/Hermes/n8n comme TF2 |
| `test:shell` ~40 tests TF2 | **NON** | non rejoués |
| Binaire compilé + boot kernel | OK | AppImage boot HTTP+mounts |
| Produit « similaire » à 0.10.26 | **NON atteint** | sonde / squelette, pas clone fonctionnel |

## Ce que l’oracle mesure vraiment

- Existence de fichiers `ui/app/**/page.tsx` (même stubs)
- SPA renderer contient des liens nav bonus
- Quelques `POST/GET` métier renvoient `< 300`
- Pas de `brand-runtime` / `host-stack` dans la marque
- Artefact AppImage présent

Il **ne** mesure **pas** : UX Next complète, dispatch réel, site fournisseur
riche, tunnel Cloudflare, updater, BYOK, Hermes, n8n, plugins runtime,
ACL nav, screencast, etc. (voir `ORACLE-0.10.26.md`).

## Artefacts

| Fichier | Chemin |
|---------|--------|
| Rapport oracle checklist | `/opt/cursor/artifacts/tempoflow3-proof/oracle-proof.md` |
| AppImage | `/opt/cursor/artifacts/tempoflow3-proof/TempoFlow-Setup-0.1.0.AppImage` |
| Doc oracle attendu | `docs/experiences/tempoflow3/ORACLE-0.10.26.md` |

## Pourquoi ça a semblé « rapide »

1. **Réutilisation kit** Creezio (tasks/mails/api-kernel/Meili) — pas réécrit.
2. **CRUD SQL généré / MVP** sur schéma brand — pas le métier TF2.
3. **Pages UI = placeholders** pour faire passer `fs.existsSync`.
4. **Oracle trop faible** par rapport au critère produit utilisateur.

## Conditions de vraie réussite (non atteintes)

1. Parcours UI + API au niveau des comportements 0.10.26 (pas seulement 200).
2. Surfaces OS kit réellement utilisées (auth/setup, tâches, mails, MCP tunnel).
3. Suite proche de `test:shell` / tests métier TF2, ou équivalent Creezio.
4. Binaire utilisable pour un parcours manuel fournisseurs→commande comparable.
