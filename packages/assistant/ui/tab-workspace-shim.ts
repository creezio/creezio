/**
 * Shim workspace onglets — marques aliasent ce module vers leur TabWorkspaceProvider.
 * Défaut : pas de workspace (null).
 */
import type {
  ActiveSurface,
  ActiveSurfaceTabLike,
} from "../dist/runtime/active-surface.js";

export type AssistantTabWorkspace = {
  activeSurface?: ActiveSurface | null;
  activeTab?: ActiveSurfaceTabLike | null;
} | null;

export function useTabWorkspaceOptional(): AssistantTabWorkspace {
  return null;
}
