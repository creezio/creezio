/**
 * Catalogue OS Next — source de vérité = `@creezio/os-ui/routes`.
 * La factory ne versionne PLUS ces pages dans ui/app/ d'une marque :
 * elles sont matérialisées localement sous `ui/app/(creezio-os)/` (gitignoré).
 */
import type { AppManifest } from "@creezio/brand-config";
import type { ProductModel } from "../product-model.js";

export type OsUiPageSpec = {
  /** Chemin relatif sous routes/ (ex. "mails/page.tsx") */
  rel: string;
  source: string;
};

/** Segments OS interdits dans ui/app/ versionné d'une marque. */
export const FORBIDDEN_BRAND_OS_UI_SEGMENTS = [
  "admin",
  "cockpit",
  "collaborateurs",
  "configuration",
  "developers",
  "login",
  "mails",
  "mcp",
  "onboarding",
  "parametres",
  "server-cockpit",
  "settings",
  "setup",
  "taches",
] as const;

function pageClient(importLine: string, jsx: string): string {
  return `"use client";

${importLine}

export default function Page() {
  return (
${jsx}
  );
}
`;
}

/**
 * Catalogue des surfaces OS (référence / sync package os-ui).
 * Ne plus écrire ces chemins dans le git de la marque.
 */
export function listOsUiPages(_manifest: AppManifest): OsUiPageSpec[] {
  return [
    {
      rel: "mails/page.tsx",
      source: pageClient(
        `import { MailInbox } from "@creezio/mails/ui";`,
        `    <MailInbox />`,
      ),
    },
    {
      rel: "taches/page.tsx",
      source: pageClient(
        `import { TasksKanbanClient } from "@creezio/tasks/ui";`,
        `    <TasksKanbanClient />`,
      ),
    },
    {
      rel: "login/page.tsx",
      source: pageClient(
        `import { Suspense } from "react";
import { LoginForm } from "@creezio/auth/ui";`,
        `    <Suspense fallback={<p>Chargement…</p>}>
      <LoginForm defaultRedirect="/dashboard" />
    </Suspense>`,
      ),
    },
    {
      rel: "setup/page.tsx",
      source: pageClient(
        `import { SetupWizard } from "@creezio/onboarding/ui";`,
        `    <SetupWizard />`,
      ),
    },
    {
      rel: "onboarding/page.tsx",
      source: `"use client";

/**
 * Point d'entrée onboarding — les étapes métier sont injectées par la marque
 * via OnboardingWizard + defineOnboardingSteps. Sans steps : lien setup OS.
 */
export default function Page() {
  return (
    <section>
      <h1>Onboarding</h1>
      <p>
        Les étapes produit se déclarent côté marque (
        <code>@creezio/onboarding/ui</code>). First-run technique :{" "}
        <a href="/setup">/setup</a>.
      </p>
    </section>
  );
}
`,
    },
    {
      rel: "settings/page.tsx",
      source: pageClient(
        `import { DesktopSettingsPage } from "@creezio/shell-ui/ui/os-pages";`,
        `    <DesktopSettingsPage />`,
      ),
    },
    {
      rel: "configuration/page.tsx",
      source: pageClient(
        `import { DesktopSettingsPage } from "@creezio/shell-ui/ui/os-pages";`,
        `    <DesktopSettingsPage />`,
      ),
    },
    {
      rel: "parametres/page.tsx",
      source: pageClient(
        `import { DesktopSettingsPage } from "@creezio/shell-ui/ui/os-pages";`,
        `    <DesktopSettingsPage />`,
      ),
    },
    {
      rel: "developers/page.tsx",
      source: pageClient(
        `import { McpAdminClient } from "@creezio/mcp-facade/ui";`,
        `    <McpAdminClient />`,
      ),
    },
    {
      rel: "mcp/page.tsx",
      source: pageClient(
        `import { McpAdminClient } from "@creezio/mcp-facade/ui";`,
        `    <McpAdminClient />`,
      ),
    },
    {
      rel: "admin/mcp/page.tsx",
      source: pageClient(
        `import { McpAdminClient } from "@creezio/mcp-facade/ui";`,
        `    <McpAdminClient />`,
      ),
    },
    {
      rel: "admin/plugins/page.tsx",
      source: pageClient(
        `import { AdminPluginsList } from "@creezio/product-hub/ui";`,
        `    <AdminPluginsList />`,
      ),
    },
    {
      rel: "admin/database/page.tsx",
      source: pageClient(
        `import { DatabaseClient } from "@creezio/database/ui";`,
        `    <DatabaseClient />`,
      ),
    },
    {
      rel: "admin/analytics/page.tsx",
      source: pageClient(
        `import { AnalyticsClient } from "@creezio/observability/ui";`,
        `    <AnalyticsClient />`,
      ),
    },
    {
      rel: "admin/request-logs/page.tsx",
      source: pageClient(
        `import { RequestLogsClient } from "@creezio/observability/ui";`,
        `    <RequestLogsClient />`,
      ),
    },
    {
      rel: "cockpit/page.tsx",
      source: pageClient(
        `import { CockpitClient } from "@creezio/cockpit/ui";`,
        `    <CockpitClient />`,
      ),
    },
    {
      rel: "server-cockpit/page.tsx",
      source: pageClient(
        `import { ServerCockpitShell } from "@creezio/cockpit/ui";`,
        `    <ServerCockpitShell />`,
      ),
    },
    {
      rel: "collaborateurs/page.tsx",
      source: pageClient(
        `import { AccountSettings } from "@creezio/shell-ui/ui/settings/account-settings";`,
        `    <>
      <h1>Collaborateurs</h1>
      <p style={{ opacity: 0.75 }}>Compte local / session — OS Creezio.</p>
      <AccountSettings />
    </>`,
      ),
    },
  ];
}

