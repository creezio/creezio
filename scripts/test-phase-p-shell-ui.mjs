#!/usr/bin/env node
/**
 * Phase P / D-P28a — SoT shell chrome (sidebar / workspace / search / site-slot).
 * Extract kit only ; extinction jumeaux marques = cutover (voir o9p + checklist README).
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PAPERCLIP_RE = /paperclipApi|startPaperclip\b|paperclip-launcher/;

const KIT_UI = [
  "packages/shell-ui/ui/layout/sidebar.tsx",
  "packages/shell-ui/ui/layout/sidebar-host.ts",
  "packages/shell-ui/ui/workspace/tab-workspace-context.tsx",
  "packages/shell-ui/ui/workspace/workspace-shell.tsx",
  "packages/shell-ui/ui/workspace/workspace-root.tsx",
  "packages/shell-ui/ui/workspace/workspace-config.ts",
  "packages/shell-ui/ui/search/global-search-provider.tsx",
  "packages/shell-ui/ui/search/global-search-config.ts",
  "packages/shell-ui/ui/desktop/external-site-slot.tsx",
  "packages/shell-ui/ui/desktop/external-site-surface.ts",
];

function walkTs(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === "dist") continue;
      out.push(...walkTs(p));
    } else if (/\.(ts|tsx)$/.test(ent.name)) out.push(p);
  }
  return out;
}

test("P-shell.1 modules chrome SoT présents", () => {
  for (const rel of KIT_UI) {
    assert.ok(fs.existsSync(path.join(root, rel)), rel);
  }
  const index = fs.readFileSync(
    path.join(root, "packages/shell-ui/ui/index.ts"),
    "utf8",
  );
  assert.match(index, /layout\/sidebar/);
  assert.match(index, /tab-workspace-context/);
  assert.match(index, /workspace-shell/);
  assert.match(index, /workspace-root/);
  assert.match(index, /global-search-provider/);
  assert.match(index, /external-site-slot/);
  assert.match(index, /configureSidebar|sidebar-host/);
  assert.match(index, /configureGlobalSearch|global-search-config/);
});

test("P-shell.2 README contrat O9 + hors scope + extinction", () => {
  const readme = fs.readFileSync(
    path.join(root, "packages/shell-ui/README.md"),
    "utf8",
  );
  assert.match(readme, /configureSidebar|Sidebar|CrmSidebar/);
  assert.match(readme, /TabWorkspaceProvider|WorkspaceRoot|ExternalSiteSlot/);
  assert.match(readme, /configureGlobalSearch/);
  assert.match(readme, /@creezio\/auth\/ui/);
  assert.match(readme, /@creezio\/onboarding\/ui/);
  assert.match(readme, /@creezio\/cockpit\/ui/);
  assert.match(readme, /extinction jumeaux|sidebar\.tsx/);
  assert.match(readme, /ADR-no-brand-domain|site externe|siteId/i);
  assert.doesNotMatch(readme, PAPERCLIP_RE);
});

test("P-shell.3 ADR kit : pas de @/ ni TF desktop ni Site fournisseur", () => {
  const dirs = [
    path.join(root, "packages/shell-ui/ui/layout"),
    path.join(root, "packages/shell-ui/ui/workspace"),
    path.join(root, "packages/shell-ui/ui/search"),
    path.join(root, "packages/shell-ui/ui/desktop"),
  ];
  for (const dir of dirs) {
    for (const f of walkTs(dir)) {
      const body = fs.readFileSync(f, "utf8");
      assert.doesNotMatch(body, PAPERCLIP_RE, f);
      assert.doesNotMatch(body, /from ["']@\//, `@/ interdit: ${f}`);
      assert.doesNotMatch(
        body,
        /window\.tempoflowDesktop/,
        `desktop API hardcode: ${f}`,
      );
      assert.doesNotMatch(
        body,
        /Site fournisseur/,
        `label TF interdit: ${f}`,
      );
    }
  }

  const slot = fs.readFileSync(
    path.join(root, "packages/shell-ui/ui/desktop/external-site-slot.tsx"),
    "utf8",
  );
  assert.match(slot, /ExternalSiteSlot/);
  assert.match(slot, /reduceExternalSiteLoadState/);
  assert.match(slot, /reduceSupplierLoadState/);
  assert.match(slot, /Site externe/);
  assert.match(slot, /getShellDesktopApi/);
  assert.match(slot, /siteId/);

  const sidebar = fs.readFileSync(
    path.join(root, "packages/shell-ui/ui/layout/sidebar.tsx"),
    "utf8",
  );
  assert.match(sidebar, /configureSidebar|getSidebarHost/);
  assert.match(sidebar, /CrmSidebar|export function Sidebar/);
  assert.match(sidebar, /getShellDesktopApi/);

  const ctx = fs.readFileSync(
    path.join(root, "packages/shell-ui/ui/workspace/tab-workspace-context.tsx"),
    "utf8",
  );
  assert.match(ctx, /TabWorkspaceProvider/);
  assert.match(ctx, /configureTabWorkspaceHost/);
  assert.match(ctx, /openExternalSite/);
  assert.match(ctx, /getShellDesktopApi/);
});

test("P-shell.4 injection configure* SoT", () => {
  const host = fs.readFileSync(
    path.join(root, "packages/shell-ui/ui/layout/sidebar-host.ts"),
    "utf8",
  );
  assert.match(host, /export function configureSidebar/);
  assert.match(host, /canShowHref/);

  const searchCfg = fs.readFileSync(
    path.join(root, "packages/shell-ui/ui/search/global-search-config.ts"),
    "utf8",
  );
  assert.match(searchCfg, /export function configureGlobalSearch/);
  assert.match(searchCfg, /search:\s*\(/);

  const wsCfg = fs.readFileSync(
    path.join(root, "packages/shell-ui/ui/workspace/workspace-config.ts"),
    "utf8",
  );
  assert.match(wsCfg, /configureDefaultNewTabHref/);
  assert.match(wsCfg, /configureSidebarCollapsedKey/);
  assert.match(wsCfg, /configureProductDetailCtx/);

  const rootUi = fs.readFileSync(
    path.join(root, "packages/shell-ui/ui/workspace/workspace-root.tsx"),
    "utf8",
  );
  assert.match(rootUi, /wrapWorkspace/);
  assert.match(rootUi, /banners/);
  assert.doesNotMatch(rootUi, /PanierProvider|ImpersonationBanner|from ["']@\//);
});
