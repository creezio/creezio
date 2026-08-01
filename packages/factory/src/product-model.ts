/**
 * ProductModel — contrat intermédiaire entre un brief produit (PRD) et le scaffold.
 *
 * Le brief reste non technique. Le parsing produit un modèle structuré que les
 * générateurs métier consomment. Pas de SQL / Electron / Hono dans le PRD.
 */

export type FieldType = "text" | "number" | "date" | "boolean" | "ref" | "json";

export interface ProductField {
  name: string;
  type: FieldType;
  required?: boolean;
  ref?: string;
  label?: string;
}

export interface ProductEntity {
  id: string;
  label: string;
  labelPlural: string;
  fields: ProductField[];
  archivable?: boolean;
}

export interface ProductPage {
  id: string;
  path: string;
  title: string;
  entityId?: string;
  kind: "list" | "detail" | "form" | "flow" | "dashboard";
}

export interface ProductFlow {
  id: string;
  label: string;
  steps: string[];
}

export interface PlatformNeeds {
  auth: boolean;
  desktop: boolean;
  pluginApi: boolean;
  chat: boolean;
  sync: boolean;
}

export interface ProductModel {
  brandId: string;
  brandName: string;
  domain: string;
  tagline: string;
  entities: ProductEntity[];
  pages: ProductPage[];
  flows: ProductFlow[];
  platformNeeds: PlatformNeeds;
  sourcePrdPath?: string;
  /** Vertical détecté (ex. chr) — active templates factory riches. */
  vertical?: "chr" | "generic";
}

const RESERVED_BRAND_IDS = new Set([
  "tempoflow",
  "certivan",
  "fidu",
  "creezio",
  "demobrand",
]);

export function safeBrandId(raw: string): string {
  let id = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .replace(/^[0-9]+/, "")
    .slice(0, 32);
  if (!id) id = "brandapp";
  if (RESERVED_BRAND_IDS.has(id)) id = `${id}3`;
  return id;
}

export function defaultPlatformNeeds(): PlatformNeeds {
  return {
    auth: true,
    desktop: true,
    pluginApi: true,
    chat: true,
    sync: false,
  };
}

export function isChrModel(model: ProductModel): boolean {
  return (
    model.vertical === "chr" ||
    (model.entities.some((e) => e.id === "fournisseurs") &&
      model.entities.some((e) => e.id === "panier_lignes") &&
      model.entities.some((e) => e.id === "commandes"))
  );
}

