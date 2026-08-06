#!/usr/bin/env node
/**
 * Gate — module support admin (@creezio/admin) : sync + reply + idempotence.
 *
 * Prouve, sur DB brand réelle (better-sqlite3, migrations admin) + mock
 * backend flotte :
 *  1. POST sync : pull servers → export → upsert tickets/messages
 *     idempotent ; corps = premier message client ; derniere_reponse =
 *     created_at du dernier message admin ;
 *  2. messages jamais dupliqués par remote_id (re-sync) ;
 *  3. POST <id>/reply : relais obligatoire vers le serveur marque AVANT
 *     copie locale ; 502 si le serveur d'origine est introuvable.
 */
import http from "node:http";
import assert from "node:assert/strict";
import { test } from "node:test";

const { adminMigrations, createSupportAdminMount } = await import(
  "../packages/admin/dist/index.js"
);
const { default: Database } = await import("better-sqlite3");

const BASIC = "admin:gate-support";

function makeDb() {
  const db = new Database(":memory:");
  for (const m of adminMigrations()) db.exec(m.sql);
  return db;
}

function makeFleetBackendMock(state) {
  const srv = http.createServer((req, res) => {
    const auth = String(req.headers.authorization || "");
    const expected = `Basic ${Buffer.from(BASIC).toString("base64")}`;
    if (auth !== expected) {
      res.writeHead(401, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: "unauthorized" }));
      return;
    }
    const url = req.url || "/";
    if (url === "/admin/api/servers" && req.method === "GET") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, servers: state.servers }));
      return;
    }
    const exp = url.match(
      /^\/admin\/api\/servers\/([^/]+)\/([^/]+)\/support\/export$/,
    );
    if (exp && req.method === "GET") {
      const brandId = decodeURIComponent(exp[1]);
      const name = decodeURIComponent(exp[2]);
      const key = `${brandId}/${name}`;
      const tickets = state.exports[key] || [];
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: true, tickets }));
      return;
    }
    const reply = url.match(
      /^\/admin\/api\/servers\/([^/]+)\/([^/]+)\/support\/([^/]+)\/reply$/,
    );
    if (reply && req.method === "POST") {
      const chunks = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", () => {
        const body = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
        state.replies.push({
          brandId: decodeURIComponent(reply[1]),
          name: decodeURIComponent(reply[2]),
          remoteId: decodeURIComponent(reply[3]),
          body,
        });
        if (state.replyFail) {
          res.writeHead(500, { "content-type": "application/json" });
          res.end(JSON.stringify({ ok: false, error: "boom" }));
          return;
        }
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: true, id: "remote-msg-1" }));
      });
      return;
    }
    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: false }));
  });
  return srv;
}

