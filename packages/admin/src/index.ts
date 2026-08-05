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

export function adminMigrations(): SqliteMigration[] {
  return [{ id: "admin_001_native_modules", sql: ADMIN_SCHEMA_SQL }];
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

/**
 * Module `support` (côté admin) — tickets agrégés depuis les serveurs
 * marque. La sync (pull via backend flotte / host-agents) écrit dans
 * `admin_support_tickets` ; ce mount sert la lecture + changement de statut
 * + réponse. La brique serveur marque vit dans `@creezio/support`.
 */
export function createSupportAdminMount(): ApiMount {
  return {
    dbLayer: "brand",
    handle: async ({ req, subPath, db }) => {
      if (!db) return { status: 503, body: { ok: false, error: "db_unavailable" } };
      const method = req.method.toUpperCase();
      const parts = subPath.split("/").filter(Boolean);

      if (!parts.length && method === "GET") {
        const items = db
          .prepare(
            `SELECT * FROM admin_support_tickets ORDER BY updated_at DESC`,
          )
          .all();
        return { status: 200, body: { ok: true, items } };
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

      if (parts.length === 2 && parts[1] === "statut" && method === "POST") {
        const body = (req.body || {}) as { statut?: string };
        const r = db
          .prepare(
            `UPDATE admin_support_tickets SET statut = ?, updated_at = ? WHERE id = ?`,
          )
          .run(String(body.statut || "ouvert"), nowIso(), parts[0]!) as {
            changes: number;
          };
        return { status: r.changes ? 200 : 404, body: { ok: Boolean(r.changes) } };
      }

      return { status: 404, body: { ok: false } };
    },
  };
}

/* ------------------------------------------------------------- register */

export type RegisterAdminModulesOptions = {
  fleet?: FleetAdminMountOptions;
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
  api.registerModuleApi("support", createSupportAdminMount());
  api.registerModuleApi(
    "billing-customers",
    createAdminCrudMount("billing-customers"),
  );
  api.registerModuleApi(
    "billing-subscriptions",
    createAdminCrudMount("billing-subscriptions"),
  );
}
