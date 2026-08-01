# Preuve TempoFlow3 — statut vivant

## Gates automatisées (2026-08-01 — vague P1)

| Gate | Résultat | Limite |
|------|----------|--------|
| `proof:hard` | à rejouer après vague P1 (+ OAuth / canvas / slots) | pas GUI AdsPower |
| `proof:oracle` | à rejouer (+ admin analytics/logs + canvas) | |
| `test-os-mcp-oauth` | **PASS** well-known + DCR + admin | loopback, sans Cloudflare |
| `test-os-shell-more` | **PASS** profile/recovery/tunnel | |
| `test-os-connection-profile` | setup + connection HTTP | |
| `test-os-app-kind` | client/server resolve | |
| `test-os-plugins` | 2/2 | |
| `test-os-cold-warm` | n8n start | |
| `test-os-native-pnp` | 4/4 | |
| `brand apply-modules` | inventaire + scaffold UI absents | ne wipe pas owned-by-brand |

## Audit

Voir `AUDIT-GAPS-2026-08-01.md`.

## Livré P1 (cette vague)

- MCP OAuth + admin MCP montés dans harness/desktop (`mountBrandMcpSurface`)
- Optimiser canvas SVG graphe
- Navigateur fournisseur slots (catalogue / promos / web)
- Admin analytics + request-logs
- `apply-modules` scaffold UI stubs manquants

## Encore ouvert (externes / profondeur)

- Tunnel Cloudflare distant (`CREEZIO_TUNNEL_PROVISION_*`)
- AdsPower GUI (xvfb smoke possible en CI)
- `test:shell` ~40 scripts TF2 complets
- ReactFlow optimiser TF2 pixel-perfect / missions IA riches

## Commandes

```bash
node --test scripts/test-os-mcp-oauth.mjs scripts/test-os-shell-more.mjs
node packages/factory/bin/creezio.js brand apply-modules \
  --spec apps/tempoflow3/brand-spec --out apps/tempoflow3
cd apps/tempoflow3 && npm run proof:oracle && npm run proof:hard
```
