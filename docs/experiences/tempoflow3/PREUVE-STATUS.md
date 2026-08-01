# Preuve TempoFlow3 — statut vivant

## Prouvé

| Item | Preuve |
|------|--------|
| BrandSpec doctor + apply → main mince | `PREUVE-RESET-APPLY.md` |
| OS hosts kit (Hermes/n8n/tunnel) | `proof:hard` /os/hosts |
| MCP HTTP + tasks/mails | `proof:hard` |
| Métier API + optimiser apply | `proof:hard` |
| Next UI plane + CRUD interactif | `startBrandUiPlane` + MetierCrud |
| `installBrandOsDesktop` (runtime) | export kit, `desktopShell=runtime` |
| AppImage | artefact |
| `proof:hard` | **26/26** |

## Reste pour parité produit 0.10.26

1. Activer `desktopShell: "runtime"` par défaut + smoke splash/tray
2. UX Next complète (toutes pages interactives, site/[id], dispatch UI)
3. Démarrer Hermes/n8n si binaires (smoke embed)
4. Tunnel réel + MCP public
5. Suite `test:shell` équivalente
6. Enrichir métier post-apply depuis mini-PRDs jusqu’aux comportements TF2

## Commandes

```bash
creezio brand doctor --spec apps/tempoflow3/brand-spec
creezio brand apply --spec apps/tempoflow3/brand-spec --out /tmp/tf3-x --force
cd apps/tempoflow3 && npm run build:ui && npm run proof:hard
```
