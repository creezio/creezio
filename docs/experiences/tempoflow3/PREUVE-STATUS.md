# Preuve TempoFlow3 — statut vivant

## Prouvé

| Item | Preuve |
|------|--------|
| Natif kit (vendor+binaires, pas la marque) | `arch.kit-*` / `arch.no-brand-vendor` |
| n8n + Hermes ensure/start | `os.n8n-*` / `os.hermes-*` |
| MCP public (surface locale) | `os.tunnel-status` / `os.mcp-public` |
| Meili kit | `arch.kit-binaries` |
| Métier + dispatch + détails commande/produit | `metier.*` |
| UI interactive (dashboard, stack, relevés, scan, dispatch, optimiser, détails…) | pages Next |
| `proof:hard` | **54/54 SUCCESS** |

## Reste vs TF2 0.10.26

1. Tunnel Cloudflare distant (provisioner prod)
2. UX TF2 restante (versions commande, navigateur, likes, marketplaces/[id] riches…)
3. Smoke Electron GUI splash/tray/embeds
4. Suite `test:shell`

## Commandes

```bash
node packages/electron-shell/scripts/ensure-kit-binaries.mjs
cd apps/tempoflow3 && npm run proof:hard
```