test("support admin : sync upsert + reply relais + idempotence messages", async () => {
  const db = makeDb();
  const state = {
    servers: [
      {
        hostId: "local",
        brandId: "tempoflow3",
        name: "demo",
        orphan: false,
      },
      {
        hostId: "local",
        brandId: "tempoflow3",
        name: "orphan",
        orphan: true,
      },
    ],
    exports: {
      "tempoflow3/demo": [
        {
          id: "t-remote-1",
          sujet: "Four casse",
          auteur: "chef@demo",
          statut: "ouvert",
          created_at: "2026-08-01T10:00:00.000Z",
          messages: [
            {
              id: "m1",
              origine: "client",
              auteur: "chef@demo",
              corps: "Le four ne chauffe plus",
              created_at: "2026-08-01T10:00:00.000Z",
            },
            {
              id: "m2",
              origine: "admin",
              auteur: "support",
              corps: "On envoie un tech",
              created_at: "2026-08-01T11:00:00.000Z",
            },
            {
              id: "m3",
              origine: "client",
              auteur: "chef@demo",
              corps: "Merci",
              created_at: "2026-08-01T12:00:00.000Z",
            },
          ],
        },
      ],
    },
    replies: [],
    replyFail: false,
  };
  const mock = makeFleetBackendMock(state);
  await new Promise((r) => mock.listen(0, "127.0.0.1", r));
  const backendUrl = `http://127.0.0.1:${mock.address().port}`;
  const mount = createSupportAdminMount({
    fleet: { backendUrl, basic: BASIC },
  });
  const call = (method, subPath, body) =>
    mount.handle({
      req: { method, body, query: {}, headers: {} },
      subPath,
      db,
    });

  // 1. Sync → upsert.
  const sync1 = await call("POST", "sync", {});
  assert.equal(sync1.status, 200, JSON.stringify(sync1.body));
  assert.equal(sync1.body.scanned, 1, "orphan ignoré");
  assert.equal(sync1.body.tickets, 1);
  assert.equal(sync1.body.messages, 3);

  const ticket = db
    .prepare(`SELECT * FROM admin_support_tickets WHERE remote_id = 't-remote-1'`)
    .get();
  assert.ok(ticket, "ticket créé");
  assert.equal(ticket.host_id, "local");
  assert.equal(ticket.server_name, "demo");
  assert.equal(
    ticket.corps,
    "Le four ne chauffe plus",
    "corps = premier message client",
  );
  assert.equal(
    ticket.derniere_reponse,
    "2026-08-01T11:00:00.000Z",
    "derniere_reponse = dernier message admin",
  );
  assert.equal(
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM admin_support_messages WHERE ticket_id = ?`,
      )
      .get(ticket.id).n,
    3,
  );

  // 2. Re-sync idempotent : pas de doublon messages (remote_id).
  const sync2 = await call("POST", "sync", {});
  assert.equal(sync2.status, 200);
  assert.equal(
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM admin_support_messages WHERE ticket_id = ?`,
      )
      .get(ticket.id).n,
    3,
    "messages jamais dupliqués par remote_id",
  );
  assert.equal(
    db.prepare(`SELECT COUNT(*) AS n FROM admin_support_tickets`).get().n,
    1,
    "ticket upserté, pas dupliqué",
  );

  // Nouveau message distant → ajouté une seule fois.
  state.exports["tempoflow3/demo"][0].messages.push({
    id: "m4",
    origine: "admin",
    auteur: "support",
    corps: "Tech en route",
    created_at: "2026-08-01T13:00:00.000Z",
  });
  const sync3 = await call("POST", "sync", {});
  assert.equal(sync3.body.messages, 1, "seul le nouveau message compté");
  assert.equal(
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM admin_support_messages WHERE ticket_id = ?`,
      )
      .get(ticket.id).n,
    4,
  );
  assert.equal(
    db
      .prepare(`SELECT derniere_reponse FROM admin_support_tickets WHERE id = ?`)
      .get(ticket.id).derniere_reponse,
    "2026-08-01T13:00:00.000Z",
  );

  // 3. Reply : relais avant copie locale.
  const replyOk = await call("POST", `${ticket.id}/reply`, {
    corps: "C'est réparé ?",
    auteur: "ops",
  });
  assert.equal(replyOk.status, 200, JSON.stringify(replyOk.body));
  assert.equal(state.replies.length, 1, "relais backend appelé");
  assert.equal(state.replies[0].remoteId, "t-remote-1");
  assert.equal(state.replies[0].body.corps, "C'est réparé ?");
  const localAdminMsgs = db
    .prepare(
      `SELECT * FROM admin_support_messages
       WHERE ticket_id = ? AND origine = 'admin' AND remote_id IS NULL`,
    )
    .all(ticket.id);
  assert.equal(localAdminMsgs.length, 1, "copie locale après relais");
  assert.equal(localAdminMsgs[0].corps, "C'est réparé ?");
  assert.equal(
    db.prepare(`SELECT statut FROM admin_support_tickets WHERE id = ?`).get(
      ticket.id,
    ).statut,
    "repondu",
  );

  // Relais KO → pas de copie locale supplémentaire.
  state.replyFail = true;
  const beforeFail = db
    .prepare(
      `SELECT COUNT(*) AS n FROM admin_support_messages WHERE ticket_id = ?`,
    )
    .get(ticket.id).n;
  const replyKo = await call("POST", `${ticket.id}/reply`, {
    corps: "échec attendu",
  });
  assert.equal(replyKo.status, 502);
  assert.equal(
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM admin_support_messages WHERE ticket_id = ?`,
      )
      .get(ticket.id).n,
    beforeFail,
    "échec relais → pas de copie locale",
  );
  state.replyFail = false;

  // 502 si serveur d'origine introuvable.
  state.servers = [];
  const replyLost = await call("POST", `${ticket.id}/reply`, {
    corps: "plus de serveur",
  });
  assert.equal(replyLost.status, 502);
  assert.match(String(replyLost.body.error || ""), /origine introuvable/i);

  mock.close();
});
