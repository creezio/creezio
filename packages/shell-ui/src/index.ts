/**
 * @creezio/shell-ui — nav + slots (Phase H1.4 / I7 adapters).
 */

export type { CoreNavItem, NavItem, NavSlot, NavSlotId } from "./types.js";
export { CORE_NAV_ITEMS, coreNavItems } from "./core-nav.js";
export type { NavRegistry } from "./registry.js";
export { createNavRegistry, mergeNav } from "./registry.js";
export type {
  CreateNavShellAdapterOptions,
  NavRenderGroup,
  NavRenderItem,
  NavRenderModel,
  NavShellAdapter,
} from "./adapters/nav-shell.js";
export { createNavShellAdapter } from "./adapters/nav-shell.js";
