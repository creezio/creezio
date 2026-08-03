/**
 * Gate — artefacts docker/server + CLI creezio server-docker.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dockerServer = path.join(root, "docker/server");

test("docker/server artefacts présents", () => {
  for (const f of [
    "Dockerfile",
    "docker-compose.yml",
    "brand.dockerignore",
    "README.md",
    "AGENTS.md",
  ]) {
    assert.ok(
      fs.existsSync(path.join(dockerServer, f)),
      `manquant: docker/server/${f}`,
    );
  }
  const df = fs.readFileSync(path.join(dockerServer, "Dockerfile"), "utf8");
  assert.match(df, /brand-kernel-harness/);
  assert.match(df, /CREEZIO_HTTP_HOST/);
  const compose = fs.readFileSync(
    path.join(dockerServer, "docker-compose.yml"),
    "utf8",
  );
  assert.match(compose, /name:\s*creezio-servers/);
  assert.match(compose, /server-a/);
  assert.match(compose, /server-b/);
});

test("CLI creezio server-docker help", () => {
  const r = spawnSync(
    process.execPath,
    [path.join(root, "packages/factory/bin/creezio.js"), "server-docker", "--help"],
    { encoding: "utf8" },
  );
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout, /server-docker/);
  assert.match(r.stdout, /build/);
  assert.match(r.stdout, /proof/);
});

test("listenBrandOsHttp exporte resolveBrandOsHttpHost", () => {
  const src = fs.readFileSync(
    path.join(root, "packages/app-runtime/src/listen-brand-os-http.ts"),
    "utf8",
  );
  assert.match(src, /export function resolveBrandOsHttpHost/);
  assert.match(src, /CREEZIO_HTTP_HOST/);
});
