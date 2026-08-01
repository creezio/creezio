# @creezio/cockpit — inventaire fichier par fichier

Généré pour documentation agents. Chaque entrée : rôle, exports principaux, taille.

> Chemins relatifs à `packages/cockpit/`.

| Fichier | Lignes | Exports (extrait) |
|---|---:|---|
| [`src/config.ts`](../src/config.ts) | 74 | `CockpitConfig`, `configureCockpit`, `getCockpitConfig`, `resetCockpitConfigForTests`, `resolveCockpitConfig`, `buildJoinLink` |
| [`src/index.ts`](../src/index.ts) | 29 | `COCKPIT_PACKAGE`, `DEFAULT_COCKPIT_TABS`, `configureCockpit`, `getCockpitConfig`, `resetCockpitConfigForTests`, `resolveCockpitConfig`, `buildJoinLink` |
| [`src/types.ts`](../src/types.ts) | 80 | `CockpitTabId`, `CockpitServiceHealth`, `CockpitHealth`, `CockpitUser`, `CockpitAiActivity`, `CockpitAclPlugin`, `CockpitDesktopSessions`, `CockpitRequestLogEntry` |
| [`ui/cockpit-client.tsx`](../ui/cockpit-client.tsx) | 275 | `CockpitClientProps`, `CockpitClient` |
| [`ui/hooks/use-cockpit-dashboard.ts`](../ui/hooks/use-cockpit-dashboard.ts) | 312 | `UseCockpitDashboardOpts`, `useCockpitDashboard` |
| [`ui/index.ts`](../ui/index.ts) | 42 | `CockpitClient`, `ServerCockpitShell`, `useCockpitDashboard`, `StatusDot`, `ServiceCard`, `configureCockpit`, `getCockpitConfig`, `resetCockpitConfigForTests` |
| [`ui/parts/service-card.tsx`](../ui/parts/service-card.tsx) | 44 | `ServiceCard` |
| [`ui/parts/status-dot.tsx`](../ui/parts/status-dot.tsx) | 28 | `CockpitVisualVariant`, `StatusDot` |
| [`ui/server-cockpit-shell.tsx`](../ui/server-cockpit-shell.tsx) | 754 | `ServerCockpitExtraTab`, `ServerCockpitShellProps`, `ServerCockpitShell` |

---

## Détail par fichier

### `src/config.ts`

- **Lignes** : 74
- **Exports** : `CockpitConfig`, `configureCockpit`, `getCockpitConfig`, `resetCockpitConfigForTests`, `resolveCockpitConfig`, `buildJoinLink`

_(pas de cartouche JSDoc en tête — voir le code)_

### `src/index.ts`

- **Lignes** : 29
- **Exports** : `COCKPIT_PACKAGE`, `DEFAULT_COCKPIT_TABS`, `configureCockpit`, `getCockpitConfig`, `resetCockpitConfigForTests`, `resolveCockpitConfig`, `buildJoinLink`

@creezio/cockpit — config + types (non-React).
UI React : `@creezio/cockpit/ui`.

### `src/types.ts`

- **Lignes** : 80
- **Exports** : `CockpitTabId`, `CockpitServiceHealth`, `CockpitHealth`, `CockpitUser`, `CockpitAiActivity`, `CockpitAclPlugin`, `CockpitDesktopSessions`, `CockpitRequestLogEntry`, `CockpitTunnelLive`, `DEFAULT_COCKPIT_TABS`

Types partagés cockpit UI (contrats API /api/v1/cockpit). 

export type CockpitTabId =
  | "sante"
  | "ia"
  | "acces"
  | "logs"
  | "plugins"
  | "invitations";

export type CockpitServiceHealth = {
  configured: boolean;

### `ui/cockpit-client.tsx`

- **Lignes** : 275
- **Exports** : `CockpitClientProps`, `CockpitClient`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/hooks/use-cockpit-dashboard.ts`

- **Lignes** : 312
- **Exports** : `UseCockpitDashboardOpts`, `useCockpitDashboard`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/index.ts`

- **Lignes** : 42
- **Exports** : `CockpitClient`, `ServerCockpitShell`, `useCockpitDashboard`, `StatusDot`, `ServiceCard`, `configureCockpit`, `getCockpitConfig`, `resetCockpitConfigForTests`, `resolveCockpitConfig`, `buildJoinLink`, `DEFAULT_COCKPIT_TABS`

@creezio/cockpit/ui — ServerCockpitShell + CockpitClient.

### `ui/parts/service-card.tsx`

- **Lignes** : 44
- **Exports** : `ServiceCard`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/parts/status-dot.tsx`

- **Lignes** : 28
- **Exports** : `CockpitVisualVariant`, `StatusDot`

_(pas de cartouche JSDoc en tête — voir le code)_

### `ui/server-cockpit-shell.tsx`

- **Lignes** : 754
- **Exports** : `ServerCockpitExtraTab`, `ServerCockpitShellProps`, `ServerCockpitShell`

_(pas de cartouche JSDoc en tête — voir le code)_

