# `@creezio/cockpit`

UI **server-cockpit** plateforme (Phase P) — shell autonome + client CRM.

## Placement

Package **dédié** — **pas** un sous-dossier de `@creezio/shell-ui`.  
Dépendance **one-way** : `cockpit` → `shell-ui` (+ peer `@creezio/tasks` pour `AiActivityPanel`).

Routes Hono / `buildCockpitHealth` restent **marque**.

## Boot marque

```tsx
import { configureCockpit } from "@creezio/cockpit";
// ou depuis /ui
import { configureCockpit } from "@creezio/cockpit/ui";
import { CLIENT_DOWNLOAD_URL } from "@/lib/desktop-download";

configureCockpit({
  deepLinkProtocol: "tempoflow", // certivan | fidu
  clientDownloadUrl: CLIENT_DOWNLOAD_URL,
  // tabs?: ["sante","ia","acces","logs","plugins","invitations"],
});
```

Copy produit via `getShellUiBrand().productName`.  
IPC via `getShellDesktopApi()` — **jamais** `tempoflowDesktop|certivanDesktop|fiduDesktop` dans le package.

## Surfaces

```tsx
import { ServerCockpitShell, CockpitClient } from "@creezio/cockpit/ui";

// /server-cockpit — hors AppShell (owner gate reste marque)
<ServerCockpitShell />

// /cockpit — dans AppShell
<CockpitClient />
```

### Hooks de perso

| Hook | Rôle |
|------|------|
| `deepLinkProtocol` | `protocol://join/<host>` |
| `clientDownloadUrl` | CTA download Client |
| `tabs` | Filtrer les 6 onglets natifs |
| `extraTabs` | Slots UI additionnels (pas de métier GED/… dans le kit) |
| `refreshMs` / `apiBase` | Poll + préfixe API |

## Fidu

Parité **UI plateforme** (mêmes onglets) — pas un cockpit métier cabinet.  
Au cutover : pages minces + mount `cockpitRoutes` + `configureCockpit({ deepLinkProtocol: "fidu", … })`.

## Anti-patterns

- ❌ Fourrer le cockpit dans `shell-ui` / onboarding / tasks  
- ❌ `if (brand === 'fidu')` métier dans le package  
- ❌ Laisser jumeaux `components/cockpit/*` après cutover  
