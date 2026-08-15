/**
 * Politique tunnel de `server-docker create` — fail-closed VPS / `--profile prod`.
 *
 * Un create « prod / VPS » ne réussit pas sans hostname public Cloudflare.
 * `CREEZIO_TUNNEL_LOCAL=1` reste l'opt-in explicite pour un loopback de dev.
 *
 * Slugs : SoT `RESERVED_SLUGS` = `docker/tunnel-provisioner/lib.mjs`.
 * Un slug d'instance réservé (ex. `demo`) n'est jamais envoyé au provisioner
 * tel quel — on dérive `<brandId>-<slug>` et on l'écrit dans l'env instance.
 */

import { pathToFileURL } from "node:url";
import path from "node:path";

/** Env tunnel toujours forwardés au create (pas seulement `--profile prod`). */
export const CREATE_TUNNEL_ENV_KEYS = [
  "CREEZIO_TUNNEL_PROVISION_URL",
  "CREEZIO_TUNNEL_PROVISION_TOKEN",
  "CREEZIO_TUNNEL_SLUG",
  "CREEZIO_TUNNEL_FLAT_HOSTS",
  "CREEZIO_TUNNEL_LOCAL",
] as const;

/**
 * Copie de secours alignée sur `docker/tunnel-provisioner/lib.mjs`.
 * La gate `test-phase-server-docker-tunnel` refuse tout drift.
 */
export const RESERVED_SLUGS_FALLBACK: readonly string[] = [
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
];

export function isExplicitTunnelLocal(
  value: string | undefined | null,
): boolean {
  const v = String(value || "")
    .trim()
    .toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

export type CreateTunnelPolicyInput = {
  instanceName: string;
  brandId: string;
  profile?: string;
  /** Env fusionné (process + .env marque + `--env`) — jamais de secrets en log. */
  env: Record<string, string | undefined>;
  reservedSlugs: ReadonlySet<string>;
  /** `--no-stack` : pas de sidecar cloudflared, donc pas de hostname public. */
  noStack?: boolean;
};

export type CreateTunnelSlugResult = {
  slug: string;
  derived: boolean;
  from: string;
};

export type CreateTunnelPolicy =
  | {
      mode: "local";
      local: true;
      slug?: undefined;
      derived?: false;
    }
  | {
      mode: "public";
      local: false;
      slug: string;
      derived: boolean;
      from: string;
      provisionUrl: string;
      provisionToken: string;
    };

export function deriveCreateTunnelSlug(opts: {
  instanceName: string;
  brandId: string;
  explicitSlug?: string;
  reservedSlugs: ReadonlySet<string>;
}): CreateTunnelSlugResult {
  const instanceName = String(opts.instanceName || "")
    .trim()
    .toLowerCase();
  const brandId = String(opts.brandId || "")
    .trim()
    .toLowerCase();
  const explicit = String(opts.explicitSlug || "")
    .trim()
    .toLowerCase();
  const candidate = explicit || instanceName;
  if (!candidate) {
    throw new Error("nom d'instance requis pour dériver CREEZIO_TUNNEL_SLUG");
  }
  if (!opts.reservedSlugs.has(candidate)) {
    return { slug: candidate, derived: false, from: candidate };
  }
  if (!brandId) {
    throw new Error(
      `slug tunnel « ${candidate} » est réservé (RESERVED_SLUGS) — ` +
        `poser CREEZIO_TUNNEL_SLUG=<marque>-${candidate} (ex. foove2-demo)`,
    );
  }
  const derived = `${brandId}-${instanceName || candidate}`;
  if (opts.reservedSlugs.has(derived)) {
    throw new Error(
      `slug tunnel dérivé « ${derived} » est encore réservé — ` +
        `poser CREEZIO_TUNNEL_SLUG explicitement (ex. ${brandId}-client-01)`,
    );
  }
  return { slug: derived, derived: true, from: candidate };
}

export function formatMissingProvisionerError(): string {
  return [
    "create VPS/prod refuse un stack loopback-only : CREEZIO_TUNNEL_PROVISION_URL et CREEZIO_TUNNEL_PROVISION_TOKEN sont requis (hostname public {slug}.crm.foove.io).",
    "",
    "Poser les vars dans le .env de la marque (gitignoré), ou les exporter avant create.",
    "Exemple déjà en prod : foove2-admin, ou /opt/docker/creezio-fleet/tunnel-provisioner.env",
    "(unité creezio-tunnel-provisioner-crm.service).",
    "",
    "Dev local (loopback assumé) : CREEZIO_TUNNEL_LOCAL=1",
  ].join("\n");
}

export function formatNoStackPublicError(): string {
  return [
    "create VPS/prod exige le stack compose (sidecar cloudflared) pour le hostname public.",
    "Retirer --no-stack, ou CREEZIO_TUNNEL_LOCAL=1 pour un loopback de dev.",
  ].join("\n");
}

/**
 * Décide local vs public. Défaut = public (fail-closed).
 * `--profile prod` impose le public même si LOCAL=1 est posé.
 */
export function resolveCreateTunnelPolicy(
  input: CreateTunnelPolicyInput,
): CreateTunnelPolicy {
  const wantLocal = isExplicitTunnelLocal(input.env.CREEZIO_TUNNEL_LOCAL);
  const prod = input.profile === "prod";
  if (wantLocal && !prod) {
    return { mode: "local", local: true };
  }
  const provisionUrl = String(input.env.CREEZIO_TUNNEL_PROVISION_URL || "")
    .trim()
    .replace(/\/+$/, "");
  const provisionToken = String(
    input.env.CREEZIO_TUNNEL_PROVISION_TOKEN || "",
  ).trim();
  if (!provisionUrl || !provisionToken) {
    throw new Error(formatMissingProvisionerError());
  }
  if (input.noStack) {
    throw new Error(formatNoStackPublicError());
  }
  const mapped = deriveCreateTunnelSlug({
    instanceName: input.instanceName,
    brandId: input.brandId,
    explicitSlug: input.env.CREEZIO_TUNNEL_SLUG,
    reservedSlugs: input.reservedSlugs,
  });
  return {
    mode: "public",
    local: false,
    slug: mapped.slug,
    derived: mapped.derived,
    from: mapped.from,
    provisionUrl,
    provisionToken,
  };
}

export function formatDerivedSlugLog(mapped: CreateTunnelSlugResult): string {
  return (
    `slug « ${mapped.from} » réservé (RESERVED_SLUGS) — ` +
    `CREEZIO_TUNNEL_SLUG dérivé → ${mapped.slug} (écrit dans l'env de l'instance)`
  );
}

export async function loadReservedSlugs(
  kitRoot: string,
): Promise<Set<string>> {
  const file = path.join(kitRoot, "docker/tunnel-provisioner/lib.mjs");
  try {
    const mod = (await import(pathToFileURL(file).href)) as {
      RESERVED_SLUGS?: Set<string>;
    };
    if (mod.RESERVED_SLUGS instanceof Set && mod.RESERVED_SLUGS.size > 0) {
      return mod.RESERVED_SLUGS;
    }
  } catch {
    /* kit absent du package npm publié — fallback */
  }
  return new Set(RESERVED_SLUGS_FALLBACK);
}

export function pickEnvValues(
  sources: Array<Record<string, string | undefined>>,
  keys: readonly string[],
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of keys) {
    for (const src of sources) {
      const v = String(src[key] || "").trim();
      if (v) {
        out[key] = v;
        break;
      }
    }
  }
  return out;
}
