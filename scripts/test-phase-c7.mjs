/**
 * Phase C7 — startHostPluginControlPlane unifié (4 boots + ACL).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { createDemobrandSandbox } from "../apps/demobrand/build/electron/sandbox-runtime.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("C7.1 kit exporte startHostPluginControlPlane + preHandle", () => {
  const src = fs.readFileSync(
    path.join(root, "packages/electron-shell/src/host/plugins/control-plane.ts"),
    "utf8",
  );
  assert.match(src, /export async function startHostPluginControlPlane/);
  assert.match(src, /preHandle/);
  assert.match(src, /controlToken/);
  const server = fs.readFileSync(
    path.join(root, "packages/product-hub/src/control-plane/server.ts"),
    "utf8",
  );
  assert.match(server, /opts\.preHandle/);
});

test("C7.2 marques appellent startHostPluginControlPlane", () => {
  // N1p : TF/CV → barrel `startPluginControlApi` kit (appelle startHostPluginControlPlane)
  // + bindings configurePluginHost ; Fidu → plugin-control-boot direct.
  const kitExtras = fs.readFileSync(
    path.join(
      root,
      "packages/electron-shell/src/host/plugins/control-extras.ts",
    ),
    "utf8",
  );
  assert.match(kitExtras, /startHostPluginControlPlane/);
  assert.match(kitExtras, /export async function startPluginControlApi/);

  const tfApi = fs.readFileSync(
    "/opt/docker/tempoflow2/crm/electron/plugin-control-api.ts",
    "utf8",
  );
  assert.match(tfApi, /startPluginControlApi/);
  assert.match(tfApi, /@creezio\/electron-shell/);
  assert.match(
    fs.readFileSync(
      "/opt/docker/tempoflow2/crm/electron/plugin-host-bindings.ts",
      "utf8",
    ),
    /configurePluginHost/,
  );

  const cvApi = fs.readFileSync(
    "/opt/docker/certivan-app/crm/electron/plugin-control-api.ts",
    "utf8",
  );
  assert.match(cvApi, /startPluginControlApi/);
  assert.match(cvApi, /@creezio\/electron-shell/);
  assert.match(
    fs.readFileSync(
      "/opt/docker/certivan-app/crm/electron/plugin-host-bindings.ts",
      "utf8",
    ),
    /configurePluginHost/,
  );

  const fiduBoot = fs.readFileSync(
    "/opt/docker/fidu/crm/electron/plugin-control-boot.ts",
    "utf8",
  );
  assert.match(fiduBoot, /startHostPluginControlPlane/);
  assert.doesNotMatch(
    fiduBoot,
    /équivalent host de\n \* `startHostPluginControlPlane`/,
  );
});

test("C7.3 demobrand startControlPlane + ACL deny cross-org", async () => {
  const sandbox = createDemobrandSandbox();
  try {
    const plane = await sandbox.startControlPlane({ port: 0 });
    assert.ok(plane.url.startsWith("http://127.0.0.1:"));
    assert.ok(plane.token.length > 8);

    sandbox.installPlugin("c7-acl", { ownerOrgId: "org-a" });

    const headersA = {
      Authorization: `Bearer ${plane.token}`,
      ...sandbox.actorHeaders({
        orgId: "org-a",
        userId: "u-a",
        isOwner: true,
      }),
    };
    const headersB = {
      Authorization: `Bearer ${plane.token}`,
      ...sandbox.actorHeaders({
        orgId: "org-b",
        userId: "u-b",
        isOwner: false,
      }),
    };

    const health = await fetch(`${plane.url}/health`, {
      headers: { Authorization: `Bearer ${plane.token}` },
    });
    assert.equal(health.status, 200);

    const listA = await fetch(`${plane.url}/v1/plugins`, {
      headers: headersA,
    });
    assert.equal(listA.status, 200);

    // org-B non-owner : bootstrap install refusé (ACL requireAdmin)
    const deny = await fetch(`${plane.url}/v1/plugins`, {
      method: "POST",
      headers: {
        ...headersB,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: "c7-foreign", name: "Foreign" }),
    });
    assert.ok([403, 401].includes(deny.status), `got ${deny.status}`);
  } finally {
    sandbox.close();
  }
});

test("C7.4 docs PHASE-C7", () => {
  const phase = fs.readFileSync(path.join(root, "docs/PHASE-C7.md"), "utf8");
  assert.match(phase, /Sign-off|TERMINÉE/i);
  assert.match(phase, /startHostPluginControlPlane/);
});
