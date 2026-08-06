/**
 * @creezio/admin — modules natifs des apps admin de marque (mode admin).
 *
 * ADR : docs/adr/ADR-admin-app-os.md. L'app admin est une app Creezio
 * complète (même OS) ; ce package fournit les modules communs à toutes les
 * admins de marques :
 *
 *   - fleet       : pilotage flotte (proxy vers le backend flotte
 *                   `server-admin.mjs` — hôtes, serveurs, updates, logs…)
 *   - prospects   : CRM prospection kanban générique (la marque nomme)
 *   - roadmap     : roadmap produit de la marque
 *   - support     : tickets clients agrégés depuis les serveurs marque
 *   - billing     : abonnements/factures clients, rapprochement
 *                   client ↔ serveur ↔ abonnement (Stripe via config marque)
 *
 * Zéro domaine marque ici (ADR-no-brand-domain-in-native-packages) :
 * le naming (« restaurants »…) vient de la config de l'app admin.
 */

import crypto from "node:crypto";
import type { ApiKernel, ApiMount, ApiRequest } from "@creezio/api-kernel";
import type { SqliteMigration } from "@creezio/platform-core";

/* ------------------------------------------------------------ migrations */

export const ADMIN_SCHEMA_SQL = `-- Schéma modules admin natifs (@creezio/admin)

CREATE TABLE IF NOT EXISTS admin_prospects (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  archived_at TEXT,
  nom TEXT NOT NULL,
  contact TEXT,
  email TEXT,
  telephone TEXT,
  ville TEXT,
  site_web TEXT,
  notes TEXT,
  colonne TEXT NOT NULL DEFAULT 'a_contacter',
  position REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS admin_roadmap_items (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  titre TEXT NOT NULL,
  description TEXT,
  statut TEXT NOT NULL DEFAULT 'idee',
  jalon TEXT,
  position REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS admin_support_tickets (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  -- provenance flotte
  host_id TEXT,
  server_name TEXT,
  remote_id TEXT,
  -- contenu
  sujet TEXT NOT NULL,
  corps TEXT,
  auteur TEXT,
  statut TEXT NOT NULL DEFAULT 'ouvert',
  derniere_reponse TEXT
);

CREATE TABLE IF NOT EXISTS admin_billing_customers (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  nom TEXT NOT NULL,
  email TEXT,
  -- rapprochement flotte : quel serveur appartient à ce client
  host_id TEXT,
  server_name TEXT,
  stripe_customer_id TEXT
);

CREATE TABLE IF NOT EXISTS admin_billing_subscriptions (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  plan TEXT,
  montant_mensuel REAL,
  devise TEXT DEFAULT 'EUR',
  statut TEXT NOT NULL DEFAULT 'active',
  stripe_subscription_id TEXT
);

CREATE TABLE IF NOT EXISTS admin_billing_invoices (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  subscription_id TEXT,
  periode TEXT,
  montant REAL,
  devise TEXT DEFAULT 'EUR',
  statut TEXT NOT NULL DEFAULT 'draft',
  stripe_invoice_id TEXT
);
`;

export const ADMIN_SCHEMA_002_SQL = `-- Fils support + journal événements Stripe

CREATE TABLE IF NOT EXISTS admin_support_messages (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL,
  remote_id TEXT,
  created_at TEXT NOT NULL,
  origine TEXT NOT NULL DEFAULT 'client',
  auteur TEXT,
  corps TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_support_messages_ticket
  ON admin_support_messages (ticket_id, created_at);

CREATE TABLE IF NOT EXISTS admin_billing_events (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  stripe_event_id TEXT UNIQUE,
  type TEXT NOT NULL,
  payload TEXT
);
`;

export function adminMigrations(): SqliteMigration[] {
  return [
    { id: "admin_001_native_modules", sql: ADMIN_SCHEMA_SQL },
    { id: "admin_002_support_messages_billing_events", sql: ADMIN_SCHEMA_002_SQL },
  ];
}

/* --------------------------------------------------------- module fleet */

export type FleetAdminMountOptions = {
  /** URL du backend flotte (server-admin.mjs). Défaut env CREEZIO_FLEET_BACKEND_URL puis http://127.0.0.1:18800 */
  backendUrl?: string;
  /** Credentials Basic `user:pass`. Défaut env CREEZIO_FLEET_BACKEND_BASIC. */
  basic?: string;
  /** Timeout par requête proxy (ms). */
  timeoutMs?: number;
};

