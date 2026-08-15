import fs from "node:fs";
import path from "node:path";
import { loadBrandSpec, resolveBrandSpecDir } from "./load.js";
import type { BrandSpecIssue, DoctorResult } from "./types.js";

const BRAND_ID_RE = /^[a-z][a-z0-9]{1,31}$/;

function resolveAppModulesDir(specRoot: string): string | null {
  const appRoot = path.dirname(specRoot);
  for (const rel of ["server/src/electron/modules", "src/electron/modules"]) {
    const dir = path.join(appRoot, rel);
    if (fs.existsSync(dir)) return dir;
  }
  return null;
}

function moduleWiringHasDemoScenarios(src: string): boolean {
  if (!/\bdemo\s*:/.test(src) || !/\bscenarios\s*:/.test(src)) return false;
  return (
    /genericOsTourScenario\s*\(/.test(src) ||
    /kind\s*:\s*["'](?:say|navigate|highlight|click|type|scroll|wait)/.test(src)
  );
}

/**
 * Chaque BrandModuleDef d'une app déjà scaffoldée doit exposer ≥ 1 scénario
 * jouable. Spec seul (avant apply) : pas de modules/*.ts → no-op.
 */
function doctorBrandModuleDemos(
  specRoot: string,
  issues: BrandSpecIssue[],
): void {
  const modulesDir = resolveAppModulesDir(specRoot);
  if (!modulesDir) return;
  const files = fs
    .readdirSync(modulesDir)
    .filter((f) => f.endsWith(".ts") && f !== "types.ts" && f !== "index.ts")
    .sort();
  for (const file of files) {
    const src = fs.readFileSync(path.join(modulesDir, file), "utf8");
    if (moduleWiringHasDemoScenarios(src)) continue;
    issues.push({
      level: "error",
      code: "MODULE_DEMO_MISSING",
      message: `module ${file.replace(/\.ts$/, "")}: demo.scenarios obligatoire (≥ 1 scénario jouable). Une app Creezio sans démo interactive est invalide.`,
      path: path.relative(specRoot, path.join(modulesDir, file)),
    });
  }
}

/**
 * Valide un BrandSpec (structure + cohérence minimale).
 */
export function doctorBrandSpec(rootDir: string): DoctorResult {
  const issues: BrandSpecIssue[] = [];
  let spec = null;

  try {
    spec = loadBrandSpec(rootDir);
  } catch (err) {
    issues.push({
      level: "error",
      code: "LOAD_FAILED",
      message: err instanceof Error ? err.message : String(err),
      path: rootDir,
    });
    return { ok: false, spec: null, issues };
  }

  const { brand } = spec;

  if (!BRAND_ID_RE.test(brand.brandId)) {
    issues.push({
      level: "error",
      code: "BRAND_ID_INVALID",
      message: `brandId invalide: ${brand.brandId} (attendu [a-z][a-z0-9]{1,31})`,
      path: "brand.yaml",
    });
  }

  if (!brand.brandName.trim()) {
    issues.push({
      level: "error",
      code: "BRAND_NAME_EMPTY",
      message: "brandName vide",
      path: "brand.yaml",
    });
  }

  if (!brand.domain.includes(".")) {
    issues.push({
      level: "warn",
      code: "DOMAIN_SUSPICIOUS",
      message: `domain sans point: ${brand.domain}`,
      path: "brand.yaml",
    });
  }

  if (!spec.productMd) {
    issues.push({
      level: "warn",
      code: "PRODUCT_MD_MISSING",
      message: "product.md manquant (recommandé pour apply --from-prd)",
      path: "product.md",
    });
  }

  if (!spec.agentsMd) {
    issues.push({
      level: "warn",
      code: "AGENTS_MD_MISSING",
      message: "AGENTS.md interview manquant",
      path: "AGENTS.md",
    });
  }

  if (!spec.interviewSchema) {
    issues.push({
      level: "info",
      code: "INTERVIEW_SCHEMA_MISSING",
      message: "interview.schema.json absent (optionnel)",
      path: "interview.schema.json",
    });
  }

  if (spec.modules.length === 0) {
    issues.push({
      level: "warn",
      code: "NO_MODULES",
      message: "aucun module sous modules/",
      path: "modules/",
    });
  }

  for (const mod of spec.modules) {
    if (!mod.hasPrd) {
      issues.push({
        level: "warn",
        code: "MODULE_PRD_MISSING",
        message: `module ${mod.id}: prd.md manquant`,
        path: path.relative(spec.rootDir, mod.dir),
      });
    }
  }

  if (brand.meili?.enabled && brand.meili.feedPreset === "custom") {
    if (!brand.meili.indexes?.length) {
      issues.push({
        level: "error",
        code: "MEILI_CUSTOM_NO_INDEXES",
        message: "meili.feedPreset=custom sans indexes[]",
        path: "brand.yaml",
      });
    }
  }

  if (brand.platform?.desktop === false) {
    issues.push({
      level: "info",
      code: "DESKTOP_DISABLED",
      message: "platform.desktop=false — pas de startBrandDesktop attendu",
      path: "brand.yaml",
    });
  }

  doctorBrandModuleDemos(spec.rootDir, issues);

  // Anti-jumeau : pas de sidecars dans brand-spec
  for (const bad of ["metier-api.mjs", "store.json", "meili-launcher.ts"]) {
    const p = path.join(spec.rootDir, bad);
    if (fs.existsSync(p)) {
      issues.push({
        level: "error",
        code: "FORBIDDEN_SIDECAR",
        message: `fichier interdit dans brand-spec: ${bad}`,
        path: bad,
      });
    }
  }

  const ok = !issues.some((i) => i.level === "error");
  return { ok, spec, issues };
}

/**
 * Doctor sur une app marque (résout brand-spec/).
 */
export function doctorAppBrandSpec(appRoot: string): DoctorResult {
  const dir = resolveBrandSpecDir(appRoot);
  if (!dir) {
    return {
      ok: false,
      spec: null,
      issues: [
        {
          level: "error",
          code: "BRAND_SPEC_NOT_FOUND",
          message: `Aucun brand.yaml sous ${appRoot}/brand-spec ni ${appRoot}`,
          path: appRoot,
        },
      ],
    };
  }
  return doctorBrandSpec(dir);
}

export function formatDoctorReport(result: DoctorResult): string {
  const lines: string[] = [];
  lines.push(
    result.ok
      ? `✓ BrandSpec OK${result.spec ? ` (${result.spec.brand.brandId})` : ""}`
      : `✗ BrandSpec INVALIDE${result.spec ? ` (${result.spec.brand.brandId})` : ""}`,
  );
  if (result.spec) {
    lines.push(`  root     ${result.spec.rootDir}`);
    lines.push(`  modules  ${result.spec.modules.map((m) => m.id).join(", ") || "(aucun)"}`);
  }
  for (const issue of result.issues) {
    const mark =
      issue.level === "error" ? "E" : issue.level === "warn" ? "W" : "I";
    lines.push(
      `  [${mark}] ${issue.code}: ${issue.message}${issue.path ? ` @ ${issue.path}` : ""}`,
    );
  }
  return lines.join("\n");
}
