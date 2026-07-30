/**
 * Prompts génériques + injection marque (AssistantPrompts).
 * Pas de TOOL_DEFINITIONS panier/dispatch en dur — marques via configureAssistantBrand.
 */
import { appMapPromptSection } from "./app-map-shim.js";
import {
  assistantPrompts,
  assistantToolDefinitions,
} from "./registry.js";
import { CHAT_MODE_ADDENDUM } from "../runtime/modes.js";
import {
  looksLikeUiCommand,
  shouldForceRunSql,
  shouldPreferSearchKnowledge,
} from "../runtime/routing.js";
import { loadSchemaCatalog } from "../runtime/schema-catalog.js";

export {
  looksLikeUiCommand,
  shouldForceRunSql,
  shouldPreferSearchKnowledge,
};

export const DEFAULT_MAX_TOOL_ROUNDS = 24;

export function maxToolRounds(): number {
  const n = Number(process.env.ASSISTANT_MAX_TOOL_ROUNDS || "");
  if (Number.isFinite(n) && n >= 4 && n <= 40) return Math.floor(n);
  return DEFAULT_MAX_TOOL_ROUNDS;
}

export function formatNowParis(d = new Date()): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      timeZone: "Europe/Paris",
      dateStyle: "full",
      timeStyle: "short",
    }).format(d);
  } catch {
    return d.toISOString();
  }
}

const GENERIC_BASE = `Tu es l'assistant ops du CRM (lecture seule).
Tu aides l'utilisateur sur les données et l'interface de l'application.

Règles strictes :
- Tu DOIS appeler au moins un outil avant toute réponse factuelle. Ne jamais répondre de mémoire.
- Ne jamais inventer de faits, montants, IDs ou statuts.
- Si l'information manque après outils, dis-le clairement.
- Réponds en français, concis et opérationnel.
- Tu n'as aucun droit d'écriture SQL.

## Pilotage de l'interface
Quand l'utilisateur demande une ACTION sur ce qu'il voit, utilise les outils surface_* :
1. surface_list_targets D'ABORD
2. surface_click / surface_type / surface_scroll / surface_read ensuite.
`;

export function buildSystemPrompt(opts?: {
  schemaCatalog?: string;
  extra?: string;
}): string {
  const brand = assistantPrompts();
  const base = brand.baseSystemPrompt?.trim() || GENERIC_BASE;
  const addendum = brand.chatModeAddendum?.trim() || CHAT_MODE_ADDENDUM;
  const catalog =
    opts?.schemaCatalog?.trim() ||
    (() => {
      try {
        return loadSchemaCatalog();
      } catch {
        return "";
      }
    })();
  const map = appMapPromptSection();
  const parts = [
    base,
    addendum,
    `## Carte de l'application\n${map}`,
    catalog ? `## Catalogue schéma\n${catalog}` : "",
    opts?.extra?.trim() || "",
  ];
  return parts.filter(Boolean).join("\n\n");
}

export const ASSISTANT_SYSTEM_PROMPT = GENERIC_BASE;

/** Outils = injection marque (vide si non configuré). */
export function getToolDefinitions() {
  return assistantToolDefinitions();
}

/** @deprecated préférer getToolDefinitions() — tableau live via getter. */
export function TOOL_DEFINITIONS() {
  return assistantToolDefinitions();
}

export function shouldAuditDistribution(_userMessage: string): boolean {
  return false;
}
