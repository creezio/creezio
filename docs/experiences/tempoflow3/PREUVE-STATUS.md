# Preuve TempoFlow3 — statut vivant

## Prouvé

| Item | Preuve |
|------|--------|
| BrandSpec doctor + apply → main mince | `PREUVE-RESET-APPLY.md` |
| OS hosts kit (Hermes/n8n/tunnel) | `proof:hard` /os/hosts |
| MCP HTTP + tasks/mails | `proof:hard` |
| Métier API + optimiser apply | `proof:hard` |
| Stack → panier, relevé → prix, scan → validate | `proof:hard` (mini-PRDs 07–09) |
| Next UI plane + CRUD + pages stack/relevés/scan interactives | `startBrandUiPlane` + pages client |
| `installBrandOsDesktop` (runtime par défaut) | `desktopShell=runtime` sauf `TEMPOFLOW3_DESKTOP_SHELL=window` |
| AppImage | artefact |
| `proof:hard` | voir `PREUVE-HARD-RUN.md` |

## Reste pour parité produit 0.10.26

1. Smoke splash/tray Electron (runtime shell) en environnement graphique
2. UX Next complète (dispatch UI, moins de pages JSON)
3. Démarrer Hermes/n8n si binaires (smoke embed)
4. Tunnel réel + MCP public
5. Suite `test:shell` équivalente
6. Enrichir métier jusqu’aux comportements TF2 (dispatch/optimiser profondeur)

## Commandes

```bash
creezio brand doctor --spec apps/tempoflow3/brand-spec
creezio brand apply --spec apps/tempoflow3/brand-spec --out /tmp/tf3-x --force
cd apps/tempoflow3 && npm run build:ui && npm run proof:hard
```
