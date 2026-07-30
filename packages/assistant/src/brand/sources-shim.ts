/**
 * Sources CRM — délégué à AssistantBrandTools (pas de schéma panier/catalogue en kit).
 */
import { assistantBrandTools } from "./registry.js";

export type AssistantSourceType = string;

export type AssistantSource = {
  title: string;
  url: string;
  type?: AssistantSourceType;
};

export function collectSourcesFromSqlRows(
  rows: Record<string, unknown>[],
): AssistantSource[] {
  const fn = assistantBrandTools().collectSourcesFromSqlRows;
  if (fn) return fn(rows);
  return [];
}

/** Matchers legacy — marques peuvent ignorer. */
export const sourceLinkMatchers: Array<{
  re: RegExp;
  type: string;
}> = [];
