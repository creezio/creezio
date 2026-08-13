/**
 * Cloudflare Tunnel auto-provisionné — helpers purs (zéro réseau, testables).
 *
 * SoT unique du modèle ingress/DNS depuis la suppression du provisioner VPS
 * (0.10.0 — fin du sidecar cloudflared et du service `docker/tunnel-provisioner`) :
 * l'instance se provisionne elle-même via l'API Cloudflare (client :
 * `tunnel-cf-client.ts`) et cloudflared tourne in-process dans le conteneur
 * de l'app — une seule méthode pour toutes les instances, admins comprises.
 *
 * SoT format hostnames : `tunnel-urls.ts`
 *   CRM    : {slug}.{zone}  (ou CREEZIO_DOMAIN — hostname complet custom)
 *   embeds nested : n8n.{slug}.{zone} / hermes.{slug}.{zone}
 *   embeds flat   : n8n-{slug}.{zone} / hermes-{slug}.{zone}  (défaut, D2)
 *   agent nested  : agent.{slug}.{zone}
 *   agent flat    : agent-{slug}.{zone}
 *
 * Mode de hostnames (D2) : `CREEZIO_CF_UNIVERSAL_SSL` truthy → nested ;
 * sinon (défaut) → flat. Remplace `CREEZIO_TUNNEL_FLAT_HOSTS` (supprimé —
 * migration propre, pas de double mécanisme).
 */

import {
  buildTunnelPublicUrls,
  resolveTunnelHostMode,
  tunnelServiceHostname,
  type TunnelHostMode,
  type TunnelPublicUrls,
} from "./tunnel-urls.js";

/**
 * Slugs "brand-web" : plans web publics de la marque (zone-level), ex.
 * `lp.{zone}` → landing page publique rendue par le plane de l'app admin
 * (ADR-module-natif-hybride). En auto-provisioning, un hostname zone-level
 * s'obtient via `CREEZIO_DOMAIN` / `CREEZIO_TUNNEL_EXTRA_HOSTNAMES` sur
 * l'instance concernée — la liste reste utile pour refuser ces slugs aux
 * serveurs clients.
 */
export const BRAND_WEB_SLUGS = new Set(["lp"]);

/** Slug "registry" : `registry.{zone}` → proxy pull-only du registre flotte. */
export const REGISTRY_SLUGS = new Set(["registry"]);

/** Slugs réservés — jamais attribuables à un serveur client. */
export const RESERVED_SLUGS = new Set([
  "lp",
  "www",
  "crm",
  "api",
  "n8n",
  "mail",
  "smtp",
  "ftp",
  "admin",
  "agent",
  "app",
  "desktop",
  "cdn",
  "static",
  "assets",
  "status",
  "health",
  "docs",
  "dev",
  "staging",
  "prod",
  "test",
  "demo",
  "sandbox",
  "mcp",
  "oauth",
  "catalog",
  "dl",
  "crash",
  "tunnel",
  "fleet",
  "registry",
  "root",
  "ns1",
  "ns2",
]);

/** Préfixes plats qui entreraient en collision avec `n8n-{slug}.{zone}` etc. */
export const FLAT_SERVICE_PREFIXES = ["n8n-", "hermes-", "agent-"];

// 2–48 caractères : commence et finit par alphanum, tirets au milieu.
export const SLUG_RE = /^[a-z0-9]([a-z0-9-]{0,46}[a-z0-9])$/;

export function normalizeSlug(raw: unknown): string {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
}

/** Kinds « zone-level » : un seul ingress HTTP, pas d'embeds/wildcard/e-mail. */
export type TunnelSlugKind = "server" | "brand-web" | "registry";

export function isZoneLevelKind(kind: string | null | undefined): boolean {
  return kind === "brand-web" || kind === "registry";
}

function modeFromOpt(hostMode?: TunnelHostMode | null): TunnelHostMode {
  return resolveTunnelHostMode(hostMode);
}

