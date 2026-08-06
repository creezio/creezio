#!/usr/bin/env node
/**
 * Provisioner Cloudflare Tunnel kit Creezio — serveurs marque + agent flotte.
 *
 * Portage brand-agnostic du provisioner TF2 (oracle gelé), avec en plus :
 *   - ingress `agent.{slug}.{zone}` → agent hôte flotte (VPS restaurant)
 *   - POST /deprovision : nettoyage DNS + tunnel (slugs de test, départ client)
 *   - GET  /state : lecture d'une réservation (enroll agent, admin)
 *
 * Écoute loopback (et optionnellement la gateway bridge Docker pour être
 * joignable depuis les containers serveurs). Auth Bearer obligatoire.
 *
 * Endpoints (Bearer CREEZIO_TUNNEL_PROVISION_TOKEN) :
 *   GET  /health
 *   GET  /check?slug=&kind=
 *   GET  /state?slug=
 *   POST /reserve     { slug, installId?, crmPort?, n8nPort?, hermesPort?,
 *                       kind? } — kind "brand-web" : hostname zone-level de la
 *                       marque (ex. lp.{zone} → landing publique) ; slugs
 *                       autorisés : BRAND_WEB_SLUGS (lib.mjs) ; un seul
 *                       ingress (crmPort), pas d'embeds/wildcard/e-mail.
 *   POST /configure   { slug|tunnelId+hostname, crmPort?, n8nPort?, hermesPort?,
 *                       agentPort?, agentHost? }
 *   POST /deprovision { slug }
 *
 * Hostnames (SoT packages/platform-core/src/tunnel-urls.ts) :
 *   {slug}.{zone}         → CRM Next        (dans le container serveur)
 *   n8n.{slug}.{zone}     → n8n             (dans le container serveur)
 *   hermes.{slug}.{zone}  → Hermes WebUI    (dans le container serveur)
 *   agent.{slug}.{zone}   → agent hôte      (hors container, via bridge)
 * DNS : CNAME slug + wildcard *.{slug} → {tunnelId}.cfargotunnel.com
 * Email : MX + SPF sur {slug}.mail.{zone} (Email Routing → Worker inbound)
 *
 * Env :
 *   CREEZIO_TUNNEL_PROVISION_TOKEN   (obligatoire)
 *   CREEZIO_TUNNEL_PROVISIONER_PORT  (défaut 8666)
 *   CREEZIO_TUNNEL_PROVISIONER_HOSTS (défaut 127.0.0.1 — liste séparée par ,)
 *   CREEZIO_TUNNEL_STATE_DIR         (défaut ./tunnel-provisioner-state)
 *   CREEZIO_TUNNEL_CF_ENV_FILE       (CF_API_TOKEN, CF_ZONE_ID, CF_ZONE_NAME,
 *                                     CREEZIO_EMAIL_INBOUND_SECRET?)
 *   CREEZIO_TUNNEL_NAME_PREFIX       (défaut creezio-server-)
 *   CREEZIO_TUNNEL_DEFAULT_CRM_PORT / _N8N_PORT / _HERMES_PORT
 *   CREEZIO_TUNNEL_AGENT_DEFAULT_HOST (défaut 172.17.0.1) / _PORT (18810)
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {
  buildIngressRules,
  buildPublicUrls,
  normalizePorts,
  normalizeSlug,
  parseEnvFile,
  serviceHostname,
  slugCheckLocal,
} from "./lib.mjs";

const PORT = Number(process.env.CREEZIO_TUNNEL_PROVISIONER_PORT || 8666);
const HOSTS = String(process.env.CREEZIO_TUNNEL_PROVISIONER_HOSTS || "127.0.0.1")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);
const TOKEN = (process.env.CREEZIO_TUNNEL_PROVISION_TOKEN || "").trim();
const STATE_DIR = path.resolve(
  process.env.CREEZIO_TUNNEL_STATE_DIR || "tunnel-provisioner-state",
);
const CF_ENV_FILE = process.env.CREEZIO_TUNNEL_CF_ENV_FILE || "";
const NAME_PREFIX = process.env.CREEZIO_TUNNEL_NAME_PREFIX || "creezio-server-";
const DEFAULT_PORTS = {
  crmPort: Number(process.env.CREEZIO_TUNNEL_DEFAULT_CRM_PORT || 18791),
  n8nPort: Number(process.env.CREEZIO_TUNNEL_DEFAULT_N8N_PORT || 15678),
  hermesPort: Number(process.env.CREEZIO_TUNNEL_DEFAULT_HERMES_PORT || 18797),
};
const AGENT_DEFAULT_HOST =
  process.env.CREEZIO_TUNNEL_AGENT_DEFAULT_HOST || "172.17.0.1";
const AGENT_DEFAULT_PORT = Number(
  process.env.CREEZIO_TUNNEL_AGENT_DEFAULT_PORT || 18810,
);

if (!TOKEN) {
  console.error(
    "[creezio-tunnel-provisioner] CREEZIO_TUNNEL_PROVISION_TOKEN requis",
  );
  process.exit(1);
}

function loadCfEnv() {
  if (!CF_ENV_FILE || !fs.existsSync(CF_ENV_FILE)) {
    throw new Error(`CF env manquant : ${CF_ENV_FILE || "(CREEZIO_TUNNEL_CF_ENV_FILE non posé)"}`);
  }
  const env = parseEnvFile(fs.readFileSync(CF_ENV_FILE, "utf8"));
  if (!env.CF_API_TOKEN || !env.CF_ZONE_ID) {
    throw new Error("CF_API_TOKEN / CF_ZONE_ID manquants");
  }
  if (!env.CF_ZONE_NAME) {
    throw new Error("CF_ZONE_NAME manquant (zone DNS)");
  }
  return env;
}

async function cf(method, urlPath, body, env) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${urlPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.CF_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.success === false) {
    const msg =
      (data.errors && data.errors[0] && data.errors[0].message) ||
      `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    err.cf = data;
    throw err;
  }
  return data.result;
}

let cachedAccountId = null;
async function accountId(env) {
  if (cachedAccountId) return cachedAccountId;
  if (process.env.CF_ACCOUNT_ID) {
    cachedAccountId = process.env.CF_ACCOUNT_ID;
    return cachedAccountId;
  }
  const zone = await cf("GET", `/zones/${env.CF_ZONE_ID}`, null, env);
  cachedAccountId = zone.account.id;
  return cachedAccountId;
}

function statePath(slug) {
  return path.join(STATE_DIR, `${slug}.json`);
}

function readState(slug) {
  try {
    return JSON.parse(fs.readFileSync(statePath(slug), "utf8"));
  } catch {
    return null;
  }
}

function writeState(slug, data) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(statePath(slug), JSON.stringify(data, null, 2), {
    mode: 0o600,
  });
}

async function dnsRecords(env, hostname, type) {
  const q = new URLSearchParams({ name: hostname, per_page: "20" });
  if (type) q.set("type", type);
  const records = await cf(
    "GET",
    `/zones/${env.CF_ZONE_ID}/dns_records?${q}`,
    null,
    env,
  );
  return Array.isArray(records) ? records : [];
}

/** MX Email Routing pour {slug}.mail.{zone} — hors arbre CNAME tunnel. */
async function ensureEmailDns(env, slug) {
  const mailHost = `${slug}.mail.${env.CF_ZONE_NAME}`;
  const mxTargets = [
    { priority: 10, content: "route1.mx.cloudflare.net" },
    { priority: 20, content: "route2.mx.cloudflare.net" },
    { priority: 30, content: "route3.mx.cloudflare.net" },
  ];
  const existingMx = await dnsRecords(env, mailHost, "MX");
  const have = new Set(
    existingMx.map((r) => String(r.content || "").toLowerCase()),
  );
  for (const mx of mxTargets) {
    if (have.has(mx.content)) continue;
    await cf(
      "POST",
      `/zones/${env.CF_ZONE_ID}/dns_records`,
      {
        type: "MX",
        name: mailHost,
        content: mx.content,
        priority: mx.priority,
        ttl: 1,
        comment: `Creezio email ${slug}`,
      },
      env,
    );
  }
  const existingTxt = await dnsRecords(env, mailHost, "TXT");
  const spf = "v=spf1 include:_spf.mx.cloudflare.net ~all";
  const hasSpf = existingTxt.some((r) =>
    String(r.content || "").toLowerCase().includes("v=spf1"),
  );
  if (!hasSpf) {
    await cf(
      "POST",
      `/zones/${env.CF_ZONE_ID}/dns_records`,
      {
        type: "TXT",
        name: mailHost,
        content: spf,
        ttl: 1,
        comment: `Creezio email SPF ${slug}`,
      },
      env,
    );
  }
  return { emailDomain: mailHost };
}

