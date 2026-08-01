/**
 * Templates CHR riches (P1) — métier uniquement sous templates/chr/.
 * First-run / login / IPC = @creezio/electron-shell (pas ici).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ProductModel } from "../product-model.js";

function templatesDir(): string {
  // dist/generators → ../../templates/chr ; src/generators → ../../templates/chr
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(here, "../../templates/chr"),
    path.resolve(here, "../templates/chr"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error(
    `templates/chr introuvable (cherché depuis ${here})`,
  );
}

function applyBrand(template: string, model: ProductModel): string {
  return template
    .replaceAll("__BRAND_ID__", model.brandId)
    .replaceAll("__BRAND_NAME__", model.brandName);
}

function readTpl(name: string, model: ProductModel): string {
  const p = path.join(templatesDir(), name);
  return applyBrand(fs.readFileSync(p, "utf8"), model);
}

export function renderChrMetierApi(model: ProductModel): string {
  return readTpl("metier-api.mjs", model);
}

export function renderChrRendererHtml(model: ProductModel): string {
  return readTpl("renderer.html", model);
}

export function renderChrSchemaSql(model: ProductModel): string {
  // SQL générique déjà paramétré sans brand id — ok tel quel
  return fs.readFileSync(path.join(templatesDir(), "schema.sql"), "utf8");
}

export function renderChrMetierParcoursSmoke(model: ProductModel): string {
  return readTpl("test-metier-parcours.mjs", model);
}

export function renderChrAllowlistSmoke(model: ProductModel): string {
  return readTpl("test-allowlist.mjs", model);
}

export function renderChrDesktopSmokeProfile(model: ProductModel): string {
  return readTpl("test-desktop-smoke-profile.mjs", model);
}

export function renderChrOracleMvpSmoke(model: ProductModel): string {
  return readTpl("test-oracle-mvp.mjs", model);
}