export function renderUiPackageJson(_manifest: AppManifest): string {
  return (
    JSON.stringify(
      {
        name: "@creezio/brand-ui",
        private: true,
        version: "0.1.0",
        scripts: {
          "predev": "npm run os-ui:materialize --prefix ..",
          "prebuild": "npm run os-ui:materialize --prefix ..",
          dev: "next dev -p 18790",
          build: "next build",
          start: "node .next/standalone/server.js",
        },
        dependencies: {
          "@creezio/os-ui": "file:../vendor/creezio/os-ui",
          "@creezio/shell-ui": "file:../vendor/creezio/shell-ui",
          "@creezio/assistant": "file:../vendor/creezio/assistant",
          "@creezio/mails": "file:../vendor/creezio/mails",
          "@creezio/tasks": "file:../vendor/creezio/tasks",
          "@creezio/auth": "file:../vendor/creezio/auth",
          "@creezio/onboarding": "file:../vendor/creezio/onboarding",
          "@creezio/mcp-facade": "file:../vendor/creezio/mcp-facade",
          "@creezio/product-hub": "file:../vendor/creezio/product-hub",
          "@creezio/cockpit": "file:../vendor/creezio/cockpit",
          "@creezio/database": "file:../vendor/creezio/database",
          "@creezio/observability": "file:../vendor/creezio/observability",
          "@radix-ui/react-avatar": "^1.1.10",
          "@radix-ui/react-dialog": "^1.1.14",
          "@radix-ui/react-dropdown-menu": "^2.1.15",
          "@radix-ui/react-label": "^2.1.7",
          "@radix-ui/react-scroll-area": "^1.2.9",
          "@radix-ui/react-select": "^2.2.5",
          "@radix-ui/react-separator": "^1.1.7",
          "@radix-ui/react-slot": "^1.2.3",
          "@radix-ui/react-tabs": "^1.1.12",
          "@tanstack/react-table": "^8.21.3",
          next: "15.3.3",
          react: "19.1.0",
          "react-dom": "19.1.0",
          "lucide-react": "^0.511.0",
          sonner: "^2.0.3",
          "date-fns": "^4.1.0",
          cmdk: "^1.1.1",
          recharts: "^2.15.3",
          "class-variance-authority": "^0.7.1",
          clsx: "^2.1.1",
          "tailwind-merge": "^3.3.0",
        },
        devDependencies: {
          "@types/node": "^22.15.3",
          "@types/react": "^19.1.2",
          "@types/react-dom": "^19.1.2",
          // Chrome kit (@creezio/shell-ui/ui) = classes Tailwind : sans le
          // build Tailwind, l'app rend du HTML brut non stylé.
          autoprefixer: "^10.4.21",
          postcss: "^8.5.3",
          tailwindcss: "^3.4.17",
          typescript: "^5.8.3",
        },
      },
      null,
      2,
    ) + "\n"
  );
}

