import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type InitBrandSpecOptions = {
  outDir: string;
  brandId: string;
  brandName: string;
  domain: string;
  tagline?: string;
  vertical?: "chr" | "generic";
  force?: boolean;
};

function kitTemplatesDir(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  // dist/ → ../templates
  return path.resolve(here, "../templates");
}

function writeFile(filePath: string, body: string, force: boolean): boolean {
  if (fs.existsSync(filePath) && !force) return false;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, body, "utf8");
  return true;
}

function copyTemplate(
  name: string,
  dest: string,
  force: boolean,
  vars: Record<string, string>,
): boolean {
  const src = path.join(kitTemplatesDir(), name);
  let body: string;
  if (fs.existsSync(src)) {
    body = fs.readFileSync(src, "utf8");
  } else {
    body = FALLBACK_TEMPLATES[name] || "";
  }
  for (const [k, v] of Object.entries(vars)) {
    body = body.split(`{{${k}}}`).join(v);
  }
  return writeFile(dest, body, force);
}

const FALLBACK_TEMPLATES: Record<string, string> = {
  "brand.yaml": `brandId: {{brandId}}
brandName: {{brandName}}
domain: {{domain}}
tagline: {{tagline}}
vertical: {{vertical}}
sandbox: true

platform:
  auth: true
  desktop: true
  pluginApi: true
  chat: true
  sync: false
  meili: true
  mcp: true
  onboarding: true

meili:
  enabled: true
  feedPreset: {{meiliPreset}}

mcp:
  enabled: true
  allowUnauthenticated: true
  spaces:
    - module
    - plugin

onboarding:
  enabled: true
  slugPlaceholder: mon-espace
  requireOpenaiKey: false
  afterCompleteHref: /onboarding
`,
  "product.md": `# {{brandName}}

{{tagline}}

## Utilisateurs

- Opérateurs métier du domaine {{vertical}}

## Parcours cœur

1. Se connecter
2. Consulter / créer les entités métier
3. Enchaîner le flux principal

## Entités (à préciser via interview)

- (à remplir)

## Plateforme

Desktop Client + Serveur Creezio, recherche Meili optionnelle, MCP.
`,
  "AGENTS.md": `# AGENTS — BrandSpec {{brandId}}

## Mission agent créateur

Remplir ce dossier \`brand-spec/\` via l'interview produit, puis :

\`\`\`bash
creezio brand doctor --spec .
creezio brand apply --spec . --out ../
creezio brand smoke --app ../
\`\`\`

## Règles

1. Métier seulement ici — jamais de launcher OS / sidecar JSON.
2. Modules = \`modules/<id>/\` avec \`prd.md\` (+ schema/api/ui si besoin).
3. Runtime = \`@creezio/app-runtime\` (\`startBrandDesktop\`) — pas de jumeau.
4. Si un besoin OS manque → gap kit creezio, pas de copie dans la marque.

Voir \`docs/agents/CREATE-BRAND.md\` à la racine du kit.
`,
  "interview.schema.json": `{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "BrandInterview",
  "type": "object",
  "required": ["brandName", "domain", "tagline", "users", "entities", "flows"],
  "properties": {
    "brandName": { "type": "string", "minLength": 2 },
    "domain": { "type": "string", "minLength": 3 },
    "tagline": { "type": "string" },
    "vertical": { "enum": ["chr", "generic"] },
    "users": {
      "type": "array",
      "items": { "type": "string" },
      "minItems": 1
    },
    "entities": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "label"],
        "properties": {
          "id": { "type": "string" },
          "label": { "type": "string" },
          "fields": { "type": "array", "items": { "type": "string" } }
        }
      }
    },
    "flows": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "label", "steps"],
        "properties": {
          "id": { "type": "string" },
          "label": { "type": "string" },
          "steps": { "type": "array", "items": { "type": "string" } }
        }
      }
    },
    "platform": {
      "type": "object",
      "properties": {
        "meili": { "type": "boolean" },
        "mcp": { "type": "boolean" },
        "chat": { "type": "boolean" },
        "onboarding": { "type": "boolean" }
      }
    }
  }
}
`,
  "platform/onboarding.yaml": `enabled: true
slugPlaceholder: mon-espace
requireOpenaiKey: false
afterCompleteHref: /onboarding
stepLabels:
  - Compte
  - Récupération
  - Tunnel
  - OpenAI
`,
  "platform/meili.yaml": `enabled: true
feedPreset: {{meiliPreset}}
`,
  "platform/mcp.yaml": `enabled: true
allowUnauthenticated: true
spaces:
  - module
  - plugin
`,
  "modules/_template/prd.md": `# Module {{moduleId}}

## Intention

(à remplir)

## Entités

(à remplir)

## API

CRUD sous \`/api/v1/modules/{{moduleId}}\`

## UI

Page liste + détail
`,
};

/**
 * Initialise un dossier brand-spec/ pour une nouvelle marque.
 */
export function initBrandSpec(opts: InitBrandSpecOptions): {
  outDir: string;
  written: string[];
} {
  const outDir = path.resolve(opts.outDir);
  fs.mkdirSync(outDir, { recursive: true });
  const force = Boolean(opts.force);
  const vertical = opts.vertical || "generic";
  const vars = {
    brandId: opts.brandId,
    brandName: opts.brandName,
    domain: opts.domain,
    tagline: opts.tagline || `${opts.brandName} — métier sur OS Creezio`,
    vertical,
    meiliPreset: vertical === "chr" ? "chr-catalog" : "none",
    moduleId: "exemple",
  };

  const written: string[] = [];
  const files: Array<[string, string]> = [
    ["brand.yaml", "brand.yaml"],
    ["product.md", "product.md"],
    ["AGENTS.md", "AGENTS.md"],
    ["interview.schema.json", "interview.schema.json"],
    ["platform/onboarding.yaml", "platform/onboarding.yaml"],
    ["platform/meili.yaml", "platform/meili.yaml"],
    ["platform/mcp.yaml", "platform/mcp.yaml"],
    ["modules/_template/prd.md", "modules/_template/prd.md"],
  ];

  for (const [tpl, rel] of files) {
    const dest = path.join(outDir, rel);
    if (copyTemplate(tpl, dest, force, vars)) written.push(dest);
  }

  // databases placeholder
  const dbReadme = path.join(outDir, "databases", "README.md");
  if (
    writeFile(
      dbReadme,
      `# Databases — ${opts.brandId}\n\nSchémas SQL brand optionnels (sinon générés via apply).\n`,
      force,
    )
  ) {
    written.push(dbReadme);
  }

  return { outDir, written };
}
