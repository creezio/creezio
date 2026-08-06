# packages/app-runtime — inventaire des fichiers

> Standard : [DOC-STANDARD.md](../../../docs/DOC-STANDARD.md) — maintenu via
> `node scripts/generate-files-md.mjs app-runtime` (gate `test-phase-docs-freshness`).
> Colonne « Rôle » éditable à la main : la régénération la préserve.

## `scripts/`

| Fichier | Rôle |
|---|---|
| [`scripts/smoke-platform-surface.mjs`](../scripts/smoke-platform-surface.mjs) | (à documenter) |

## `src/`

| Fichier | Rôle |
|---|---|
| [`src/boot-progress.ts`](../src/boot-progress.ts) | Progression de boot headless (modèle splash partagé) — JSON `GET /api/v1/os/boot-status`, JSONL stdout, journal ops |
| [`src/brand-platform-store.ts`](../src/brand-platform-store.ts) | Store plateforme marque |
| [`src/compose-brand-os.ts`](../src/compose-brand-os.ts) | Composition OS natif : kernel, stores, auth, fleet (sentinelle `ingest-disabled` par défaut), surfaces |
| [`src/create-brand-kernel.ts`](../src/create-brand-kernel.ts) | Création du kernel API (espaces core/platform/modules/plugins) |
| [`src/fleet-heartbeat.ts`](../src/fleet-heartbeat.ts) | (à documenter) |
| [`src/harness-server-phases.ts`](../src/harness-server-phases.ts) | (à documenter) |
| [`src/hermes-mcp-host-tools.ts`](../src/hermes-mcp-host-tools.ts) | (à documenter) |
| [`src/index.ts`](../src/index.ts) | Surface publique du package |
| [`src/install-brand-os-desktop.ts`](../src/install-brand-os-desktop.ts) | Installation des services OS dans le main Electron |
| [`src/listen-brand-boot-http.ts`](../src/listen-brand-boot-http.ts) | Early-listen : `boot-status`/healthz répondent pendant le boot |
| [`src/listen-brand-os-http.ts`](../src/listen-brand-os-http.ts) | Serveur HTTP OS (`/api/v1`, CRM web) |
| [`src/mcp-jsonrpc.ts`](../src/mcp-jsonrpc.ts) | (à documenter) |
| [`src/mount-brand-email-surface.ts`](../src/mount-brand-email-surface.ts) | Surface mails optionnelle |
| [`src/mount-brand-mcp-surface.ts`](../src/mount-brand-mcp-surface.ts) | Surface MCP optionnelle |
| [`src/mount-brand-platform-surface.ts`](../src/mount-brand-platform-surface.ts) | Surface plateforme optionnelle |
| [`src/plugin-acl-wiring.ts`](../src/plugin-acl-wiring.ts) | (à documenter) |
| [`src/plugin-proxy-mount.ts`](../src/plugin-proxy-mount.ts) | (à documenter) |
| [`src/plugin-seed.ts`](../src/plugin-seed.ts) | (à documenter) |
| [`src/plugin-tools-discovery.ts`](../src/plugin-tools-discovery.ts) | (à documenter) |
| [`src/start-brand-desktop.ts`](../src/start-brand-desktop.ts) | Boot desktop Electron complet — early crash writer, data layout packagé, splash, updater, host stack |
| [`src/start-brand-kernel-harness.ts`](../src/start-brand-kernel-harness.ts) | Boot OS sans Electron (serveur Docker headless, smokes) |
| [`src/start-brand-ui-plane.ts`](../src/start-brand-ui-plane.ts) | Plan UI (Next standalone / dev) |
| [`src/types.ts`](../src/types.ts) | Types de config (StartBrandDesktopConfig, harness…) |
| [`src/warm-brand-native-hosts.ts`](../src/warm-brand-native-hosts.ts) | Préchauffage embeds n8n/Hermes |
| [`src/wire-brand-browser-sidecar.ts`](../src/wire-brand-browser-sidecar.ts) | Wiring sidecar navigateur IA (AiSessionHost, proxy `CREEZIO_BROWSER_PROXY`) |