export function slugCheckLocal(
  slug: string,
  opts?: { kind?: TunnelSlugKind; hostMode?: TunnelHostMode | null },
): { available: boolean; reason?: string } {
  if (!SLUG_RE.test(slug)) {
    return {
      available: false,
      reason: "Slug invalide (a-z, 0-9, tirets, 2–48 car.)",
    };
  }
  // kind=registry : UNIQUEMENT le slug registry (ingress pull-only) —
  // une réservation registry ne peut pas capturer un slug arbitraire.
  if (opts?.kind === "registry" && !REGISTRY_SLUGS.has(slug)) {
    return { available: false, reason: "kind registry limité au slug registry" };
  }
  if (RESERVED_SLUGS.has(slug)) {
    // Les slugs brand-web (lp…) sont réservables explicitement par la marque.
    if (opts?.kind === "brand-web" && BRAND_WEB_SLUGS.has(slug)) {
      return { available: true };
    }
    if (opts?.kind === "registry" && REGISTRY_SLUGS.has(slug)) {
      return { available: true };
    }
    return { available: false, reason: "Slug réservé" };
  }
  // En mode flat, `n8n-resto.{zone}` est l'embed du slug `resto` — un CRM
  // slug `n8n-resto` entrerait en collision DNS.
  if (modeFromOpt(opts?.hostMode) === "flat") {
    for (const p of FLAT_SERVICE_PREFIXES) {
      if (slug.startsWith(p)) {
        return {
          available: false,
          reason: `Slug réservé (préfixe flat ${p.slice(0, -1)})`,
        };
      }
    }
  }
  return { available: true };
}

export type TunnelIngressPorts = {
  crmPort: number;
  n8nPort: number;
  hermesPort: number;
};

export const TUNNEL_DEFAULT_PORTS: TunnelIngressPorts = {
  crmPort: 18791,
  n8nPort: 15678,
  hermesPort: 18797,
};

export function normalizeTunnelPorts(
  raw: Partial<Record<keyof TunnelIngressPorts | "localPort", unknown>> = {},
  defaults?: Partial<TunnelIngressPorts>,
): TunnelIngressPorts {
  const d = { ...TUNNEL_DEFAULT_PORTS, ...(defaults || {}) };
  const crmPort =
    Number(raw.crmPort ?? raw.localPort ?? d.crmPort) || d.crmPort;
  return {
    crmPort,
    n8nPort: Number(raw.n8nPort ?? d.n8nPort) || d.n8nPort,
    hermesPort: Number(raw.hermesPort ?? d.hermesPort) || d.hermesPort,
  };
}

export type TunnelIngressRule = {
  hostname?: string;
  service: string;
  originRequest?: { noTLSVerify: boolean; httpHostHeader: string };
};

export type TunnelIngressOpts = {
  /** Force nested|flat ; sinon résolution env (D2). */
  hostMode?: TunnelHostMode | null;
  /** Ingress agent flotte (hôte) — hors conteneur app. */
  agent?: { host?: string; port: number } | null;
  /** false = réservation zone-level (brand-web/registry) : un seul service. */
  embeds?: boolean;
  /**
   * D1 — hostnames supplémentaires servis par le MÊME tunnel (multi-domaines,
   * ex. `console.winhub.fr` + `app.winhub.fr` sur le tunnel de l'admin).
   * Pointent le même service que le CRM.
   */
  extraHostnames?: string[];
  /**
   * Hôte interne des services crm/n8n/hermes — défaut `127.0.0.1`
   * (cloudflared in-process dans le conteneur de l'app, modèle unique).
   */
  originHost?: string;
};

/**
 * Règles ingress complètes (le PUT Cloudflare remplace toute la config).
 *
 * cloudflared tourne IN-PROCESS dans le conteneur de l'app : les services
 * crm/n8n/hermes pointent `127.0.0.1` (même conteneur). L'entrée `agent`
 * pointe l'agent hôte flotte — hors conteneur — joignable via
 * host.docker.internal (extra_hosts host-gateway du stack).
 */
export function buildTunnelIngressRules(
  hostname: string,
  ports: TunnelIngressPorts,
  opts?: TunnelIngressOpts,
): TunnelIngressRule[] {
  const hostMode = modeFromOpt(opts?.hostMode);
  const originHost =
    String(opts?.originHost || "127.0.0.1").trim() || "127.0.0.1";
  const svcRule = (
    svcHostname: string,
    service: string,
  ): TunnelIngressRule => ({
    hostname: svcHostname,
    service,
    originRequest: { noTLSVerify: false, httpHostHeader: svcHostname },
  });
  if (opts?.embeds === false) {
    // Zone-level (ex. lp.{zone}, registry.{zone}) : un seul service HTTP local.
    return [
      svcRule(hostname, `http://${originHost}:${ports.crmPort}`),
      { service: "http_status:404" },
    ];
  }
  const rules: TunnelIngressRule[] = [
    svcRule(hostname, `http://${originHost}:${ports.crmPort}`),
    svcRule(
      tunnelServiceHostname(hostname, "n8n", hostMode),
      `http://${originHost}:${ports.n8nPort}`,
    ),
    svcRule(
      tunnelServiceHostname(hostname, "hermes", hostMode),
      `http://${originHost}:${ports.hermesPort}`,
    ),
  ];
  // D1 — hostnames supplémentaires → même app que le CRM.
  for (const extra of opts?.extraHostnames || []) {
    const h = String(extra || "").trim().toLowerCase();
    if (h && h !== hostname) {
      rules.push(svcRule(h, `http://${originHost}:${ports.crmPort}`));
    }
  }
  if (opts?.agent && opts.agent.port) {
    rules.push(
      svcRule(
        tunnelServiceHostname(hostname, "agent", hostMode),
        `http://${opts.agent.host || "host.docker.internal"}:${opts.agent.port}`,
      ),
    );
  }
  rules.push({ service: "http_status:404" });
  return rules;
}

