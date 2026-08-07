# scripts — inventaire des fichiers

> Standard : [DOC-STANDARD.md](../../docs/DOC-STANDARD.md) — maintenu via
> `node scripts/generate-files-md.mjs scripts` (gate `test-phase-docs-freshness`).
> Colonne « Rôle » éditable à la main : la régénération la préserve.

## Racine

| Fichier | Rôle |
|---|---|
| [`build-cjs.mjs`](../build-cjs.mjs) | !usrbinenv node |
| [`generate-files-md.mjs`](../generate-files-md.mjs) | Générateur des inventaires `docs/FILES.md` — format standard du kit. |
| [`kit-version.mjs`](../kit-version.mjs) | !usrbinenv node |
| [`propagation-impact.mjs`](../propagation-impact.mjs) | !usrbinenv node |
| [`reset-tempoflow3.mjs`](../reset-tempoflow3.mjs) | Reset scripté TempoFlow3 : backup → brand apply --force → les fichiers creezio:owned-by-brand / creezio.ownedByBrand sont préservés. |
| [`sync-creezio-vendor.sh`](../sync-creezio-vendor.sh) | !usrbinenv bash |
| [`test-fast.mjs`](../test-fast.mjs) | Runner gates fail-fast lisible (`npm run test:kit`/`test:brands`/`test:env`) — suites auto-détectées (matrice dans README), séquentiel, stop 1re rouge, `--from`/`--only`/`--skip`, JSONL /tmp/creezio-test-fast.log |
| [`test-mails-inbox.mjs`](../test-mails-inbox.mjs) | Tests inbox SoT @creezio/mails (insert/list/read/delete/PJ + configureMails). |
| [`test-meili-no-brand-legacy.mjs`](../test-meili-no-brand-legacy.mjs) | Gate — pas de vocabulaire marque legacy (`tf2_`) dans le module Meili natif. |
| [`test-os-ai-missions.mjs`](../test-os-ai-missions.mjs) | Gate OS — surface missions IA (tasks kit) : exports ai-task / Hermes, configureTasksBrand, SSE activity stream. |
| [`test-os-app-kind.mjs`](../test-os-app-kind.mjs) | appKind client/server — résolution kit (équivalent TF2 test:app-kind). |
| [`test-os-cold-warm.mjs`](../test-os-cold-warm.mjs) | Cold-start OS : userData vide + warm n8n réel + /os/ready. Hermes skip par défaut (install lourde) — CREEZIO_COLD_WARM_HERMES=1 pour inclure. |
| [`test-os-connection-profile.mjs`](../test-os-connection-profile.mjs) | Connection profile Héberger / Rejoindre via HTTP OS. Harness optionnel si probe brand (tempoflow3) résolu hors monorepo. |
| [`test-os-electron-runtime-smoke.mjs`](../test-os-electron-runtime-smoke.mjs) | Smoke shell runtime Electron — wiring kit + lancement court si electron/xvfb. |
| [`test-os-email-surface.mjs`](../test-os-email-surface.mjs) | Gate OS — surface `/api/v1/email` montée par app-runtime (Worker inbound). |
| [`test-os-embeds.mjs`](../test-os-embeds.mjs) | Gate OS — embeds Hermes/n8n + catalogue env (port TF2 hermes-embed / n8n-embed / embed-env). |
| [`test-os-fleet-compose.mjs`](../test-os-fleet-compose.mjs) | Gate OS — composeBrandOs branche fleet: depuis manifest.features.fleet. |
| [`test-os-mails-config.mjs`](../test-os-mails-config.mjs) | Gate OS — configureMails + file-sink send + schéma inbox prêt. |
| [`test-os-mcp-oauth.mjs`](../test-os-mcp-oauth.mjs) | MCP OAuth + admin — prouvable en local (sans Cloudflare). Harness si probe brand résolu hors monorepo kit. |
| [`test-os-native-pnp.mjs`](../test-os-native-pnp.mjs) | Gate OS native plug-and-play — multi-marques : prouve qu'une app neuve (brand apply) démarre avec embeds, DB et surfaces OS sans wiring manuel. |
| [`test-os-open-external-tab.mjs`](../test-os-open-external-tab.mjs) | Gate OS — onglets externes + tool MCP `open_external_tab`. Unit-style (tab-url, preload path, contrats MCP) — pas de GUI Electron. |
| [`test-os-owned-by-brand.mjs`](../test-os-owned-by-brand.mjs) | brand apply --force ne doit pas wipe les fichiers creezio:owned-by-brand. |
| [`test-os-plugins.mjs`](../test-os-plugins.mjs) | Plugins control plane via compose OS — actifs par défaut, kill-switch CREEZIO_PLUGINS=0 (l'ancien opt-in =1 reste un no-op). |
| [`test-os-public-origin.mjs`](../test-os-public-origin.mjs) | Gate OS — public-origin / cookies Secure (port TF2 test:public-origin). |
| [`test-os-shell-contracts.mjs`](../test-os-shell-contracts.mjs) | Contrats shell OS kit (splash / tray / embeds / updater / vendors). |
| [`test-os-shell-more.mjs`](../test-os-shell-more.mjs) | Extensions shell kit — fonctions réellement exportées par @creezio/platform-core. |
| [`test-os-shell.mjs`](../test-os-shell.mjs) | Agrégat test:shell kit — contrats + surfaces BYOK/recovery/updater/tunnel. |
| [`test-os-tunnel-provision.mjs`](../test-os-tunnel-provision.mjs) | Gate OS — resolveTunnelProvision (envPrefix / CREEZIO_TUNNEL_PROVISION_*). |
| [`test-os-updater.mjs`](../test-os-updater.mjs) | Gate OS — reduceur updater (port TF2 test:updater), sans Electron. |
| [`test-phase-admin-billing.mjs`](../test-phase-admin-billing.mjs) | Gate — module billing admin (@creezio/admin) : webhook + réconciliation. |
| [`test-phase-admin-database-runtime.mjs`](../test-phase-admin-database-runtime.mjs) | Gate Admin Database runtime : stores `core`+`brand` auto-enregistrés + `GET /database/dbs` |
| [`test-phase-admin-fleet-registry.mjs`](../test-phase-admin-fleet-registry.mjs) | Gate — module fleet-registry (@creezio/admin) : DB flotte centrale (F2). |
| [`test-phase-admin-prospects.mjs`](../test-phase-admin-prospects.mjs) | (à documenter) |
| [`test-phase-admin-roadmap.mjs`](../test-phase-admin-roadmap.mjs) | (à documenter) |
| [`test-phase-api-entity-mount.mjs`](../test-phase-api-entity-mount.mjs) | Gate entity mounts — moteur CRUD déclaratif `@creezio/api-kernel` (`createEntityApiMount` / `registerEntityMounts`). |
| [`test-phase-api-fallthrough-loop.mjs`](../test-phase-api-fallthrough-loop.mjs) | (à documenter) |
| [`test-phase-app-runtime.mjs`](../test-phase-app-runtime.mjs) | Gate app-runtime — façade exports + composeBrandOs smoke (sans apps/tempoflow3). |
| [`test-phase-auth-secret.mjs`](../test-phase-auth-secret.mjs) | Gate sécurité AUTH_SECRET serveur (fix trou : serveurs Docker headless signaient les sessions avec le fallback dev public). |
| [`test-phase-b.mjs`](../test-phase-b.mjs) | !usrbinenv node |
| [`test-phase-b2.mjs`](../test-phase-b2.mjs) | !usrbinenv node |
| [`test-phase-brand-spec.mjs`](../test-phase-brand-spec.mjs) | Gate BrandSpec — load / doctor / init / onboarding decl. Extract P1.1 : package + ADR (+ CREATE-BRAND doc). |
| [`test-phase-c.mjs`](../test-phase-c.mjs) | !usrbinenv node |
| [`test-phase-c0.mjs`](../test-phase-c0.mjs) | Phase C0 — docs/archive/gates/matrice = état réel + backlog C*. |
| [`test-phase-c1.mjs`](../test-phase-c1.mjs) | Phase C1 — schéma kit rich + docs cutover TF. |
| [`test-phase-c2.mjs`](../test-phase-c2.mjs) | Phase C2 — docs cutover Certivan. |
| [`test-phase-c3.mjs`](../test-phase-c3.mjs) | Phase C3 — fabrique V1 réelle : scaffold riche, console SQLite, PrdDrafter. |
| [`test-phase-c4.mjs`](../test-phase-c4.mjs) | Phase C4 — V2/V3 prod-ready : SQLite obs/automations + console + docs. |
| [`test-phase-c7.mjs`](../test-phase-c7.mjs) | Phase C7 — startHostPluginControlPlane unifié (4 boots + ACL). |
| [`test-phase-clone-autonomy.mjs`](../test-phase-clone-autonomy.mjs) | Gate — clone autonome des repos marque (distribution sans kit). |
| [`test-phase-crash-reporter.mjs`](../test-phase-crash-reporter.mjs) | Gate crash-reporter kit — upload configurable + brandId + pending queue. |
| [`test-phase-create-brand.mjs`](../test-phase-create-brand.mjs) | Sonde E2E CREATE-BRAND — init → doctor → apply → smoke façade. |
| [`test-phase-d.mjs`](../test-phase-d.mjs) | !usrbinenv node |
| [`test-phase-data-changed.mjs`](../test-phase-data-changed.mjs) | (à documenter) |
| [`test-phase-desktop-server-parity.mjs`](../test-phase-desktop-server-parity.mjs) | Gate parité desktop Serveur TF2 0.10.26 : NSIS (démarrage auto, désinstall profonde), UI Configuration (tray / launchAtStartup / factory-reset), runtime. |
| [`test-phase-docs-freshness.mjs`](../test-phase-docs-freshness.mjs) | Gate D0 — fraîcheur documentaire (docs/DOC-STANDARD.md). Vérifie, pour chaque cible du périmètre (packages/*, docker/*, apps/*, scripts/) : 1. |
| [`test-phase-e.mjs`](../test-phase-e.mjs) | !usrbinenv node |
| [`test-phase-f.mjs`](../test-phase-f.mjs) | !usrbinenv node |
| [`test-phase-factory-docker-parity.mjs`](../test-phase-factory-docker-parity.mjs) | Gate héritage factory → Docker (env, opt-in CREEZIO_FACTORY_DOCKER=1). |
| [`test-phase-factory-lockfile.mjs`](../test-phase-factory-lockfile.mjs) | (à documenter) |
| [`test-phase-factory-prd-experience.mjs`](../test-phase-factory-prd-experience.mjs) | Gate expérience F5 — simulation agent « un prompt produit ». Input = PROMPT-PRODUIT + PRD uniquement ; assert fichiers métier + smoke. |
| [`test-phase-factory-prd.mjs`](../test-phase-factory-prd.mjs) | Gate F0–F5 — factory --from-prd natif (api-kernel + SQLite). |
| [`test-phase-factory-two-repos.mjs`](../test-phase-factory-two-repos.mjs) | Gate FLOTTE — factory 2-repos : chaque marque = monorepo (server/ client/) + repo ADMIN dédié `<brand>-admin` (pilotage flotte multi-VPS, sans secret). |
| [`test-phase-fleet-agent.mjs`](../test-phase-fleet-agent.mjs) | Gate FLOTTE — agent hôte + server-admin multi-VPS (fleet-collector). |
| [`test-phase-fleet-heartbeat.mjs`](../test-phase-fleet-heartbeat.mjs) | Gate — auto-inscription flotte + heartbeat (F3). Prouve, avec un VRAI serveur HTTP admin (mount fleet-registry @creezio/admin sur DB better-sqlite3) et le client kit (@creezio/app-runtime) : 1. |
| [`test-phase-fleet-releases.mjs`](../test-phase-fleet-releases.mjs) | Gate — updates en PULL de la flotte (F5). Prouve, sur DB brand réelle (better-sqlite3, migrations admin) + mocks admin/registre : 1. |
| [`test-phase-fleet-rollout.mjs`](../test-phase-fleet-rollout.mjs) | Gate — rollout piloté de la flotte (F6). Prouve, sur DB brand réelle (better-sqlite3, migrations admin) : 1. |
| [`test-phase-h1.mjs`](../test-phase-h1.mjs) | !usrbinenv node |
| [`test-phase-h2.mjs`](../test-phase-h2.mjs) | !usrbinenv node |
| [`test-phase-h3.mjs`](../test-phase-h3.mjs) | Tests Phase H3 — cadre kit (métier reste dans tempoflow2). |
| [`test-phase-h4.mjs`](../test-phase-h4.mjs) | Tests Phase H4 — proxy MCP unifié (registry, namespaces, aliases, policies). |
| [`test-phase-h5.mjs`](../test-phase-h5.mjs) | !usrbinenv node |
| [`test-phase-harness-parity.mjs`](../test-phase-harness-parity.mjs) | Gate parité serveur Docker headless — phases TF2 portées dans le harness (`startBrandKernelHarness`), prouvées fonctionnellement en sandbox. |
| [`test-phase-hermes-computer-use.mjs`](../test-phase-hermes-computer-use.mjs) | H3/H4 « Hermes cerveau unique » — verbes navigateur directs + HITL async + skills sites auto-entretenus. |
| [`test-phase-hermes-mcp.mjs`](../test-phase-hermes-mcp.mjs) | H1 « Hermes cerveau unique » — Hermes pilote le runner de tâches. |
| [`test-phase-hermes-web-allowlist.mjs`](../test-phase-hermes-web-allowlist.mjs) | H0 « Hermes cerveau unique » — allowlist web appliquée AU NIVEAU EXÉCUTION. |
| [`test-phase-hybrid.mjs`](../test-phase-hybrid.mjs) | Gate architecture hybride : browser-host (driver partagé, sans electron), surface plateforme + sidecar IA, client thin `requireRemoteProfile`, bridge session, `defaultServerUrl`, onglets réels install-brand-os-desktop, Hermes `--skip-browser` conditionnel |
| [`test-phase-i0.mjs`](../test-phase-i0.mjs) | Phase I0 — gouvernance : sync vendor contrat, ARCHITECTURE_VERSION, docs. |
| [`test-phase-i1.mjs`](../test-phase-i1.mjs) | Phase I1 — createSqliteAuthStore (core.db) + session après restart. |
| [`test-phase-i2.mjs`](../test-phase-i2.mjs) | Phase I2 — createSqliteAssistantStore (core.db) + persist after reopen. |
| [`test-phase-i3.mjs`](../test-phase-i3.mjs) | Phase I3 — tasks/mails sqlite + file-sink provider + vendor list. |
| [`test-phase-i4.mjs`](../test-phase-i4.mjs) | Phase I4 — control-plane unifié : helpers ACL + demobrand path. |
| [`test-phase-i5.mjs`](../test-phase-i5.mjs) | Phase I5 — Admin Plugins L3 : upsert caps + deny cross-org (API = UI). |
| [`test-phase-i6.mjs`](../test-phase-i6.mjs) | Phase I6 — createFileOrgPluginRegistry persisté + reopen. |
| [`test-phase-i7.mjs`](../test-phase-i7.mjs) | Phase I7 — createNavShellAdapter + demobrand conso. |
| [`test-phase-i8.mjs`](../test-phase-i8.mjs) | Phase I8 — freeze H6 : ARCHITECTURE_VERSION + factory scaffold + parity doc. |
| [`test-phase-integrations.mjs`](../test-phase-integrations.mjs) | Gate — intégrations / clés API tierces (ADR-integrations-store). |
| [`test-phase-landing.mjs`](../test-phase-landing.mjs) | Gate — module natif hybride « landing page » (ADR-module-natif-hybride). |
| [`test-phase-m0.mjs`](../test-phase-m0.mjs) | Phase M0 — baseline vision stricte : inventaire + freeze anti-stub. |
| [`test-phase-m1.mjs`](../test-phase-m1.mjs) | Phase M1 — cutover Database TF sans shims (vision stricte). |
| [`test-phase-m10.mjs`](../test-phase-m10.mjs) | !usrbinenv node |
| [`test-phase-m11.mjs`](../test-phase-m11.mjs) | !usrbinenv node |
| [`test-phase-m12.mjs`](../test-phase-m12.mjs) | !usrbinenv node |
| [`test-phase-m12p.mjs`](../test-phase-m12p.mjs) | !usrbinenv node |
| [`test-phase-m13.mjs`](../test-phase-m13.mjs) | !usrbinenv node |
| [`test-phase-m14.mjs`](../test-phase-m14.mjs) | !usrbinenv node |
| [`test-phase-m15.mjs`](../test-phase-m15.mjs) | !usrbinenv node |
| [`test-phase-m16.mjs`](../test-phase-m16.mjs) | !usrbinenv node |
| [`test-phase-m1p.mjs`](../test-phase-m1p.mjs) | Phase M1p — propagate Database Certivan puis Fidu (vision stricte). |
| [`test-phase-m2.mjs`](../test-phase-m2.mjs) | Phase M2 — Admin UI Database hors TF (vision stricte). |
| [`test-phase-m2p.mjs`](../test-phase-m2p.mjs) | Phase M2p — Admin UI Database Certivan puis Fidu (vision stricte). |
| [`test-phase-m3.mjs`](../test-phase-m3.mjs) | Phase M3 — Product Hub / control-plane zéro façade TF (vision stricte). |
| [`test-phase-m3p.mjs`](../test-phase-m3p.mjs) | Phase M3p — Product Hub Certivan + Fidu (vision stricte). |
| [`test-phase-m4.mjs`](../test-phase-m4.mjs) | Phase M4 — Delete local-config TF (vision stricte). |
| [`test-phase-m5.mjs`](../test-phase-m5.mjs) | Phase M5 — Delete bootstraps hermes/n8n TF (vision stricte). |
| [`test-phase-m6p.mjs`](../test-phase-m6p.mjs) | !usrbinenv node |
| [`test-phase-m7.mjs`](../test-phase-m7.mjs) | !usrbinenv node |
| [`test-phase-m7p.mjs`](../test-phase-m7p.mjs) | !usrbinenv node |
| [`test-phase-m8.mjs`](../test-phase-m8.mjs) | !usrbinenv node |
| [`test-phase-m8p.mjs`](../test-phase-m8p.mjs) | !usrbinenv node |
| [`test-phase-m9.mjs`](../test-phase-m9.mjs) | !usrbinenv node |
| [`test-phase-mcp-tool-policy-guard.mjs`](../test-phase-mcp-tool-policy-guard.mjs) | Gate M1-M2 — garde d'enforcement réutilisable des policies MCP admin (`packages/mcp-facade/src/admin/tool-policy-guard.ts`). |
| [`test-phase-meili-feed.mjs`](../test-phase-meili-feed.mjs) | Gate Phase C — BrandMeiliFeed générique (pas de tf2_* dans le chemin feed). |
| [`test-phase-module-docs.mjs`](../test-phase-module-docs.mjs) | (à documenter) |
| [`test-phase-module-mount-session.mjs`](../test-phase-module-mount-session.mjs) | (à documenter) |
| [`test-phase-n0.mjs`](../test-phase-n0.mjs) | !usrbinenv node |
| [`test-phase-n1.mjs`](../test-phase-n1.mjs) | !usrbinenv node |
| [`test-phase-n1p.mjs`](../test-phase-n1p.mjs) | !usrbinenv node |
| [`test-phase-n2.mjs`](../test-phase-n2.mjs) | !usrbinenv node |
| [`test-phase-n2p.mjs`](../test-phase-n2p.mjs) | !usrbinenv node |
| [`test-phase-n3.mjs`](../test-phase-n3.mjs) | !usrbinenv node |
| [`test-phase-n3p.mjs`](../test-phase-n3p.mjs) | !usrbinenv node |
| [`test-phase-n4.mjs`](../test-phase-n4.mjs) | !usrbinenv node |
| [`test-phase-n4p.mjs`](../test-phase-n4p.mjs) | !usrbinenv node |
| [`test-phase-n5.mjs`](../test-phase-n5.mjs) | !usrbinenv node |
| [`test-phase-n6.mjs`](../test-phase-n6.mjs) | !usrbinenv node |
| [`test-phase-n6p.mjs`](../test-phase-n6p.mjs) | !usrbinenv node |
| [`test-phase-n7.mjs`](../test-phase-n7.mjs) | !usrbinenv node |
| [`test-phase-n8.mjs`](../test-phase-n8.mjs) | !usrbinenv node |
| [`test-phase-n9.mjs`](../test-phase-n9.mjs) | !usrbinenv node |
| [`test-phase-o0.mjs`](../test-phase-o0.mjs) | !usrbinenv node |
| [`test-phase-o1.mjs`](../test-phase-o1.mjs) | !usrbinenv node |
| [`test-phase-o10.mjs`](../test-phase-o10.mjs) | !usrbinenv node |
| [`test-phase-o11.mjs`](../test-phase-o11.mjs) | !usrbinenv node |
| [`test-phase-o2.mjs`](../test-phase-o2.mjs) | !usrbinenv node |
| [`test-phase-o3.mjs`](../test-phase-o3.mjs) | !usrbinenv node |
| [`test-phase-o3p.mjs`](../test-phase-o3p.mjs) | !usrbinenv node |
| [`test-phase-o4.mjs`](../test-phase-o4.mjs) | !usrbinenv node |
| [`test-phase-o4p.mjs`](../test-phase-o4p.mjs) | !usrbinenv node |
| [`test-phase-o4r.mjs`](../test-phase-o4r.mjs) | !usrbinenv node |
| [`test-phase-o4r2.mjs`](../test-phase-o4r2.mjs) | !usrbinenv node |
| [`test-phase-o4r3.mjs`](../test-phase-o4r3.mjs) | !usrbinenv node |
| [`test-phase-o4r4.mjs`](../test-phase-o4r4.mjs) | !usrbinenv node |
| [`test-phase-o5.mjs`](../test-phase-o5.mjs) | !usrbinenv node |
| [`test-phase-o5p.mjs`](../test-phase-o5p.mjs) | !usrbinenv node |
| [`test-phase-o6.mjs`](../test-phase-o6.mjs) | !usrbinenv node |
| [`test-phase-o7.mjs`](../test-phase-o7.mjs) | !usrbinenv node |
| [`test-phase-o8.mjs`](../test-phase-o8.mjs) | !usrbinenv node |
| [`test-phase-o9.mjs`](../test-phase-o9.mjs) | !usrbinenv node |
| [`test-phase-o9p.mjs`](../test-phase-o9p.mjs) | !usrbinenv node |
| [`test-phase-onboarding-hybride.mjs`](../test-phase-onboarding-hybride.mjs) | Gate : @creezio/onboarding conforme au patron « module natif hybride » (docs/adr/ADR-module-natif-hybride.md). |
| [`test-phase-os-ui-scaffold.mjs`](../test-phase-os-ui-scaffold.mjs) | Gate : factory --from-prd ne versionne PLUS de pages OS dans ui/app/. |
| [`test-phase-p-cockpit.mjs`](../test-phase-p-cockpit.mjs) | !usrbinenv node |
| [`test-phase-p-onboarding.mjs`](../test-phase-p-onboarding.mjs) | !usrbinenv node |
| [`test-phase-p-shell-ui.mjs`](../test-phase-p-shell-ui.mjs) | !usrbinenv node |
| [`test-phase-p0-intention.mjs`](../test-phase-p0-intention.mjs) | !usrbinenv node |
| [`test-phase-p18-host-tools.mjs`](../test-phase-p18-host-tools.mjs) | !usrbinenv node |
| [`test-phase-p18-open-external-tab.mjs`](../test-phase-p18-open-external-tab.mjs) | !usrbinenv node |
| [`test-phase-p25.mjs`](../test-phase-p25.mjs) | !usrbinenv node |
| [`test-phase-p29.mjs`](../test-phase-p29.mjs) | !usrbinenv node |
| [`test-phase-pack-runtime-deps.mjs`](../test-phase-pack-runtime-deps.mjs) | Gate : config electron-builder embarque la clôture npm runtime (hono, better-sqlite3, …) + asarUnpack natifs. |
| [`test-phase-platform-native-mounts.mjs`](../test-phase-platform-native-mounts.mjs) | Gate montages natifs kit : Tasks autoconfig, Analytics admin, stub OpenAPI `/api/v1/openapi.json` |
| [`test-phase-platform-users.mjs`](../test-phase-platform-users.mjs) | Gate — référentiel utilisateurs UNIQUE (API plateforme users). |
| [`test-phase-plugin-insights.mjs`](../test-phase-plugin-insights.mjs) | Gate P4 plugins natifs — plugin démo kit « insights-assistant ». |
| [`test-phase-plugin-tools.mjs`](../test-phase-plugin-tools.mjs) | Gate P2/P3 plugins natifs — tools MCP plugins + mounts API kernel. |
| [`test-phase-plugins-default.mjs`](../test-phase-plugins-default.mjs) | Gate P1 plugins natifs — activation par défaut. - PD1 : sans env ⇒ plugins ENABLED (défaut inversé, plus d'opt-in). |
| [`test-phase-r0.mjs`](../test-phase-r0.mjs) | Phase R0 — gel inventions + clarif lifecycle-only. |
| [`test-phase-r1.mjs`](../test-phase-r1.mjs) | Phase R1 — @creezio/database (port TempoFlow Admin Database). |
| [`test-phase-r2.mjs`](../test-phase-r2.mjs) | Phase R2 — Product Hub SoT unique core.db. |
| [`test-phase-r3.mjs`](../test-phase-r3.mjs) | !usrbinenv node |
| [`test-phase-r4.mjs`](../test-phase-r4.mjs) | !usrbinenv node |
| [`test-phase-registry-pull-proxy.mjs`](../test-phase-registry-pull-proxy.mjs) | Gate — exposition du registre Docker en pull authentifié (F4). |
| [`test-phase-resolve-manifest.mjs`](../test-phase-resolve-manifest.mjs) | Gate resolveManifest — registre + fallback app-manifest.json (from-prd). |
| [`test-phase-runtime-dist-freshness.mjs`](../test-phase-runtime-dist-freshness.mjs) | Gate ADR.1b généralisée — dist runtime = câblage src (content + mtime) ; fail-closed sync/publish. |
| [`test-phase-server-docker.mjs`](../test-phase-server-docker.mjs) | Gate — artefacts docker/server + CLI creezio server-docker. |
| [`test-phase-shell-desktop-api.mjs`](../test-phase-shell-desktop-api.mjs) | Gate — `getShellDesktopApi` uniquement (pas de `window.*Desktop` hardcodé) + import obligatoire ; scan kit UI + TF3 si présent. |
| [`test-phase-single-data-plane.mjs`](../test-phase-single-data-plane.mjs) | (à documenter) |
| [`test-phase-tf3-chrome.mjs`](../test-phase-tf3-chrome.mjs) | (à documenter) |
| [`test-phase-v1.mjs`](../test-phase-v1.mjs) | Phase V1 — fabrique plugins conversationnelle (demobrand E2E). |
| [`test-phase-v2.mjs`](../test-phase-v2.mjs) | Phase V2 — observabilité native (activité, usages plugins, control-plane). |
| [`test-phase-v3.mjs`](../test-phase-v3.mjs) | Phase V3 — automations data-driven (triggers lifecycle / données). |

## `lib/`

| Fichier | Rôle |
|---|---|
| [`lib/assert-runtime-dist.mjs`](../lib/assert-runtime-dist.mjs) | Assert fail-closed dist runtime (contrats src↔dist + mtime) — CLI + import gate/sync/publish. |
| [`lib/brand-roots.mjs`](../lib/brand-roots.mjs) | Resolve brand CRM roots across VPS (/opt/docker/…) and sibling layouts (e.g. |
| [`lib/intention-twins.mjs`](../lib/intention-twins.mjs) | Scanner jumeaux plateforme TF↔CV (Plan P* / intention OS). Mesure cutover : présence + similarité de lignes — pas « package existe ». |
| [`lib/resolve-probe-brand.mjs`](../lib/resolve-probe-brand.mjs) | Résout la marque sonde TempoFlow3 hors monorepo kit. Layout nominal : 2 repos — monorepo marque (`server/`, `client/`) + repo admin dédié `<brand>-admin`. |
