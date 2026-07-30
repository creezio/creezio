/**
 * Tests inbox SoT @creezio/mails (insert/list/read/delete/PJ + configureMails).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const {
  configureMails,
  resetMailsConfigForTests,
  resolveEmailDomain,
  createSqliteMailsStore,
  createEmailInboxRoutes,
} = await import(path.join(root, "packages/mails/dist/index.js"));

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "creezio-mails-inbox-"));
const coreDb = path.join(tmp, "core.db");

resetMailsConfigForTests();
configureMails({
  rootDomain: "example.test",
  inboundSecretEnvKeys: ["EMAIL_INBOUND_SECRET", "BRAND_EMAIL_INBOUND_SECRET"],
  pageSubtitle: "Boîte test",
});

process.env.EMAIL_DOMAIN = "lab.mail.example.test";
process.env.EMAIL_INBOUND_SECRET = "secret-test-xyz";
assert.equal(resolveEmailDomain(), "lab.mail.example.test");

const store = createSqliteMailsStore({ coreDbPath: coreDb });
assert.equal(store.emailsReady(), true);

const a = store.insertInboundFull({
  message_id: "<msg-1@test>",
  from: "Fournisseur <fournisseur@example.com>",
  to: "achats@lab.mail.example.test",
  subject: "Devis mars",
  text: "Bonjour, voici le devis.",
  attachments: [
    {
      filename: "devis.pdf",
      content_type: "application/pdf",
      content_base64: Buffer.from("%PDF-fake").toString("base64"),
    },
  ],
});
assert.equal(a.ok, true);
assert.ok(typeof a.id === "string" && a.id.length > 0);

const dup = store.insertInboundFull({
  message_id: "<msg-1@test>",
  from: "Fournisseur <fournisseur@example.com>",
  to: "achats@lab.mail.example.test",
  subject: "Devis mars",
  text: "Bonjour, voici le devis.",
});
assert.equal(dup.ok, true);
assert.equal(dup.duplicate, true);
assert.equal(dup.id, a.id);

const listed = store.listInbox({ folder: "inbox" });
assert.equal(listed.total, 1);
assert.equal(listed.unread, 1);
assert.equal(listed.rows[0].subject, "Devis mars");
assert.equal(listed.rows[0].has_attachments, 1);

const detail = store.getInbox(a.id);
assert.ok(detail);
assert.equal(detail.attachments.length, 1);
assert.equal(detail.attachments[0].filename, "devis.pdf");

const att = store.getAttachment(a.id, detail.attachments[0].id);
assert.ok(att);
assert.equal(att.filename, "devis.pdf");
assert.ok(att.data.length > 0);

assert.equal(store.markRead(a.id, true), true);
assert.equal(store.listInbox({}).unread, 0);
assert.equal(store.markRead(a.id, false), true);
assert.equal(store.listInbox({}).unread, 1);

assert.equal(store.deleteMail(a.id), true);
assert.equal(store.listInbox({}).total, 0);

const routes = createEmailInboxRoutes({ getStore: () => store });
assert.ok(routes);

// meta via app.request
const metaRes = await routes.request("/meta");
assert.equal(metaRes.status, 200);
const meta = await metaRes.json();
assert.equal(meta.domain, "lab.mail.example.test");
assert.equal(meta.inboundConfigured, true);
assert.equal(meta.uiEnabled, true);

store.close();
resetMailsConfigForTests();
delete process.env.EMAIL_DOMAIN;
delete process.env.EMAIL_INBOUND_SECRET;
fs.rmSync(tmp, { recursive: true, force: true });
console.log("OK mails-inbox");