export function renderUiNextConfig(): string {
  return `import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Cible kernel pour rewrite same-origin (UI plane navigateur / MCP). */
const metierProxyTarget = (
  process.env.METIER_BASE_URL ||
  process.env.NEXT_PUBLIC_METIER_BASE_URL ||
  "http://127.0.0.1:18791"
).replace(/\\/$/, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  // Sources vendor kit : typés dans creezio (workspaces). Ici, peers résolus via webpack.
  typescript: { ignoreBuildErrors: true },
  transpilePackages: [
    "@creezio/os-ui",
    "@creezio/shell-ui",
    "@creezio/assistant",
    "@creezio/mails",
    "@creezio/tasks",
    "@creezio/auth",
    "@creezio/onboarding",
    "@creezio/mcp-facade",
    "@creezio/product-hub",
    "@creezio/cockpit",
    "@creezio/database",
    "@creezio/observability",
  ],
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: \`\${metierProxyTarget}/api/v1/:path*\`,
      },
    ];
  },
  webpack: (config) => {
    // Imports depuis vendor/… résolvent les peers installés dans ui/node_modules.
    config.resolve.modules = [
      path.join(__dirname, "node_modules"),
      ...(config.resolve.modules || ["node_modules"]),
    ];
    return config;
  },
};

export default nextConfig;
`;
}

/** tsconfig UI — paths pour typer les sources vendor contre peers ui/. */
export function renderUiTsconfig(): string {
  return `{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2022"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "next": ["./node_modules/next"],
      "next/*": ["./node_modules/next/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
`;
}

/**
 * Layout marque : chrome CRM kit (sidebar/onglets/recherche) + nav métier.
 * Les surfaces OS vivent dans @creezio/os-ui (matérialisées hors git).
 * Boot identity via props marque — pas de dossier OS versionné.
 */
export function renderNextLayoutWithOsNav(model: ProductModel): string {
  const bridge = `${model.brandId}Desktop`;
  const host = model.domain || `${model.brandId}.local`;

  return `import type { ReactNode } from "react";
import { CreezioUiBoot } from "@creezio/os-ui/boot";
import { BrandChrome } from "@/components/brand-chrome";
import "@creezio/shell-ui/theme.css";
import "./globals.css";

export const metadata = {
  title: ${JSON.stringify(model.brandName)},
  description: ${JSON.stringify(model.tagline)},
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="antialiased">
        <CreezioUiBoot
          desktopApiGlobal={${JSON.stringify(bridge)}}
          productName={${JSON.stringify(model.brandName)}}
          publicHostSuffix={${JSON.stringify(host)}}
        >
          <BrandChrome>{children}</BrandChrome>
        </CreezioUiBoot>
      </body>
    </html>
  );
}
`;
}

/** Icône lucide générique par kind de page (pas de vocabulaire marque). */
const PAGE_KIND_ICONS: Record<string, string> = {
  dashboard: "LayoutDashboard",
  list: "List",
  detail: "FileText",
  form: "SquarePen",
  flow: "Workflow",
};

/**
 * Wiring chrome kit côté marque : nav + recherche + providers.
 * Fichier marque (personnalisable — ex. icônes par page), généré une fois.
 */
