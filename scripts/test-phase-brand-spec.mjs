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

test("BS7 doctor : helpers modules ignorés (_lib, shared, mcp-shared, meili-shared, index, types)", () => {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "brand-spec-helpers-"));
  const result = initBrandSpec({
    outDir: path.join(work, "brand-spec"),
    brandId: "helpdoc",
    brandName: "Help Doc",
    domain: "helpdoc.local",
    vertical: "generic",
    force: true,
  });
  const modulesDir = path.join(work, "server/src/electron/modules");
  fs.mkdirSync(modulesDir, { recursive: true });
  for (const name of [
    "index.ts",
    "types.ts",
    "shared.ts",
    "mcp-shared.ts",
    "meili-shared.ts",
    "_lib.ts",
  ]) {
    fs.writeFileSync(
      path.join(modulesDir, name),
      `export const helper = "${name}";\n`,
      "utf8",
    );
  }
  fs.writeFileSync(
    path.join(modulesDir, "notes.ts"),
    `import { genericOsTourScenario } from "@creezio/interactive-demo";
export const notesModule = {
  id: "notes",
  demo: { scenarios: [genericOsTourScenario({ productName: "Help Doc" })] },
};
`,
    "utf8",
  );
  const doctor = doctorBrandSpec(result.outDir);
  assert.equal(doctor.ok, true, formatDoctorReport(doctor));
  assert.ok(
    !doctor.issues.some(
      (i) => i.code === "MODULE_DEMO_MISSING" && /shared|_lib|index|types/.test(i.message),
    ),
    formatDoctorReport(doctor),
  );
  fs.rmSync(work, { recursive: true, force: true });
});

test("BS8 doctor : démo trop pauvre = warn (pas fail-closed)", () => {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "brand-spec-thin-"));
  const result = initBrandSpec({
    outDir: path.join(work, "brand-spec"),
    brandId: "thindoc",
    brandName: "Thin Doc",
    domain: "thindoc.local",
    vertical: "generic",
    force: true,
  });
  const modulesDir = path.join(work, "server/src/electron/modules");
  fs.mkdirSync(modulesDir, { recursive: true });
  fs.writeFileSync(
    path.join(modulesDir, "notes.ts"),
    `export const notesModule = {
  id: "notes",
  demo: {
    scenarios: [{
      id: "tiny",
      title: "Mini",
      steps: [{ kind: "say", id: "s1", title: "Hi" }],
    }],
  },
};
`,
    "utf8",
  );
  const doctor = doctorBrandSpec(result.outDir);
  assert.equal(doctor.ok, true, formatDoctorReport(doctor));
  const thin = doctor.issues.find((i) => i.code === "MODULE_DEMO_THIN");
  assert.ok(thin, formatDoctorReport(doctor));
  assert.equal(thin.level, "warn");
  assert.match(thin.message, /autoStart|steps trop courts/);
  fs.rmSync(work, { recursive: true, force: true });
});

test("BS9 doctor : pin 0.9.2 (Winhub) — démo absente = warn, pas fail-closed", () => {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), "brand-spec-winhub-"));
  const result = initBrandSpec({
    outDir: path.join(work, "brand-spec"),
    brandId: "winhubdoc",
    brandName: "Winhub Doc",
    domain: "winhubdoc.local",
    vertical: "generic",
    force: true,
  });
  const modulesDir = path.join(work, "server/src/electron/modules");
  fs.mkdirSync(modulesDir, { recursive: true });
  fs.writeFileSync(
    path.join(work, "server/package.json"),
    JSON.stringify({
      name: "winhub-server",
      dependencies: { "@creezio/platform-core": "^0.9.2" },
    }),
    "utf8",
  );
  fs.writeFileSync(
    path.join(modulesDir, "notes.ts"),
    `export const notesModule = { id: "notes" };\n`,
    "utf8",
  );
  const doctor = doctorBrandSpec(result.outDir);
  assert.equal(doctor.ok, true, formatDoctorReport(doctor));
  const missing = doctor.issues.find((i) => i.code === "MODULE_DEMO_MISSING");
  assert.ok(missing, formatDoctorReport(doctor));
  assert.equal(missing.level, "warn");
  fs.rmSync(work, { recursive: true, force: true });
});
