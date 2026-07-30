/**
 * Modes assistant : Chat (guide) vs Work (délégation Hermes).
 * Briefs métier → configureAssistantBrand({ prompts }).
 */
import {
  buildBrandHermesWorkBrief,
  buildBrandPersonalAgentBrief,
} from "../brand/registry.js";
import type { HermesWorkUser } from "../brand/types.js";

export type { HermesWorkUser };

export const ASSISTANT_MODES = ["chat", "work"] as const;
export type AssistantMode = (typeof ASSISTANT_MODES)[number];

export function isAssistantMode(v: unknown): v is AssistantMode {
  return v === "chat" || v === "work";
}

export function parseAssistantMode(
  v: unknown,
  fallback: AssistantMode = "chat",
): AssistantMode {
  return isAssistantMode(v) ? v : fallback;
}

/** Tools UI (souris) — exclus du mode Work côté Hermes. */
export const UI_TOOL_NAMES = [
  "surface_list_targets",
  "surface_click",
  "surface_type",
  "surface_scroll",
  "surface_read",
  "ui_list_targets",
  "ui_click",
  "ui_type",
  "ui_scroll",
  "supplier_list_tabs",
  "supplier_open_tab",
  "supplier_list_targets",
  "supplier_click",
  "supplier_type",
  "supplier_scroll",
  "supplier_read",
] as const;

export function isUiToolName(name: string): boolean {
  return (UI_TOOL_NAMES as readonly string[]).includes(name);
}

/**
 * Prompt Chat générique (marques peuvent override via prompts.chatModeAddendum).
 */
export const CHAT_MODE_ADDENDUM = `
## Mode Chat (guide)
Tu es en **mode Chat** : priorité à **répondre** et **guider** l'utilisateur.
Tu conserves **tous** tes outils (SQL, Meili, surface_*/ui_*/supplier_*, tâches…).
Pour toute action sur l'écran visible : préfère \`surface_*\` et suis le bloc **Surface active (runtime)**.

### Tâches / missions (OBLIGATOIRE)
Dès qu'il y a une **mission à faire** — rappel, batch, suivi — appelle \`create_task\` pour l'ajouter au kanban **/taches**. Par défaut \`executor=hermes\` ; pour un collaborateur IA passe \`executor=ai\` + \`assignee_user_id\` ; pour un humain \`executor=human\`.
Tu peux ensuite \`list_tasks\` pour le statut.

Quand la demande est une **tâche longue / batch** : crée d'abord la tâche, puis invite à ouvrir **Work** pour l'exécution (« passe en mode Work ») — Work délègue à Hermes.
`;

export function buildPersonalAgentWorkBrief(
  nowIso: string,
  user?: HermesWorkUser | null,
): string {
  return buildBrandPersonalAgentBrief(nowIso, user);
}

export function buildHermesWorkSystemBrief(
  nowIso: string,
  user?: HermesWorkUser | null,
): string {
  return buildBrandHermesWorkBrief(nowIso, user);
}
