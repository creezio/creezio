/**
 * Scaffold du repo ADMIN dédié d'une marque (`<brand>-admin`).
 *
 * Toute marque factory est livrée en 2 repos GitHub privés :
 *   - monorepo marque : server/ client/ brand-spec/ (workspace npm racine)
 *   - repo admin      : **app OS Creezio complète en mode admin**
 *     (ADR-admin-app-os) — modules natifs flotte / support / prospection /
 *     roadmap / billing Stripe (@creezio/admin) + config flotte
 *     (server-admin.json, fleet-hosts.json) versionnée SANS secrets ;
 *     runtime (pass, tokens) sous docker-data/ gitignoré.
 *
 * L'admin tourne sur le VPS propriétaire (`admin.{domaine}`), réservé à
 * l'entreprise de la marque — jamais accessible aux clients finaux.
 */

import fs from "node:fs";
import { creezioDepSpec } from "./kit-release.js";
import path from "node:path";
import { moduleTemplateFiles } from "@creezio/brand-spec";
import type { ProductModel } from "./product-model.js";
import { scaffoldNewApp } from "./scaffold.js";

export type AdminRepoOptions = {
  /** Dossier cible du repo admin (ex. /opt/docker/tempoflow-admin). */
  outDir: string;
  brandId: string;
  productName: string;
  /** Domaine marque (zone tunnel) — l'admin vit sur admin.{domain}. */
  domain: string;
  /** Brand roots par défaut du plan local (souvent vide en multi-VPS pur). */
  brandRoots?: string[];
  force?: boolean;
};

export type AdminRepoResult = {
  outDir: string;
  writtenFiles: string[];
};