export function renderUiBrandChrome(model: ProductModel): string {
  const icons = new Set<string>(["Settings", "Users"]);
  const navLines = model.pages.map((p) => {
    const icon = PAGE_KIND_ICONS[p.kind] || "List";
    icons.add(icon);
    return `  { href: ${JSON.stringify(p.path)}, label: ${JSON.stringify(p.title)}, icon: ${icon} },`;
  });
  const iconImports = [...icons].sort().join(",\n  ");
  const storageKey = `${model.brandId}-global-search`;
  const home = defaultWorkspaceHome(model);

  return `"use client";
/**
 * creezio:owned-by-brand — wiring du chrome CRM kit (sidebar, onglets,
 * recherche). Le chrome lui-même vient de @creezio/shell-ui/ui : la marque
 * ne déclare que sa nav, ses icônes et une recherche minimale.
 */

import type { ReactNode } from "react";
import {
  ${iconImports},
} from "lucide-react";
import { SessionProvider } from "@creezio/auth/ui";
import { AssistantRoot } from "@creezio/assistant/ui";
import {
  configureDefaultNewTabHref,
  configureGlobalSearch,
  configureSidebar,
  WorkspaceRoot,
} from "@creezio/shell-ui/ui";

const NAV = [
${navLines.join("\n")}
];

configureSidebar({
  getNavItems: () => NAV,
  getAdminItems: () => [
    { href: "/parametres", label: "Paramètres", icon: Settings },
    { href: "/collaborateurs", label: "Collaborateurs", icon: Users },
  ],
});

configureGlobalSearch({
  placeholder: "Rechercher une page…",
  storageKey: ${JSON.stringify(storageKey)},
  search: async (query) => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return NAV.filter((n) => n.label.toLowerCase().includes(q)).map((n) => ({
      index: "pages",
      id: n.href,
      title: n.label,
      href: n.href,
    }));
  },
});

configureDefaultNewTabHref(${JSON.stringify(home)});

export function BrandChrome({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AssistantRoot>
        <WorkspaceRoot>{children}</WorkspaceRoot>
      </AssistantRoot>
    </SessionProvider>
  );
}
`;
}

/**
 * Home workspace : le chrome kit canonise "/" → /dashboard (DASHBOARD_PATH).
 * Si le modèle n'a pas de page dashboard, retomber sur la première page.
 */
export function defaultWorkspaceHome(model: ProductModel): string {
  const dash = model.pages.find(
    (p) => p.kind === "dashboard" || p.path === "/dashboard",
  );
  return dash?.path || model.pages[0]?.path || "/dashboard";
}

/**
 * Tailwind : preset kit (thème Creezio canonique, extrait du gold TF) +
 * scan app + composants + sources UI vendor kit.
 */
export function renderUiTailwindConfig(): string {
  return `import type { Config } from "tailwindcss";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

// Le design system vient du kit (preset + theme.css @creezio/shell-ui) :
// une app générée ne DOIT PAS repartir d'un thème vide / HTML brut.
// Le scan doit inclure les sources UI vendor (\`vendor/creezio/<pkg>/ui\`
// + routes OS), sinon les classes du kit sont purgées.
const config: Config = {
  presets: [require("@creezio/shell-ui/tailwind-preset")],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "../vendor/creezio/*/ui/**/*.{js,ts,jsx,tsx}",
    "../vendor/creezio/*/routes/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
`;
}

/** PostCSS CJS — le loader Next le lit tel quel (pas d'ESM ici). */
export function renderUiPostcssConfig(): string {
  return `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;
}

/**
 * Globals marque : directives Tailwind + overrides éventuels.
 * Le thème lui-même (tokens crème/encre, chrome onglets, sidebar sombre,
 * animations) vient du kit : `@creezio/shell-ui/theme.css`, importé par le
 * layout racine AVANT ce fichier.
 */
export function renderUiGlobalsCss(): string {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

/*
 * Le design system par défaut est le thème Creezio (@creezio/shell-ui/theme.css,
 * importé dans app/layout.tsx). Ce fichier ne contient que les directives
 * Tailwind + les overrides propres à la marque.
 */
`;
}

/** Script marque : matérialise ui/app/(creezio-os) depuis vendor. */
export function renderMaterializeOsUiScript(): string {
  return `#!/usr/bin/env node
/**
 * Matérialise les pages OS kit sous ui/app/(creezio-os)/ (gitignoré).
 * Ne pas versionner de dossier OS dans ui/app/.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const script = path.join(root, "vendor/creezio/os-ui/scripts/materialize.mjs");
const r = spawnSync(process.execPath, [script, "--app-root", root], {
  stdio: "inherit",
  env: { ...process.env, CREEZIO_BRAND_ROOT: root },
});
process.exit(r.status ?? 1);
`;
}
