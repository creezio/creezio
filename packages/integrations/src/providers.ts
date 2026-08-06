/**
 * Catalogue des providers d'intégration connus + mapping vers les types de
 * credentials n8n (pour la sync). `custom` couvre tout le reste via un
 * header HTTP générique côté n8n.
 */

export type IntegrationProviderId =
  | "openai"
  | "anthropic"
  | "notion"
  | "custom";

export type IntegrationProviderSpec = {
  id: IntegrationProviderId;
  label: string;
  /** Placeholder champ secret dans l'UI. */
  secretPlaceholder: string;
  /** Type credential n8n + fabrique du payload `data`. */
  n8n: {
    credentialType: string;
    buildData: (
      secret: string,
      meta: Record<string, unknown>,
    ) => Record<string, unknown>;
  };
};

export const INTEGRATION_PROVIDERS: readonly IntegrationProviderSpec[] = [
  {
    id: "openai",
    label: "OpenAI",
    secretPlaceholder: "sk-…",
    n8n: {
      credentialType: "openAiApi",
      buildData: (secret) => ({ apiKey: secret }),
    },
  },
  {
    id: "anthropic",
    label: "Anthropic",
    secretPlaceholder: "sk-ant-…",
    n8n: {
      credentialType: "anthropicApi",
      buildData: (secret) => ({ apiKey: secret }),
    },
  },
  {
    id: "notion",
    label: "Notion",
    secretPlaceholder: "ntn_… / secret_…",
    n8n: {
      credentialType: "notionApi",
      buildData: (secret) => ({ apiKey: secret }),
    },
  },
  {
    id: "custom",
    label: "Autre (header HTTP)",
    secretPlaceholder: "valeur du secret",
    n8n: {
      credentialType: "httpHeaderAuth",
      buildData: (secret, meta) => ({
        name:
          typeof meta.headerName === "string" && meta.headerName.trim()
            ? meta.headerName.trim()
            : "Authorization",
        value: secret,
      }),
    },
  },
];

export function getIntegrationProvider(
  id: string,
): IntegrationProviderSpec | null {
  return INTEGRATION_PROVIDERS.find((p) => p.id === id) ?? null;
}
