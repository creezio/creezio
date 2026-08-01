/**
 * Feed Meili marque tempoflow3 — config OS (pas de moteur maison).
 * UIDs génériques catalog_* (interdit tf2_* dans le feed marque).
 */
import {
  configureMeiliBrandFeed,
  configureMeiliCatalogSqlTables,
  createChrCatalogMeiliFeed,
  type BrandMeiliFeed,
} from "@creezio/electron-shell/meili";

export const brandMeiliFeed: BrandMeiliFeed = createChrCatalogMeiliFeed({
  brandId: "tempoflow3",
});

export function applyBrandMeiliConfig(): void {
  configureMeiliCatalogSqlTables(brandMeiliFeed.countTables);
  configureMeiliBrandFeed(brandMeiliFeed);
}
