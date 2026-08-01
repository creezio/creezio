# AGENTS — TempoFlow3 (marque métier)

## Mission

Marque **légère** TempoFlow construite via creezio (`new-app --from-prd` +
mini-PRDs). Ici : métier CHR seulement. Le lourd (auth, desktop, assistant,
tasks, mails, plugins, tunnel, MCP…) = `@creezio/*`.

## Anti-triche

- Ne pas copier le code de `tempoflow2` / oracle 0.10.26.
- Enrichir module par module avec les prompts de
  `docs/experiences/tempoflow3/HISTORIQUE-PROMPTS.md`.
- Gap générique → ticket / PR **creezio**, pas duplication OS ici.

## Bootstrap

```bash
# depuis la racine kit
creezio new-app \
  --from-prd docs/experiences/tempoflow3/PRD-PRODUIT.md \
  --out apps/tempoflow3 --force
npm run test:metier-parcours -w @creezio/app-tempoflow3
```

## Allowlist

Voir `docs/experiences/tempoflow3/ALLOWLIST.md`.

## Tests

```bash
npm run test:metier-parcours
npm run test:first-run-auth
```