function fleetBackendUrl(opts?: FleetAdminMountOptions): string {
  return (
    opts?.backendUrl ||
    (process.env.CREEZIO_FLEET_BACKEND_URL || "").trim() ||
    "http://127.0.0.1:18800"
  ).replace(/\/$/, "");
}

function fleetBasic(opts?: FleetAdminMountOptions): string {
  return (
    opts?.basic || (process.env.CREEZIO_FLEET_BACKEND_BASIC || "").trim()
  );
}

/**
 * Module `fleet` — proxy authentifié vers le backend flotte.
 *
 * `/api/v1/modules/fleet/<sub>` → `{backend}/admin/api/<sub>` (Basic).
 * La session OS protège déjà le mount ; le Basic reste interne au serveur
 * admin (jamais exposé au client).
 */
export function createFleetAdminMount(opts?: FleetAdminMountOptions): ApiMount {
  const timeoutMs = opts?.timeoutMs ?? 30_000;
  return {
    dbLayer: "brand",
    handle: async ({ req, subPath }) => {
      const base = fleetBackendUrl(opts);
      const basic = fleetBasic(opts);
      if (!basic) {
        return {
          status: 503,
          body: {
            ok: false,
            error:
              "backend flotte non configuré (CREEZIO_FLEET_BACKEND_BASIC requis)",
          },
        };
      }
      const qs = buildQueryString(req);
      const url = `${base}/admin/api/${subPath}${qs}`;
      const method = req.method.toUpperCase();
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        const res = await fetch(url, {
          method,
          signal: ctrl.signal,
          headers: {
            Authorization: `Basic ${Buffer.from(basic).toString("base64")}`,
            ...(req.body !== undefined && method !== "GET"
              ? { "Content-Type": "application/json" }
              : {}),
          },
          ...(req.body !== undefined && method !== "GET"
            ? { body: JSON.stringify(req.body) }
            : {}),
        });
        let body: unknown = null;
        try {
          body = await res.json();
        } catch {
          body = { ok: false, error: "réponse backend non JSON" };
        }
        return { status: res.status, body };
      } catch (e) {
        return {
          status: 502,
          body: {
            ok: false,
            error: `backend flotte injoignable: ${(e as Error)?.message || e}`,
          },
        };
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

function buildQueryString(req: ApiRequest): string {
  const entries = Object.entries(req.query || {});
  if (!entries.length) return "";
  const qs = new URLSearchParams();
  for (const [k, v] of entries) {
    if (Array.isArray(v)) {
      for (const x of v) qs.append(k, String(x));
    } else if (v != null) {
      qs.set(k, String(v));
    }
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

/* --------------------------------------------- CRUD générique (SQLite) */

const CRUD_TABLES: Record<string, readonly string[]> = {
  prospects: [
    "nom",
    "contact",
    "email",
    "telephone",
    "ville",
    "site_web",
    "notes",
    "colonne",
    "position",
  ],
  roadmap: ["titre", "description", "statut", "jalon", "position"],
  "billing-customers": [
    "nom",
    "email",
    "host_id",
    "server_name",
    "stripe_customer_id",
  ],
  "billing-subscriptions": [
    "customer_id",
    "plan",
    "montant_mensuel",
    "devise",
    "statut",
    "stripe_subscription_id",
  ],
};

const CRUD_SQL_TABLE: Record<string, string> = {
  prospects: "admin_prospects",
  roadmap: "admin_roadmap_items",
  "billing-customers": "admin_billing_customers",
  "billing-subscriptions": "admin_billing_subscriptions",
};

function nowIso(): string {
  return new Date().toISOString();
}

function newId(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
  );
}

/**
 * Mount CRUD générique sur brand.db de l'app admin.
 * GET '' → liste ; POST '' → create ; GET/PUT/DELETE '<id>'.
 */
export function createAdminCrudMount(kind: keyof typeof CRUD_SQL_TABLE): ApiMount {
  const table = CRUD_SQL_TABLE[kind];
  const cols = CRUD_TABLES[kind] || [];
  return {
    dbLayer: "brand",
    handle: async ({ req, subPath, db }) => {
      if (!db) return { status: 503, body: { ok: false, error: "db_unavailable" } };
      const method = req.method.toUpperCase();
      const parts = subPath.split("/").filter(Boolean);

      if (!parts.length && method === "GET") {
        const items = db
          .prepare(
            `SELECT * FROM ${table} ORDER BY position ASC, created_at DESC`,
          )
          .all();
        return { status: 200, body: { ok: true, items } };
      }

      if (!parts.length && method === "POST") {
        const body = (req.body || {}) as Record<string, unknown>;
        const id = String(body.id || newId());
        const ts = nowIso();
        const values: Record<string, unknown> = {
          id,
          created_at: ts,
          updated_at: ts,
        };
        for (const c of cols) {
          if (body[c] !== undefined) values[c] = body[c];
        }
        const keys = Object.keys(values);
        db.prepare(
          `INSERT INTO ${table} (${keys.join(",")}) VALUES (${keys
            .map(() => "?")
            .join(",")})`,
        ).run(...keys.map((k) => values[k]));
        const item = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
        return { status: 201, body: { ok: true, item } };
      }

      if (parts.length === 1) {
        const id = parts[0]!;
        if (method === "GET") {
          const item = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
          if (!item) return { status: 404, body: { ok: false } };
          return { status: 200, body: { ok: true, item } };
        }
        if (method === "PUT" || method === "PATCH") {
          const body = (req.body || {}) as Record<string, unknown>;
          const sets: string[] = ["updated_at = ?"];
          const args: unknown[] = [nowIso()];
          for (const c of cols) {
            if (body[c] !== undefined) {
              sets.push(`${c} = ?`);
              args.push(body[c]);
            }
          }
          args.push(id);
          const r = db
            .prepare(`UPDATE ${table} SET ${sets.join(", ")} WHERE id = ?`)
            .run(...args) as { changes: number };
          if (!r.changes) return { status: 404, body: { ok: false } };
          const item = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
          return { status: 200, body: { ok: true, item } };
        }
        if (method === "DELETE") {
          const r = db
            .prepare(`DELETE FROM ${table} WHERE id = ?`)
            .run(id) as { changes: number };
          return { status: r.changes ? 200 : 404, body: { ok: Boolean(r.changes) } };
        }
      }

      return { status: 404, body: { ok: false } };
    },
  };
}

/* -------------------------------------------------------- module support */

/** Appel authentifié (Basic) vers le backend flotte. */
async function fleetFetch(
  opts: FleetAdminMountOptions | undefined,
  method: string,
  subPath: string,
  body?: unknown,
  timeoutMs = 8000,
): Promise<{ status: number; json: Record<string, unknown> | null }> {
  const base = fleetBackendUrl(opts);
  const basic = fleetBasic(opts);
  if (!basic) return { status: 503, json: { ok: false, error: "fleet_basic_missing" } };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${base}${subPath}`, {
      method,
      signal: ctrl.signal,
      headers: {
        Authorization: `Basic ${Buffer.from(basic).toString("base64")}`,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    let json: Record<string, unknown> | null = null;
    try {
      json = (await res.json()) as Record<string, unknown>;
    } catch {
      /* non JSON */
    }
    return { status: res.status, json };
  } finally {
    clearTimeout(timer);
  }
}

/** Chemin backend flotte du mount support d'un serveur (local ou hôte). */
function supportPathFor(
  s: { hostId?: string; brandId: string; name: string },
  rest: string,
): string {
  const seg = `servers/${encodeURIComponent(s.brandId)}/${encodeURIComponent(s.name)}/support${rest}`;
  return s.hostId && s.hostId !== "local"
    ? `/admin/api/hosts/${encodeURIComponent(s.hostId)}/${seg}`
    : `/admin/api/${seg}`;
}

export type SupportAdminMountOptions = {
  fleet?: FleetAdminMountOptions;
};

/**
 * Module `support` (côté admin) — tickets agrégés depuis les serveurs
 * marque (brique serveur : `@creezio/support`, mount `platform-support`).
 *
 * - GET  ``            → tickets agrégés
 * - GET  `<id>`        → ticket + fil de messages
 * - POST `sync`        → pull TOUTE la flotte (backend flotte → agents →
 *                        instances) et upsert tickets + messages
 * - POST `<id>/reply`  → réponse admin : relayée au serveur marque
 *                        (visible par le client) + copie locale
 * - POST `<id>/statut` → statut local + propagation au serveur marque
 * - POST `ingest`      → upsert direct (tests / imports)
 */
export function createSupportAdminMount(
  opts?: SupportAdminMountOptions,
): ApiMount {
  return {
    dbLayer: "brand",
    handle: async ({ req, subPath, db }) => {
      if (!db) return { status: 503, body: { ok: false, error: "db_unavailable" } };
      const method = req.method.toUpperCase();
      const parts = subPath.split("/").filter(Boolean);

      if (!parts.length && method === "GET") {
        const items = db
          .prepare(
            `SELECT t.*,
               (SELECT COUNT(*) FROM admin_support_messages m WHERE m.ticket_id = t.id) AS messages_count
             FROM admin_support_tickets t ORDER BY t.updated_at DESC`,
          )
          .all();
        return { status: 200, body: { ok: true, items } };
      }

      // Pull de toute la flotte : backend flotte → (agents) → instances.
      if (parts.length === 1 && parts[0] === "sync" && method === "POST") {
        const list = await fleetFetch(opts?.fleet, "GET", "/admin/api/servers");
        if (list.status !== 200 || !list.json?.ok) {
          return {
            status: 502,
            body: { ok: false, error: "backend flotte injoignable", detail: list.json },
          };
        }
        const servers = (list.json.servers || []) as Array<{
          hostId?: string;
          brandId: string;
          name: string;
          orphan?: boolean;
        }>;
        let scanned = 0;
        let tickets = 0;
        let messages = 0;
        const errors: string[] = [];
        for (const s of servers) {
          if (s.orphan || !s.brandId || !s.name) continue;
          scanned++;
          let exp: Awaited<ReturnType<typeof fleetFetch>>;
          try {
            exp = await fleetFetch(
              opts?.fleet,
              "GET",
              supportPathFor(s, "/export"),
            );
          } catch (e) {
            errors.push(`${s.name}: ${(e as Error)?.message || e}`);
            continue;
          }
          if (exp.status !== 200 || !exp.json?.ok) continue;
          const remoteTickets = (exp.json.tickets || []) as Array<
            Record<string, unknown> & { messages?: Array<Record<string, unknown>> }
          >;
          for (const t of remoteTickets) {
            const remoteId = String(t.id || "");
            if (!remoteId) continue;
            const hostId = String(s.hostId || "local");
            const existing = db
              .prepare(
                `SELECT id FROM admin_support_tickets
                 WHERE host_id = ? AND server_name = ? AND remote_id = ?`,
              )
              .get(hostId, s.name, remoteId) as { id: string } | undefined;
            const ts = nowIso();
            const msgs = Array.isArray(t.messages) ? t.messages : [];
            const firstClient = msgs.find((m) => m.origine !== "admin");
            const lastAdmin = [...msgs]
              .reverse()
              .find((m) => m.origine === "admin");
            let localId: string;
            if (existing) {
              localId = existing.id;
              db.prepare(
                `UPDATE admin_support_tickets
                 SET sujet = ?, corps = ?, auteur = ?, statut = ?,
                     derniere_reponse = ?, updated_at = ?
                 WHERE id = ?`,
              ).run(
                String(t.sujet || "(sans sujet)"),
                String(firstClient?.corps || t.corps || ""),
                String(t.auteur || ""),
                String(t.statut || "ouvert"),
                lastAdmin ? String(lastAdmin.created_at || "") : null,
                ts,
                localId,
              );
            } else {
              localId = newId();
              db.prepare(
                `INSERT INTO admin_support_tickets
                 (id, created_at, updated_at, host_id, server_name, remote_id,
                  sujet, corps, auteur, statut, derniere_reponse)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
              ).run(
                localId,
                String(t.created_at || ts),
                ts,
                hostId,
                s.name,
                remoteId,
                String(t.sujet || "(sans sujet)"),
                String(firstClient?.corps || t.corps || ""),
                String(t.auteur || ""),
                String(t.statut || "ouvert"),
                lastAdmin ? String(lastAdmin.created_at || "") : null,
              );
            }
            tickets++;
            for (const m of msgs) {
              const mRemoteId = String(m.id || "");
              if (!mRemoteId) continue;
              const mExists = db
                .prepare(
                  `SELECT id FROM admin_support_messages
                   WHERE ticket_id = ? AND remote_id = ?`,
                )
                .get(localId, mRemoteId) as { id: string } | undefined;
              if (mExists) continue;
              db.prepare(
                `INSERT INTO admin_support_messages
                 (id, ticket_id, remote_id, created_at, origine, auteur, corps)
                 VALUES (?,?,?,?,?,?,?)`,
              ).run(
                newId(),
                localId,
                mRemoteId,
                String(m.created_at || nowIso()),
                String(m.origine || "client"),
                m.auteur == null ? null : String(m.auteur),
                String(m.corps || ""),
              );
              messages++;
            }
          }
        }
        return {
          status: 200,
          body: { ok: true, scanned, tickets, messages, errors },
        };
      }

      // Ingestion (sync flotte) : upsert par (host_id, server_name, remote_id).
      if (parts.length === 1 && parts[0] === "ingest" && method === "POST") {
        const body = (req.body || {}) as { tickets?: Array<Record<string, unknown>> };
        const tickets = Array.isArray(body.tickets) ? body.tickets : [];
        let upserted = 0;
        for (const t of tickets) {
          const hostId = String(t.host_id || "");
          const serverName = String(t.server_name || "");
          const remoteId = String(t.remote_id || t.id || "");
          if (!remoteId) continue;
          const existing = db
            .prepare(
              `SELECT id FROM admin_support_tickets
               WHERE host_id = ? AND server_name = ? AND remote_id = ?`,
            )
            .get(hostId, serverName, remoteId) as { id: string } | undefined;
          const ts = nowIso();
          if (existing) {
            db.prepare(
              `UPDATE admin_support_tickets
               SET sujet = ?, corps = ?, auteur = ?, statut = ?, updated_at = ?
               WHERE id = ?`,
            ).run(
              String(t.sujet || t.subject || "(sans sujet)"),
              String(t.corps || t.body || ""),
              String(t.auteur || t.author || ""),
              String(t.statut || t.status || "ouvert"),
              ts,
              existing.id,
            );
          } else {
            db.prepare(
              `INSERT INTO admin_support_tickets
               (id, created_at, updated_at, host_id, server_name, remote_id,
                sujet, corps, auteur, statut)
               VALUES (?,?,?,?,?,?,?,?,?,?)`,
            ).run(
              newId(),
              String(t.created_at || ts),
              ts,
              hostId,
              serverName,
              remoteId,
              String(t.sujet || t.subject || "(sans sujet)"),
              String(t.corps || t.body || ""),
              String(t.auteur || t.author || ""),
              String(t.statut || t.status || "ouvert"),
            );
          }
          upserted++;
        }
        return { status: 200, body: { ok: true, upserted } };
      }

      if (parts.length === 1 && method === "GET") {
        const item = db
          .prepare(`SELECT * FROM admin_support_tickets WHERE id = ?`)
          .get(parts[0]!) as Record<string, unknown> | undefined;
        if (!item) return { status: 404, body: { ok: false } };
        const messages = db
          .prepare(
            `SELECT * FROM admin_support_messages
             WHERE ticket_id = ? ORDER BY created_at ASC`,
          )
          .all(parts[0]!);
        return { status: 200, body: { ok: true, item, messages } };
      }

      // Réponse admin — relayée au serveur marque (le client la voit sur
      // sa page /support) puis copiée localement.
      if (parts.length === 2 && parts[1] === "reply" && method === "POST") {
        const body = (req.body || {}) as { corps?: string; auteur?: string };
        const corps = String(body.corps || "").trim();
        if (!corps) return { status: 400, body: { ok: false, error: "corps requis" } };
        const ticket = db
          .prepare(`SELECT * FROM admin_support_tickets WHERE id = ?`)
          .get(parts[0]!) as
          | { id: string; host_id: string; server_name: string; remote_id: string; sujet: string }
          | undefined;
        if (!ticket) return { status: 404, body: { ok: false } };
        // Retrouver le brandId du serveur d'origine via la liste flotte.
        const list = await fleetFetch(opts?.fleet, "GET", "/admin/api/servers");
        const servers = (list.json?.servers || []) as Array<{
          hostId?: string;
          brandId: string;
          name: string;
        }>;
        const origin = servers.find(
          (s) =>
            (String(s.hostId || "local") === ticket.host_id) &&
            s.name === ticket.server_name,
        );
        if (!origin) {
          return {
            status: 502,
            body: { ok: false, error: "serveur d'origine introuvable dans la flotte" },
          };
        }
        const r = await fleetFetch(
          opts?.fleet,
          "POST",
          supportPathFor(origin, `/${encodeURIComponent(ticket.remote_id)}/reply`),
          { corps, auteur: String(body.auteur || "").trim() || "support" },
        );
        if (r.status !== 200 || !r.json?.ok) {
          return {
            status: 502,
            body: { ok: false, error: "relais réponse KO", detail: r.json },
          };
        }
        const ts = nowIso();
        db.prepare(
          `INSERT INTO admin_support_messages
           (id, ticket_id, remote_id, created_at, origine, auteur, corps)
           VALUES (?,?,?,?,?,?,?)`,
        ).run(newId(), ticket.id, null, ts, "admin", String(body.auteur || "support"), corps);
        db.prepare(
          `UPDATE admin_support_tickets
           SET statut = 'repondu', derniere_reponse = ?, updated_at = ? WHERE id = ?`,
        ).run(ts, ts, ticket.id);
        return { status: 200, body: { ok: true } };
      }

      if (parts.length === 2 && parts[1] === "statut" && method === "POST") {
        const body = (req.body || {}) as { statut?: string };
        const statut = String(body.statut || "ouvert");
        const ticket = db
          .prepare(`SELECT * FROM admin_support_tickets WHERE id = ?`)
          .get(parts[0]!) as
          | { id: string; host_id: string; server_name: string; remote_id: string }
          | undefined;
        if (!ticket) return { status: 404, body: { ok: false } };
        db.prepare(
          `UPDATE admin_support_tickets SET statut = ?, updated_at = ? WHERE id = ?`,
        ).run(statut, nowIso(), ticket.id);
        // Propagation best-effort au serveur marque (le client voit le statut).
        try {
          const list = await fleetFetch(opts?.fleet, "GET", "/admin/api/servers");
          const servers = (list.json?.servers || []) as Array<{
            hostId?: string;
            brandId: string;
            name: string;
          }>;
          const origin = servers.find(
            (s) =>
              String(s.hostId || "local") === ticket.host_id &&
              s.name === ticket.server_name,
          );
          if (origin) {
            await fleetFetch(
              opts?.fleet,
              "POST",
              supportPathFor(origin, `/${encodeURIComponent(ticket.remote_id)}/statut`),
              { statut },
            );
          }
        } catch {
          /* best-effort */
        }
        return { status: 200, body: { ok: true } };
      }

      return { status: 404, body: { ok: false } };
    },
  };
}

