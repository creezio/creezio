# `@creezio/shell-ui`

Navigation **native Creezio** + **slots** pour le métier marque.

## Contrat marque (I7)

> **Marque = `registerBrandNav` only** — pas de hardcode des ids métier
> (`panier`, `dispatch`…) dans le kit. Utiliser `brand.*` + href produit.

```ts
import { createNavShellAdapter } from "@creezio/shell-ui";

const shell = createNavShellAdapter();
shell.registerBrandNav([
  { id: "brand.notes", label: "Notes", href: "/notes" },
]);

// UI React / Next : consommer le modèle
const model = shell.getRenderModel();
// model.groups = [{ id: "core", items }, { id: "brand", items }, …]

// Preuve HTML (demobrand)
const html = shell.renderNavHtml();
```

## API bas niveau (H1)

- `CORE_NAV_ITEMS` — Accueil / Réglages / À propos / Assistant / Tasks / Mails
- `createNavRegistry()` + `registerBrandNav(items)`
- `mergeNav(core, brand)`

```ts
import { CORE_NAV_ITEMS, createNavRegistry, mergeNav } from "@creezio/shell-ui";

const nav = createNavRegistry();
nav.registerBrandNav([{ id: "brand.home", label: "Métier", href: "/brand" }]);
const items = mergeNav(CORE_NAV_ITEMS, nav.getBrandNav());
```
