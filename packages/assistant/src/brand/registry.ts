import type {
  AssistantAppMapConfig,
  AssistantAppPage,
  AssistantBrandConfig,
  AssistantBrandIdentity,
  AssistantBrandTools,
  AssistantDbAccess,
  AssistantHermesConfig,
  AssistantMeiliConfig,
  AssistantPromptsConfig,
  AssistantToolDefinition,
  HermesWorkUser,
} from "./types.js";

let config: AssistantBrandConfig | null = null;

const DEFAULT_IDENTITY: AssistantBrandIdentity = {
  productName: "Creezio",
  uiStorageKey: "creezio-assistant-ui",
  modeStorageKey: "creezio-assistant-preferred-mode",
  desktopApiGlobal: "creezioDesktop",
  globalStorePrefix: "__creezio",
};

/**
 * Configure l’assistant marque (AppMap, Prompts, BrandTools, DB, Meili…).
 * À appeler au boot serveur / layout client avant usage runtime.
 */
export function configureAssistantBrand(next: AssistantBrandConfig): void {
  config = next;
}

export function getAssistantBrandConfig(): AssistantBrandConfig | null {
  return config;
}

export function requireAssistantBrand(): AssistantBrandConfig {
  if (!config) {
    throw new Error(
      "@creezio/assistant: configureAssistantBrand() requis avant usage runtime",
    );
  }
  return config;
}

export function assistantIdentity(): AssistantBrandIdentity {
  return config?.identity ?? DEFAULT_IDENTITY;
}

export function assistantAppMapPages(): AssistantAppPage[] {
  return config?.appMap?.pages ?? [];
}

export function assistantPrompts(): AssistantPromptsConfig {
  return config?.prompts ?? {};
}

export function assistantBrandTools(): AssistantBrandTools {
  return config?.tools ?? {};
}

export function assistantDb(): AssistantDbAccess | null {
  return config?.db ?? null;
}

export function requireAssistantDb(): AssistantDbAccess {
  const db = assistantDb();
  if (!db) {
    throw new Error(
      "@creezio/assistant: configureAssistantBrand({ db }) requis pour SQL tools",
    );
  }
  return db;
}

export function assistantMeili(): AssistantMeiliConfig | null {
  return config?.meili ?? null;
}

export function assistantHermes(): AssistantHermesConfig {
  return config?.hermes ?? {};
}

export function assistantToolDefinitions(): AssistantToolDefinition[] {
  return config?.prompts?.toolDefinitions ?? [];
}

export function buildBrandHermesWorkBrief(
  nowIso: string,
  user?: HermesWorkUser | null,
): string {
  const fn = config?.prompts?.buildHermesWorkSystemBrief;
  if (fn) return fn(nowIso, user);
  const who = user ? `${user.name} (rôle ${user.role})` : "l'utilisateur";
  return `Tu es l'agent Work ${assistantIdentity().productName}, exécuté via Hermes embarqué pour ${who}. Date : ${nowIso}.`;
}

export function buildBrandPersonalAgentBrief(
  nowIso: string,
  user?: HermesWorkUser | null,
): string {
  const fn = config?.prompts?.buildPersonalAgentWorkBrief;
  if (fn) return fn(nowIso, user);
  const who = user ? `${user.name} (rôle ${user.role})` : "l'utilisateur";
  return `Tu es l'agent personnel de ${who}, sollicité depuis ${assistantIdentity().productName} Desktop (mode Work). Date : ${nowIso}.`;
}

export type { AssistantAppMapConfig };