function writeFile(
  file: string,
  content: string,
  force: boolean,
  written: string[],
): void {
  if (fs.existsSync(file) && !force) {
    throw new Error(`refus d'écraser sans --force: ${file}`);
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  written.push(file);
}

function renderServerAdminJson(o: AdminRepoOptions): string {
  return (
    JSON.stringify(
      {
        port: 18800,
        user: "admin",
        brandId: o.brandId,
        domain: o.domain,
        brandRoots: o.brandRoots || [],
      },
      null,
      2,
    ) + "\n"
  );
}

function renderFleetHostsJson(): string {
  // Miroir versionnable SANS tokens — le runtime (avec tokens agents) vit
  // dans docker-data/fleet-hosts.json, régénéré par le server-admin.
  return JSON.stringify({ version: 1, hosts: [] }, null, 2) + "\n";
}

function renderGitignore(): string {
  return `# Runtime admin (secrets : pass Basic, tokens agents) — jamais commité
docker-data/
.env
.github-token
node_modules/
`;
}

function renderEnvExample(o: AdminRepoOptions): string {
  return `# ${o.productName} admin — secrets locaux (copier en .env, gitignoré)

# Auth Basic de l'admin web (le CLI génère un pass runtime si absent)
# CREEZIO_ADMIN_USER=admin
# CREEZIO_ADMIN_PASS=…

# Registre d'images versionnées (update de flotte)
# CREEZIO_REGISTRY=127.0.0.1:5000
# CREEZIO_REGISTRY_BASIC=user:pass          # API registre protégée (tags)
# CREEZIO_REGISTRY_AUTH=…                   # base64 docker auth (pull agents)
`;
}

function renderComposeYml(o: AdminRepoOptions): string {
  return `# Admin web multi-serveurs / multi-VPS ${o.productName}
# Image kit \`creezio-server-admin:local\` (fleet-collector étendu,
# packagée depuis $CREEZIO_KIT_ROOT/docker/server-admin).
#
# Chemin nominal (build + run + config runtime docker-data/) :
#   creezio server-docker admin up --admin-root .
#
# Ce compose est l'alternative déclarative (image déjà buildée par le CLI) :
#   CREEZIO_ADMIN_PASS=… docker compose up -d

name: ${o.brandId}-admin

services:
  server-admin:
    image: creezio-server-admin:local
    container_name: creezio-server-admin
    restart: unless-stopped
    # host network : sonde les serveurs locaux 127.0.0.1:<port> ;
    # l'admin lui-même bind 127.0.0.1 (exposition via reverse proxy TLS).
    network_mode: host
    labels:
      creezio.server-admin: "1"
    environment:
      CREEZIO_ADMIN_PORT: \${CREEZIO_ADMIN_PORT:-18800}
      CREEZIO_ADMIN_USER: \${CREEZIO_ADMIN_USER:-admin}
      CREEZIO_ADMIN_PASS: \${CREEZIO_ADMIN_PASS:?secret runtime — voir docker-data/server-admin.json}
      CREEZIO_ADMIN_ROOT: \${PWD}
      CREEZIO_ADMIN_BRAND_ROOTS: \${CREEZIO_ADMIN_BRAND_ROOTS:-}
      CREEZIO_REGISTRY: \${CREEZIO_REGISTRY:-}
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - .:\${PWD}
`;
}

function renderReadme(o: AdminRepoOptions): string {
  return `# ${o.productName} — admin flotte

Pilotage de la flotte multi-VPS **${o.productName}** (\`admin.${o.domain}\`,
réservé au propriétaire — les restaurateurs n'y accèdent jamais).

L'admin **initie tous les appels** vers les VPS restaurants via leurs
adresses tunnelisées : CRM/santé \`https://{slug}.${o.domain}\`, actions
Docker via l'agent hôte \`https://agent.{slug}.${o.domain}\` (Bearer token
hashé, révocable).

## Démarrer

\`\`\`bash
# Image + container + config runtime (pass généré sous docker-data/) :
creezio server-docker admin up --admin-root .
# → http://127.0.0.1:18800/admin (exposer via reverse proxy TLS en prod)
\`\`\`

## Enrôler un VPS restaurant

1. UI admin → « Générer un token d'enrôlement » (affiché une fois).
2. Sur le VPS restaurant (marque déployée + serveur Docker + tunnel) :

\`\`\`bash
creezio server-docker agent up --brand-root .
creezio server-docker enroll --brand-root . \\
  --admin https://admin.${o.domain} --token <enrollToken> --slug <slug>
\`\`\`

3. L'hôte apparaît dans l'admin (santé, serveurs, logs, update).

## Mettre à jour un restaurant

\`\`\`bash
# 1. Publier une version (VPS build) :
creezio server-docker publish --brand-root <marque> --tag 0.2.0 --registry <registre>
# 2. Update (défaut = pas de nouveau backup) :
creezio server-docker update <nom> --brand-root <marque> --tag 0.2.0
#    Opt-in snapshot frais : --backup / API {"backup":true}
#    One-shot de référence : creezio server-docker backup <nom> --brand-root <marque>
\`\`\`

## Fichiers

| Fichier | Rôle |
|---------|------|
| \`server-admin.json\` | Config versionnée SANS secret (port, user, brandRoots, brandId/domaine) |
| \`fleet-hosts.json\` | Hôtes enrôlés SANS tokens (miroir généré) |
| \`docker-compose.admin.yml\` | Alternative déclarative au CLI |
| \`.env.example\` | Secrets locaux à copier en \`.env\` |
| \`docker-data/\` | Runtime gitignoré (pass Basic, tokens agents, registres) |

Doc kit : \`$CREEZIO_KIT_ROOT/docker/server-admin/README.md\`.
`;
}

/* ------------------------------------------------- app OS admin complète */

/**
 * ProductModel de l'app admin générée (entités génériques — la marque
 * renomme via mini-PRDs : « restaurants » pour un vertical CHR…).
 */
export function adminProductModel(o: {
  brandId: string;
  productName: string;
  domain: string;
}): ProductModel {
  return {
    brandId: `${o.brandId}admin`,
    brandName: `${o.productName} Admin`,
    domain: `admin.${o.domain}`,
    tagline: `L'OS qui gère l'entreprise ${o.productName} — flotte, support, prospection, billing.`,
    vertical: "generic",
    entities: [
      {
        id: "prospects",
        label: "Prospect",
        labelPlural: "Prospects",
        archivable: true,
        fields: [
          { name: "nom", type: "text", required: true, label: "Nom" },
          { name: "contact", type: "text", label: "Contact" },
          { name: "email", type: "text", label: "Email" },
          { name: "telephone", type: "text", label: "Téléphone" },
          { name: "ville", type: "text", label: "Ville" },
          { name: "site_web", type: "text", label: "Site web" },
          { name: "notes", type: "text", label: "Notes" },
          { name: "colonne", type: "text", label: "Étape" },
          { name: "position", type: "number", label: "Position kanban" },
        ],
      },
      {
        id: "roadmap",
        label: "Élément roadmap",
        labelPlural: "Roadmap",
        fields: [
          { name: "titre", type: "text", required: true, label: "Titre" },
          { name: "description", type: "text", label: "Description" },
          { name: "statut", type: "text", label: "Statut" },
          { name: "jalon", type: "text", label: "Jalon" },
        ],
      },
      {
        id: "clients",
        label: "Client",
        labelPlural: "Clients",
        archivable: true,
        fields: [
          { name: "nom", type: "text", required: true, label: "Nom" },
          { name: "email", type: "text", label: "Email" },
          { name: "host_id", type: "text", label: "Hôte flotte" },
          { name: "server_name", type: "text", label: "Serveur" },
          { name: "plan", type: "text", label: "Plan" },
          { name: "montant_mensuel", type: "number", label: "€ / mois" },
          { name: "statut", type: "text", label: "Statut" },
        ],
      },
    ],
    pages: [
      { id: "flotte", path: "/flotte", title: "Flotte", kind: "list" },
      { id: "tickets", path: "/tickets", title: "Tickets support", kind: "list" },
      { id: "landing", path: "/landing", title: "Landing page", kind: "list" },
      {
        id: "prospects",
        path: "/prospects",
        title: "Prospects",
        entityId: "prospects",
        kind: "list",
      },
      {
        id: "roadmap",
        path: "/roadmap",
        title: "Roadmap",
        entityId: "roadmap",
        kind: "list",
      },
      {
        id: "clients",
        path: "/clients",
        title: "Clients",
        entityId: "clients",
        kind: "list",
      },
    ],
    flows: [],
    platformNeeds: {
      auth: true,
      desktop: true,
      pluginApi: true,
      chat: true,
      sync: false,
    },
  };
}

/** Remplacement exact — échoue si l'ancre du template a dérivé. */
function patchFile(file: string, anchor: string, replacement: string): void {
  const content = fs.readFileSync(file, "utf8");
  if (!content.includes(anchor)) {
    throw new Error(`ancre introuvable dans ${file}: ${anchor.slice(0, 60)}…`);
  }
  fs.writeFileSync(file, content.replace(anchor, replacement));
}

function forceWrite(file: string, content: string, written: string[]): void {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  written.push(file);
}

function renderAdminEnvExample(o: AdminRepoOptions): string {
  return `# ${o.productName} Admin — secrets locaux (copier en .env, gitignoré)

# Backend flotte (server-admin.mjs) consommé par le module Flotte
# CREEZIO_FLEET_BACKEND_URL=http://127.0.0.1:18800
# CREEZIO_FLEET_BACKEND_BASIC=admin:…

# Stripe (module billing natif — webhooks signés)
# STRIPE_API_KEY=sk_live_…
# STRIPE_WEBHOOK_SECRET=whsec_…

# Auth Basic du backend flotte (le CLI génère un pass runtime si absent)
# CREEZIO_ADMIN_USER=admin
# CREEZIO_ADMIN_PASS=…

# Registre d'images versionnées (update de flotte)
# CREEZIO_REGISTRY=127.0.0.1:5000
# CREEZIO_REGISTRY_BASIC=user:pass
# CREEZIO_REGISTRY_AUTH=…
`;
}

function renderAdminAppReadme(o: AdminRepoOptions): string {
  const adminBrandId = `${o.brandId}admin`;
  return `# ${o.productName} Admin — app OS de l'entreprise

App **Creezio OS complète en mode admin** (ADR-admin-app-os) : l'OS qui gère
l'entreprise ${o.productName} — multi-comptes multi-rôles, avec chat
assistant, tâches, mails, admin database… et les modules admin natifs :

| Module | Page | API |
|--------|------|-----|
| Flotte (serveurs, updates, enrôlement VPS) | \`/flotte\` | \`/api/v1/modules/fleet\` (proxy backend flotte) |
| Tickets support (agrégés de toute la flotte) | \`/tickets\` | \`/api/v1/modules/support\` (sync pull + réponse) |
| Prospection kanban | \`/prospects\` | \`/api/v1/modules/prospects\` |
| Roadmap | \`/roadmap\` | \`/api/v1/modules/roadmap\` |
| Clients / billing Stripe | \`/clients\` | \`/api/v1/modules/billing-*\` + webhook \`/api/v1/modules/billing-webhook/stripe\` |

## Deux plans

1. **App admin** (ce repo, \`server/\`) — OS Creezio headless (image Docker
   \`creezio-server-${adminBrandId}\`).
2. **Backend flotte** (\`creezio server-docker admin up --admin-root .\`) —
   \`server-admin.mjs\` + host-agents : socket Docker, registres d'instances.
   L'app admin le consomme via \`CREEZIO_FLEET_BACKEND_URL/BASIC\`.

## Démarrer

\`\`\`bash
# 1. Backend flotte (config runtime docker-data/, pass généré)
creezio server-docker admin up --admin-root .

# 2. App admin (build + run — voir scripts package.json)
npm run build && npm run server-docker:build
npm run server-docker:create -- --name main
\`\`\`

## Stripe

Renseigner \`.env\` (gitignoré) : \`STRIPE_WEBHOOK_SECRET=whsec_…\` puis
pointer le endpoint Stripe sur
\`https://admin.${o.domain}/api/v1/modules/billing-webhook/stripe\`.
Événements projetés : customers / subscriptions / invoices
(tables \`admin_billing_*\`).

## Fichiers flotte

| Fichier | Rôle |
|---------|------|
| \`server-admin.json\` | Config backend flotte SANS secret |
| \`fleet-hosts.json\` | Hôtes enrôlés SANS tokens (miroir) |
| \`docker-compose.admin.yml\` | Alternative déclarative au CLI |
| \`docker-data/\` | Runtime gitignoré (pass, tokens, données app) |

Doc kit : ADR \`docs/adr/ADR-admin-app-os.md\` + skill \`creezio-fleet-ops\`.
`;
}

/**
 * Repo admin = app OS Creezio complète (mode admin) + config flotte.
 * Appelé par scaffoldNewApp pour toute nouvelle marque (2 repos).
 */
export function scaffoldAdminApp(o: AdminRepoOptions): AdminRepoResult {
  const outDir = path.resolve(o.outDir);
  const force = Boolean(o.force);
  const written: string[] = [];
  const model = adminProductModel(o);

  // 1. App OS complète (server/ + client/ + UI), sans récursion admin.
  const app = scaffoldNewApp({
    brandId: model.brandId,
    productName: model.brandName,
    domain: model.domain,
    outDir,
    force,
    sandbox: true,
    adminApp: true,
    productModel: model,
  });
  written.push(...app.writtenFiles);

  const serverDir = path.join(outDir, "server");

  // 2. Wiring modules admin natifs (@creezio/admin).
  patchFile(
    path.join(serverDir, "src/electron/brand-migrations.ts"),
    `import { composeMigrations, type SqliteMigration } from "@creezio/platform-core";`,
    `import { composeMigrations, type SqliteMigration } from "@creezio/platform-core";\nimport { adminMigrations } from "@creezio/admin";\nimport { defaultLandingSeed, landingMigrations } from "@creezio/landing";`,
  );
  patchFile(
    path.join(serverDir, "src/electron/brand-migrations.ts"),
    `    {
      id: "fromprd_brand_api_keys",
      sql: BRAND_API_KEYS_SQL,
    },
    collectModuleMigrations(),
  );`,
    `    {
      id: "fromprd_brand_api_keys",
      sql: BRAND_API_KEYS_SQL,
    },
    // Tables des modules admin natifs (@creezio/admin — ADR-admin-app-os).
    adminMigrations(),
    // Landing page hybride (@creezio/landing — ADR-module-natif-hybride) :
    // seed par défaut éditable dans l'admin, publiée sur lp.${o.domain}.
    landingMigrations(
      defaultLandingSeed({ brandName: ${JSON.stringify(o.productName)} }),
    ),
    collectModuleMigrations(),
  );`,
  );
  patchFile(
    path.join(serverDir, "src/electron/brand-module-api.ts"),
    `import { registerEntityMounts } from "@creezio/api-kernel";`,
    `import { registerEntityMounts } from "@creezio/api-kernel";
import {
  createAdminCrudMount,
  createBillingWebhookMount,
  createFleetAdminMount,
  createSupportAdminMount,
} from "@creezio/admin";
import { createLandingMount } from "@creezio/landing";`,
  );
  patchFile(
    path.join(serverDir, "src/electron/brand-module-api.ts"),
    `  api.registerModuleApi("search", createSearchMount());`,
    `  api.registerModuleApi("search", createSearchMount());
  // Modules admin natifs (@creezio/admin — ADR-admin-app-os) : flotte
  // (proxy backend server-admin.mjs), support agrégé (sync pull + réponse),
  // billing Stripe (webhook signé → projections admin_billing_*).
  api.registerModuleApi("fleet", createFleetAdminMount());
  api.registerModuleApi("support", createSupportAdminMount());
  api.registerModuleApi("billing-webhook", createBillingWebhookMount());
  api.registerModuleApi(
    "billing-customers",
    createAdminCrudMount("billing-customers"),
  );
  api.registerModuleApi(
    "billing-subscriptions",
    createAdminCrudMount("billing-subscriptions"),
  );
  // Landing page hybride (@creezio/landing — ADR-module-natif-hybride) :
  // contenu en DB brand, édition /landing (admin), rendu public /lp.
  api.registerModuleApi("landing", createLandingMount());`,
  );

  // 3. Dépendances @creezio/admin (mounts serveur + UI React des modules).
  const creezioSpec = creezioDepSpec();
  patchFile(
    path.join(serverDir, "package.json"),
    `"@creezio/api-kernel": "${creezioSpec}",`,
    `"@creezio/api-kernel": "${creezioSpec}",
    "@creezio/admin": "${creezioSpec}",
    "@creezio/landing": "${creezioSpec}",`,
  );
  patchFile(
    path.join(serverDir, "ui/package.json"),
    `"@creezio/shell-ui": "${creezioSpec}",`,
    `"@creezio/shell-ui": "${creezioSpec}",
    "@creezio/admin": "${creezioSpec}",
    "@creezio/landing": "${creezioSpec}",`,
  );

  // 4. Pages des modules natifs (remplacent les stubs générés).
  forceWrite(
    path.join(serverDir, "ui/app/flotte/page.tsx"),
    `"use client";

import { FleetAdminClient } from "@creezio/admin/ui";

export default function Page() {
  return <FleetAdminClient />;
}
`,
    written,
  );
  forceWrite(
    path.join(serverDir, "ui/app/tickets/page.tsx"),
    `"use client";

import { TicketsAdminClient } from "@creezio/admin/ui";

export default function Page() {
  return <TicketsAdminClient />;
}
`,
    written,
  );
  forceWrite(
    path.join(serverDir, "ui/app/prospects/page.tsx"),
    `"use client";

import { ProspectsKanbanClient } from "@creezio/admin/ui";

export default function Page() {
  return <ProspectsKanbanClient />;
}
`,
    written,
  );

  // 4bis. Module landing hybride (@creezio/landing — ADR-module-natif-hybride) :
  // /landing (édition, auth OS) + /lp (rendu public) + /lp-media (binaire) +
  // middleware host lp.{zone} → /lp.
  forceWrite(
    path.join(serverDir, "ui/app/landing/page.tsx"),
    `"use client";

import { LandingAdminClient } from "@creezio/landing/ui";

export default function Page() {
  return <LandingAdminClient />;
}
`,
    written,
  );
  forceWrite(
    path.join(serverDir, "ui/app/lp/page.tsx"),
    `"use client";

// Rendu public de la landing (aucune session requise) — contenu 100 % DB,
// éditable sur /landing. Surcharge marque : passer components={{ kind: Comp }}.
import { LandingPublicPage } from "@creezio/landing/ui";

export default function Page() {
  return <LandingPublicPage />;
}
`,
    written,
  );
  forceWrite(
    path.join(serverDir, "ui/app/lp-media/[file]/route.ts"),
    `// Service binaire des médias de la landing (le kernel API ne stream pas).
import { createLandingMediaGET } from "@creezio/landing";

export const dynamic = "force-dynamic";
export const GET = createLandingMediaGET();
`,
    written,
  );
  const middlewarePath = path.join(serverDir, "ui/middleware.ts");
  if (!fs.existsSync(middlewarePath)) {
    forceWrite(
      middlewarePath,
      `import { NextResponse, type NextRequest } from "next/server";

/**
 * Routage par hostname public : lp.{zone} → landing publique /lp
 * (tunnel brand-web du provisioner — ADR-module-natif-hybride).
 * Le host public arrive via x-forwarded-host (proxy OS) ou host (dev direct).
 * Sur le host lp., tous les chemins pages servent la landing — seuls les
 * assets (_next), les médias (/lp-media) et l'API restent accessibles.
 */
export function middleware(request: NextRequest) {
  const host = (
    request.headers.get("x-forwarded-host") ||
    request.headers.get("host") ||
    ""
  ).toLowerCase();
  const { pathname } = request.nextUrl;
  if (host.startsWith("lp.") && pathname !== "/lp") {
    const url = request.nextUrl.clone();
    url.pathname = "/lp";
    // Rewrite interne au plane Next (TLS terminé au tunnel) : sans ça,
    // nextUrl hérite du x-forwarded-proto https et Next se re-proxifie en TLS
    // sur son port interne → EPROTO. Le plane sert toujours en http clair.
    url.protocol = "http:";
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|lp-media/|api/|favicon\\\\.ico).*)"],
};
`,
      written,
    );
  }

  // 4ter. admin-spec/ : specs des modules PROPRES au repo admin (standard
  // kit DOC-STANDARD-MODULE.md — les modules natifs @creezio/admin ont leurs
  // specs dans le kit, packages/admin/modules/<id>/).
  const adminSpecReadme = path.join(outDir, "admin-spec", "README.md");
  if (!fs.existsSync(adminSpecReadme)) {
    forceWrite(
      adminSpecReadme,
      `# admin-spec — modules propres au repo admin

Specs des modules développés DANS ce repo admin (standard kit
\`docs/DOC-STANDARD-MODULE.md\`) : un dossier \`modules/<id>/\` par module,
4 fichiers (\`prd.md\`, \`interview.md\`, \`TODO.md\`, \`CHANGELOG.md\`).

Les modules admin NATIFS (flotte, tickets, prospects, roadmap, billing…)
sont documentés côté kit dans \`packages/admin/modules/<id>/\` — ne pas les
dupliquer ici. Scaffold d'un nouveau module :
\`creezio brand module init <id> --app .\` (détecte \`admin-spec/\`).
`,
      written,
    );
  }
  for (const [name, body] of Object.entries(moduleTemplateFiles())) {
    const dest = path.join(outDir, "admin-spec", "modules", "_template", name);
    if (!fs.existsSync(dest)) forceWrite(dest, body, written);
  }

  // 5. Marqueur mode admin (root package.json).
  const rootPkgPath = path.join(outDir, "package.json");
  const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, "utf8")) as {
    creezio?: Record<string, unknown>;
    scripts?: Record<string, string>;
  };
  rootPkg.creezio = { ...(rootPkg.creezio || {}), appMode: "admin" };
  rootPkg.scripts = {
    ...(rootPkg.scripts || {}),
    "fleet-backend:up":
      "node server/scripts/creezio-cli.mjs server-docker admin up --admin-root .",
  };
  fs.writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2) + "\n");

  // 6. Config flotte versionnée SANS secrets + docs.
  forceWrite(
    path.join(outDir, "server-admin.json"),
    renderServerAdminJson(o),
    written,
  );
  forceWrite(path.join(outDir, "fleet-hosts.json"), renderFleetHostsJson(), written);
  forceWrite(
    path.join(outDir, "docker-compose.admin.yml"),
    renderComposeYml(o),
    written,
  );
  forceWrite(path.join(outDir, ".env.example"), renderAdminEnvExample(o), written);
  forceWrite(path.join(outDir, "README.md"), renderAdminAppReadme(o), written);
  // .gitignore app + runtime flotte.
  const gitignorePath = path.join(outDir, ".gitignore");
  const gi = fs.existsSync(gitignorePath)
    ? fs.readFileSync(gitignorePath, "utf8")
    : "";
  if (!gi.includes("docker-data/")) {
    fs.writeFileSync(
      gitignorePath,
      gi.trimEnd() +
        `\n# Runtime flotte + app (secrets : pass Basic, tokens agents)\ndocker-data/\n.github-token\n`,
    );
  }

  return { outDir, writtenFiles: written };
}

export function scaffoldAdminRepo(o: AdminRepoOptions): AdminRepoResult {
  const outDir = path.resolve(o.outDir);
  const force = Boolean(o.force);
  const written: string[] = [];
  writeFile(
    path.join(outDir, "server-admin.json"),
    renderServerAdminJson(o),
    force,
    written,
  );
  writeFile(
    path.join(outDir, "fleet-hosts.json"),
    renderFleetHostsJson(),
    force,
    written,
  );
  writeFile(path.join(outDir, ".gitignore"), renderGitignore(), force, written);
  writeFile(
    path.join(outDir, ".env.example"),
    renderEnvExample(o),
    force,
    written,
  );
  writeFile(
    path.join(outDir, "docker-compose.admin.yml"),
    renderComposeYml(o),
    force,
    written,
  );
  writeFile(path.join(outDir, "README.md"), renderReadme(o), force, written);
  return { outDir, writtenFiles: written };
}
