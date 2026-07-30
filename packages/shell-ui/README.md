# `@creezio/shell-ui`

Navigation **native Creezio** + **chrome shell CRM** + slots pour le métier marque.

Package surface :

| Export | Contenu |
|--------|---------|
| `@creezio/shell-ui` | nav registry, brand tokens, libs plateforme |
| `@creezio/shell-ui/ui` | primitives + AppShell + **sidebar / workspace / search / site-slot** |

## Contrat marque (O9 / P1)

> **Marque = wiring + métier + slots `brand.*` only.**  
> Le chrome shell (sidebar, onglets, search modal, site slot) vit **uniquement**
> dans ce package. Zéro jumeau TF↔CV↔Fidu pour ces surfaces.

```ts
import { createNavShellAdapter } from "@creezio/shell-ui";
import {
  configureShellUiBrand,
  configureSidebar,
  configureGlobalSearch,
  configureDefaultNewTabHref,
  TabWorkspaceProvider,
  WorkspaceRoot,
  ExternalSiteSlot,
} from "@creezio/shell-ui/ui";

configureShellUiBrand({ productName: "MaMarque", desktopApiGlobal: "…" });
configureSidebar({
  getNavItems: () => [/* icons + hrefs marque */],
  canShowHref: (href, me) => /* ACL marque */,
});
configureGlobalSearch({
  search: (q, signal) => /* Meili / fallback marque */,
  indexLabels: { /* … */ },
});
configureDefaultNewTabHref("/dashboard");
```

Boot client marque = **un seul** fichier typique :
`crm/src/lib/shell-ui/configure-shell-ui-client.ts`.

## Surfaces chrome SoT (`./ui`)

| Surface | Export principal | Injection marque |
|---------|------------------|------------------|
| Sidebar CRM | `Sidebar` / `CrmSidebar` | `configureSidebar` |
| Tab workspace | `TabWorkspaceProvider` | `configureDefaultNewTabHref`, `configureProductDetailCtx`, desktop via `getShellDesktopApi` |
| Workspace chrome | `WorkspaceShell`, `WorkspaceRoot` | slots `sidebar` / `footbar` / `wrapWorkspace` / `banners` |
| Recherche globale | `GlobalSearchProvider` | `configureGlobalSearch` |
| Site externe desktop | `ExternalSiteSlot` | route marque `/site/[id]` ; opts `siteId` |

Hosts historiques (toujours valides) : `configureTabWorkspaceHost`,
`configureGlobalSearchHost`, `configureAiActivityPanel`.

## Hors scope (ne pas ré-absorber)

| Domaine | Package |
|---------|---------|
| Login | `@creezio/auth/ui` |
| Setup / onboarding | `@creezio/onboarding/ui` |
| Cockpit serveur | `@creezio/cockpit/ui` |
| Tasks AI panel | `@creezio/tasks/ui` → `configureAiActivityPanel` |

Aussi hors shell-ui : `nav-config` / `page-meta` métier, panier/RTI/GED,
adapters nav `brand.*`.

## Checklist extinction jumeaux marques

Après cutover, ces fichiers **doivent être absents** (pas de re-export) :

- `src/components/layout/sidebar.tsx`
- `src/components/workspace/tab-workspace-context.tsx`
- `src/components/workspace/workspace-shell.tsx`
- `src/components/global-search-provider.tsx`
- `src/components/desktop/supplier-site-slot.tsx`

`workspace-root.tsx` peut rester **mince** (compose `WorkspaceRoot` kit +
`PanierProvider` / banners marque) ou importer directement le kit.

## Nav bas niveau (H1 / I7)

> **Marque = `registerBrandNav` only** — pas de hardcode des ids métier
> (`panier`, `dispatch`…) dans le kit. Utiliser `brand.*` + href produit.

```ts
import { createNavShellAdapter, CORE_NAV_ITEMS, createNavRegistry, mergeNav } from "@creezio/shell-ui";

const shell = createNavShellAdapter();
shell.registerBrandNav([
  { id: "brand.notes", label: "Notes", href: "/notes" },
]);
const model = shell.getRenderModel();
```

## ADR domaine (P29)

Voir [`docs/ADR-no-brand-domain-in-native-packages.md`](../../docs/ADR-no-brand-domain-in-native-packages.md) :

| SoT kit (préféré) | Alias déprécié TF |
|-------------------|-------------------|
| `OpenExternalSiteOpts` / `openExternalSite` / `siteId` | `OpenSupplierSiteOpts` / `openSupplierSite` / `fournisseurId` |
| `ExternalSiteSlot` / `ExternalSiteTabMeta` / `createExternalSiteTab` | `SupplierSiteSlot` / `SupplierTabMeta` / `createSupplierTab` |
| `siteIdFromHref` / `isExternalSiteHref` | `fournisseurIdFromHref` / `isSupplierHref` |

- Aucun label utilisateur « Site fournisseur » dans le kit
- Aucun `window.tempoflowDesktop` — `getShellDesktopApi()` + `configureShellUiBrand`
- Gate : `node --test scripts/test-phase-p-shell-ui.mjs` (+ `test-phase-p29.mjs`)