/** Catalogue CHR complet (oracle onglets TempoFlow). */
export function chrCatalogEntities(): ProductEntity[] {
  return [
    {
      id: "fournisseurs",
      label: "Fournisseur",
      labelPlural: "Fournisseurs",
      archivable: true,
      fields: [
        { name: "nom", type: "text", required: true, label: "Nom" },
        { name: "contact", type: "text", label: "Contact" },
        { name: "email", type: "text", label: "Email" },
        { name: "telephone", type: "text", label: "Téléphone" },
        { name: "site_web", type: "text", label: "Site web" },
        { name: "notes", type: "text", label: "Notes" },
      ],
    },
    {
      id: "produits",
      label: "Produit",
      labelPlural: "Produits",
      archivable: true,
      fields: [
        { name: "nom", type: "text", required: true, label: "Nom" },
        { name: "unite", type: "text", label: "Unité" },
        { name: "categorie", type: "text", label: "Catégorie" },
        { name: "secteur_id", type: "ref", ref: "secteurs", label: "Secteur" },
        {
          name: "fournisseur_id",
          type: "ref",
          ref: "fournisseurs",
          label: "Fournisseur",
        },
      ],
    },
    {
      id: "prix",
      label: "Prix",
      labelPlural: "Prix",
      fields: [
        {
          name: "produit_id",
          type: "ref",
          ref: "produits",
          required: true,
          label: "Produit",
        },
        {
          name: "fournisseur_id",
          type: "ref",
          ref: "fournisseurs",
          required: true,
          label: "Fournisseur",
        },
        { name: "montant", type: "number", required: true, label: "Montant HT" },
        { name: "devise", type: "text", label: "Devise" },
        { name: "promo", type: "boolean", label: "Promo" },
        { name: "promo_label", type: "text", label: "Libellé promo" },
        { name: "promo_fin", type: "date", label: "Fin promo" },
      ],
    },
    {
      id: "panier_lignes",
      label: "Ligne panier",
      labelPlural: "Panier",
      fields: [
        {
          name: "produit_id",
          type: "ref",
          ref: "produits",
          required: true,
          label: "Produit",
        },
        {
          name: "fournisseur_id",
          type: "ref",
          ref: "fournisseurs",
          required: true,
          label: "Fournisseur",
        },
        { name: "quantite", type: "number", required: true, label: "Quantité" },
        { name: "prix_unitaire", type: "number", label: "Prix unitaire" },
      ],
    },
    {
      id: "commandes",
      label: "Commande",
      labelPlural: "Commandes",
      fields: [
        {
          name: "fournisseur_id",
          type: "ref",
          ref: "fournisseurs",
          required: true,
          label: "Fournisseur",
        },
        { name: "statut", type: "text", required: true, label: "Statut" },
        { name: "total_ht", type: "number", label: "Total HT" },
        { name: "notes", type: "text", label: "Notes" },
      ],
    },
    {
      id: "stack_items",
      label: "Stack",
      labelPlural: "Mes produits",
      fields: [
        {
          name: "produit_id",
          type: "ref",
          ref: "produits",
          required: true,
          label: "Produit",
        },
      ],
    },
    {
      id: "releves",
      label: "Relevé",
      labelPlural: "Relevés",
      fields: [
        { name: "date_releve", type: "date", required: true, label: "Date" },
        {
          name: "fournisseur_id",
          type: "ref",
          ref: "fournisseurs",
          required: true,
          label: "Fournisseur",
        },
        { name: "source", type: "text", label: "Source" },
      ],
    },
    {
      id: "scan_sessions",
      label: "Scan",
      labelPlural: "Scans",
      fields: [
        { name: "statut", type: "text", required: true, label: "Statut" },
        { name: "note", type: "text", label: "Note" },
      ],
    },
    {
      id: "marketplaces",
      label: "Marketplace",
      labelPlural: "Marketplaces",
      fields: [
        { name: "nom", type: "text", required: true, label: "Nom" },
        { name: "url", type: "text", label: "URL" },
        { name: "notes", type: "text", label: "Notes" },
      ],
    },
    {
      id: "secteurs",
      label: "Secteur",
      labelPlural: "Secteurs",
      fields: [
        { name: "nom", type: "text", required: true, label: "Nom" },
        { name: "description", type: "text", label: "Description" },
      ],
    },
    {
      id: "agregateurs",
      label: "Agrégateur",
      labelPlural: "Agrégateurs",
      fields: [
        { name: "nom", type: "text", required: true, label: "Nom" },
        { name: "url", type: "text", label: "URL" },
        { name: "notes", type: "text", label: "Notes" },
      ],
    },
    {
      id: "data_mappings",
      label: "Mapping",
      labelPlural: "Data-mapping",
      fields: [
        {
          name: "libelle_fournisseur",
          type: "text",
          required: true,
          label: "Libellé fournisseur",
        },
        {
          name: "fournisseur_id",
          type: "ref",
          ref: "fournisseurs",
          label: "Fournisseur",
        },
        {
          name: "produit_id",
          type: "ref",
          ref: "produits",
          required: true,
          label: "Produit interne",
        },
      ],
    },
  ];
}

export function chrCatalogPages(): ProductPage[] {
  return [
    { id: "dashboard", path: "/dashboard", title: "Dashboard", kind: "dashboard" },
    {
      id: "fournisseurs",
      path: "/fournisseurs",
      title: "Fournisseurs",
      entityId: "fournisseurs",
      kind: "list",
    },
    {
      id: "produits",
      path: "/produits",
      title: "Produits",
      entityId: "produits",
      kind: "list",
    },
    { id: "prix", path: "/prix", title: "Prix", entityId: "prix", kind: "list" },
    {
      id: "panier",
      path: "/panier",
      title: "Panier",
      entityId: "panier_lignes",
      kind: "flow",
    },
    {
      id: "commandes",
      path: "/commandes",
      title: "Commandes",
      entityId: "commandes",
      kind: "list",
    },
    { id: "optimiser", path: "/optimiser", title: "Optimiser", kind: "flow" },
    {
      id: "stack",
      path: "/stack",
      title: "Mes produits",
      entityId: "stack_items",
      kind: "list",
    },
    {
      id: "releves",
      path: "/releves",
      title: "Relevés",
      entityId: "releves",
      kind: "list",
    },
    {
      id: "scan",
      path: "/scan",
      title: "Scan",
      entityId: "scan_sessions",
      kind: "flow",
    },
    {
      id: "marketplaces",
      path: "/marketplaces",
      title: "Marketplaces",
      entityId: "marketplaces",
      kind: "list",
    },
    {
      id: "secteurs",
      path: "/secteurs",
      title: "Secteurs",
      entityId: "secteurs",
      kind: "list",
    },
    {
      id: "agregateurs",
      path: "/agregateurs",
      title: "Agrégateurs",
      entityId: "agregateurs",
      kind: "list",
    },
    {
      id: "data-mapping",
      path: "/data-mapping",
      title: "Data-mapping",
      entityId: "data_mappings",
      kind: "list",
    },
  ];
}

