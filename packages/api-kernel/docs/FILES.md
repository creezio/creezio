# packages/api-kernel — inventaire des fichiers

> Standard : [DOC-STANDARD.md](../../../docs/DOC-STANDARD.md) — maintenu via
> `node scripts/generate-files-md.mjs api-kernel` (gate `test-phase-docs-freshness`).
> Colonne « Rôle » éditable à la main : la régénération la préserve.

## `src/`

| Fichier | Rôle |
|---|---|
| [`src/db-scope.ts`](../src/db-scope.ts) | Accès DB scopé par couche (H2.2) — deny-by-default cross-layer write. Un mount module (brand) ou plugin ne reçoit qu'un handle sur sa couche. Platform → couche core. Toute tentative d'écriture core depuis brand/plugin → CrossLayerWriteDeniedError. |
| [`src/entity-mount.ts`](../src/entity-mount.ts) | (à documenter) |
| [`src/hono.ts`](../src/hono.ts) | Adaptateur Hono officiel — délègue les espaces façade au kernel. Usage typique (app marque avec `.basePath("/api/v1")`) |
| [`src/index.ts`](../src/index.ts) | @creezio/api-kernel — façade HTTP unique (Phase H1.1 / isolation H2 / P17). |
| [`src/kernel.ts`](../src/kernel.ts) | Façade API Creezio — registre + routes cœur + deny-by-default cross-write. H2 : ScopedDbAccess injecté quand `sqliteRuntime` est fourni. P17 : espaces core / platform / modules / plugins. |
| [`src/register.ts`](../src/register.ts) | Helpers DX — enregistrement batch de mounts + factory marque documentée. Pattern recommandé (Electron + Next, une seule SoT) |
| [`src/types.ts`](../src/types.ts) | Contrats HTTP façade Creezio — indépendants d'Express/Fastify/Next. |
