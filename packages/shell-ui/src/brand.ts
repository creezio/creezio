/**
 * O9 — tokens marque pour shell-ui (desktop API, hosts, titlebar).
 */

export type ShellUiBrand = {
  /** Ex. creezioDesktop / certivanDesktop / fiduDesktop */
  desktopApiGlobal: string;
  /** Suffixe hôte public (ex. app.example.com / tenant.creez.io) */
  publicHostSuffix: string;
  /** Classe CSS titlebar no-drag */
  titlebarDragClass: string;
  titlebarNoDragClass: string;
  /** Préfixe clés API live (ex. product_live_) */
  apiKeyPrefix: string;
  /** Nom produit UI — injecté par la marque */
  productName: string;
  /** Attribut data-* analytics clics (défaut data-creezio-aid). */
  aidAttr?: string;
};

const DEFAULT: ShellUiBrand = {
  desktopApiGlobal: "creezioDesktop",
  publicHostSuffix: "creez.io",
  titlebarDragClass: "creezio-titlebar-drag",
  titlebarNoDragClass: "creezio-titlebar-no-drag",
  apiKeyPrefix: "creezio_live_",
  productName: "Creezio",
  aidAttr: "data-creezio-aid",
};

let brand: ShellUiBrand = { ...DEFAULT };

export function configureShellUiBrand(next: Partial<ShellUiBrand>): void {
  brand = { ...brand, ...next };
}

export function getShellUiBrand(): ShellUiBrand {
  return brand;
}

export function resetShellUiBrandForTests(): void {
  brand = { ...DEFAULT };
}

/** Accès typé soft à window[desktopApiGlobal]. */
export function getShellDesktopApi(): any {
  if (typeof window === "undefined") return undefined;
  const key = getShellUiBrand().desktopApiGlobal;
  return (window as any)[key];
}
