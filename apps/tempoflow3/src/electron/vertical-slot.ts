/** creezio:owned-by-brand */
/**
 * Slot métier vertical — TempoFlow (nav marque uniquement).
 */
import {
  createNavRegistry,
  type CoreNavItem,
  type NavRegistry,
} from "@creezio/shell-ui";

export type VerticalSlot = {
  brandId: string;
  items: CoreNavItem[];
  nav: NavRegistry;
};

const BRAND_NAV: CoreNavItem[] = [
  { id: "brand.dashboard", label: "Dashboard", href: "/dashboard", group: "brand" },
  { id: "brand.fournisseurs", label: "Fournisseurs", href: "/fournisseurs", group: "brand" },
  { id: "brand.produits", label: "Produits", href: "/produits", group: "brand" },
  { id: "brand.prix", label: "Prix", href: "/prix", group: "brand" },
  { id: "brand.panier", label: "Panier", href: "/panier", group: "brand" },
  { id: "brand.commandes", label: "Commandes", href: "/commandes", group: "brand" },
  { id: "brand.optimiser", label: "Optimiser", href: "/optimiser", group: "brand" },
  { id: "brand.stack", label: "Mes produits", href: "/stack", group: "brand" },
  { id: "brand.releves", label: "Relevés", href: "/releves", group: "brand" },
  { id: "brand.scan", label: "Scan", href: "/scan", group: "brand" },
  { id: "brand.marketplaces", label: "Marketplaces", href: "/marketplaces", group: "brand" },
  { id: "brand.secteurs", label: "Secteurs", href: "/secteurs", group: "brand" },
  { id: "brand.agregateurs", label: "Agrégateurs", href: "/agregateurs", group: "brand" },
  { id: "brand.data-mapping", label: "Data-mapping", href: "/data-mapping", group: "brand" },
];

const nav = createNavRegistry();
nav.registerBrandNav(BRAND_NAV);

export const verticalSlot: VerticalSlot = {
  brandId: "tempoflow3",
  items: nav.getBrandNav(),
  nav,
};
