export type McpToolSpace = "core" | "module" | "plugin";

/**
 * Surface publique listTools :
 * - `canonical` — noms namespacés uniquement (module.panier.get)
 * - `legacy-preferred` — si un alias legacy existe, masquer le canonique
 * - `both` — alias + canonique (déconseillé — double exposition)
 */
export type McpPublicSurfaceMode =
  | "canonical"
  | "legacy-preferred"
  | "both";

export type McpToolDefinition = {
  name: string;
  description: string;
  space: McpToolSpace;
  /** Id module/plugin si space !== core. */
  ownerId?: string;
  inputSchema?: Record<string, unknown>;
  /** Nom canonique si cette entrée est un alias legacy exposé. */
  aliasOf?: string;
};

export type McpToolCallResult = {
  ok: boolean;
  content?: unknown;
  error?: string;
};

export type McpToolHandler = (
  args: Record<string, unknown>,
) => McpToolCallResult | Promise<McpToolCallResult>;

export type McpRegisteredTool = McpToolDefinition & {
  handler: McpToolHandler;
};

export type DiscoverToolsFn = () =>
  | McpRegisteredTool[]
  | Promise<McpRegisteredTool[]>;

/** Discovery scindée par couche (H2.3) — préférée à une liste plate. */
export type DiscoverToolsBySpaceFn = () =>
  | Partial<Record<"module" | "plugin", McpRegisteredTool[]>>
  | Promise<Partial<Record<"module" | "plugin", McpRegisteredTool[]>>>;

export type McpAuthorizeContext = {
  name: string;
  canonicalName: string;
  space: McpToolSpace;
  ownerId?: string;
  subject?: string;
  args: Record<string, unknown>;
  isAlias: boolean;
};

export type McpToolPolicyDecision =
  | { allow: true }
  | { allow: false; reason: string };

export type McpAuthorizeToolCallFn = (
  ctx: McpAuthorizeContext,
) => McpToolPolicyDecision | Promise<McpToolPolicyDecision>;

export type McpFacadeOptions = {
  /** Secret JWT (local-config `mcpJwtSecret` / env MCP_JWT_SECRET). */
  jwtSecret?: string | null;
  /** Si true, auth JWT optionnelle (dev/sandbox). Défaut false en prod. */
  allowUnauthenticated?: boolean;
  /** Discoverer plat (H1 compat). */
  discoverTools?: DiscoverToolsFn;
  /**
   * Discoverer scindé (H2) — tools modules vs plugins.
   * Si fourni, fusionné avec `discoverTools` (plat).
   */
  discoverToolsBySpace?: DiscoverToolsBySpaceFn;
  architectureVersion?: string;
  brandId?: string;
  /** Liste mounts api-kernel (optionnel, pour tool admin). */
  listApiMounts?: () => Array<{ space: string; id: string }>;
  /**
   * H4 — impose préfixes `core.*` / `creezio.*` · `module.<id>.*` · `plugin.<id>.*`
   * Défaut true.
   */
  enforceNamespaces?: boolean;
  /**
   * H4 — aliases legacy → nom canonique namespacé
   * (ex. get_panier → module.panier.get).
   */
  aliases?: Record<string, string>;
  /**
   * H4 — surface listTools (défaut `legacy-preferred` pour éviter
   * la double exposition panier historique ↔ module.*).
   */
  publicSurface?: McpPublicSurfaceMode;
  /** H4 — policy avant callTool (deny cross-layer par défaut). */
  authorizeToolCall?: McpAuthorizeToolCallFn;
  /**
   * H4 — si false, ne pas installer denyCrossLayerToolCall par défaut.
   * Défaut true.
   */
  defaultCrossLayerDeny?: boolean;
};

export type McpListToolsResult = {
  tools: McpToolDefinition[];
};

export type McpToolsBySpace = Record<McpToolSpace, McpToolDefinition[]>;

export type McpAuthResult =
  | { ok: true; subject?: string }
  | { ok: false; error: string; status: number };