function emailInboundSecret(env) {
  return (
    process.env.CREEZIO_EMAIL_INBOUND_SECRET ||
    env.CREEZIO_EMAIL_INBOUND_SECRET ||
    env.TF2_EMAIL_INBOUND_SECRET ||
    ""
  ).trim();
}

async function checkSlug(slug, env, kind) {
  const local = slugCheckLocal(slug, { kind });
  if (!local.available) return local;
  if (readState(slug)) {
    return { available: false, reason: "Déjà réservé" };
  }
  const hostname = `${slug}.${env.CF_ZONE_NAME}`;
  const existing = await dnsRecords(env, hostname);
  if (existing.length) {
    return { available: false, reason: "DNS déjà pris" };
  }
  return { available: true, hostname };
}

function agentFromBody(body, st) {
  // agentPort explicite = (ré)activer l'ingress agent ; sinon conserver l'état.
  if (body && (body.agentPort || body.agentHost)) {
    return {
      host: String(body.agentHost || AGENT_DEFAULT_HOST),
      port: Number(body.agentPort || AGENT_DEFAULT_PORT),
    };
  }
  return st?.agent || null;
}

async function putIngress(env, tunnelId, hostname, ports, agent, opts) {
  const acc = await accountId(env);
  const p = normalizePorts(ports, DEFAULT_PORTS);
  await cf(
    "PUT",
    `/accounts/${acc}/cfd_tunnel/${tunnelId}/configurations`,
    { config: { ingress: buildIngressRules(hostname, p, agent, opts) } },
    env,
  );
  return p;
}