export function chrOrderFlow(): ProductFlow {
  return {
    id: "commande_fournisseur",
    label: "Commander chez un fournisseur",
    steps: ["fournisseurs", "produits", "prix", "panier", "commandes"],
  };
}

function extractBrandName(text: string, fallbackH1: string): string {
  const fromNom = text.match(/^\s*Nom\s*:\s*(.+)$/im)?.[1]?.trim();
  if (fromNom) return fromNom.replace(/[.。].*$/, "").trim();
  const fromProductBold = text.match(
    /\*\*([A-Za-z][A-Za-z0-9][A-Za-z0-9 _-]{1,40})\*\*\s*[—–-]\s*application/i,
  )?.[1]?.trim();
  if (fromProductBold) return fromProductBold;
  const cleaned = fallbackH1
    .replace(/\s*[—–-].*$/, "")
    .replace(/^PRD(\s+produit)?\s+/i, "")
    .trim();
  return cleaned || "BrandApp";
}

export function parseProductPrd(
  markdown: string,
  opts?: { sourcePath?: string; brandId?: string; brandName?: string },
): ProductModel {
  const text = markdown.replace(/\r\n/g, "\n");
  const h1 = text.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? "Nouvelle app";
  const brandName =
    opts?.brandName?.trim() || extractBrandName(text, h1) || "BrandApp";
  const brandId = opts?.brandId
    ? safeBrandId(opts.brandId)
    : safeBrandId(brandName);

  const lower = text.toLowerCase();
  const isChr =
    /\bfournisseur/.test(lower) &&
    (/\bpanier\b/.test(lower) || /\bcommande/.test(lower)) &&
    (/\bprix\b/.test(lower) || /\bproduit/.test(lower));

  const taglineMatch =
    text.match(/\*\*Une phrase\*\*\s*[—\-:]\s*(.+)/i) ||
    text.match(/^>\s*(.+)$/m);
  const tagline =
    taglineMatch?.[1]?.trim() ??
    (isChr
      ? "Prix fournisseurs, catalogue et commandes pour la restauration"
      : `Application métier ${brandName}`);

  if (isChr) {
    return {
      brandId,
      brandName,
      domain: `${brandId}.local`,
      tagline,
      entities: chrCatalogEntities(),
      pages: chrCatalogPages(),
      flows: [chrOrderFlow()],
      platformNeeds: defaultPlatformNeeds(),
      sourcePrdPath: opts?.sourcePath,
      vertical: "chr",
    };
  }

  return {
    brandId,
    brandName,
    domain: `${brandId}.local`,
    tagline,
    entities: [
      {
        id: "notes",
        label: "Note",
        labelPlural: "Notes",
        fields: [
          { name: "titre", type: "text", required: true, label: "Titre" },
          { name: "contenu", type: "text", label: "Contenu" },
        ],
      },
    ],
    pages: [
      {
        id: "notes",
        path: "/notes",
        title: "Notes",
        entityId: "notes",
        kind: "list",
      },
    ],
    flows: [],
    platformNeeds: defaultPlatformNeeds(),
    sourcePrdPath: opts?.sourcePath,
    vertical: "generic",
  };
}

export function assertProductModel(model: ProductModel): void {
  if (!model.brandId || !/^[a-z][a-z0-9]{1,31}$/.test(model.brandId)) {
    throw new Error(`ProductModel.brandId invalide: ${model.brandId}`);
  }
  if (!model.brandName.trim()) throw new Error("ProductModel.brandName vide");
  if (!model.entities.length) throw new Error("ProductModel.entities vide");
  if (!model.pages.length) throw new Error("ProductModel.pages vide");
}
