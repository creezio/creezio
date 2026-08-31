# AGENTS — @creezio/granola

## Mission

Module natif Granola : récepteur webhook signé (Standard Webhooks),
sync des notes en `brand.db`, client + proxys de l'API publique Granola
(`https://public-api.granola.ai`). Générique : zéro domaine marque.

## Frontières

- Patron **module natif hybride** (comme `onboarding`) : le kit fournit le
  moteur, la marque enregistre `createGranolaMount({ defaults })` sous l'id
  `granola` et compose `granolaMigrations()` dans ses migrations brand —
  **pas** de montage automatique dans `app-runtime`.
- `POST webhook` est une route machine **publique** (justifiée par
  `accessJustification`) : la sécurité est la signature HMAC fail-closed
  dès qu'un `signingSecret` est configuré. Ne pas poser de `permission`
  sur le mount — elle bloquerait les livraisons Granola.
- Les secrets (`apiKey`, `signingSecret`) ne sortent **jamais en clair**
  de `GET config` (masqués via `maskSecret`). Ne pas les logger.
- Imports `@creezio/api-kernel` / `@creezio/platform-core` **type-only**
  (pas d'import runtime — cycle). Seul runtime import : `node:crypto`.
- Pas de `zod`, pas d'Electron, pas de dépendance réseau imposée
  (`fetchImpl` injectable).

## Points d'entrée

- `src/index.ts` : surface publique.
- `src/config.ts` : `GranolaModuleConfig`, `granolaMigrations()`
  (tables `granola_settings` / `granola_events` / `granola_notes`,
  `granola_002_note_transcript_folder` pour `folder_id` / `transcript_json`),
  `mergeGranolaConfig`, `maskSecret`.
- `src/signature.ts` : `verifyGranolaSignature` (HMAC-SHA256
  `{id}.{timestamp}.{body}`, tolérance rejeu 300 s) + `signGranolaPayload`
  (tests/simulateur).
- `src/client.ts` : `createGranolaClient` — notes / transcript / folders /
  webhook-endpoints.
- `src/mount.ts` : `createGranolaMount` → `/api/v1/modules/granola/*`
  (webhook, webhook-info, register-webhook, config, events, notes,
  `GET notes/:id/transcript`, remote/*).
- `ui/granola-client.tsx` : page `GranolaClient` — compose les deux panneaux.
- `ui/granola-notes-panel.tsx` : workspace notes (liste + fiche) — **GRANOLA-1**.
- `ui/granola-connect-panel.tsx` : config / webhook / livraisons — **GRANOLA-2**
  (ne pas enrichir depuis GRANOLA-1).

## Modifier sans casser

- `verifyGranolaSignature` doit rester conforme Standard Webhooks
  (secret `whsec_` base64-décodé, préfixe `v1,`, `timingSafeEqual`) —
  vérifié par la gate.
- Le webhook doit répondre 2xx en < 15 s : la sync note reste best-effort
  et non bloquante (`awaitWebhookSync` = tests uniquement).
- La dédup par `event_id` doit survivre aux retries (payload identique,
  `deliveries` incrémenté).
- `register-webhook` capture le `signing_secret` retourné **une seule
  fois** par l'API : ne jamais le renvoyer au client HTTP, seulement le
  stocker (`secretStored: true`).

## Tests/gates

```bash
npm run build -w @creezio/granola
node --test scripts/test-phase-granola.mjs
```

## Liens

- [README.md](./README.md)
- [docs/FILES.md](./docs/FILES.md)
- Doc API : https://docs.granola.ai (webhooks + api-reference)
