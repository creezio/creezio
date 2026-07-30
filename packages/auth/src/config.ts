/**
 * Configuration auth marque — cookie / permissions owner.
 * Aucun nom de cookie ni bridge hardcodé dans le kit.
 */

export type AuthConfig = {
  /**
   * Nom du cookie de session JWT (ex. tempoflow2_crm_session / fidu_session).
   * Obligatoire avant getSession / cookies / middlewares.
   */
  cookieName: string;
  /** Durée cookie en secondes. Défaut 7 jours. */
  cookieMaxAge?: number;
  /**
   * Permissions nav accordées au rôle owner / session AUTH_DISABLED.
   * Injectées par la marque (ALL_NAV_PERMISSIONS).
   */
  ownerPermissions?: readonly string[];
};

const DEFAULT_MAX_AGE = 60 * 60 * 24 * 7;

type ResolvedAuthConfig = {
  cookieName: string;
  cookieMaxAge: number;
  ownerPermissions: readonly string[];
};

const DEFAULT: ResolvedAuthConfig = {
  cookieName: "",
  cookieMaxAge: DEFAULT_MAX_AGE,
  ownerPermissions: [],
};

let config: ResolvedAuthConfig = { ...DEFAULT };

/** Configure une fois au boot marque (avant routes / pages / middleware). */
export function configureAuth(next: AuthConfig): void {
  if (!next.cookieName || !String(next.cookieName).trim()) {
    throw new Error("@creezio/auth: configureAuth({ cookieName }) requis");
  }
  config = {
    cookieName: String(next.cookieName).trim(),
    cookieMaxAge:
      typeof next.cookieMaxAge === "number" && next.cookieMaxAge > 0
        ? next.cookieMaxAge
        : DEFAULT_MAX_AGE,
    ownerPermissions: next.ownerPermissions
      ? [...next.ownerPermissions]
      : config.ownerPermissions,
  };
}

export function getAuthConfig(): ResolvedAuthConfig {
  return {
    ...config,
    ownerPermissions: [...config.ownerPermissions],
  };
}

export function getAuthCookieName(): string {
  const name = config.cookieName;
  if (!name) {
    throw new Error(
      "@creezio/auth: cookieName non configuré — appeler configureAuth({ cookieName }) au boot",
    );
  }
  return name;
}

export function resetAuthConfigForTests(): void {
  config = { ...DEFAULT, ownerPermissions: [] };
}
