# Preuve TempoFlow3 — statut vivant

## Gates automatisées (2026-08-01 soir)

| Gate | Résultat | Limite |
|------|----------|--------|
| `proof:hard` | **61/61 SUCCESS** | + optimiser commande GET/apply + dispatch graph ; pas GUI AdsPower |
| `proof:oracle` | 33/33 (pages) | Parité pages ≠ profondeur TF2 partout |
| `reset-tempoflow3.mjs --no-proof` | OK | `owned-by-brand` préserve métier |
| `test-os-owned-by-brand` | OK | + merge `package.json` ownedByBrand |
| `test-os-shell` / contracts | OK | Contrats + BYOK/recovery/updater |
| `test-os-cold-warm` | OK ready + **n8n start** | free-port via lsof (fuser absent CI) |
| `test-os-native-pnp` | 4/4 | Marque neuve apply → tsc → `/os/ready` |
| `test-os-electron-runtime-smoke` | wiring OK | Launch xvfb optionnel / skip CI |

## Avancées kit cette itération

- `creezio:owned-by-brand` + merge `package.json` `creezio.ownedByBrand`
- n8n `ensureN8nDesktopPortFree` + kill listeners via **lsof** (pas seulement fuser)
- Optimiser commande + dispatch score/graph
- Reset scripté `scripts/reset-tempoflow3.mjs`
- CREATE-BRAND §4b documenté

## Encore ouvert vs DoD handoff

- Tunnel Cloudflare **distant** — **bloqueur credentials** ; local MCP prouvé
- Plugins control plane (`CREEZIO_PLUGINS=1`) non prouvé
- Smoke Electron GUI réel systématique (xvfb/AdsPower)
- Agrégat `test:shell` 0.10.26 complet (~40 scripts)
- Atelier optimiser canvas TF2 / admin MCP OAuth / tasks-mails comportement
- Checklist OS oracle encore partiellement `[ ]`

## Commandes

```bash
node scripts/reset-tempoflow3.mjs --no-proof
cd apps/tempoflow3 && npm run proof:hard
node --test scripts/test-os-shell.mjs scripts/test-os-owned-by-brand.mjs
node --test scripts/test-os-cold-warm.mjs   # ~2 min
node --test scripts/test-os-native-pnp.mjs
```
