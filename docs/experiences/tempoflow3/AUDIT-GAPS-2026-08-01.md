# Audit gaps — OS P&P + TempoFlow3 vs TF2 0.10.26

Date : 2026-08-01. Ref TF2 : `v0.10.26` / `e36e4d0`.

## Verdict

Kit OS boot/P&P et métier API TF3 sont **largement prouvés**. DoD produit bloque surtout sur **UI OS stubs**, **agrégat test:shell**, **OAuth/admin**, profondeur optimiser canvas, et **tunnel distant** (credentials).

## Déjà OK (A)

- `proof:hard` 61/61, `proof:oracle` pages, cold-warm n8n start, native-pnp, plugins opt-in, owned-by-brand
- Architecture mince `startBrandDesktop`, vendors kit only
- Bonus API : optimiser/dispatch/stack/relevés/scan/site/versions/likes…

## Plan d’implémentation (cette vague = P0)

| # | Item | Couche | Done |
|---|------|--------|------|
| 1 | `GET/POST /api/v1/os/connection` + test remote | kit | ✓ |
| 2 | `GET/POST /api/v1/os/setup` first-run | kit | ✓ |
| 3 | Pages UI OS interactives (plus « Surface exposée… ») | marque | ✓ |
| 4 | Admin plugins/mcp/database + likes + data-mapping CRUD | marque | ✓ |
| 5 | Tâches kanban colonnes + mails draft/send | marque | ✓ |
| 6 | Oracle anti-stub + proof:hard extensions | preuves | ✓ 73/73 + 34/34 |
| 7 | `test-os-connection-profile` + app-kind | kit | ✓ |
| 8 | `creezio brand apply-modules` | factory | ✓ |

## P1 (suivant)

- Atelier optimiser canvas TF2, navigateur fournisseur slots
- MCP OAuth routes dans harness
- Brancher `@creezio/shell-ui` Settings (deps UI + transpile)
- Génération auto bonus depuis BrandSpec YAML

## P2 / bloqueurs externes (D)

- Tunnel Cloudflare distant (`CREEZIO_TUNNEL_PROVISION_*`)
- AdsPower / xvfb GUI CI
- `test:shell` ~40 scripts TF2 complets