/* -------------------------------------------------- module billing Stripe */

export type BillingWebhookMountOptions = {
  /**
   * Secret de signature webhook (`whsec_…`). Défaut env
   * STRIPE_WEBHOOK_SECRET (fichier .env gitignoré de l'app admin).
   */
  webhookSecret?: string;
  /** Tolérance horodatage signature (s). Défaut 300. */
  toleranceSeconds?: number;
};

function stripeSecret(opts?: BillingWebhookMountOptions): string {
  return (
    opts?.webhookSecret || (process.env.STRIPE_WEBHOOK_SECRET || "").trim()
  );
}

/**
 * Vérifie une signature Stripe (`stripe-signature: t=…,v1=…`) sur le corps
 * brut — schéma officiel : HMAC-SHA256(secret, `${t}.${payload}`).
 * Implémentation locale : pas de dépendance au SDK stripe.
 */
export function verifyStripeSignature(
  rawBody: string,
  header: string,
  secret: string,
  toleranceSeconds = 300,
): boolean {
  if (!rawBody || !header || !secret) return false;
  const parts = new Map<string, string[]>();
  for (const kv of header.split(",")) {
    const i = kv.indexOf("=");
    if (i <= 0) continue;
    const k = kv.slice(0, i).trim();
    const v = kv.slice(i + 1).trim();
    parts.set(k, [...(parts.get(k) || []), v]);
  }
  const t = Number(parts.get("t")?.[0] || 0);
  if (!t || Math.abs(Date.now() / 1000 - t) > toleranceSeconds) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${t}.${rawBody}`)
    .digest("hex");
  for (const sig of parts.get("v1") || []) {
    try {
      if (
        sig.length === expected.length &&
        crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
      ) {
        return true;
      }
    } catch {
      /* longueur invalide */
    }
  }
  return false;
}

type StripeEvent = {
  id?: string;
  type?: string;
  data?: { object?: Record<string, unknown> };
};

/**
 * Module `billing-webhook` — POST `/api/v1/modules/billing-webhook/stripe`.
 *
 * Auth = signature Stripe (pas de session : Stripe appelle directement).
 * Chaque événement est journalisé (`admin_billing_events`, dédup par id
 * Stripe) puis projeté :
 *   - customer.created|updated            → admin_billing_customers
 *   - customer.subscription.*             → admin_billing_subscriptions
 *   - invoice.finalized|paid|payment_failed|voided → admin_billing_invoices
 */
export function createBillingWebhookMount(
  opts?: BillingWebhookMountOptions,
): ApiMount {
  return {
    dbLayer: "brand",
    handle: async ({ req, subPath, db }) => {
      if (!db) return { status: 503, body: { ok: false, error: "db_unavailable" } };
      if (subPath !== "stripe" || req.method.toUpperCase() !== "POST") {
        return { status: 404, body: { ok: false } };
      }
      const secret = stripeSecret(opts);
      if (!secret) {
        return {
          status: 503,
          body: { ok: false, error: "STRIPE_WEBHOOK_SECRET non configuré" },
        };
      }
      const header = String(
        (Array.isArray(req.headers?.["stripe-signature"])
          ? req.headers?.["stripe-signature"]?.[0]
          : req.headers?.["stripe-signature"]) || "",
      );
      const raw = req.rawBody || "";
      if (
        !verifyStripeSignature(
          raw,
          header,
          secret,
          opts?.toleranceSeconds ?? 300,
        )
      ) {
        return { status: 400, body: { ok: false, error: "signature invalide" } };
      }
      const event = (req.body || {}) as StripeEvent;
      const eventId = String(event.id || "");
      const type = String(event.type || "");
      const obj = (event.data?.object || {}) as Record<string, unknown>;
      const ts = nowIso();

      // Journal (idempotence : Stripe retente les webhooks).
      if (eventId) {
        const seen = db
          .prepare(
            `SELECT id FROM admin_billing_events WHERE stripe_event_id = ?`,
          )
          .get(eventId);
        if (seen) return { status: 200, body: { ok: true, duplicate: true } };
        db.prepare(
          `INSERT INTO admin_billing_events (id, created_at, stripe_event_id, type, payload)
           VALUES (?,?,?,?,?)`,
        ).run(newId(), ts, eventId, type, raw.slice(0, 100_000));
      }

      if (type === "customer.created" || type === "customer.updated") {
        const stripeCustomerId = String(obj.id || "");
        if (stripeCustomerId) {
          const existing = db
            .prepare(
              `SELECT id FROM admin_billing_customers WHERE stripe_customer_id = ?`,
            )
            .get(stripeCustomerId) as { id: string } | undefined;
          if (existing) {
            db.prepare(
              `UPDATE admin_billing_customers SET nom = ?, email = ?, updated_at = ? WHERE id = ?`,
            ).run(
              String(obj.name || obj.email || stripeCustomerId),
              obj.email == null ? null : String(obj.email),
              ts,
              existing.id,
            );
          } else {
            db.prepare(
              `INSERT INTO admin_billing_customers
               (id, created_at, updated_at, nom, email, stripe_customer_id)
               VALUES (?,?,?,?,?,?)`,
            ).run(
              newId(),
              ts,
              ts,
              String(obj.name || obj.email || stripeCustomerId),
              obj.email == null ? null : String(obj.email),
              stripeCustomerId,
            );
          }
        }
      } else if (type.startsWith("customer.subscription.")) {
        const stripeSubId = String(obj.id || "");
        const stripeCustomerId = String(obj.customer || "");
        if (stripeSubId) {
          let customer = db
            .prepare(
              `SELECT id FROM admin_billing_customers WHERE stripe_customer_id = ?`,
            )
            .get(stripeCustomerId) as { id: string } | undefined;
          if (!customer && stripeCustomerId) {
            const cid = newId();
            db.prepare(
              `INSERT INTO admin_billing_customers
               (id, created_at, updated_at, nom, stripe_customer_id)
               VALUES (?,?,?,?,?)`,
            ).run(cid, ts, ts, stripeCustomerId, stripeCustomerId);
            customer = { id: cid };
          }
          const items = (obj.items as { data?: Array<Record<string, unknown>> })
            ?.data;
          const price = (items?.[0]?.price || {}) as Record<string, unknown>;
          const plan = String(price.nickname || price.id || "");
          const montant =
            price.unit_amount != null ? Number(price.unit_amount) / 100 : null;
          const devise = String(price.currency || "eur").toUpperCase();
          const statut =
            type === "customer.subscription.deleted"
              ? "canceled"
              : String(obj.status || "active");
          const existing = db
            .prepare(
              `SELECT id FROM admin_billing_subscriptions WHERE stripe_subscription_id = ?`,
            )
            .get(stripeSubId) as { id: string } | undefined;
          if (existing) {
            db.prepare(
              `UPDATE admin_billing_subscriptions
               SET plan = ?, montant_mensuel = ?, devise = ?, statut = ?, updated_at = ?
               WHERE id = ?`,
            ).run(plan, montant, devise, statut, ts, existing.id);
          } else {
            db.prepare(
              `INSERT INTO admin_billing_subscriptions
               (id, created_at, updated_at, customer_id, plan, montant_mensuel,
                devise, statut, stripe_subscription_id)
               VALUES (?,?,?,?,?,?,?,?,?)`,
            ).run(
              newId(),
              ts,
              ts,
              customer?.id || "",
              plan,
              montant,
              devise,
              statut,
              stripeSubId,
            );
          }
        }
      } else if (type.startsWith("invoice.")) {
        const stripeInvoiceId = String(obj.id || "");
        const stripeCustomerId = String(obj.customer || "");
        if (stripeInvoiceId) {
          const customer = db
            .prepare(
              `SELECT id FROM admin_billing_customers WHERE stripe_customer_id = ?`,
            )
            .get(stripeCustomerId) as { id: string } | undefined;
          const sub = db
            .prepare(
              `SELECT id FROM admin_billing_subscriptions WHERE stripe_subscription_id = ?`,
            )
            .get(String(obj.subscription || "")) as { id: string } | undefined;
          const montant =
            obj.amount_due != null ? Number(obj.amount_due) / 100 : null;
          const statut =
            type === "invoice.paid" || obj.paid === true
              ? "paid"
              : type === "invoice.payment_failed"
                ? "payment_failed"
                : String(obj.status || "open");
          const periode = obj.period_start
            ? new Date(Number(obj.period_start) * 1000)
                .toISOString()
                .slice(0, 7)
            : null;
          const existing = db
            .prepare(
              `SELECT id FROM admin_billing_invoices WHERE stripe_invoice_id = ?`,
            )
            .get(stripeInvoiceId) as { id: string } | undefined;
          if (existing) {
            db.prepare(
              `UPDATE admin_billing_invoices
               SET montant = ?, statut = ?, periode = ? WHERE id = ?`,
            ).run(montant, statut, periode, existing.id);
          } else {
            db.prepare(
              `INSERT INTO admin_billing_invoices
               (id, created_at, customer_id, subscription_id, periode, montant,
                devise, statut, stripe_invoice_id)
               VALUES (?,?,?,?,?,?,?,?,?)`,
            ).run(
              newId(),
              ts,
              customer?.id || "",
              sub?.id || null,
              periode,
              montant,
              String(obj.currency || "eur").toUpperCase(),
              statut,
              stripeInvoiceId,
            );
          }
        }
      }

      return { status: 200, body: { ok: true, received: type } };
    },
  };
}

/* ------------------------------------------------------------- register */

export type RegisterAdminModulesOptions = {
  fleet?: FleetAdminMountOptions;
  billing?: BillingWebhookMountOptions;
};

/**
 * Enregistre les modules admin natifs sur le kernel de l'app admin.
 * `/api/v1/modules/fleet|prospects|roadmap|support|billing-*`.
 */
export function registerAdminModules(
  api: ApiKernel,
  opts?: RegisterAdminModulesOptions,
): void {
  api.registerModuleApi("fleet", createFleetAdminMount(opts?.fleet));
  api.registerModuleApi("prospects", createAdminCrudMount("prospects"));
  api.registerModuleApi("roadmap", createAdminCrudMount("roadmap"));
  api.registerModuleApi(
    "support",
    createSupportAdminMount({ fleet: opts?.fleet }),
  );
  api.registerModuleApi(
    "billing-customers",
    createAdminCrudMount("billing-customers"),
  );
  api.registerModuleApi(
    "billing-subscriptions",
    createAdminCrudMount("billing-subscriptions"),
  );
  api.registerModuleApi(
    "billing-webhook",
    createBillingWebhookMount(opts?.billing),
  );
}
