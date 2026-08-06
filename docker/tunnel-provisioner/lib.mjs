/**
 * Provisioner Cloudflare Tunnel kit — helpers purs (testables sans réseau).
 *
 * SoT format hostnames : packages/platform-core/src/tunnel-urls.ts
 *   CRM    : {slug}.{zone}
 *   embeds : n8n.{slug}.{zone} / hermes.{slug}.{zone}
 *   agent  : agent.{slug}.{zone}  → agent hôte flotte (VPS restaurant)
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

// 2–48 caractères : commence et finit par alphanum, tirets au milieu.
export const SLUG_RE = /^[a-z0-9]([a-z0-9-]{0,46}[a-z0-9])$/;

export function normalizeSlug(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
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
  return { available: true };
}

/** Kinds « zone-level » : un seul ingress HTTP, pas d'embeds/wildcard/e-mail. */
export function isZoneLevelKind(kind) {
  return kind === "brand-web" || kind === "registry";
}

/** `n8n.{slug}.{zone}` etc. — préfixe simple sur le hostname CRM. */
export function serviceHostname(hostname, service) {
  return `${service}.${hostname}`;
}

export function buildPublicUrls(hostname, opts) {
  if (opts?.embeds === false) {
    // Réservation brand-web : un seul hostname public, pas d'embeds.
    return { crm: `https://${hostname}` };
  }
  return {
    crm: `https://${hostname}`,
    n8n: `https://${serviceHostname(hostname, "n8n")}`,
    hermes: `https://${serviceHostname(hostname, "hermes")}`,
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
 * crm/n8n/hermes pointent 127.0.0.1 (cloudflared tourne DANS le container
 * serveur). L'entrée `agent` pointe l'agent hôte flotte — hors container —
 * joignable depuis le container via la gateway bridge Docker (172.17.0.1).
 */
export function buildIngressRules(hostname, ports, agent, opts) {
  const svcRule = (svcHostname, service) => ({
    hostname: svcHostname,
    service,
    originRequest: { noTLSVerify: false, httpHostHeader: svcHostname },
  });
  if (opts?.embeds === false) {
    // Réservation brand-web (ex. lp.{zone}) : un seul service HTTP local.
    return [
      svcRule(hostname, `http://127.0.0.1:${ports.crmPort}`),
      { service: "http_status:404" },
    ];
  }
  const rules = [
    svcRule(hostname, `http://127.0.0.1:${ports.crmPort}`),
    svcRule(
      serviceHostname(hostname, "n8n"),
      `http://127.0.0.1:${ports.n8nPort}`,
    ),
    svcRule(
      serviceHostname(hostname, "hermes"),
      `http://127.0.0.1:${ports.hermesPort}`,
    ),
  ];
  if (agent && agent.port) {
    rules.push(
      svcRule(
        serviceHostname(hostname, "agent"),
        `http://${agent.host || "172.17.0.1"}:${agent.port}`,
      ),
    );
  }
  rules.push({ service: "http_status:404" });
  return rules;
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
