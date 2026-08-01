# Preuve TempoFlow3 — statut vivant

## Gates automatisées (2026-08-01 — vague audit P0)

| Gate | Résultat | Limite |
|------|----------|--------|
| `proof:hard` | **73/73 SUCCESS** | connection/setup/plugins/kanban/UI OS ; pas GUI AdsPower |
| `proof:oracle` | **34/34** (+ anti-stubs OS) | |
| `test-os-connection-profile` | setup + connection HTTP | |
| `test-os-app-kind` | client/server resolve | |
| `test-os-plugins` | 2/2 | |
| `test-os-cold-warm` | n8n start | |
| `test-os-native-pnp` | 4/4 | |
| `brand apply-modules` | inventaire + owned-by-brand | pas codegen bonus |

## Audit

Voir `AUDIT-GAPS-2026-08-01.md` — plan P0 exécuté, P1/P2 restants documentés.

## Encore ouvert

- Tunnel Cloudflare distant (credentials)
- Atelier optimiser canvas TF2 / navigateur fournisseur
- MCP OAuth routes harness
- `test:shell` ~40 complets
- AdsPower / xvfb GUI

## Commandes

```bash
node --test scripts/test-os-connection-profile.mjs scripts/test-os-app-kind.mjs
node packages/factory/bin/creezio.js brand apply-modules \
  --spec apps/tempoflow3/brand-spec --out apps/tempoflow3
cd apps/tempoflow3 && npm run proof:oracle && npm run proof:hard
```
