# `@creezio/shell-ui`

Navigation **native Creezio** + **slots** pour le métier marque.

- `CORE_NAV_ITEMS` — Accueil / Réglages / À propos / Assistant / Tasks / Mails
- `registerBrandNav(items)` — remplit le slot métier (jamais panier/dispatch hardcodés)
- `mergeNav()` — nav finale = cœur + slot

```ts
import { CORE_NAV_ITEMS, createNavRegistry, mergeNav } from "@creezio/shell-ui";

const nav = createNavRegistry();
nav.registerBrandNav([{ id: "brand.home", label: "Métier", href: "/brand" }]);
const items = mergeNav(CORE_NAV_ITEMS, nav.getBrandNav());
```
