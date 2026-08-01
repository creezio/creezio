# Preuve TempoFlow3 — statut vivant

## Prouvé (post-reset 2026-08-01)

| Item | Preuve |
|------|--------|
| Reset clean-room BrandSpec apply | `brand doctor` + `brand apply --force` → main mince P&P |
| Natif kit (vendor+binaires, pas la marque) | `arch.kit-*` / pas de `resources/vendor` marque |
| n8n + Hermes ensure/start | `os.n8n-*` / `os.hermes-*` |
| MCP public (surface locale) | `os.tunnel-status` / `os.mcp-public` |
| Meili kit | `arch.kit-binaries` |
| Métier + dispatch + détails | `metier.*` |
| UI interactive + détails TF2 manquants | `fournisseurs/[id]`, `skus/[id]`, `marketplaces/[id]`, `commandes/[id]/optimiser`, `/mcp`, `/server-cockpit` |
| `proof:hard` | **54/54 SUCCESS** |
| Demobrand OS P&P | `startBrandDesktop` + bootKernel sandbox |
| Contrats shell kit | `scripts/test-os-shell-contracts.mjs` |

## Hors scope résolu

1. Demobrand → `startBrandDesktop`
2. Warm n8n/Hermes avec retries ; Hermes aligné desktop
3. Tunnel provision via `CREEZIO_TUNNEL_*`
4. Suite shell kit (splash/tray/embed/updater)
5. Pages UX TF2 manquantes listées ci-dessus

## Commandes

```bash
creezio brand doctor --spec apps/tempoflow3/brand-spec
creezio brand apply --spec apps/tempoflow3/brand-spec --out apps/tempoflow3 --force
# puis re-couche métier (bonus API / UI) depuis brand-spec/modules
cd apps/tempoflow3 && npm run proof:hard
```
