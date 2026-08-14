/**
 * ProductModel — contrat intermédiaire entre un brief produit (PRD) et le scaffold.
 *
 * Le brief reste non technique. Le parsing produit un modèle structuré que les
 * générateurs **génériques** consomment (CRUD + wiring OS).
 *
 * Anti-triche : on n’injecte PAS un clone TempoFlow (optimiser/scan/stack…).
 * Le cœur inféré du PRD « fournisseurs → prix → panier → commande » suffit
 * pour le bootstrap ; les modules suivants sont écrits par l’agent (mini-PRDs).
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
  /**
   * Parcours produit `/onboarding` après setup.
   * `false` = demo / app sans étapes (post-setup → home).
   * Absent = laisser le défaut kit (activé côté brand-spec / features).
   */
  onboarding?: boolean;
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
  /** Vertical détecté — n’active PAS de templates métier riches. */
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

/**
 * App vierge (`creezio demo-app`) — zéro vertical métier : toutes les
 * fonctions natives OS (auth, setup, mails, tâches, assistant, MCP, admin,
 * plugins) + un unique module d'exemple neutre `notes` (placeholder à
 * remplacer par le métier réel via mini-PRDs).
 */
export function blankAppModel(opts: {
  brandId: string;
  brandName: string;
  domain: string;
}): ProductModel {
  return {
    brandId: safeBrandId(opts.brandId),
    brandName: opts.brandName,
    domain: opts.domain,
    tagline: "App vierge sur OS Creezio — serveur Docker par défaut",
    vertical: "generic",
    entities: [
      {
        id: "notes",
        label: "Note",
        labelPlural: "Notes",
        archivable: true,
        fields: [
          { name: "titre", type: "text", required: true, label: "Titre" },
          { name: "contenu", type: "text", label: "Contenu" },
        ],
      },
    ],
    pages: [
      { id: "notes", path: "/notes", title: "Notes", entityId: "notes", kind: "list" },
    ],
    flows: [],
    // Demo / app vierge : pas d'étapes produit → pas d'écran /onboarding mort.
    platformNeeds: { ...defaultPlatformNeeds(), onboarding: false },
  };
}

/** Cœur achats détecté (fournisseurs + panier + commandes). */
export function isChrModel(model: ProductModel): boolean {
  return (
    model.vertical === "chr" ||
    (model.entities.some((e) => e.id === "fournisseurs") &&
      model.entities.some((e) => e.id === "panier_lignes") &&
      model.entities.some((e) => e.id === "commandes"))
  );
}

/**
 * Cœur minimum déduit du PRD « fournisseurs → prix → panier → commande ».
 * Pas de modules bonus (optimiser, scan, stack…) — ceux-là = agent + mini-PRDs.
 */
export function corePurchaseEntities(): ProductEntity[] {
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
  ];
}

export function corePurchasePages(): ProductPage[] {
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
  ];
}

export function coreOrderFlow(): ProductFlow {
  return {
    id: "commande_fournisseur",
    label: "Commander chez un fournisseur",
    steps: ["fournisseurs", "produits", "prix", "panier", "commandes"],
  };
}

/** @deprecated alias — préférer corePurchaseEntities (cœur PRD, pas catalogue oracle). */
export const chrCatalogEntities = corePurchaseEntities;
/** @deprecated alias */
export const chrCatalogPages = corePurchasePages;
/** @deprecated alias */
export const chrOrderFlow = coreOrderFlow;

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
      entities: corePurchaseEntities(),
      pages: corePurchasePages(),
      flows: [coreOrderFlow()],
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

/**
 * CONVENTION OS — la home d'une marque vit à /dashboard : le workspace kit
 * (@creezio/shell-ui) canonise tout href "/" → "/dashboard" (normalizeHref /
 * targetHref) et l'onglet de base est créé sur /dashboard. Toute app générée
 * DOIT donc exposer une page /dashboard, sinon l'onglet de base et la
 * redirection "/" tombent sur un 404 (vécu foove2 : modèle générique sans
 * dashboard → redirect("/notes") résiduel).
 */
export function ensureDashboardPage(model: ProductModel): ProductModel {
  const hasDash = model.pages.some(
    (p) => p.kind === "dashboard" || p.path === "/dashboard",
  );
  if (hasDash) return model;
  return {
    ...model,
    pages: [
      {
        id: "dashboard",
        path: "/dashboard",
        title: "Dashboard",
        kind: "dashboard",
      },
      ...model.pages,
    ],
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
