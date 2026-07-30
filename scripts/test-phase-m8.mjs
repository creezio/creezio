#!/usr/bin/env node
/**
 * Gate kit M8 — helpers auth/assistant/tasks/mails SoT ; TF adapters lourds absents.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const tfRoot = "/opt/docker/tempoflow2/crm";

function locDir(dir) {
  if (!fs.existsSync(dir)) return 0;
  let n = 0;
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith(".ts") && !f.endsWith(".tsx")) continue;
    n += fs.readFileSync(path.join(dir, f), "utf8").split("\n").length;
  }
  return n;
}

test("M8.1 PHASE-M8.md présent", () => {
  const docPath = path.join(root, "docs/PHASE-M8.md");
  assert.ok(fs.existsSync(docPath));
  const doc = fs.readFileSync(docPath, "utf8");
  assert.match(doc, /@creezio\/auth/);
  assert.match(doc, /platform-stores/);
  assert.match(doc, /≤\s*80|≤80/);
});

test("M8.2 kit expose env helpers + contrat", () => {
  const core = require(path.join(root, "packages/platform-core/dist-cjs/index.js"));
  assert.equal(typeof core.resolveCoreDbPathFromEnv, "function");
  assert.equal(typeof core.ensureCoreDbParent, "function");
  assert.ok(Array.isArray(core.PLATFORM_STORES_CONTRACT));
  assert.equal(core.PLATFORM_STORES_CONTRACT.length, 4);

  const auth = require(path.join(root, "packages/auth/dist-cjs/index.js"));
  assert.equal(typeof auth.getKitAuthStore, "function");
  assert.equal(typeof auth.authenticateViaKit, "function");
  assert.equal(typeof auth.migrateBrandCredentialsToKit, "function");

  const assistant = require(path.join(root, "packages/assistant/dist-cjs/index.js"));
  assert.equal(typeof assistant.getKitAssistantStore, "function");

  const tasks = require(path.join(root, "packages/tasks/dist-cjs/index.js"));
  assert.equal(typeof tasks.upsertKitPlatformTask, "function");

  const mails = require(path.join(root, "packages/mails/dist-cjs/index.js"));
  assert.equal(typeof mails.indexKitInboundMail, "function");
  assert.equal(typeof mails.createEmailInboxRoutes, "function");
  assert.equal(typeof mails.configureMails, "function");
  assert.equal(typeof mails.getKitMailsStore, "function");
  assert.equal(typeof mails.migrateBrandEmailsToKit, "function");
  assert.ok(
    fs.existsSync(path.join(root, "packages/mails/ui/mail-inbox.tsx")),
    "MailInbox UI",
  );
  assert.ok(
    fs.existsSync(path.join(root, "packages/mails/email-worker/worker.js")),
    "email-worker kit",
  );
});

test("M8.3 TF adapters lourds absents ; platform-stores ≤80 LOC", () => {
  const ps = path.join(tfRoot, "src/lib/platform-stores");
  for (const gone of [
    "auth-adapter.ts",
    "assistant-adapter.ts",
    "tasks-mails-adapters.ts",
    "paths.ts",
    "contract.ts",
  ]) {
    assert.ok(!fs.existsSync(path.join(ps, gone)), gone);
  }
  const n = locDir(ps);
  assert.ok(n <= 80, `platform-stores ${n} LOC > 80`);
  assert.ok(fs.existsSync(path.join(ps, "product-hub-adapter.ts")));
});

test("M8.4 TF call-sites importent @creezio/* directs", () => {
  const auth = fs.readFileSync(
    path.join(tfRoot, "src/server/routes/auth.ts"),
    "utf8",
  );
  assert.match(auth, /from ["']@creezio\/auth["']/);
  assert.doesNotMatch(auth, /platform-stores/);

  const tasks = fs.readFileSync(path.join(tfRoot, "src/lib/tasks.ts"), "utf8");
  assert.match(tasks, /from ["']@creezio\/tasks["']/);

  // P20 cutover : email-queries jumeau éteint ; routes délèguent au kit
  const emailQueriesPath = path.join(tfRoot, "src/lib/email-queries.ts");
  if (fs.existsSync(emailQueriesPath)) {
    const mails = fs.readFileSync(emailQueriesPath, "utf8");
    assert.match(mails, /from ["']@creezio\/mails["']/);
  } else if (fs.existsSync(tfRoot)) {
    const emailRoutes = fs.readFileSync(
      path.join(tfRoot, "src/server/routes/email.ts"),
      "utf8",
    );
    assert.match(emailRoutes, /from ["']@creezio\/mails["']/);
    assert.match(emailRoutes, /createEmailInboxRoutes/);
    assert.ok(
      !fs.existsSync(path.join(tfRoot, "src/components/mail/mail-inbox.tsx")),
      "TF mail-inbox twin",
    );
  }

  // O2 : chat-db façade absente — SoT kit direct
  assert.ok(
    !fs.existsSync(path.join(tfRoot, "src/lib/assistant/chat-db.ts")),
    "TF chat-db façade",
  );
  // O4r : assistant-chat jumeau supprimé — mount kit + mcp-bridge
  const assistantRoutes = fs.readFileSync(
    path.join(tfRoot, "src/server/routes/assistant.ts"),
    "utf8",
  );
  assert.match(assistantRoutes, /@creezio\/assistant/);
  assert.ok(
    fs.existsSync(path.join(tfRoot, "src/lib/assistant/mcp-bridge.ts")),
    "TF mcp-bridge",
  );
  assert.ok(
    !fs.existsSync(path.join(tfRoot, "src/lib/assistant/brand-chat-tools.ts")),
    "TF brand-chat-tools mort",
  );
});
