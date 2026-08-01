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
  /** Entity id for type "ref" */
  ref?: string;
  label?: string;
}

export interface ProductEntity {
  id: string;
  label: string;
  labelPlural: string;
  fields: ProductField[];
  /** Soft-delete style archive */
  archivable?: boolean;
}

export interface ProductPage {
  id: string;
  path: string;
  title: string;
  /** Entity this page primarily manages, if any */
  entityId?: string;
  kind: "list" | "detail" | "form" | "flow" | "dashboard";
}

export interface ProductFlow {
  id: string;
  label: string;
  /** Ordered entity / page ids participating in the flow */
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
  /** Source PRD path if any */
  sourcePrdPath?: string;
}

const RESERVED_BRAND_IDS = new Set(["tempoflow", "certivan", "fidu", "creezio", "demobrand"]);

/** Sanitize brand id; reserved kit brand ids get a `3` suffix (e.g. tempoflow → tempoflow3). */
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
    chat: false,
    sync: false,
  };
}

/** Catalogue CHR minimal (fournisseurs → panier → commande) — oracle TempoFlow 0.10.26. */
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
        { name: "fournisseur_id", type: "ref", ref: "fournisseurs", label: "Fournisseur" },
      ],
    },
    {
      id: "prix",
      label: "Prix",
      labelPlural: "Prix",
      fields: [
        { name: "produit_id", type: "ref", ref: "produits", required: true, label: "Produit" },
        { name: "fournisseur_id", type: "ref", ref: "fournisseurs", required: true, label: "Fournisseur" },
        { name: "montant", type: "number", required: true, label: "Montant HT" },
        { name: "devise", type: "text", label: "Devise" },
      ],
    },
    {
      id: "panier_lignes",
      label: "Ligne panier",
      labelPlural: "Panier",
      fields: [
        { name: "produit_id", type: "ref", ref: "produits", required: true, label: "Produit" },
        { name: "fournisseur_id", type: "ref", ref: "fournisseurs", required: true, label: "Fournisseur" },
        { name: "quantite", type: "number", required: true, label: "Quantité" },
        { name: "prix_unitaire", type: "number", label: "Prix unitaire" },
      ],
    },
    {
      id: "commandes",
      label: "Commande",
      labelPlural: "Commandes",
      fields: [
        { name: "fournisseur_id", type: "ref", ref: "fournisseurs", required: true, label: "Fournisseur" },
        { name: "statut", type: "text", required: true, label: "Statut" },
        { name: "total_ht", type: "number", label: "Total HT" },
        { name: "notes", type: "text", label: "Notes" },
      ],
    },
  ];
}

export function chrCatalogPages(): ProductPage[] {
  return [
    { id: "fournisseurs", path: "/fournisseurs", title: "Fournisseurs", entityId: "fournisseurs", kind: "list" },
    { id: "produits", path: "/produits", title: "Produits", entityId: "produits", kind: "list" },
    { id: "prix", path: "/prix", title: "Prix", entityId: "prix", kind: "list" },
    { id: "panier", path: "/panier", title: "Panier", entityId: "panier_lignes", kind: "flow" },
    { id: "commandes", path: "/commandes", title: "Commandes", entityId: "commandes", kind: "list" },
  ];
}

export function chrOrderFlow(): ProductFlow {
  return {
    id: "commande_fournisseur",
    label: "Commander chez un fournisseur",
    steps: ["fournisseurs", "produits", "prix", "panier", "commandes"],
  };
}

/**
 * Parse a French product PRD into a ProductModel.
 * Heuristics: brand name from first H1; CHR keywords → catalogue; else notes entity.
 */
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

export function parseProductPrd(markdown: string, opts?: { sourcePath?: string; brandId?: string; brandName?: string }): ProductModel {
  const text = markdown.replace(/\r\n/g, "\n");
  const h1 = text.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? "Nouvelle app";
  const brandName =
    opts?.brandName?.trim() || extractBrandName(text, h1) || "BrandApp";
  const brandId = opts?.brandId ? safeBrandId(opts.brandId) : safeBrandId(brandName);

  const lower = text.toLowerCase();
  const isChr =
    /\bfournisseur/.test(lower) &&
    (/\bpanier\b/.test(lower) || /\bcommande/.test(lower)) &&
    (/\bprix\b/.test(lower) || /\bproduit/.test(lower));

  const taglineMatch = text.match(/\*\*Une phrase\*\*\s*[—\-:]\s*(.+)/i) || text.match(/^>\s*(.+)$/m);
  const tagline = taglineMatch?.[1]?.trim() ?? `Application métier ${brandName}`;

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
    };
  }

  // Fallback générique : une entité notes + pages minimales
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
    pages: [{ id: "notes", path: "/notes", title: "Notes", entityId: "notes", kind: "list" }],
    flows: [],
    platformNeeds: defaultPlatformNeeds(),
    sourcePrdPath: opts?.sourcePath,
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
