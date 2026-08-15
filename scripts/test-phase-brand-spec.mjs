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
  assert.equal(cfg.afterCompleteHref, "/onboarding");
});

test("BS3b demo-app : onboardingEnabled=false → home", () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "brand-spec-bs3b-"));
  const result = initBrandSpec({
    outDir: out,
    brandId: "acmedemo",
    brandName: "Acme Demo",
    domain: "acmedemo.local",
    vertical: "generic",
    force: true,
    onboardingEnabled: false,
  });
  const spec = loadBrandSpec(result.outDir);
  assert.equal(spec.brand.platform?.onboarding, false);
  const decl = resolveOnboardingDecl(spec);
  assert.ok(decl);
  assert.equal(decl.enabled, false);
  assert.equal(toSetupWizardConfig(decl).afterCompleteHref, "/");
  const yaml = fs.readFileSync(path.join(result.outDir, "brand.yaml"), "utf8");
  assert.match(yaml, /onboarding:\s*false/);
  assert.match(yaml, /afterCompleteHref:\s*\//);
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

  // Le gabarit d'interview module porte les conventions dures du kit :
  // une interview générée ne doit plus POUVOIR proposer « accueil à / »
  // (vécu foove2 — contradiction spec ↔ workspace kit, DOC-STANDARD-MODULE).
  const interviewTpl = fs.readFileSync(
    path.join(result.outDir, "modules/_template/interview.md"),
    "utf8",
  );
  assert.match(
    interviewTpl,
    /## Conventions OS non négociables/,
    "template interview sans section Conventions OS",
  );
  assert.match(
    interviewTpl,
    /Home = `\/dashboard`/,
    "template interview : home = /dashboard absent",
  );
  assert.match(
    interviewTpl,
    /`\/` = pure redirection factory/,
    "template interview : '/' pure redirection absent",
  );
  assert.match(
    interviewTpl,
    /href: "\/dashboard"/,
    "template interview : nav accueil → /dashboard absent",
  );
  assert.match(
    interviewTpl,
    /démo interactive \(\*\*obligatoire\*\*/,
    "template interview : démo interactive obligatoire",
  );
  assert.doesNotMatch(
    interviewTpl,
    /démo interactive \(optionnel\)/,
    "template interview ne doit plus dire démo optionnelle",
  );
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
  assert.match(create, /Démo interactive native obligatoire/);
  const createMod = fs.readFileSync(
    path.join(ROOT, "docs/agents/CREATE-MODULE.md"),
    "utf8",
  );
  assert.doesNotMatch(createMod, /Démo interactive \(optionnel\)/);
  assert.match(createMod, /Démo interactive \(\*\*obligatoire\*\*/);
});

test("BS6 doctor : module sans demo.scenarios = erreur (app scaffoldée)", () => {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "brand-spec-demo-"));
  const result = initBrandSpec({
    outDir: path.join(work, "brand-spec"),
    brandId: "demodoc",
    brandName: "Demo Doc",
    domain: "demodoc.local",
    vertical: "generic",
    force: true,
  });
  const modulesDir = path.join(work, "server/src/electron/modules");
  fs.mkdirSync(modulesDir, { recursive: true });
  fs.writeFileSync(
    path.join(modulesDir, "notes.ts"),
    `export const notesModule = { id: "notes" };\n`,
    "utf8",
  );
  const doctor = doctorBrandSpec(result.outDir);
  assert.equal(doctor.ok, false);
  assert.ok(
    doctor.issues.some((i) => i.code === "MODULE_DEMO_MISSING"),
    formatDoctorReport(doctor),
  );
  fs.writeFileSync(
    path.join(modulesDir, "notes.ts"),
    `import { genericOsTourScenario } from "@creezio/interactive-demo";
export const notesModule = {
  id: "notes",
  demo: { scenarios: [genericOsTourScenario({ productName: "Demo Doc" })] },
};
`,
    "utf8",
  );
  const ok = doctorBrandSpec(result.outDir);
  assert.equal(ok.ok, true, formatDoctorReport(ok));
  fs.rmSync(work, { recursive: true, force: true });
});
