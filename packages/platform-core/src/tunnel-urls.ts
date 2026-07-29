/**
 * URLs publiques multi-niveau pour embeds via tunnel Cloudflare.
 * Port brand-agnostic de electron/tunnel-service-urls.ts (TF2 0.10.26).
 *
 * CRM     : https://{slug}.{tunnelRootDomain}
 * n8n     : https://n8n.{slug}.{tunnelRootDomain}
 * Hermes  : https://hermes.{slug}.{tunnelRootDomain}
 */

export const TUNNEL_EMBED_SERVICES = ["n8n", "hermes"] as const;
export type TunnelEmbedService = (typeof TUNNEL_EMBED_SERVICES)[number];

export type TunnelPublicUrls = {
  crm: string;
  n8n: string;
  hermes: string;
};

function cleanHost(raw: string): string {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .split("/")[0]!;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Hostnames services pour un slug CRM. */
export function tunnelServiceHostname(
  crmHostname: string,
  service: TunnelEmbedService,
): string {
  const host = cleanHost(crmHostname);
  if (!host) throw new Error("hostname CRM requis");
  if (host.startsWith(`${service}.`)) return host;
  for (const svc of TUNNEL_EMBED_SERVICES) {
    if (host.startsWith(`${svc}.`)) {
      return `${service}.${host.slice(svc.length + 1)}`;
    }
  }
  return `${service}.${host}`;
}

/** Construit le map d'URLs publiques pour un hostname CRM. */
export function buildTunnelPublicUrls(crmHostname: string): TunnelPublicUrls {
  const host = cleanHost(crmHostname);
  if (!host) throw new Error("hostname CRM requis");
  let crmHost = host;
  for (const svc of TUNNEL_EMBED_SERVICES) {
    if (host.startsWith(`${svc}.`)) {
      crmHost = host.slice(svc.length + 1);
      break;
    }
  }
  return {
    crm: `https://${crmHost}`,
    n8n: `https://${tunnelServiceHostname(crmHost, "n8n")}`,
    hermes: `https://${tunnelServiceHostname(crmHost, "hermes")}`,
  };
}

/**
 * Dérive l'URL publique d'un embed depuis l'origine CRM (mode Rejoindre).
 * Retourne null si l'origin n'appartient pas au `tunnelRootDomain`.
 */
export function deriveTunnelServiceUrl(
  crmOrigin: string,
  service: TunnelEmbedService,
  tunnelRootDomain: string,
): string | null {
  try {
    let s = String(crmOrigin || "").trim();
    if (!s) return null;
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) s = `https://${s}`;
    const u = new URL(s);
    const root = cleanHost(tunnelRootDomain);
    const re = new RegExp(`(^|\\.)${escapeRegex(root)}$`, "i");
    if (!re.test(u.hostname)) return null;
    return `https://${tunnelServiceHostname(u.hostname, service)}`;
  } catch {
    return null;
  }
}

/** Extrait le port d'une URL loopback locale. */
export function portFromLocalUrl(
  url: string | null | undefined,
): number | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.port) {
      const n = Number(u.port);
      return Number.isFinite(n) && n > 0 ? n : null;
    }
    if (u.protocol === "https:") return 443;
    if (u.protocol === "http:") return 80;
    return null;
  } catch {
    return null;
  }
}
