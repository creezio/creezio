"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getShellDesktopApi } from "@creezio/shell-ui";
import { AssistantWidget, UiDriver } from "@creezio/assistant/ui";
import { DesktopBridge } from "../desktop/desktop-bridge";
import { AuthWindowChrome } from "../desktop/auth-window-chrome";
import { AiWorkspaceAgentHost } from "./ai-workspace-agent-host";
import { AiWorkspaceBanner } from "./ai-workspace-banner";
import { TabWorkspaceProvider } from "./tab-workspace-context";
import { WorkspaceShell } from "./workspace-shell";

function isAuthSurface(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/setup" ||
    pathname.startsWith("/setup/") ||
    pathname === "/onboarding" ||
    pathname.startsWith("/onboarding/")
  );
}

function isServerCockpitSurface(pathname: string | null): boolean {
  if (!pathname) return false;
  return (
    pathname === "/server-cockpit" || pathname.startsWith("/server-cockpit/")
  );
}

function defaultHideAssistantOn(pathname: string | null): boolean {
  return isAuthSurface(pathname) || isServerCockpitSurface(pathname);
}

export function WorkspaceRoot({
  children,
  wrapWorkspace,
  banners,
  afterShell,
  hideAssistantOn = defaultHideAssistantOn,
}: {
  children: ReactNode;
  wrapWorkspace?: (node: ReactNode) => ReactNode;
  banners?: ReactNode;
  afterShell?: ReactNode;
  hideAssistantOn?: (pathname: string | null) => boolean;
}) {
  const pathname = usePathname();
  const authSurface = isAuthSurface(pathname);
  const serverCockpit = isServerCockpitSurface(pathname);
  const hideAssistant = hideAssistantOn(pathname);

  // Hors session / cockpit serveur : masquer le FAB Electron topmost.
  useEffect(() => {
    if (!hideAssistant) return;
    void getShellDesktopApi()?.setAssistantChrome?.("hidden");
  }, [hideAssistant]);

  const content = authSurface ? (
    <AuthWindowChrome>{children}</AuthWindowChrome>
  ) : serverCockpit ? (
    <AuthWindowChrome variant="dark">{children}</AuthWindowChrome>
  ) : (
    children
  );

  const shell = (
    <WorkspaceShell>
      {hideAssistant ? null : <AiWorkspaceBanner />}
      {banners}
      {content}
    </WorkspaceShell>
  );

  const wrappedShell = wrapWorkspace ? wrapWorkspace(shell) : shell;
  const defaultAfterShell = (
    <>
      <DesktopBridge />
      {hideAssistant ? null : (
        <>
          <AssistantWidget />
          <UiDriver />
          <AiWorkspaceAgentHost />
        </>
      )}
    </>
  );

  return (
    <TabWorkspaceProvider>
      {wrappedShell}
      {afterShell === undefined ? defaultAfterShell : afterShell}
    </TabWorkspaceProvider>
  );
}
