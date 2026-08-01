# Preuve TempoFlow3 — statut vivant

## Ce qui est prouvé maintenant

| Couche | Statut | Preuve |
|--------|--------|--------|
| Marque mince (pas host-stack) | OK | `proof:hard` |
| OS hosts kit (Hermes/n8n/tunnel) | OK | `/api/v1/os/hosts` + status |
| MCP HTTP | OK | `GET /mcp` |
| tasks/mails platform | OK | mounts |
| Métier API cœur + bonus + optimiser apply | OK | `proof:hard` 24+ |
| Plan UI Next standalone | OK | `startBrandUiPlane` → dashboard/taches 200 |
| SPA fallback | OK | `resources/renderer` |
| AppImage | OK | artefact |

## Encore à faire pour « = 0.10.26 »

1. `installBrandDesktopRuntime` (splash, tray, WebContentsView, profils) derrière façade
2. UX Next interactive (formulaires/CRUD) au niveau TF2 — pas seulement JSON fetch
3. Démarrage embeds Hermes/n8n quand binaires présents + smoke
4. Tunnel provision réel + MCP public URL
5. Suite `test:shell` équivalente
6. Reset BrandSpec → apply → re-dev bout-en-bout documenté

## Commandes

```bash
cd apps/tempoflow3
npm run build:ui          # Next standalone
npm run proof:hard        # OS + MCP + métier
npm run desktop:dev       # Electron (Next si buildé, sinon SPA)
```
