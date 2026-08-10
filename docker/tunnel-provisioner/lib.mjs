/**
 * Provisioner Cloudflare Tunnel kit — helpers purs (testables sans réseau).
 *
 * SoT format hostnames : packages/platform-core/src/tunnel-urls.ts
 *   CRM    : {slug}.{zone}
 *   embeds nested : n8n.{slug}.{zone} / hermes.{slug}.{zone}
 *   embeds flat   : n8n-{slug}.{zone} / hermes-{slug}.{zone}
 *   agent nested  : agent.{slug}.{zone}
 *   agent flat    : agent-{slug}.{zone}
 *
 * Mode flat : CREEZIO_TUNNEL_FLAT_HOSTS=1 (Universal SSL, 1 niveau).
 * Défaut nested (rétrocompat ACM / TempoFlow).
 */

/**
 * Slugs "brand-web" : plans web publics de la marque (zone-level), réservables
 * uniquement via `kind: "brand-web"` (jamais par un serveur client).
 *   lp.{zone} → landing page publique (rendue par le plane de l'app admin —
 *   ADR-module-natif-hybride).
 */
export const BRAND_WEB_SLUGS = new Set(["lp"]);

/**
 * Slug "registry" : ingress `registry.{zone}` → proxy pull-only du registre
 * d'images de la flotte (Creezio Server Admin `/v2/*`, F4). Réservable
 * uniquement via `kind: "registry"` — jamais par un serveur client.
 */
export const REGISTRY_SLUGS = new Set(["registry"]);

/** Slugs réservés — jamais attribuables à un serveur restaurant. */
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

export function normalizeSlug(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
}

/**
 * nested | flat — même sémantique que platform-core `resolveTunnelHostMode`.
 * Env : CREEZIO_TUNNEL_FLAT_HOSTS=1|true|yes|on
 */
export function resolveTunnelHostMode(explicit) {
  if (explicit === "flat" || explicit === true || explicit === 1 || explicit === "1") {
    return "flat";
  }
  if (
    explicit === "nested" ||
    explicit === false ||
    explicit === 0 ||
    explicit === "0"
  ) {
    return "nested";
  }
  const env = String(process.env.CREEZIO_TUNNEL_FLAT_HOSTS || "")
    .trim()
    .toLowerCase();
  if (env === "1" || env === "true" || env === "yes" || env === "on") {
    return "flat";
  }
  return "nested";
}

function hostModeFromOpts(opts) {
  if (opts && opts.hostMode != null) {
    return resolveTunnelHostMode(opts.hostMode);
  }
  return resolveTunnelHostMode();
}

