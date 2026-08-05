/**
 * Gate : factory --from-prd ne versionne PLUS de pages OS dans ui/app/.
 * Les surfaces OS vivent dans @creezio/os-ui et sont matérialisées hors git.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLI = path.join(ROOT, "packages/factory/bin/creezio.js");
const PRD = path.join(ROOT, "docs/experiences/tempoflow3/PRD-PRODUIT.md");

const FORBIDDEN_OS_DIRS = [
  "mails",
  "taches",
  "setup",
  "login",
  "developers",
  "settings",
  "admin",
  "cockpit",
  "mcp",
];

test("os-ui scaffold : zéro page OS versionnée, materialize + boot kit", () => {
  assert.ok(fs.existsSync(CLI), "factory CLI");
  assert.ok(fs.existsSync(PRD), "PRD produit");
  assert.ok(
    fs.existsSync(path.join(ROOT, "packages/os-ui/routes/mails/page.tsx")),
    "@creezio/os-ui routes",
  );

  const out = fs.mkdtempSync(path.join(os.tmpdir(), "creezio-os-ui-"));
  const r = spawnSync(
    process.execPath,
    [CLI, "new-app", "--from-prd", PRD, "--out", out, "--force"],
    { encoding: "utf8", cwd: ROOT, timeout: 120_000 },
  );
  assert.equal(r.status, 0, r.stderr || r.stdout);

  // Layout monorepo 3 livrables : le serveur (et son UI) vit sous server/.
  const srv = path.join(out, "server");

  for (const seg of FORBIDDEN_OS_DIRS) {
    assert.ok(
      !fs.existsSync(path.join(srv, "ui/app", seg)),
      `ne doit pas versionner ui/app/${seg}`,
    );
  }
  assert.ok(
    !fs.existsSync(path.join(srv, "ui/app/lib/creezio-ui-boot.tsx")),
    "pas de boot OS versionné",
  );

  assert.ok(
    fs.existsSync(path.join(srv, "scripts/materialize-os-ui.mjs")),
    "script materialize",
  );
  const gitignore = fs.readFileSync(path.join(out, ".gitignore"), "utf8");
  assert.match(gitignore, /\(creezio-os\)/);

  const uiPkg = JSON.parse(
    fs.readFileSync(path.join(srv, "ui/package.json"), "utf8"),
  );
  assert.ok(uiPkg.dependencies["@creezio/os-ui"]);
  assert.ok(uiPkg.scripts.prebuild);

  const layout = fs.readFileSync(path.join(srv, "ui/app/layout.tsx"), "utf8");
  assert.match(layout, /@creezio\/os-ui\/boot/);
  assert.match(layout, /CreezioUiBoot/);
  assert.doesNotMatch(layout, /OS_NAV/);
  assert.doesNotMatch(layout, /\/mails/);

  // Chrome CRM kit + Tailwind : sans ça, l'app générée rend du HTML brut
  // (nav en liens texte, zéro sidebar) — régression vue sur tempoflow3.
  assert.match(layout, /BrandChrome/, "layout branche le chrome kit");
  assert.match(layout, /globals\.css/, "layout importe globals.css");
  assert.match(
    layout,
    /@creezio\/shell-ui\/theme\.css/,
    "layout importe le thème Creezio canonique (design system kit)",
  );
  assert.doesNotMatch(
    layout,
    /style=\{\{/,
    "plus de styles inline scaffold dans le layout",
  );

  const chrome = fs.readFileSync(
    path.join(srv, "ui/components/brand-chrome.tsx"),
    "utf8",
  );
  assert.match(chrome, /@creezio\/shell-ui\/ui/, "chrome vient du kit");
  assert.match(chrome, /WorkspaceRoot/);
  assert.match(chrome, /configureSidebar/);
  assert.match(chrome, /SessionProvider/);
  assert.match(chrome, /AssistantRoot/);

  const tailwind = fs.readFileSync(
    path.join(srv, "ui/tailwind.config.ts"),
    "utf8",
  );
  assert.match(
    tailwind,
    /vendor\/creezio\/\*\/ui/,
    "tailwind scanne les sources UI vendor kit (sinon classes purgées)",
  );
  assert.match(
    tailwind,
    /@creezio\/shell-ui\/tailwind-preset/,
    "tailwind consomme le preset thème kit (design system par défaut)",
  );
  const postcss = fs.readFileSync(
    path.join(srv, "ui/postcss.config.js"),
    "utf8",
  );
  assert.match(postcss, /tailwindcss/);
  const globals = fs.readFileSync(
    path.join(srv, "ui/app/globals.css"),
    "utf8",
  );
  assert.match(globals, /@tailwind base/);
  // Les tokens vivent dans le kit (theme.css, SoT — le vendor de l'app est
  // synchronisé plus tard par sync-creezio-vendor.sh qui copie ui/ entier).
  const kitTheme = fs.readFileSync(
    path.join(ROOT, "packages/shell-ui/ui/theme/theme.css"),
    "utf8",
  );
  assert.match(kitTheme, /--background: #faf7f1/, "tokens thème gold TF");
  assert.match(kitTheme, /\.tf-tab-bg/, "chrome onglets kit présent");
  assert.match(kitTheme, /\.sidebar-scroll/, "scrollbar sidebar sombre");
  const kitPreset = fs.readFileSync(
    path.join(ROOT, "packages/shell-ui/ui/theme/tailwind-preset.cjs"),
    "utf8",
  );
  assert.match(kitPreset, /#f0701d/, "accent orange gold TF dans le preset");
  const shellUiPkg = JSON.parse(
    fs.readFileSync(
      path.join(ROOT, "packages/shell-ui/package.json"),
      "utf8",
    ),
  );
  assert.equal(
    shellUiPkg.exports?.["./theme.css"],
    "./ui/theme/theme.css",
    "export ./theme.css",
  );
  assert.equal(
    shellUiPkg.exports?.["./tailwind-preset"],
    "./ui/theme/tailwind-preset.cjs",
    "export ./tailwind-preset",
  );
  assert.ok(
    uiPkg.devDependencies?.tailwindcss,
    "tailwindcss en devDependency UI",
  );

  const home = fs.readFileSync(path.join(srv, "ui/app/page.tsx"), "utf8");
  assert.match(
    home,
    /redirect\(/,
    "home = redirection workspace (pas de placeholder scaffold)",
  );

  const allow = fs.readFileSync(
    path.join(srv, "scripts/test-allowlist.mjs"),
    "utf8",
  );
  assert.match(allow, /page OS versionnée interdite/);

  fs.rmSync(out, { recursive: true, force: true });
});
