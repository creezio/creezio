#!/usr/bin/env node
/**
 * Génère electron-builder.client.json / .server.json via buildElectronBuilderConfig.
 * Préfère le registre kit ; sinon lit src/electron/app-manifest.ts via JSON export.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildElectronBuilderConfig,
  getManifest,
  listBrandIds,
} from "@creezio/brand-config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const kind = process.argv[2] === "server" ? "server" : "client";
const brandId = process.env.CREEZIO_BRAND || "demobrand";

let manifest;
if (listBrandIds().includes(brandId)) {
  manifest = getManifest(brandId);
} else {
  const genPath = path.join(root, "src/electron/app-manifest.json");
  if (!fs.existsSync(genPath)) {
    throw new Error(`Manifest introuvable pour ${brandId} (registre + app-manifest.json)`);
  }
  manifest = JSON.parse(fs.readFileSync(genPath, "utf8"));
}

const base = JSON.parse(
  fs.readFileSync(path.join(root, "electron-builder.base.json"), "utf8"),
);
const cfg = buildElectronBuilderConfig(manifest, kind, base);
const out = path.join(root, `electron-builder.${kind}.json`);
fs.writeFileSync(out, JSON.stringify(cfg, null, 2) + "\n");
console.log("wrote", out);
