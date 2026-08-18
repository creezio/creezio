#!/usr/bin/env node
/**
 * Gate contrat fondateur 0.10.6 — une op dans le module = HTTP + /admin/api + MCP.
 *
 * Couvre : CRUD EntitySpec auto, generateModuleToolsFromOperations (handler =
 * req synthétique), catalogue kernel (pas seulement Hono admin), doctor
 * MODULE_OP_MISSING / UNCATALOGUED / MCP_OVERLAP.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  collectKernelOperationRoutes,
  createApiKernel,
  createEntityApiMount,
  entityOperationsFromSpec,
  matchModuleOperation,
  resolveOperationHttpPath,
} from "../packages/api-kernel/dist/index.js";
import {
  generateModuleToolsFromMountedOps,
  generateModuleToolsFromOperations,
} from "../packages/mcp-facade/dist/index.js";
import { buildApiEndpointsRegistry } from "../packages/observability/dist/index.js";
import {
  doctorBrandSpec,
  formatDoctorReport,
  initBrandSpec,
} from "../packages/brand-spec/dist/index.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("MO1 EntitySpec → ops CRUD auto + extra operations", () => {
  const ops = entityOperationsFromSpec({
    table: "notes",
    columns: [{ name: "titre" }],
    archivable: true,
    operations: [
      {
        id: "pin",
        method: "POST",
        path: "/:id/pin",
        description: "Épingler une note",
      },
    ],
  });
  assert.deepEqual(
    ops.map((o) => o.id),
    ["list", "create", "get", "update", "delete", "archive", "pin"],
  );
  const mount = createEntityApiMount({
    table: "notes",
    columns: [{ name: "titre" }],
  });
  assert.ok(mount.operations?.some((o) => o.id === "list"));
});

test("MO2 generateModuleToolsFromOperations — name + invoke HTTP", async () => {
  const api = createApiKernel({ brandId: "demobrand" });
  api.registerModuleApi("notes", {
    dbLayer: "brand",
    operations: [
      {
        id: "list",
        method: "GET",
        path: "/",
        description: "Lister les notes démo",
      },
    ],
    handle: async () => ({ status: 200, body: { items: [{ id: "n1" }], total: 1 } }),
  });
  const tools = generateModuleToolsFromOperations(
    "notes",
    api.listMounts().find((m) => m.id === "notes").operations,
    (req) => api.handle(req),
    { mountId: "notes" },
  );
  assert.equal(tools.length, 1);
  assert.equal(tools[0].name, "module.notes.list");
  assert.equal(tools[0].space, "module");
  assert.equal(tools[0].ownerId, "notes");
  assert.equal(tools[0].mcpPublishDefault, false);
  const result = await tools[0].handler({});
  assert.equal(result.ok, true);
  assert.equal(result.content.total, 1);

  const fromMounts = generateModuleToolsFromMountedOps(api);
  assert.ok(fromMounts.some((t) => t.name === "module.notes.list"));
});

test("MO3 catalogue = ops kernel (mount démo) + Hono admin", () => {
  const api = createApiKernel({ brandId: "demobrand" });
  api.registerModuleApi("notes", {
    dbLayer: "brand",
    operations: [
      {
        id: "list",
        method: "GET",
        path: "/",
        description: "Lister les notes démo",
      },
      {
        id: "from-inbox",
        method: "POST",
        path: "/from-inbox",
        description: "Créer une note depuis l'inbox",
      },
    ],
    handle: async () => ({ status: 200, body: { ok: true } }),
  });
  const kernelRoutes = collectKernelOperationRoutes(api.listMounts());
  assert.ok(
    kernelRoutes.some(
      (r) => r.method === "GET" && r.path === "/api/v1/modules/notes",
    ),
    "catalogue contient le mount de démo",
  );
  assert.ok(
    kernelRoutes.some(
      (r) =>
        r.method === "POST" && r.path === "/api/v1/modules/notes/from-inbox",
    ),
  );
  const registry = buildApiEndpointsRegistry({
    routes: [
      { method: "GET", path: "/api/v1/admin/endpoints" },
      ...kernelRoutes,
    ],
    source: "test-module-ops",
  });
  assert.ok(
    registry.endpoints.some((e) => e.path === "/api/v1/modules/notes"),
    "Admin API liste un endpoint métier, pas seulement admin",
  );
  assert.ok(
    registry.endpoints.some((e) => e.path === "/api/v1/admin/endpoints"),
  );
  assert.equal(
    resolveOperationHttpPath("module", "notes", "/:id"),
    "/api/v1/modules/notes/:id",
  );
  const matched = matchModuleOperation(
    api.listMounts()[0].operations,
    "POST",
    "from-inbox",
  );
  assert.equal(matched?.id, "from-inbox");
});

function writeDemoNotes(modulesDir, body) {
  fs.mkdirSync(modulesDir, { recursive: true });
  fs.writeFileSync(
    path.join(modulesDir, "notes.ts"),
    `import { genericOsTourScenario } from "@creezio/interactive-demo";
${body}
`,
    "utf8",
  );
}

const DEMO_BLOCK = `  demo: { scenarios: [genericOsTourScenario({ productName: "Ops Doc" })] },`;

test("MO4 doctor MODULE_OP_MISSING fail-closed (pin ≥ 0.10.6)", () => {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "brand-spec-ops-missing-"));
  const result = initBrandSpec({
    outDir: path.join(work, "brand-spec"),
    brandId: "opsmiss",
    brandName: "Ops Miss",
    domain: "opsmiss.local",
    vertical: "generic",
    force: true,
  });
  fs.mkdirSync(path.join(work, "server"), { recursive: true });
  fs.writeFileSync(
    path.join(work, "server/package.json"),
    JSON.stringify({
      dependencies: { "@creezio/platform-core": "^0.10.6" },
    }),
  );
  writeDemoNotes(
    path.join(work, "server/src/electron/modules"),
    `export const notesModule = {
  id: "notes",
  apiMounts: { notes: { dbLayer: "brand", handle: async () => ({ status: 200 }) } },
  ${DEMO_BLOCK}
};
`,
  );
  const doctor = doctorBrandSpec(result.outDir);
  assert.equal(doctor.ok, false, formatDoctorReport(doctor));
  assert.ok(
    doctor.issues.some((i) => i.code === "MODULE_OP_MISSING" && i.level === "error"),
    formatDoctorReport(doctor),
  );
  fs.rmSync(work, { recursive: true, force: true });
});

test("MO5 doctor MODULE_OP_UNCATALOGUED + MCP overlap", () => {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "brand-spec-ops-uncat-"));
  const result = initBrandSpec({
    outDir: path.join(work, "brand-spec"),
    brandId: "opsuncat",
    brandName: "Ops Uncat",
    domain: "opsuncat.local",
    vertical: "generic",
    force: true,
  });
  fs.mkdirSync(path.join(work, "server"), { recursive: true });
  fs.writeFileSync(
    path.join(work, "server/package.json"),
    JSON.stringify({
      dependencies: { "@creezio/platform-core": "^0.10.6" },
    }),
  );
  writeDemoNotes(
    path.join(work, "server/src/electron/modules"),
    `export const notesModule = {
  id: "notes",
  entitySpecs: { notes: { table: "notes", columns: [], extraRoutes: async () => ({ status: 404 }) } },
  mcpTools: () => [{ name: "module.notes.list", space: "module", ownerId: "notes", handler: async () => ({ ok: true }) }],
  ${DEMO_BLOCK}
};
`,
  );
  const doctor = doctorBrandSpec(result.outDir);
  assert.equal(doctor.ok, false, formatDoctorReport(doctor));
  assert.ok(
    doctor.issues.some((i) => i.code === "MODULE_OP_UNCATALOGUED"),
    formatDoctorReport(doctor),
  );
  assert.ok(
    doctor.issues.some((i) => i.code === "MODULE_OP_MCP_OVERLAP"),
    formatDoctorReport(doctor),
  );
  fs.rmSync(work, { recursive: true, force: true });
});

test("MO6 create-module docs : une op, pas mcpTools parallèle", () => {
  const create = fs.readFileSync(
    path.join(ROOT, "docs/agents/CREATE-MODULE.md"),
    "utf8",
  );
  assert.match(create, /operations\[\]/);
  assert.match(create, /generateModuleToolsFromOperations/);
  assert.doesNotMatch(
    create,
    /\| Tools MCP métier \| `mcpTools\(api\)` \|/,
  );
  const standard = fs.readFileSync(
    path.join(ROOT, "docs/DOC-STANDARD-MODULE.md"),
    "utf8",
  );
  assert.match(standard, /tools générés/);
});
