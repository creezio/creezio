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
export const BRAND_TAGLINE = "Prix fournisseurs, catalogue et commandes pour la restauration" as const;

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
        "name": "site_web",
        "type": "text",
        "label": "Site web"
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
        "name": "secteur_id",
        "type": "ref",
        "ref": "secteurs",
        "label": "Secteur"
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
      },
      {
        "name": "promo",
        "type": "boolean",
        "label": "Promo"
      },
      {
        "name": "promo_label",
        "type": "text",
        "label": "Libellé promo"
      },
      {
        "name": "promo_fin",
        "type": "date",
        "label": "Fin promo"
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
  },
  {
    "id": "stack_items",
    "label": "Stack",
    "labelPlural": "Mes produits",
    "archivable": false,
    "fields": [
      {
        "name": "produit_id",
        "type": "ref",
        "ref": "produits",
        "required": true,
        "label": "Produit"
      }
    ]
  },
  {
    "id": "releves",
    "label": "Relevé",
    "labelPlural": "Relevés",
    "archivable": false,
    "fields": [
      {
        "name": "date_releve",
        "type": "date",
        "required": true,
        "label": "Date"
      },
      {
        "name": "fournisseur_id",
        "type": "ref",
        "ref": "fournisseurs",
        "required": true,
        "label": "Fournisseur"
      },
      {
        "name": "source",
        "type": "text",
        "label": "Source"
      }
    ]
  },
  {
    "id": "scan_sessions",
    "label": "Scan",
    "labelPlural": "Scans",
    "archivable": false,
    "fields": [
      {
        "name": "statut",
        "type": "text",
        "required": true,
        "label": "Statut"
      },
      {
        "name": "note",
        "type": "text",
        "label": "Note"
      }
    ]
  },
  {
    "id": "marketplaces",
    "label": "Marketplace",
    "labelPlural": "Marketplaces",
    "archivable": false,
    "fields": [
      {
        "name": "nom",
        "type": "text",
        "required": true,
        "label": "Nom"
      },
      {
        "name": "url",
        "type": "text",
        "label": "URL"
      },
      {
        "name": "notes",
        "type": "text",
        "label": "Notes"
      }
    ]
  },
  {
    "id": "secteurs",
    "label": "Secteur",
    "labelPlural": "Secteurs",
    "archivable": false,
    "fields": [
      {
        "name": "nom",
        "type": "text",
        "required": true,
        "label": "Nom"
      },
      {
        "name": "description",
        "type": "text",
        "label": "Description"
      }
    ]
  },
  {
    "id": "agregateurs",
    "label": "Agrégateur",
    "labelPlural": "Agrégateurs",
    "archivable": false,
    "fields": [
      {
        "name": "nom",
        "type": "text",
        "required": true,
        "label": "Nom"
      },
      {
        "name": "url",
        "type": "text",
        "label": "URL"
      },
      {
        "name": "notes",
        "type": "text",
        "label": "Notes"
      }
    ]
  },
  {
    "id": "data_mappings",
    "label": "Mapping",
    "labelPlural": "Data-mapping",
    "archivable": false,
    "fields": [
      {
        "name": "libelle_fournisseur",
        "type": "text",
        "required": true,
        "label": "Libellé fournisseur"
      },
      {
        "name": "fournisseur_id",
        "type": "ref",
        "ref": "fournisseurs",
        "label": "Fournisseur"
      },
      {
        "name": "produit_id",
        "type": "ref",
        "ref": "produits",
        "required": true,
        "label": "Produit interne"
      }
    ]
  }
];

export const BRAND_ENTITY_IDS = BRAND_ENTITIES.map((e) => e.id);

export function getEntity(id: string): BrandEntity | undefined {
  return BRAND_ENTITIES.find((e) => e.id === id);
}