/** CNAME slug + wildcard *.{slug} (couvre n8n/hermes/agent.{slug}). */
async function ensureTunnelDns(env, slug, hostname, tunnelId, opts) {
  const target = `${tunnelId}.cfargotunnel.com`;
  const records = [
    { name: hostname, qName: hostname },
    // brand-web : pas d'embeds → pas de wildcard *.{slug}.
    ...(opts?.wildcard === false
      ? []
      : [{ name: `*.${slug}`, qName: `*.${slug}.${env.CF_ZONE_NAME}` }]),
  ];
  for (const rec of records) {
    const found = await dnsRecords(env, rec.qName);
    if (found.length) continue;
    await cf(
      "POST",
      `/zones/${env.CF_ZONE_ID}/dns_records`,
      {
        type: "CNAME",
        proxied: true,
        name: rec.name,
        content: target,
        comment: `Creezio server ${slug}`,
      },
      env,
    );
  }
}

async function reserveSlug(slug, installId, portsIn, env, kind) {
  const brandWeb = kind === "brand-web";
  const check = await checkSlug(slug, env, kind);
  if (!check.available) {
    return { ok: false, error: check.reason || "Indisponible" };
  }
  const hostname = check.hostname;
  const ports = normalizePorts(portsIn || {}, DEFAULT_PORTS);
  const acc = await accountId(env);
  const tunnelName = `${NAME_PREFIX}${slug}`.slice(0, 100);
  const tunnel = await cf(
    "POST",
    `/accounts/${acc}/cfd_tunnel`,
    { name: tunnelName, config_src: "cloudflare" },
    env,
  );
  const tunnelId = tunnel.id;
  const tunnelToken = tunnel.token;
  if (!tunnelId || !tunnelToken) {
    return { ok: false, error: "Réponse tunnel incomplète (id/token)" };
  }
  await putIngress(env, tunnelId, hostname, ports, null, {
    embeds: !brandWeb,
  });
  await ensureTunnelDns(env, slug, hostname, tunnelId, {
    wildcard: !brandWeb,
  });
  let emailDomain = brandWeb ? null : `${slug}.mail.${env.CF_ZONE_NAME}`;
  if (!brandWeb) {
    try {
      const email = await ensureEmailDns(env, slug);
      emailDomain = email.emailDomain;
    } catch (e) {
      console.warn("[creezio-tunnel-provisioner] ensureEmailDns:", e);
    }
  }
  const publicUrls = buildPublicUrls(hostname, { embeds: !brandWeb });
  const inboundSecret = brandWeb ? "" : emailInboundSecret(env);
  const state = {
    slug,
    kind: brandWeb ? "brand-web" : "server",
    hostname,
    tunnelId,
    tunnelName,
    installId: installId || null,
    localPort: ports.crmPort,
    ports,
    agent: null,
    publicUrls,
    emailDomain,
    reservedAt: new Date().toISOString(),
  };
  writeState(slug, state);
  return {
    ok: true,
    slug,
    kind: state.kind,
    hostname,
    publicUrl: publicUrls.crm,
    publicUrls,
    tunnelId,
    tunnelToken,
    localPort: ports.crmPort,
    ports,
    emailDomain,
    ...(inboundSecret ? { emailInboundSecret: inboundSecret } : {}),
  };
}

