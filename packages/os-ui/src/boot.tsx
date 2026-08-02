"use client";

import { useEffect, type ReactNode } from "react";
import { configureShellUiBrand } from "@creezio/shell-ui";

export type CreezioUiBootProps = {
  children: ReactNode;
  /** Global bridge Electron (ex. tempoflowDesktop). */
  desktopApiGlobal: string;
  productName: string;
  publicHostSuffix: string;
};

/**
 * Boot client OS — identity desktop + tokens shell-ui.
 * Vit dans @creezio/os-ui ; la marque ne stocke pas de page OS.
 */
export function CreezioUiBoot({
  children,
  desktopApiGlobal,
  productName,
  publicHostSuffix,
}: CreezioUiBootProps) {
  useEffect(() => {
    configureShellUiBrand({
      desktopApiGlobal,
      productName,
      publicHostSuffix,
    });
  }, [desktopApiGlobal, productName, publicHostSuffix]);
  return <>{children}</>;
}
