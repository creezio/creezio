---
"@creezio/search": minor
"@creezio/host-runtime": minor
"@creezio/brand-spec": minor
"@creezio/observability": minor
"@creezio/propagation": minor
"@creezio/factory": minor
"@creezio/platform-core": minor
"@creezio/app-runtime": minor
"@creezio/electron-shell": minor
---

P1.c — H7 : neutralisation des contrats au vocabulaire marque (ARCHITECTURE_VERSION H6 → H7).

Breaking contrôlé avec **dual-read une version** (politique de dépréciation —
voir `docs/adr/ADR-h7-neutralize-brand-contracts.md`) :

- **search** : `countTables`/`CatalogSqlCounts` génériques (`Record<string, …>`),
  `countKey` libre par index ; alias `sites`→`fournisseurs` normalisé par
  `fingerprintCountKey` (une version) ; `createChrCatalogMeiliFeed`,
  `expectedMeiliCounts`, `countGedSql` dépréciés (retrait au prochain bump).
  Meili reste fail-closed à l'identique.
- **host-runtime** : env bridge Hermes dérivé du manifest (`envKey`) ; dual-read
  `TEMPOFLOW_*`, `TF2_HERMES_REMOTE_KEY` et fichiers `~/.tempoflow-*` legacy
  avec warnings bruyants ; `clearTempoflowGeneratedWebuiPassword` déprécié
  (alias de `clearGeneratedWebuiPassword`).
- **brand-spec** : `vertical?: string` (libre), `feedPreset?: string` (id du
  registre de presets factory ; valeur legacy `<vertical>-catalog` normalisée).
- **observability** : plus de fallbacks `CERTIVAN_/FIDU_FLEET_STATE_DIR` —
  lecture générique de `${envPrefix}_FLEET_STATE_DIR` dérivé du manifest.
- **propagation** : canaux data-driven (`listUpdateChannels`,
  `configureBrandChannels`, `brandPrChannelId`) ; `UPDATE_CHANNELS` déprécié
  (snapshot) ; plus de noms de marque ni chemins absolus dans les types.
- **factory** : registre de presets de feed Meili
  (`registerMeiliFeedPreset`/`getMeiliFeedPreset`) — preset catalogue CHR
  inliné dans le code marque généré.

Migration marque : codemod idempotent `scripts/codemods/H7/h7-neutralize-brand-contracts.mjs`
(`ROOT=<clone marque> node …`).
