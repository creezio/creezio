# Rapport TempoFlow3 — prompts 0→13

**Date** : 2026-08-01  
**Artefact** : `apps/tempoflow3`  
**Playbook** : [HISTORIQUE-PROMPTS.md](./HISTORIQUE-PROMPTS.md)

## Verdict

| Critère | Résultat |
|---------|----------|
| Brief → bootstrap factory | ✅ |
| Parcours fournisseurs → prix → panier → commande | ✅ smoke |
| Onglets mini-PRDs 2–12 | ✅ API + UI SPA + nav |
| Repo marque sans launchers OS | ✅ `test:allowlist` |
| Capacités lourdes via creezio (wiring) | ✅ paths/host-stack/boot/auth refs |
| Parity visuelle complète oracle 0.10.26 | ⏳ F6 / E2E Electron |

## Ce qui vient de Creezio (lourd)

`@creezio/electron-shell`, `brand-config`, `shell-ui`, `api-kernel`,
`mcp-facade`, `auth`, `onboarding`, `product-hub`, factory `--from-prd`.

## Ce qui est dans tempoflow3 (léger)

Schéma brand, API métier JSON, UI onglets, queries, smokes métier,
wiring mince (`src/lib/*`).

## Gaps restants

Voir [PROBLEMES.md](./PROBLEMES.md) — surtout GUI Electron E2E et
générateurs factory pour modules au-delà du CHR MVP.
