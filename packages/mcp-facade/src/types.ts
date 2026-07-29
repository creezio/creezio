export type McpToolSpace = "core" | "module" | "plugin";

export type McpToolDefinition = {
  name: string;
  description: string;
  space: McpToolSpace;
  /** Id module/plugin si space !== core. */
  ownerId?: string;
  inputSchema?: Record<string, unknown>;
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
};

export type McpListToolsResult = {
  tools: McpToolDefinition[];
};

export type McpToolsBySpace = Record<McpToolSpace, McpToolDefinition[]>;

export type McpAuthResult =
  | { ok: true; subject?: string }
  | { ok: false; error: string; status: number };
