export { CreezioUiBoot, type CreezioUiBootProps } from "./boot.js";

/** Dossiers OS interdits dans ui/app/ versionné d'une marque. */
export const OS_UI_ROUTE_SEGMENTS = [
  "admin",
  "cockpit",
  "collaborateurs",
  "configuration",
  "developers",
  "login",
  "mails",
  "mcp",
  "onboarding",
  "parametres",
  "server-cockpit",
  "settings",
  "setup",
  "taches",
] as const;

/** Groupe App Router Next (hors URL) où l’OS est matérialisé localement. */
export const OS_UI_ROUTE_GROUP = "(creezio-os)";
