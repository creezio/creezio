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
 * Layout marque : nav métier uniquement.
 * Les surfaces OS vivent dans @creezio/os-ui (matérialisées hors git).
 * Boot identity via props marque — pas de dossier OS versionné.
 */
export function renderNextLayoutWithOsNav(model: ProductModel): string {
  const brandLinks = model.pages
    .map((p) => `    [${JSON.stringify(p.path)}, ${JSON.stringify(p.title)}]`)
    .join(",\n");
  const bridge = `${model.brandId}Desktop`;
  const host = model.domain || `${model.brandId}.local`;

  return `import type { ReactNode } from "react";
import { CreezioUiBoot } from "@creezio/os-ui/boot";

export const metadata = {
  title: ${JSON.stringify(model.brandName)},
  description: ${JSON.stringify(model.tagline)},
};

const BRAND_NAV = [
${brandLinks}
] as const;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          fontFamily:
            '"Source Serif 4", "Iowan Old Style", Georgia, serif',
          background:
            "linear-gradient(165deg,#e7f0ec,#f6f3eb 50%,#e9eef5)",
          color: "#14201c",
          minHeight: "100vh",
        }}
      >
        <CreezioUiBoot
          desktopApiGlobal={${JSON.stringify(bridge)}}
          productName={${JSON.stringify(model.brandName)}}
          publicHostSuffix={${JSON.stringify(host)}}
        >
          <header
            style={{
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid rgba(20,32,28,0.08)",
            }}
          >
            <strong style={{ fontSize: "1.35rem", letterSpacing: "-0.02em" }}>
              ${model.brandName}
            </strong>
            <span style={{ marginLeft: "0.75rem", opacity: 0.7 }}>
              ${model.tagline}
            </span>
          </header>
          <nav
            style={{
              display: "flex",
              gap: "0.85rem",
              padding: "0.75rem 1.5rem",
              flexWrap: "wrap",
            }}
          >
            {BRAND_NAV.map(([href, label]) => (
              <a key={href} href={href} style={{ color: "#0f3d32" }}>
                {label}
              </a>
            ))}
          </nav>
          <main
            style={{ padding: "1.5rem", maxWidth: "56rem", margin: "0 auto" }}
          >
            {children}
          </main>
        </CreezioUiBoot>
      </body>
    </html>
  );
}
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
