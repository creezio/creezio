/**
 * Surface module API brand — enregistre les mounts métier.
 */
import type { ApiKernel } from "@creezio/api-kernel";

const ENTITIES = ["fournisseurs","produits","prix","panier_lignes","commandes"];

export function registerBrandModuleApi(api: ApiKernel): void {
  for (const entity of ENTITIES) {
    api.registerModuleApi(entity, {
      dbLayer: "brand",
      handle: async () => ({
        status: 501,
        body: {
          error: "delegate_to_metier_api",
          hint: "npm run metier:api",
          entity,
        },
      }),
    });
  }
}
