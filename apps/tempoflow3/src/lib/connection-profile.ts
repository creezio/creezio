/**
 * Profil de connexion — généré factory (local / remote).
 */
export type ConnectionProfile = {
  mode: "local" | "remote";
  localBind: string;
  remoteUrl?: string;
  chosen: boolean;
};

export function defaultConnectionProfile(): ConnectionProfile {
  return {
    mode: "local",
    localBind: "127.0.0.1",
    chosen: false,
  };
}

export function tunnelRootDomain(): string {
  return "tempoflow3.local";
}
