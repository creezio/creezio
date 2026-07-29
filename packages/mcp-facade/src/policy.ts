/**
 * Policies MCP H4 — deny cross-layer cohérent api-kernel H2.
 */

import type {
  McpAuthorizeContext,
  McpToolPolicyDecision,
} from "./types.js";

/**
 * Deny-by-default si la charge utile tente un échappement cross-layer
 * (même sémantique que api-kernel `__cross/` / `core/` escaping).
 */
export function denyCrossLayerToolCall(
  ctx: McpAuthorizeContext,
): McpToolPolicyDecision {
  const args = ctx.args || {};
  for (const [key, value] of Object.entries(args)) {
    const blob = `${key}=${stringifyArg(value)}`.toLowerCase();
    if (
      blob.includes("__cross/") ||
      blob.includes("__cross") ||
      /(^|[=\s/])core\//.test(blob) ||
      blob.includes("/../") ||
      blob.includes("..\\")
    ) {
      return { allow: false, reason: "cross_layer_denied" };
    }
  }

  // Un tool module/plugin ne peut pas se faire passer pour core via alias.
  if (ctx.isAlias && ctx.space === "core") {
    return { allow: false, reason: "alias_to_core_denied" };
  }

  // Spoof explicite de couche cible.
  const targetSpace = args.targetSpace ?? args.target_space ?? args.space;
  if (
    typeof targetSpace === "string" &&
    targetSpace !== ctx.space &&
    (targetSpace === "core" ||
      targetSpace === "module" ||
      targetSpace === "plugin")
  ) {
    return { allow: false, reason: "cross_layer_space_spoof" };
  }

  return { allow: true };
}

/**
 * Compose plusieurs policies (premier deny gagne).
 */
export function composeToolPolicies(
  ...policies: Array<
    (ctx: McpAuthorizeContext) => McpToolPolicyDecision | Promise<McpToolPolicyDecision>
  >
): (ctx: McpAuthorizeContext) => Promise<McpToolPolicyDecision> {
  return async (ctx) => {
    for (const p of policies) {
      const d = await p(ctx);
      if (!d.allow) return d;
    }
    return { allow: true };
  };
}

function stringifyArg(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
