#!/usr/bin/env node
/**
 * Gate BrandSpec — load / doctor / init / onboarding decl.
 * Extract P1.1 : package + ADR (+ CREATE-BRAND doc). CLI brand / TF3 app = vagues suivantes.
 */
import assert from "node:assert/strict";
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

test("BS1 package brand-spec buildé", () => {
  assert.ok(
    fs.existsSync(path.join(ROOT, "packages/brand-spec/dist/index.js")),
  );
});

test("BS2 initBrandSpec + load + doctor", () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "brand-spec-bs2-"));
  const result = initBrandSpec({
    outDir: out,
    brandId: "acmeprobe",
    brandName: "Acme Probe",
    domain: "acmeprobe.local",
    vertical: "generic",
    force: true,
  });
  const spec = loadBrandSpec(result.outDir);
  assert.equal(spec.brand.brandId, "acmeprobe");
  assert.equal(spec.brand.vertical, "generic");
  assert.ok(spec.productMd);
  const doctor = doctorBrandSpec(result.outDir);
  assert.equal(doctor.ok, true, formatDoctorReport(doctor));
  assert.match(formatDoctorReport(doctor), /BrandSpec OK/);
});

test("BS3 onboarding decl depuis brand-spec", () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "brand-spec-bs3-"));
  const result = initBrandSpec({
    outDir: out,
    brandId: "acmeonb",
    brandName: "Acme Onb",
    domain: "acmeonb.local",
    vertical: "generic",
    force: true,
  });
  const spec = loadBrandSpec(result.outDir);
  const decl = resolveOnboardingDecl(spec);
  assert.ok(decl);
  assert.equal(decl.enabled, true);
  const cfg = toSetupWizardConfig(decl);
  assert.equal(cfg.slugPlaceholder, "mon-espace");
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
  assert.equal(doctor.ok, true, formatDoctorReport(doctor));
});

test("BS5 ADR + CREATE-BRAND docs", () => {
  assert.ok(fs.existsSync(path.join(ROOT, "docs/adr/ADR-brand-spec-app-runtime.md")));
  assert.ok(fs.existsSync(path.join(ROOT, "docs/agents/CREATE-BRAND.md")));
  const create = fs.readFileSync(
    path.join(ROOT, "docs/agents/CREATE-BRAND.md"),
    "utf8",
  );
  assert.match(create, /startBrandDesktop/);
  assert.match(create, /brand apply/);
});
