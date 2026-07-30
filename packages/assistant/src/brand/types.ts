/**
 * Points d’extension marque pour `@creezio/assistant` (Phase N3).
 *
 * Marques = AppMap + Prompts + BrandTools métier.
 * Kit = runtime + UI génériques (pas de panier/dispatch/relevés).
 */

export type AssistantAppPage = {
  route: string;
  titre: string;
  role: string;
  actions: string[];
  synonymes: string[];
};

export type AssistantToolDefinition = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type HermesWorkUser = {
  id: string;
  name: string;
  role: string;
};

/** Carte app injectée par la marque (pages métier). */
export type AssistantAppMapConfig = {
  pages: AssistantAppPage[];
};

/** Prompts / briefs métier. */
export type AssistantPromptsConfig = {
  /** Prompt système Chat (hors carte app / addendum mode). */
  baseSystemPrompt?: string;
  /** Addendum mode Chat (sinon défaut kit générique). */
  chatModeAddendum?: string;
  /** Définitions d’outils LLM (plateforme + métier). */
  toolDefinitions?: AssistantToolDefinition[];
  /** Brief Hermes Work entreprise. */
  buildHermesWorkSystemBrief?: (
    nowIso: string,
    user?: HermesWorkUser | null,
  ) => string;
  /** Brief agent personnel. */
  buildPersonalAgentWorkBrief?: (
    nowIso: string,
    user?: HermesWorkUser | null,
  ) => string;
};

/** Session utilisateur pour handleAssistantChat (O4). */
export type AssistantAuthSession = {
  sub: string;
  email: string;
  role: string;
};

/** Outils / entités métier (catalogue, RTI, GED…) — hors kit. */
export type AssistantBrandTools = {
  /** get_entity marque (produit/dossier/…). */
  getEntity?: (
    kind: string,
    id: string,
  ) => { kind: string; entity: unknown; related?: Record<string, unknown> };
  /**
   * Exécuteur d’outil métier marque (panier, statut, tasks/todos…).
   * Retourne `null` si l’outil n’est pas géré → kit répond « outil inconnu ».
   * Peut inclure `sources` / `uiSummary` / `ok` dans le résultat.
   */
  executeTool?: (
    name: string,
    args: Record<string, unknown>,
    ctx: Record<string, unknown>,
  ) => Promise<Record<string, unknown> | null>;
  /** Sources CRM pour get_entity (kinds marque). */
  entitySources?: (
    kind: string,
    id: string,
    entity: Record<string, unknown> | null,
  ) => Array<{ title: string; url: string; type?: string }>;
  /** Projection hits Meili pour tool_result (champs métier optionnels). */
  formatSearchHit?: (hit: AssistantRagHit) => Record<string, unknown>;
  /** Preview args outil métier (sinon JSON générique). */
  argsPreview?: (
    name: string,
    args: Record<string, unknown>,
  ) => string | null | undefined;
  /** Enrichissement sources SQL → liens CRM. */
  collectSourcesFromSqlRows?: (
    rows: Record<string, unknown>[],
  ) => Array<{ title: string; url: string; type?: string }>;
  /** Matchers de liens dans le markdown assistant (UI). */
  sourceLinkMatchers?: (
    sources: Array<{ title: string; url: string; type?: string }> | undefined,
  ) => Array<{ text: string; url: string; type?: string }>;
};

/** Accès DB marque (remplace `@/lib/db`). */
export type AssistantDbAccess = {
  queryAll: <T = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ) => T[];
  queryOne: <T = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ) => T | undefined;
  getDbPath: () => string;
  tableExists?: (name: string) => boolean;
  /** better-sqlite3 Database (run_sql / explore). */
  getDb?: () => {
    prepare: (sql: string) => {
      all: (...params: unknown[]) => unknown[];
      get: (...params: unknown[]) => unknown;
      run: (...params: unknown[]) => unknown;
    };
    pragma?: (s: string) => unknown;
  };
};

/** Hit Meili générique (champs métier optionnels via index signature). */
export type AssistantRagHit = {
  index: string;
  id: string;
  type: string;
  title: string;
  body: string;
  url: string;
  status?: string;
  score?: number;
  ville?: string;
  pays?: string;
  [k: string]: unknown;
};

/** Meilisearch marque (indexes + mapping hits). */
export type AssistantMeiliConfig = {
  /** Tous les indexes keyword. */
  indexes: readonly string[];
  /** Indexes interrogés en premier (défaut = indexes). */
  primaryIndexes?: readonly string[];
  /** Index de secours si 0 hit (optionnel). */
  fallbackIndex?: string;
  mapHit: (index: string, doc: Record<string, unknown>) => AssistantRagHit;
  /** Enrichissement post-Meili (ex. geo SQL marque). */
  enrichHits?: (hits: AssistantRagHit[]) => void;
  host?: string;
  apiKey?: string;
};

/** Hermes / kanban marque. */
export type AssistantHermesConfig = {
  defaultSkills?: string[];
  /** Skills mode Work (≠ defaultSkills n8n/plugins) — O4. */
  workSkills?: string[];
  /** Préfixe session Hermes Work (`${prefix}-${conversationId}`). */
  sessionIdPrefix?: string;
  kanbanTenant?: string;
  kanbanTaskSkills?: string[];
  kanbanCronSkills?: string[];
  kanbanCreatedBy?: string;
};

/** Identité produit pour UI / messages d’erreur. */
export type AssistantBrandIdentity = {
  productName: string;
  /** localStorage key UI (provider). */
  uiStorageKey: string;
  /** Pref key mode Chat/Work. */
  modeStorageKey: string;
  /** window.*Desktop API name (ex. tempoflowDesktop). */
  desktopApiGlobal: string;
  /** Prefixe globalThis pour registres ui-actions. */
  globalStorePrefix: string;
};

export type AssistantBrandConfig = {
  identity: AssistantBrandIdentity;
  appMap?: AssistantAppMapConfig;
  prompts?: AssistantPromptsConfig;
  tools?: AssistantBrandTools;
  db?: AssistantDbAccess;
  meili?: AssistantMeiliConfig;
  hermes?: AssistantHermesConfig;
  /**
   * Auth pour handleAssistantChat (O4).
   * Remplace l’import marque `@/lib/auth`.
   */
  auth?: {
    getSession: () => Promise<AssistantAuthSession | null>;
  };
  /** Presence desktop (isDesktopOnline / offline error). */
  desktopPresence?: {
    isDesktopOnline: (userId: string) => boolean;
    desktopOfflineError: (userId: string) => Record<string, unknown>;
  };
  /** Ops track (optionnel). */
  trackServerDebounced?: (
    evt: {
      level: string;
      kind: string;
      outcome?: string;
      reason?: string;
      ctx?: Record<string, unknown>;
    },
    intervalMs?: number,
  ) => void;
};