export function slugCheckLocal(slug, opts) {
  if (!SLUG_RE.test(slug)) {
    return {
      available: false,
      reason: "Slug invalide (a-z, 0-9, tirets, 2–48 car.)",
    };
  }
  // kind=registry : UNIQUEMENT le slug registry (ingress pull-only F4) —
  // une réservation registry ne peut pas capturer un slug arbitraire.
  if (opts?.kind === "registry" && !REGISTRY_SLUGS.has(slug)) {
    return { available: false, reason: "kind registry limité au slug registry" };
  }
  if (RESERVED_SLUGS.has(slug)) {
    // Les slugs brand-web (lp…) sont réservables explicitement par la marque.
    if (opts?.kind === "brand-web" && BRAND_WEB_SLUGS.has(slug)) {
      return { available: true };
    }
    // registry.{zone} : réservable uniquement en kind=registry (F4).
    if (opts?.kind === "registry" && REGISTRY_SLUGS.has(slug)) {
      return { available: true };
    }
    return { available: false, reason: "Slug réservé" };
  }
  // En mode flat, `n8n-resto.{zone}` est l'embed du slug `resto` — un CRM
  // slug `n8n-resto` entrerait en collision DNS.
  const mode = hostModeFromOpts(opts);
  if (mode === "flat") {
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

/** Kinds « zone-level » : un seul ingress HTTP, pas d'embeds/wildcard/e-mail. */
export function isZoneLevelKind(kind) {
  return kind === "brand-web" || kind === "registry";
}

/**
 * Hostname service (nested `svc.{crm}` ou flat `svc-{slug}.{zone}`).
 * `hostname` = CRM `{slug}.{zone}`.
 */
export function serviceHostname(hostname, service, opts) {
  const mode = hostModeFromOpts(opts);
  const host = String(hostname || "")
    .trim()
    .toLowerCase();
  if (!host) throw new Error("hostname CRM requis");
  if (mode === "flat") {
    const i = host.indexOf(".");
    if (i <= 0) throw new Error(`hostname CRM invalide: ${hostname}`);
    const slug = host.slice(0, i);
    const zone = host.slice(i + 1);
    return `${service}-${slug}.${zone}`;
  }
  return `${service}.${host}`;
}

export function buildPublicUrls(hostname, opts) {
  if (opts?.embeds === false) {
    // Réservation brand-web : un seul hostname public, pas d'embeds.
    return { crm: `https://${hostname}` };
  }
  const hostOpts = { hostMode: hostModeFromOpts(opts) };
  return {
    crm: `https://${hostname}`,
    n8n: `https://${serviceHostname(hostname, "n8n", hostOpts)}`,
    hermes: `https://${serviceHostname(hostname, "hermes", hostOpts)}`,
  };
}

export function normalizePorts(raw, defaults) {
  const d = {
    crmPort: 18791,
    n8nPort: 15678,
    hermesPort: 18797,
    ...(defaults || {}),
  };
  const crmPort =
    Number(raw.crmPort ?? raw.localPort ?? d.crmPort) || d.crmPort;
  return {
    crmPort,
    n8nPort: Number(raw.n8nPort ?? d.n8nPort) || d.n8nPort,
    hermesPort: Number(raw.hermesPort ?? d.hermesPort) || d.hermesPort,
  };
}

/**
 * Règles ingress complètes (PUT remplace toute la config).
 *
 * crm/n8n/hermes pointent `opts.serviceHost` (défaut 127.0.0.1 — cloudflared
 * dans le container serveur). Modèle stack compose (M2) : serviceHost = "app"
 * (nom de service du stack, cloudflared sidecar). L'entrée `agent` pointe
 * l'agent hôte flotte — hors stack — joignable via host.docker.internal
 * (extra_hosts host-gateway) ou la gateway bridge historique (172.17.0.1).
 */
export function buildIngressRules(hostname, ports, agent, opts) {
  const hostOpts = { hostMode: hostModeFromOpts(opts) };
  // Hôte des services crm/n8n/hermes : 127.0.0.1 (cloudflared in-container,
  // historique) ou "app" (stack compose M2 — sidecar joint le service par nom).
  const svcHost = String(opts?.serviceHost || "127.0.0.1").trim() || "127.0.0.1";
  const svcRule = (svcHostname, service) => ({
    hostname: svcHostname,
    service,
    originRequest: { noTLSVerify: false, httpHostHeader: svcHostname },
  });
  if (opts?.embeds === false) {
    // Réservation brand-web (ex. lp.{zone}) : un seul service HTTP local.
    return [
      svcRule(hostname, `http://${svcHost}:${ports.crmPort}`),
      { service: "http_status:404" },
    ];
  }
  const rules = [
    svcRule(hostname, `http://${svcHost}:${ports.crmPort}`),
    svcRule(
      serviceHostname(hostname, "n8n", hostOpts),
      `http://${svcHost}:${ports.n8nPort}`,
    ),
    svcRule(
      serviceHostname(hostname, "hermes", hostOpts),
      `http://${svcHost}:${ports.hermesPort}`,
    ),
  ];
  if (agent && agent.port) {
    rules.push(
      svcRule(
        serviceHostname(hostname, "agent", hostOpts),
        `http://${agent.host || "172.17.0.1"}:${agent.port}`,
      ),
    );
  }
  rules.push({ service: "http_status:404" });
  return rules;
}

/**
 * Liste des records DNS CNAME à assurer pour un slug serveur.
 * nested → `{slug}` + `*.{slug}` ; flat → `{slug}` + `n8n|hermes|agent-{slug}`.
 */
export function dnsRecordSpecs(slug, hostname, zone, opts) {
  const mode = hostModeFromOpts(opts);
  const records = [{ name: hostname, qName: hostname }];
  if (opts?.wildcard === false) {
    return { hostMode: mode, records };
  }
  if (mode === "flat") {
    const services = ["n8n", "hermes"];
    if (opts?.agent) services.push("agent");
    for (const svc of services) {
      const h = serviceHostname(hostname, svc, { hostMode: "flat" });
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

/** Hosts à nettoyer au deprovision (nested + flat + mail). */
export function deprovisionDnsHosts(slug, hostname, zone) {
  return [
    hostname,
    `*.${slug}.${zone}`,
    `${slug}.mail.${zone}`,
    `n8n-${slug}.${zone}`,
    `hermes-${slug}.${zone}`,
    `agent-${slug}.${zone}`,
  ];
}

/** Parse un fichier env `K=V` (secrets Cloudflare — jamais commité). */
export function parseEnvFile(text) {
  const env = {};
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
