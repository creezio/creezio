# Preuve TempoFlow3 — statut vivant

## Prouvé

| Item | Preuve |
|------|--------|
| Vendor + binaires OS **dans le kit** | `@creezio/electron-shell/resources/{vendor,bin}` |
| Aucun vendor dans la marque | `arch.no-brand-vendor` |
| n8n ensure + start | `os.n8n-*` |
| Hermes ensure + start (gateway+WebUI) | `os.hermes-*` |
| MCP public (surface locale kit) | `os.tunnel-status` + `os.mcp-public` |
| Meili binaire kit | `arch.kit-binaries` + harness `search=meili` |
| Métier cœur + stack/relevés/scan/dispatch | `proof:hard` |
| UI Next interactive (dashboard, dispatch, promotions, skus, stack…) | pages `use client` |
| Shell runtime par défaut | `test:desktop-smoke-profile` |
| `proof:hard` | **52/52 SUCCESS** |

## Reste vs TF2 0.10.26

1. Tunnel Cloudflare **distant** (provisioner + token réel) — surface locale OK
2. UX TF2 complète (détail produit/commande, optimiser riche, navigateur, likes…)
3. Smoke Electron GUI splash/tray/embeds
4. Suite `test:shell` équivalente

## Commandes

```bash
node packages/electron-shell/scripts/ensure-kit-binaries.mjs
cd apps/tempoflow3 && npm run proof:hard
```
