# Preuve TempoFlow3 — statut vivant

## Gates automatisées (2026-08-01)

| Gate | Résultat | Limite |
|------|----------|--------|
| `proof:hard` | **58/58 SUCCESS** | Harness Node + ensure/start — pas GUI Electron AdsPower |
| `proof:oracle` | 33/33 (pages) | Parité pages ≠ profondeur TF2 partout |
| `reset-tempoflow3.mjs --no-proof` | OK | `owned-by-brand` préserve métier |
| `test-os-owned-by-brand` | OK | |
| `test-os-shell` | 6/6 | Contrats + BYOK/recovery/updater |
| `test-os-cold-warm` | OK ready+ensure | `started` flaky si port 15678 occupé |
| `test-os-electron-runtime-smoke` | wiring OK | Launch xvfb optionnel / skip CI |

## Avancées kit cette itération

- `creezio:owned-by-brand` + `package.json creezio.ownedByBrand` → apply --force ne wipe plus
- Hook bonus optionnel dans générateur `brand-module-api`
- Versions commande + likes métier
- Reset scripté `scripts/reset-tempoflow3.mjs`
- Suite shell kit agrégée

## Encore ouvert vs DoD handoff

- Tunnel Cloudflare **distant** (hostname public) — local MCP seulement
- Cold-warm n8n **start** 100% fiable (port fixe / zombies)
- Smoke Electron GUI réel systématique (xvfb)
- Agrégat `test:shell` 0.10.26 complet (~40 scripts)
- Profondeur optimiser/dispatch/site = TF2
- Checklist OS oracle encore partiellement `[ ]`

## Commandes

```bash
node scripts/reset-tempoflow3.mjs --no-proof
cd apps/tempoflow3 && npm run proof:hard
node --test scripts/test-os-shell.mjs scripts/test-os-owned-by-brand.mjs
node --test scripts/test-os-cold-warm.mjs   # ~2 min
```
