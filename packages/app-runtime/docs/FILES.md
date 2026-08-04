# FILES — @creezio/app-runtime

| Fichier | Rôle |
|---------|------|
| [`src/index.ts`](../src/index.ts) | Surface publique du package |
| [`src/types.ts`](../src/types.ts) | Types de config (StartBrandDesktopConfig, harness…) |
| [`src/start-brand-desktop.ts`](../src/start-brand-desktop.ts) | Boot desktop Electron complet — early crash writer, data layout packagé, splash, updater, host stack |
| [`src/start-brand-kernel-harness.ts`](../src/start-brand-kernel-harness.ts) | Boot OS sans Electron (serveur Docker headless, smokes) |
| [`src/compose-brand-os.ts`](../src/compose-brand-os.ts) | Composition OS natif : kernel, stores, auth, fleet (sentinelle `ingest-disabled` par défaut), surfaces |
| [`src/create-brand-kernel.ts`](../src/create-brand-kernel.ts) | Création du kernel API (espaces core/platform/modules/plugins) |
| [`src/listen-brand-os-http.ts`](../src/listen-brand-os-http.ts) | Serveur HTTP OS (`/api/v1`, CRM web) |
| [`src/listen-brand-boot-http.ts`](../src/listen-brand-boot-http.ts) | Early-listen : `boot-status`/healthz répondent pendant le boot |
| [`src/boot-progress.ts`](../src/boot-progress.ts) | Progression de boot headless (modèle splash partagé) — JSON `GET /api/v1/os/boot-status`, JSONL stdout, journal ops |
| [`src/warm-brand-native-hosts.ts`](../src/warm-brand-native-hosts.ts) | Préchauffage embeds n8n/Hermes |
| [`src/wire-brand-browser-sidecar.ts`](../src/wire-brand-browser-sidecar.ts) | Wiring sidecar navigateur IA (AiSessionHost, proxy `CREEZIO_BROWSER_PROXY`) |
| [`src/install-brand-os-desktop.ts`](../src/install-brand-os-desktop.ts) | Installation des services OS dans le main Electron |
| [`src/start-brand-ui-plane.ts`](../src/start-brand-ui-plane.ts) | Plan UI (Next standalone / dev) |
| [`src/brand-platform-store.ts`](../src/brand-platform-store.ts) | Store plateforme marque |
| [`src/mount-brand-email-surface.ts`](../src/mount-brand-email-surface.ts) | Surface mails optionnelle |
| [`src/mount-brand-mcp-surface.ts`](../src/mount-brand-mcp-surface.ts) | Surface MCP optionnelle |
| [`src/mount-brand-platform-surface.ts`](../src/mount-brand-platform-surface.ts) | Surface plateforme optionnelle |
| [`src/electron-shim.d.ts`](../src/electron-shim.d.ts) | Types Electron optionnels (harness sans Electron) |