/** Nettoyage complet d'un slug : DNS (slug, *.slug, mail) + tunnel CF + state. */
async function deprovisionSlug(slug, env) {
  const st = readState(slug);
  const hostname = st?.hostname || `${slug}.${env.CF_ZONE_NAME}`;
  const removed = { dns: [], tunnel: null };
  const hostsToClean = [
    hostname,
    `*.${slug}.${env.CF_ZONE_NAME}`,
    `${slug}.mail.${env.CF_ZONE_NAME}`,
  ];
  for (const h of hostsToClean) {
    try {
      const records = await dnsRecords(env, h);
      for (const rec of records) {
        await cf(
          "DELETE",
          `/zones/${env.CF_ZONE_ID}/dns_records/${rec.id}`,
          null,
          env,
        );
        removed.dns.push(`${rec.type} ${rec.name}`);
      }
    } catch (e) {
      console.warn(`[creezio-tunnel-provisioner] DNS cleanup ${h}:`, e.message);
    }
  }
  if (st?.tunnelId) {
    try {
      const acc = await accountId(env);
      // Les connexions actives bloquent le DELETE — on les coupe d'abord.
      await cf(
        "DELETE",
        `/accounts/${acc}/cfd_tunnel/${st.tunnelId}/connections`,
        null,
        env,
      ).catch(() => {});
      await cf(
        "DELETE",
        `/accounts/${acc}/cfd_tunnel/${st.tunnelId}`,
        null,
        env,
      );
      removed.tunnel = st.tunnelId;
    } catch (e) {
      console.warn(
        `[creezio-tunnel-provisioner] tunnel delete ${st.tunnelId}:`,
        e.message,
      );
    }
  }
  try {
    fs.rmSync(statePath(slug), { force: true });
  } catch {
    /* state absent */
  }
  return { ok: true, slug, removed };
}

function authOk(req) {
  const h = req.headers.authorization || "";
  const bearer = h.startsWith("Bearer ") ? h.slice(7).trim() : "";
  const q =
    new URL(req.url, "http://127.0.0.1").searchParams.get("token") || "";
  const got = bearer || q;
  if (!got || got.length !== TOKEN.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(got), Buffer.from(TOKEN));
  } catch {
    return false;
  }
}

