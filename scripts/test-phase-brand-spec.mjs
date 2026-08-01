#!/usr/bin/env node
/**
 * Gate BrandSpec — load / doctor / init / CLI brand.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  doctorBrandSpec,
  formatDoctorReport,
  initBrandSpec,
  loadBrandSpec,
  resolveOnboardingDecl,
  toSetupWizardConfig,
} from "../packages/brand-spec/dist/index.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLI = path.join(ROOT, "packages/factory/bin/creezio.js");
const TF3_SPEC = path.join(ROOT, "apps/tempoflow3/brand-spec");

test("BS1 package brand-spec buildé", () => {
  assert.ok(
    fs.existsSync(path.join(ROOT, "packages/brand-spec/dist/index.js")),
  );
});

test("BS2 load + doctor tempoflow3 brand-spec", () => {
  const spec = loadBrandSpec(TF3_SPEC);
  assert.equal(spec.brand.brandId, "tempoflow3");
  assert.equal(spec.brand.vertical, "chr");
  assert.ok(spec.productMd);
  assert.ok(spec.modules.length >= 5);
  assert.ok(spec.modules.some((m) => m.id === "fournisseurs" && m.hasPrd));

  const doctor = doctorBrandSpec(TF3_SPEC);
  assert.equal(doctor.ok, true, formatDoctorReport(doctor));
  const report = formatDoctorReport(doctor);
  assert.match(report, /BrandSpec OK/);
});

test("BS3 onboarding decl depuis brand-spec", () => {
  const spec = loadBrandSpec(TF3_SPEC);
  const decl = resolveOnboardingDecl(spec);
  assert.ok(decl);
  assert.equal(decl.enabled, true);
  const cfg = toSetupWizardConfig(decl);
  assert.equal(cfg.slugPlaceholder, "mon-resto");
});

test("BS4 initBrandSpec écrit squelette", () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "brand-spec-init-"));
  const result = initBrandSpec({
    outDir: out,
    brandId: "acmeprobe",
    brandName: "Acme Probe",
    domain: "acmeprobe.local",
    vertical: "generic",
    force: true,
  });
  assert.ok(fs.existsSync(path.join(result.outDir, "brand.yaml")));
  assert.ok(fs.existsSync(path.join(result.outDir, "product.md")));
  assert.ok(fs.existsSync(path.join(result.outDir, "AGENTS.md")));
  assert.ok(fs.existsSync(path.join(result.outDir, "interview.schema.json")));
  const doctor = doctorBrandSpec(result.outDir);
  // product.md exist but modules empty → warns only
  assert.equal(doctor.ok, true, formatDoctorReport(doctor));
});

test("BS5 CLI creezio brand doctor", () => {
  const r = spawnSync(
    process.execPath,
    [CLI, "brand", "doctor", "--spec", TF3_SPEC],
    { encoding: "utf8", cwd: ROOT },
  );
  assert.equal(r.status, 0, r.stderr + "\n" + r.stdout);
  assert.match(r.stdout, /BrandSpec OK/);
});

test("BS6 ADR + CREATE-BRAND docs", () => {
  assert.ok(fs.existsSync(path.join(ROOT, "docs/ADR-brand-spec-app-runtime.md")));
  assert.ok(fs.existsSync(path.join(ROOT, "docs/agents/CREATE-BRAND.md")));
  const create = fs.readFileSync(
    path.join(ROOT, "docs/agents/CREATE-BRAND.md"),
    "utf8",
  );
  assert.match(create, /startBrandDesktop/);
  assert.match(create, /brand apply/);
});
