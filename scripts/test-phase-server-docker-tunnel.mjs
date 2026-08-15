/**
 * Gate — create server-docker fail-closed (tunnel public obligatoire)
 * + mapping slug réservé → `<brand>-<slug>`.
 *
 * Aucun secret : URL/token fictifs uniquement.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const { RESERVED_SLUGS } = await import(
  pathToFileURL(path.join(root, "docker/tunnel-provisioner/lib.mjs")).href
);

const dist = path.join(root, "packages/factory/dist/server-docker-tunnel.js");
assert.ok(
  fs.existsSync(dist),
  "packages/factory/dist/server-docker-tunnel.js absent — npm run build -w @creezio/factory",
);
const {
  RESERVED_SLUGS_FALLBACK,
  deriveCreateTunnelSlug,
  formatMissingProvisionerError,
  resolveCreateTunnelPolicy,
} = await import(pathToFileURL(dist).href);

test("RESERVED_SLUGS_FALLBACK factory = SoT provisioner (demo inclus)", () => {
  assert.ok(RESERVED_SLUGS.has("demo"), "demo est réservé côté provisioner");
  assert.deepEqual(
    [...RESERVED_SLUGS].sort(),
    [...RESERVED_SLUGS_FALLBACK].sort(),
    "drift RESERVED_SLUGS lib.mjs ↔ factory fallback",
  );
});

test("create sans provisioner + LOCAL unset : échec actionnable (pas de loopback)", () => {
  assert.throws(
    () =>
      resolveCreateTunnelPolicy({
        instanceName: "resto1",
        brandId: "foove2",
        env: {},
        reservedSlugs: RESERVED_SLUGS,
      }),
    (err) => {
      const msg = String(err?.message || err);
      assert.match(msg, /CREEZIO_TUNNEL_PROVISION_URL/);
      assert.match(msg, /CREEZIO_TUNNEL_PROVISION_TOKEN/);
      assert.match(msg, /crm\.foove\.io/);
      assert.match(msg, /foove2-admin|tunnel-provisioner\.env/);
      assert.match(msg, /CREEZIO_TUNNEL_LOCAL=1/);
      assert.doesNotMatch(msg, /gh[po]_[A-Za-z0-9]{20,}/);
      return true;
    },
  );
  const text = formatMissingProvisionerError();
  assert.match(text, /loopback-only/);
});

test("create --profile prod ignore LOCAL=1 et exige le provisioner", () => {
  assert.throws(
    () =>
      resolveCreateTunnelPolicy({
        instanceName: "resto1",
        brandId: "foove2",
        profile: "prod",
        env: { CREEZIO_TUNNEL_LOCAL: "1" },
        reservedSlugs: RESERVED_SLUGS,
      }),
    /CREEZIO_TUNNEL_PROVISION_URL/,
  );
});

test("create LOCAL=1 sans profile : loopback autorisé (dev)", () => {
  const p = resolveCreateTunnelPolicy({
    instanceName: "demo",
    brandId: "foove2",
    env: { CREEZIO_TUNNEL_LOCAL: "1" },
    reservedSlugs: RESERVED_SLUGS,
  });
  assert.equal(p.mode, "local");
  assert.equal(p.local, true);
});

test("slug réservé demo → foove2-demo (explicite, écriture env)", () => {
  const mapped = deriveCreateTunnelSlug({
    instanceName: "demo",
    brandId: "foove2",
    reservedSlugs: RESERVED_SLUGS,
  });
  assert.equal(mapped.slug, "foove2-demo");
  assert.equal(mapped.derived, true);
  assert.equal(mapped.from, "demo");

  const p = resolveCreateTunnelPolicy({
    instanceName: "demo",
    brandId: "foove2",
    profile: "prod",
    env: {
      CREEZIO_TUNNEL_PROVISION_URL: "http://127.0.0.1:18667",
      CREEZIO_TUNNEL_PROVISION_TOKEN: "test-token-not-a-secret",
    },
    reservedSlugs: RESERVED_SLUGS,
  });
  assert.equal(p.mode, "public");
  assert.equal(p.slug, "foove2-demo");
  assert.equal(p.derived, true);
  assert.equal(p.from, "demo");
});

test("slug déjà préfixé (foove2-demo) n'est pas re-dérivé", () => {
  const mapped = deriveCreateTunnelSlug({
    instanceName: "demo",
    brandId: "foove2",
    explicitSlug: "foove2-demo",
    reservedSlugs: RESERVED_SLUGS,
  });
  assert.equal(mapped.slug, "foove2-demo");
  assert.equal(mapped.derived, false);
});

test("slug libre (acme) inchangé", () => {
  const mapped = deriveCreateTunnelSlug({
    instanceName: "acme",
    brandId: "foove2",
    reservedSlugs: RESERVED_SLUGS,
  });
  assert.equal(mapped.slug, "acme");
  assert.equal(mapped.derived, false);
});

test("--no-stack en mode public : échec (pas de sidecar)", () => {
  assert.throws(
    () =>
      resolveCreateTunnelPolicy({
        instanceName: "acme",
        brandId: "foove2",
        env: {
          CREEZIO_TUNNEL_PROVISION_URL: "http://127.0.0.1:18667",
          CREEZIO_TUNNEL_PROVISION_TOKEN: "test-token-not-a-secret",
        },
        reservedSlugs: RESERVED_SLUGS,
        noStack: true,
      }),
    /--no-stack/,
  );
});

test("CLI create câble la politique (plus de skip silencieux)", () => {
  const cli = fs.readFileSync(
    path.join(root, "packages/factory/src/server-docker-cli.ts"),
    "utf8",
  );
  assert.match(cli, /resolveCreateTunnelPolicy/);
  assert.match(cli, /loadReservedSlugs/);
  assert.match(cli, /formatDerivedSlugLog/);
  assert.match(cli, /CREATE_TUNNEL_ENV_KEYS/);
  assert.doesNotMatch(
    cli,
    /if \(provUrl && provToken\) \{\s*const slug = \(extraEnv\.CREEZIO_TUNNEL_SLUG/,
    "l'ancien skip tunnel si URL absente ne doit plus exister",
  );
});
