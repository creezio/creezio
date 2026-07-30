#!/usr/bin/env node
/**
 * Phase O5p — Cutover request-logs / api-endpoints TF → CV → Fidu.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dockerRoot = path.resolve(root, "..");
const PAPERCLIP_RE = /paperclipApi|startPaperclip\b|paperclip-launcher/;

const BRANDS = [
  { id: "tempoflow2", label: "TF", hasApiEndpoints: true },
  { id: "certivan-app", label: "CV", hasApiEndpoints: true },
  { id: "fidu", label: "Fidu", hasApiEndpoints: false },
];

const DELETED = [
  "crm/src/lib/request-logs.ts",
  "crm/src/server/request-log-middleware.ts",
  "crm/src/server/routes/request-logs.ts",
  "crm/src/components/admin/request-logs-client.tsx",
];

test("O5p.1 PHASE-O5p.md + PLAN-O O5p", () => {
  const phase = fs.readFileSync(path.join(root, "docs/PHASE-O5p.md"), "utf8");
  assert.match(phase, /request-logs|RequestLogsClient/i);
  assert.match(phase, /Sign-off|gates verts/i);
  assert.match(phase, /test-phase-o5p/);
  assert.doesNotMatch(phase, PAPERCLIP_RE);

  const plan = fs.readFileSync(path.join(root, "docs/PLAN-O.md"), "utf8");
  assert.match(plan, /## O5p — Cutover admin logs/);
  assert.match(plan, /PHASE-O5p\.md/);
  assert.match(plan, /O5p — Cutover admin logs.*✅|## O5p —[\s\S]*?✅/);
});

test("O5p.2 jumeaux absents ×3 + imports kit", () => {
  for (const b of BRANDS) {
    for (const rel of DELETED) {
      const p = path.join(dockerRoot, b.id, rel);
      assert.ok(!fs.existsSync(p), `${b.label}: encore présent ${rel}`);
    }
    if (b.hasApiEndpoints) {
      const ae = path.join(
        dockerRoot,
        b.id,
        "crm/src/components/admin/api-endpoints-client.tsx",
      );
      assert.ok(!fs.existsSync(ae), `${b.label}: api-endpoints-client encore présent`);
    }

    const app = fs.readFileSync(
      path.join(dockerRoot, b.id, "crm/src/server/app.ts"),
      "utf8",
    );
    assert.match(app, /createRequestLogsRoutes/);
    assert.match(app, /from ["']@creezio\/observability["']/);
    assert.match(app, /requestLogApiMiddleware/);
    assert.doesNotMatch(app, /request-log-middleware|routes\/request-logs/);

    const mcp = fs.readFileSync(
      path.join(dockerRoot, b.id, "crm/src/server/mcp/app.ts"),
      "utf8",
    );
    assert.match(mcp, /requestLogMcpMiddleware.*@creezio\/observability|from ["']@creezio\/observability["']/);
    assert.doesNotMatch(mcp, /@\/server\/request-log-middleware/);

    const page = path.join(
      dockerRoot,
      b.id,
      "crm/src/app/admin/request-logs/page.tsx",
    );
    assert.ok(fs.existsSync(page), `${b.label}: page request-logs manquante`);
    const pageBody = fs.readFileSync(page, "utf8");
    assert.match(pageBody, /RequestLogsClient.*@creezio\/observability\/ui|from ["']@creezio\/observability\/ui["']/);
    const loc = pageBody.split("\n").length;
    assert.ok(loc <= 80, `${b.label}: page request-logs ${loc} > 80 LOC`);

    if (b.hasApiEndpoints) {
      const apiPage = fs.readFileSync(
        path.join(dockerRoot, b.id, "crm/src/app/admin/api/page.tsx"),
        "utf8",
      );
      assert.match(apiPage, /ApiEndpointsClient.*@creezio\/observability\/ui|from ["']@creezio\/observability\/ui["']/);
      assert.ok(apiPage.split("\n").length <= 80, `${b.label}: page api > 80`);
    }

    const sync = JSON.parse(
      fs.readFileSync(
        path.join(dockerRoot, b.id, "crm/vendor/creezio/SYNC.json"),
        "utf8",
      ),
    );
    assert.ok(
      (sync.packages || []).includes("observability"),
      `${b.label}: observability absent SYNC`,
    );
    assert.ok(
      fs.existsSync(
        path.join(
          dockerRoot,
          b.id,
          "crm/vendor/creezio/observability/dist/request-logs/request-logs.js",
        ),
      ),
      `${b.label}: vendor request-logs.js manquant`,
    );
  }

  // TF/CV brand-mcp-admin-host
  for (const b of ["tempoflow2", "certivan-app"]) {
    const host = fs.readFileSync(
      path.join(dockerRoot, b, "crm/src/lib/brand-mcp-admin-host.ts"),
      "utf8",
    );
    assert.match(host, /listRequestLogs.*@creezio\/observability|from ["']@creezio\/observability["']/);
    assert.doesNotMatch(host, /@\/lib\/request-logs/);
  }
});

test("O5p.3 kit exports + Paperclip mort", () => {
  const index = fs.readFileSync(
    path.join(root, "packages/observability/src/index.ts"),
    "utf8",
  );
  assert.match(index, /createRequestLogsRoutes/);
  assert.match(index, /requestLogApiMiddleware/);
  assert.doesNotMatch(index, PAPERCLIP_RE);

  const ui = fs.readFileSync(
    path.join(root, "packages/observability/ui/index.ts"),
    "utf8",
  );
  assert.match(ui, /RequestLogsClient/);
  assert.match(ui, /ApiEndpointsClient/);
});

test("O5p.4 SHAs marques dans PHASE-O5p", () => {
  const phase = fs.readFileSync(path.join(root, "docs/PHASE-O5p.md"), "utf8");
  assert.match(phase, /TempoFlow/);
  assert.match(phase, /Certivan/);
  assert.match(phase, /Fidu/);
  for (const sha of ["2203a41", "a7b96b3", "8009aed"]) {
    assert.match(phase, new RegExp(`\`${sha}\``), `SHA ${sha} manquant`);
  }
});

test("O5p.5 gate enregistrée npm test", () => {
  const pkg = fs.readFileSync(path.join(root, "package.json"), "utf8");
  assert.match(pkg, /test-phase-o5p\.mjs/);
});