function send(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

async function readJson(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function handle(req, res) {
  const url = new URL(req.url || "/", `http://127.0.0.1:${PORT}`);
  if (url.pathname === "/health") {
    return send(res, 200, { ok: true, service: "creezio-tunnel-provisioner" });
  }
  if (!authOk(req)) {
    return send(res, 401, { ok: false, error: "Non autorisé" });
  }
  const env = loadCfEnv();

  if (req.method === "GET" && url.pathname === "/check") {
    const slug = normalizeSlug(url.searchParams.get("slug"));
    const kind = url.searchParams.get("kind") || undefined;
    const r = await checkSlug(slug, env, kind);
    return send(res, 200, { ok: true, slug, ...r });
  }

  if (req.method === "GET" && url.pathname === "/state") {
    const slug = normalizeSlug(url.searchParams.get("slug"));
    const st = readState(slug);
    if (!st) return send(res, 404, { ok: false, error: "slug inconnu" });
    // Jamais de tunnelToken dans /state — il n'est restitué qu'au /reserve.
    return send(res, 200, { ok: true, state: st });
  }

  if (req.method === "POST" && url.pathname === "/reserve") {
    const body = await readJson(req);
    const slug = normalizeSlug(body.slug);
    const r = await reserveSlug(
      slug,
      body.installId || null,
      body,
      env,
      body.kind || undefined,
    );
    return send(res, r.ok ? 200 : 409, r);
  }

  if (req.method === "POST" && url.pathname === "/configure") {
    const body = await readJson(req);
    const slug = normalizeSlug(body.slug);
    const st = slug ? readState(slug) : null;
    const tunnelId = body.tunnelId || st?.tunnelId;
    const hostname = body.hostname || st?.hostname;
    if (!tunnelId || !hostname) {
      return send(res, 400, { ok: false, error: "tunnelId/hostname requis" });
    }
    // Conserver les ports connus si le body n'en fournit pas (enroll agent).
    const portsIn = {
      crmPort: body.crmPort ?? body.localPort ?? st?.ports?.crmPort,
      n8nPort: body.n8nPort ?? st?.ports?.n8nPort,
      hermesPort: body.hermesPort ?? st?.ports?.hermesPort,
    };
    const brandWeb = (body.kind || st?.kind) === "brand-web";
    const agent = brandWeb ? null : agentFromBody(body, st);
    const ports = await putIngress(env, tunnelId, hostname, portsIn, agent, {
      embeds: !brandWeb,
    });
    if (slug) {
      try {
        await ensureTunnelDns(env, slug, hostname, tunnelId, {
          wildcard: !brandWeb,
        });
      } catch (e) {
        console.warn("[creezio-tunnel-provisioner] ensureTunnelDns:", e);
      }
    }
    let emailDomain = slug && !brandWeb ? `${slug}.mail.${env.CF_ZONE_NAME}` : null;
    if (slug && !brandWeb) {
      try {
        const email = await ensureEmailDns(env, slug);
        emailDomain = email.emailDomain;
      } catch (e) {
        console.warn("[creezio-tunnel-provisioner] ensureEmailDns:", e);
      }
    }
    const publicUrls = buildPublicUrls(hostname, { embeds: !brandWeb });
    const inboundSecret = emailInboundSecret(env);
    if (st && slug) {
      st.localPort = ports.crmPort;
      st.ports = ports;
      st.agent = agent;
      st.publicUrls = publicUrls;
      if (emailDomain) st.emailDomain = emailDomain;
      writeState(slug, st);
    }
    return send(res, 200, {
      ok: true,
      hostname,
      localPort: ports.crmPort,
      ports,
      agent,
      publicUrls,
      ...(agent
        ? { agentUrl: `https://${serviceHostname(hostname, "agent")}` }
        : {}),
      emailDomain,
      ...(inboundSecret ? { emailInboundSecret: inboundSecret } : {}),
    });
  }

  if (req.method === "POST" && url.pathname === "/deprovision") {
    const body = await readJson(req);
    const slug = normalizeSlug(body.slug);
    if (!slug) return send(res, 400, { ok: false, error: "slug requis" });
    const r = await deprovisionSlug(slug, env);
    return send(res, 200, r);
  }

  return send(res, 404, { ok: false, error: "Not found" });
}

fs.mkdirSync(STATE_DIR, { recursive: true });
for (const host of HOSTS) {
  const server = http.createServer((req, res) => {
    handle(req, res).catch((e) => {
      console.error("[creezio-tunnel-provisioner]", e);
      if (!res.writableEnded) {
        send(res, 500, {
          ok: false,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    });
  });
  server.listen(PORT, host, () => {
    console.log(
      `[creezio-tunnel-provisioner] http://${host}:${PORT} state=${STATE_DIR}`,
    );
  });
}
