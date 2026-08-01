/**
 * Schéma brand tempoflow3 — généré par creezio new-app --from-prd.
 * Source de vérité métier dans le repo marque.
 */

export type BrandFieldType = "text" | "number" | "date" | "boolean" | "ref" | "json";

export type BrandField = {
  name: string;
  type: BrandFieldType;
  required?: boolean;
  ref?: string;
  label?: string;
};

export type BrandEntity = {
  id: string;
  label: string;
  labelPlural: string;
  archivable?: boolean;
  fields: BrandField[];
};

export const BRAND_ID = "tempoflow3" as const;
export const BRAND_NAME = "TempoFlow" as const;
export const BRAND_TAGLINE = "Application métier TempoFlow" as const;

export const BRAND_ENTITIES: BrandEntity[] = [
  {
    "id": "fournisseurs",
    "label": "Fournisseur",
    "labelPlural": "Fournisseurs",
    "archivable": true,
    "fields": [
      {
        "name": "nom",
        "type": "text",
        "required": true,
        "label": "Nom"
      },
      {
        "name": "contact",
        "type": "text",
        "label": "Contact"
      },
      {
        "name": "email",
        "type": "text",
        "label": "Email"
      },
      {
        "name": "telephone",
        "type": "text",
        "label": "Téléphone"
      },
      {
        "name": "notes",
        "type": "text",
        "label": "Notes"
      }
    ]
  },
  {
    "id": "produits",
    "label": "Produit",
    "labelPlural": "Produits",
    "archivable": true,
    "fields": [
      {
        "name": "nom",
        "type": "text",
        "required": true,
        "label": "Nom"
      },
      {
        "name": "unite",
        "type": "text",
        "label": "Unité"
      },
      {
        "name": "categorie",
        "type": "text",
        "label": "Catégorie"
      },
      {
        "name": "fournisseur_id",
        "type": "ref",
        "ref": "fournisseurs",
        "label": "Fournisseur"
      }
    ]
  },
  {
    "id": "prix",
    "label": "Prix",
    "labelPlural": "Prix",
    "archivable": false,
    "fields": [
      {
        "name": "produit_id",
        "type": "ref",
        "ref": "produits",
        "required": true,
        "label": "Produit"
      },
      {
        "name": "fournisseur_id",
        "type": "ref",
        "ref": "fournisseurs",
        "required": true,
        "label": "Fournisseur"
      },
      {
        "name": "montant",
        "type": "number",
        "required": true,
        "label": "Montant HT"
      },
      {
        "name": "devise",
        "type": "text",
        "label": "Devise"
      }
    ]
  },
  {
    "id": "panier_lignes",
    "label": "Ligne panier",
    "labelPlural": "Panier",
    "archivable": false,
    "fields": [
      {
        "name": "produit_id",
        "type": "ref",
        "ref": "produits",
        "required": true,
        "label": "Produit"
      },
      {
        "name": "fournisseur_id",
        "type": "ref",
        "ref": "fournisseurs",
        "required": true,
        "label": "Fournisseur"
      },
      {
        "name": "quantite",
        "type": "number",
        "required": true,
        "label": "Quantité"
      },
      {
        "name": "prix_unitaire",
        "type": "number",
        "label": "Prix unitaire"
      }
    ]
  },
  {
    "id": "commandes",
    "label": "Commande",
    "labelPlural": "Commandes",
    "archivable": false,
    "fields": [
      {
        "name": "fournisseur_id",
        "type": "ref",
        "ref": "fournisseurs",
        "required": true,
        "label": "Fournisseur"
      },
      {
        "name": "statut",
        "type": "text",
        "required": true,
        "label": "Statut"
      },
      {
        "name": "total_ht",
        "type": "number",
        "label": "Total HT"
      },
      {
        "name": "notes",
        "type": "text",
        "label": "Notes"
      }
    ]
  }
];

export const BRAND_ENTITY_IDS = BRAND_ENTITIES.map((e) => e.id);

export function getEntity(id: string): BrandEntity | undefined {
  return BRAND_ENTITIES.find((e) => e.id === id);
}