export type TunnelDnsRecordSpec = { name: string; qName: string };

/**
 * Liste des enregistrements DNS CNAME à assurer pour un slug serveur.
 * nested → `{slug}` + `*.{slug}` ; flat → `{slug}` + `n8n|hermes|agent-{slug}`.
 * + un CNAME par hostname supplémentaire (D1).
 */
export function tunnelDnsRecordSpecs(
  slug: string,
  hostname: string,
  zone: string,
  opts?: {
    wildcard?: boolean;
    agent?: boolean;
    hostMode?: TunnelHostMode | null;
    extraHostnames?: string[];
  },
): { hostMode: TunnelHostMode; records: TunnelDnsRecordSpec[] } {
  const mode = modeFromOpt(opts?.hostMode);
  const records: TunnelDnsRecordSpec[] = [{ name: hostname, qName: hostname }];
  for (const extra of opts?.extraHostnames || []) {
    const h = String(extra || "").trim().toLowerCase();
    if (h && h !== hostname) records.push({ name: h, qName: h });
  }
  if (opts?.wildcard === false) {
    return { hostMode: mode, records };
  }
  if (mode === "flat") {
    for (const svc of ["n8n", "hermes"] as const) {
      const h = tunnelServiceHostname(hostname, svc, "flat");
      records.push({ name: h, qName: h });
    }
    if (opts?.agent) {
      const h = tunnelServiceHostname(hostname, "agent", "flat");
      records.push({ name: h, qName: h });
    }
    return { hostMode: mode, records };
  }
  records.push({
    name: `*.${slug}`,
    qName: `*.${slug}.${zone}`,
  });
  return { hostMode: mode, records };
}

/** Hosts à nettoyer au deprovision (nested + flat + mail + extras D1). */
export function tunnelDeprovisionDnsHosts(
  slug: string,
  hostname: string,
  zone: string,
  extraHostnames?: string[],
): string[] {
  return [
    hostname,
    `*.${slug}.${zone}`,
    `${slug}.mail.${zone}`,
    `n8n-${slug}.${zone}`,
    `hermes-${slug}.${zone}`,
    `agent-${slug}.${zone}`,
    `n8n.${slug}.${zone}`,
    `hermes.${slug}.${zone}`,
    `agent.${slug}.${zone}`,
    ...(extraHostnames || [])
      .map((h) => String(h || "").trim().toLowerCase())
      .filter((h) => h && h !== hostname),
  ];
}

/**
 * Hostname de l'ingress agent pour un hostname CRM donné :
 * nested → `agent.{hostname}` ; flat → `agent-{hostname}`.
 */
export function tunnelAgentHostname(
  hostname: string,
  hostMode: TunnelHostMode,
): string {
  return hostMode === "nested" ? `agent.${hostname}` : `agent-${hostname}`;
}

/**
 * URLs publiques d'un hostname CRM. `embeds: false` (zone-level) → CRM seul.
 */
export function tunnelPublicUrls(
  hostname: string,
  opts?: { hostMode?: TunnelHostMode | null; embeds?: boolean },
): TunnelPublicUrls | { crm: string } {
  if (opts?.embeds === false) {
    return { crm: `https://${hostname}` };
  }
  return buildTunnelPublicUrls(hostname, modeFromOpt(opts?.hostMode));
}

/** Parse un fichier env `K=V` (secrets — jamais commité). */
export function parseEnvFileText(text: string): Record<string, string> {
  const env: Record<string, string> = {};
  for (const line of String(text || "").split(/\r?\n/)) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const i = line.indexOf("=");
    env[line.slice(0, i).trim()] = line
      .slice(i + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }
  return env;
}

/** Parse une liste d'hostnames supplémentaires (D1) séparés par virgules. */
export function parseExtraHostnames(raw: unknown): string[] {
  return String(raw || "")
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter((h) => /^[a-z0-9]([a-z0-9.-]*[a-z0-9])?$/.test(h) && h.includes("."));
}
