/**
 * Générateur pages OS Next — wrappers fins qui consomment les exports UI kit
 * (`@creezio/<pkg>/ui`). La marque ne réimplémente PAS mails/tasks/mcp/setup.
 */
import type { AppManifest } from "@creezio/brand-config";
import type { ProductModel } from "../product-model.js";

export type OsUiPageSpec = {
  /** Chemin relatif sous ui/app/ (ex. "mails/page.tsx") */
  rel: string;
  source: string;
};

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
 * Catalogue des surfaces OS natives à scaffolder dans toute marque from-prd.
 * Pas de marker owned-by-brand : le kit peut les régénérer.
 */
export function listOsUiPages(manifest: AppManifest): OsUiPageSpec[] {
  const bridge = manifest.bridgeName;
  const product = manifest.client.productName;
  const hostSuffix = manifest.domains?.primary || `${manifest.brandId}.local`;

  return [
    {
      rel: "lib/creezio-ui-boot.tsx",
      source: `"use client";

import { useEffect, type ReactNode } from "react";
import { configureShellUiBrand } from "@creezio/shell-ui";

/**
 * Boot client OS — identity desktop + tokens shell-ui.
 * Généré factory ; ne pas y mettre de métier marque.
 */
export function CreezioUiBoot({ children }: { children: ReactNode }) {
  useEffect(() => {
    configureShellUiBrand({
      desktopApiGlobal: ${JSON.stringify(bridge)},
      productName: ${JSON.stringify(product)},
      publicHostSuffix: ${JSON.stringify(hostSuffix)},
    });
  }, []);
  return <>{children}</>;
}
`,
    },
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
        `import { DesktopSettingsPage } from "@creezio/shell-ui/ui";`,
        `    <DesktopSettingsPage />`,
      ),
    },
    {
      rel: "configuration/page.tsx",
      source: pageClient(
        `import { DesktopSettingsPage } from "@creezio/shell-ui/ui";`,
        `    <DesktopSettingsPage />`,
      ),
    },
    {
      rel: "parametres/page.tsx",
      source: pageClient(
        `import { DesktopSettingsPage } from "@creezio/shell-ui/ui";`,
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
        `import { AccountSettings } from "@creezio/shell-ui/ui";`,
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
          dev: "next dev -p 18790",
          build: "next build",
          start: "node .next/standalone/server.js",
        },
        dependencies: {
          "@creezio/shell-ui": "file:../vendor/creezio/shell-ui",
          "@creezio/mails": "file:../vendor/creezio/mails",
          "@creezio/tasks": "file:../vendor/creezio/tasks",
          "@creezio/auth": "file:../vendor/creezio/auth",
          "@creezio/onboarding": "file:../vendor/creezio/onboarding",
          "@creezio/mcp-facade": "file:../vendor/creezio/mcp-facade",
          "@creezio/product-hub": "file:../vendor/creezio/product-hub",
          "@creezio/cockpit": "file:../vendor/creezio/cockpit",
          "@creezio/database": "file:../vendor/creezio/database",
          "@creezio/observability": "file:../vendor/creezio/observability",
          next: "15.3.3",
          react: "19.1.0",
          "react-dom": "19.1.0",
          "lucide-react": "^0.511.0",
          sonner: "^2.0.3",
          "date-fns": "^4.1.0",
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
  return `/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  reactStrictMode: true,
  transpilePackages: [
    "@creezio/shell-ui",
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
};

export default nextConfig;
`;
}

/** Layout marque : nav métier + liens OS kit (pas de fetch maison). */
export function renderNextLayoutWithOsNav(model: ProductModel): string {
  const brandLinks = model.pages
    .map((p) => `    [${JSON.stringify(p.path)}, ${JSON.stringify(p.title)}]`)
    .join(",\n");
  const osLinks = [
    `["/taches", "Tâches"]`,
    `["/mails", "Mails"]`,
    `["/setup", "Setup"]`,
    `["/settings", "Réglages"]`,
    `["/developers", "MCP"]`,
  ].join(",\n  ");

  return `import type { ReactNode } from "react";
import { CreezioUiBoot } from "./lib/creezio-ui-boot";

export const metadata = {
  title: ${JSON.stringify(model.brandName)},
  description: ${JSON.stringify(model.tagline)},
};

const BRAND_NAV = [
${brandLinks}
] as const;

const OS_NAV = [
  ${osLinks}
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
        <CreezioUiBoot>
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
            <span style={{ opacity: 0.35 }}>|</span>
            {OS_NAV.map(([href, label]) => (
              <a key={href} href={href} style={{ color: "#3d5a52", fontSize: "0.95em" }}>
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
