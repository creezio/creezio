/**
 * Définitions d'outils plateforme (SoT kit) — explore / SQL / Meili / surface / UI / supplier.
 * Métier (module.*) = discovery MCP. Tasks = PLATFORM_TASK_TOOL_DEFINITIONS + adapter tasks.
 * Phase O4r — remplace la duplication ×3 dans prompts.ts marques.
 */
import type { AssistantToolDefinition } from "../brand/types.js";

export const PLATFORM_TOOL_DEFINITIONS: AssistantToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "list_tables",
      description:
        "Liste les tables SQLite du CRM avec nombre de lignes et de colonnes.",
      parameters: {
        type: "object",
        properties: {
          q: {
            type: "string",
            description: "Filtre optionnel sur le nom de table (ex. produit, marketplace)",
          },
          limit: {
            type: "integer",
            description: "Nb max de tables retournées (défaut 80, max 200)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "describe_table",
      description:
        "Décrit une table : colonnes + types + enums + linkColumns + childTables + FK.",
      parameters: {
        type: "object",
        properties: {
          table: {
            type: "string",
            description: "Nom exact de la table (ex. produits, fournisseurs, releves_prix, promotions)",
          },
          sample_distinct: {
            type: "boolean",
            description: "Échantillonner les enums et linkColumns (défaut true)",
          },
        },
        required: ["table"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "find_columns",
      description:
        "Cherche dans le schéma des tables/colonnes/valeurs contenant un mot-clé.",
      parameters: {
        type: "object",
        properties: {
          q: {
            type: "string",
            description: "Mot-clé (nom de colonne, fragment de table, ou valeur)",
          },
          scope: {
            type: "string",
            enum: ["columns", "values", "both"],
            description: "columns = noms ; values = DISTINCT contenant q ; both = défaut",
          },
          limit: {
            type: "integer",
            description: "Nb max de hits (défaut 40, max 80)",
          },
        },
        required: ["q"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_distinct_values",
      description:
        "Liste les valeurs DISTINCT exactes d'une colonne (avec counts). OBLIGATOIRE avant un filtre égalité texte douteux.",
      parameters: {
        type: "object",
        properties: {
          table: { type: "string", description: "Table SQLite" },
          column: {
            type: "string",
            description: "Colonne catégorielle à inspecter",
          },
          limit: {
            type: "integer",
            description: "Nb max de valeurs (défaut 30, max 100)",
          },
        },
        required: ["table", "column"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_knowledge",
      description:
        "Recherche keyword Meilisearch (indexes marque). PRIORITAIRE pour noms flous / typos / accents. Option ville pour filtrer. NE PAS utiliser pour un COUNT exact.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "Mots-clés produit/fournisseur (ex. paella, nutella). La ville peut rester dans la query ou passer via ville.",
          },
          ville: {
            type: "string",
            description:
              "Filtre géo optionnel sur fournisseurs.ville (ex. Paris). Appliqué après Meili.",
          },
          limit: { type: "integer", description: "Nb docs par index (défaut 5)" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "run_sql",
      description:
        "SQL SQLite lecture seule (SELECT/WITH). Lire metadata.totalMatching. Ne JAMAIS inventer de littéraux enum. LIMIT liste ≤100.",
      parameters: {
        type: "object",
        properties: {
          sql: {
            type: "string",
            description:
              "Requête SELECT/WITH. Ex count par fournisseur: SELECT COUNT(*) AS n FROM produits p JOIN fournisseurs f ON f.id=p.fournisseur_id WHERE f.nom LIKE '%Agidra%'",
          },
        },
        required: ["sql"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_entity",
      description:
        "Détail d'une entité CRM par id local / nom / id_produit (marketplace, produit, releve).",
      parameters: {
        type: "object",
        properties: {
          kind: {
            type: "string",
            description: "Kind d'entité (config marque / getEntity)",
          },
          id: {
            type: "string",
            description: "id entier, nom/slug fournisseur, ref_fournisseur ou libellé produit…",
          },
        },
        required: ["kind", "id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "surface_list_targets",
      description:
        "Inventaire unifié des éléments VISIBLES sur la surface active (CRM React OU site fournisseur Electron). Préférer cet outil à ui_list_targets / supplier_list_targets. Retourne url/path + titre + cibles. TOUJOURS avant surface_click / surface_type.",
      parameters: {
        type: "object",
        properties: {
          q: {
            type: "string",
            description:
              "Filtre optionnel sur le libellé (ex. 'email', 'like', 'panier')",
          },
          tabId: {
            type: "string",
            description:
              "Override onglet fournisseur (sinon tabId de la surface active)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "surface_click",
      description:
        "Clic unifié sur la surface active (fake-cursor CRM ou injecté fournisseur). Cible = ref de surface_list_targets.",
      parameters: {
        type: "object",
        properties: {
          ref: { type: "string", description: "Ref de cible" },
          label: { type: "string", description: "Libellé si ref inconnue" },
          tabId: { type: "string", description: "Override onglet fournisseur" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "surface_type",
      description:
        "Saisie unifiée sur la surface active (champ CRM ou site fournisseur). Autorisé sur email/password natifs si l'utilisateur le demande. PAS sur CAPTCHA Cloudflare.",
      parameters: {
        type: "object",
        properties: {
          ref: { type: "string", description: "Ref du champ" },
          label: { type: "string", description: "Placeholder / libellé" },
          text: { type: "string", description: "Texte à saisir" },
          submit: {
            type: "boolean",
            description: "Envoyer Entrée après la frappe (défaut false)",
          },
          tabId: { type: "string", description: "Override onglet fournisseur" },
        },
        required: ["text"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "surface_scroll",
      description:
        "Défilement unifié sur la surface active (haut/bas) avant un nouveau surface_list_targets.",
      parameters: {
        type: "object",
        properties: {
          direction: { type: "string", enum: ["up", "down"] },
          tabId: { type: "string", description: "Override onglet fournisseur" },
        },
        required: ["direction"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "surface_read",
      description:
        "Lecture texte visible sur la surface active. Sur CRM : résumé page ; sur site fournisseur : extraction texte (prix, tableaux).",
      parameters: {
        type: "object",
        properties: {
          q: {
            type: "string",
            description: "Filtre optionnel (blocs contenant ce texte)",
          },
          maxChars: {
            type: "integer",
            description: "Taille max (défaut 6000, supplier)",
          },
          tabId: { type: "string", description: "Override onglet fournisseur" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ui_list_targets",
      description:
        "CRM uniquement : inventaire DOM React. Sur surface supplier, utiliser surface_list_targets à la place (ui_* ne voit pas le site externe).",
      parameters: {
        type: "object",
        properties: {
          q: {
            type: "string",
            description:
              "Filtre optionnel sur le libellé des cibles (ex. 'like', 'fournisseur', 'Agidra')",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ui_click",
      description:
        "Clique un élément de la page via la souris virtuelle visible (le curseur se déplace puis clique réellement). Cible = ref retournée par ui_list_targets (prioritaire) ou libellé exact. Retourne la nouvelle page après le clic.",
      parameters: {
        type: "object",
        properties: {
          ref: {
            type: "string",
            description: "Ref de cible issue du dernier ui_list_targets (ex. t12)",
          },
          label: {
            type: "string",
            description: "Libellé visible de l'élément si ref inconnue (ex. 'Likés', 'Fournisseurs')",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ui_type",
      description:
        "Tape du texte dans un champ visible (recherche, filtre) via la souris virtuelle : clic dans le champ puis frappe simulée. Utiliser après ui_list_targets pour connaître la ref du champ.",
      parameters: {
        type: "object",
        properties: {
          ref: { type: "string", description: "Ref du champ (ui_list_targets)" },
          label: {
            type: "string",
            description: "Placeholder / libellé du champ si ref inconnue",
          },
          text: { type: "string", description: "Texte à saisir" },
          submit: {
            type: "boolean",
            description: "Envoyer Entrée après la frappe (défaut false — les recherches ont un debounce automatique)",
          },
        },
        required: ["text"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "ui_scroll",
      description:
        "Fait défiler la page de l'utilisateur vers le haut ou le bas (pour révéler des éléments hors écran avant ui_list_targets).",
      parameters: {
        type: "object",
        properties: {
          direction: { type: "string", enum: ["up", "down"] },
        },
        required: ["direction"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "supplier_list_tabs",
      description:
        "App desktop uniquement : liste les onglets fournisseurs ouverts (tabId, fournisseur, URL, titre). TOUJOURS appeler ceci avant toute autre action supplier_* pour connaître les tabId valides.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "supplier_open_tab",
      description:
        "App desktop uniquement : ouvre (ou réutilise) un onglet fournisseur sur une URL et le met au premier plan. La session du portail est persistante (l'utilisateur s'est connecté manuellement). Retourne le tabId à utiliser pour les actions suivantes.",
      parameters: {
        type: "object",
        properties: {
          fournisseur_id: {
            type: "integer",
            description: "id local du fournisseur (isole la session par fournisseur)",
          },
          url: { type: "string", description: "URL à ouvrir (https://…)" },
        },
        required: ["fournisseur_id", "url"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "supplier_list_targets",
      description:
        "App desktop uniquement : inventaire des éléments cliquables/saisissables VISIBLES dans un onglet fournisseur (liens, boutons, champs). Retourne aussi l'URL et le titre de la page. TOUJOURS appeler ceci avant supplier_click / supplier_type pour obtenir des refs valides.",
      parameters: {
        type: "object",
        properties: {
          tabId: { type: "string", description: "Onglet cible (supplier_list_tabs)" },
          q: {
            type: "string",
            description: "Filtre optionnel sur le libellé des cibles (ex. 'recherche', 'panier')",
          },
        },
        required: ["tabId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "supplier_click",
      description:
        "App desktop uniquement : clique un élément d'un onglet fournisseur via un vrai clic Chromium (trusted). Cible = ref retournée par supplier_list_targets (prioritaire) ou libellé exact. Retourne la page après le clic.",
      parameters: {
        type: "object",
        properties: {
          tabId: { type: "string", description: "Onglet cible (supplier_list_tabs)" },
          ref: {
            type: "string",
            description: "Ref de cible issue du dernier supplier_list_targets (ex. s3-12)",
          },
          label: {
            type: "string",
            description: "Libellé visible de l'élément si ref inconnue",
          },
        },
        required: ["tabId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "supplier_type",
      description:
        "App desktop uniquement : tape du texte dans un champ d'un onglet fournisseur (frappe clavier trusted, caractère par caractère). Utiliser après supplier_list_targets pour connaître la ref du champ.",
      parameters: {
        type: "object",
        properties: {
          tabId: { type: "string", description: "Onglet cible (supplier_list_tabs)" },
          ref: { type: "string", description: "Ref du champ (supplier_list_targets)" },
          label: {
            type: "string",
            description: "Placeholder / libellé du champ si ref inconnue",
          },
          text: { type: "string", description: "Texte à saisir" },
          submit: {
            type: "boolean",
            description: "Envoyer Entrée après la frappe (défaut false)",
          },
        },
        required: ["tabId", "text"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "supplier_scroll",
      description:
        "App desktop uniquement : fait défiler la page d'un onglet fournisseur vers le haut ou le bas (pour révéler des éléments avant supplier_list_targets).",
      parameters: {
        type: "object",
        properties: {
          tabId: { type: "string", description: "Onglet cible (supplier_list_tabs)" },
          direction: { type: "string", enum: ["up", "down"] },
        },
        required: ["tabId", "direction"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "supplier_read",
      description:
        "App desktop uniquement : lit le contenu texte visible d'un onglet fournisseur (extraction du texte principal, prix, tableaux). Param q optionnel pour cibler une zone (ex. 'prix', 'résultat'). À utiliser pour remonter une information affichée (prix, dispo).",
      parameters: {
        type: "object",
        properties: {
          tabId: { type: "string", description: "Onglet cible (supplier_list_tabs)" },
          q: {
            type: "string",
            description: "Filtre optionnel : ne retourne que les blocs contenant ce texte",
          },
          maxChars: {
            type: "integer",
            description: "Taille max du texte retourné (défaut 6000)",
          },
        },
        required: ["tabId"],
      },
    },
  }
];

/** create_task / list_tasks — handlers kit via configureAssistantBrand({ tasks }). */
export const PLATFORM_TASK_TOOL_DEFINITIONS: AssistantToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "create_task",
      description:
        "Crée une tâche dans le kanban unifié /taches (ou /todos selon marque). OBLIGATOIRE dès qu'il y a une mission à faire.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Titre court de la mission" },
          body: { type: "string", description: "Consignes détaillées" },
          executor: {
            type: "string",
            enum: ["hermes", "ai", "human"],
            description: "Exécutant (défaut hermes)",
          },
          assignee_user_id: { type: "string" },
          recurring_schedule: { type: "string" },
          priority: { type: "integer" },
          dispatch: { type: "boolean" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_tasks",
      description:
        "Liste les tâches du kanban unifié (sync Hermes si disponible).",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string" },
          executor: {
            type: "string",
            enum: ["hermes", "ai", "human"],
          },
          sync: { type: "boolean" },
        },
        required: [],
      },
    },
  },
];

export const PLATFORM_TASK_TOOL_ALIASES = {
  create_todo: "create_task",
  list_todos: "list_tasks",
} as const;
