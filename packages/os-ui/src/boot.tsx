"use client";

import { useEffect, type ReactNode } from "react";
import {
  configureShellUiBrand,
  installCreezioDataChangedFetch,
  type ShellUiLoginBrand,
} from "@creezio/shell-ui";

export type CreezioUiBootProps = {
  children: ReactNode;
  /** Global bridge Electron (ex. tempoflowDesktop). */
  desktopApiGlobal: string;
  productName: string;
  publicHostSuffix: string;
  /**
   * Panneau brand de la page login split-screen (@creezio/auth LoginPage).
   * Absent = défaut neutre (gradient encre, tuile initiale, pas de tagline).
   */
  login?: ShellUiLoginBrand;
};

/**
 * Boot client OS — identity desktop + tokens shell-ui + fetch → bus data.
 * Vit dans @creezio/os-ui ; la marque ne stocke pas de page OS.
 *
 * configureShellUiBrand est appelé AU RENDER (parent avant enfants) pour que
 * la marque soit correcte dès le 1er paint de /login — zéro flash du défaut.
 * Idempotent : configureShellUiBrand no-op si rien ne change (StrictMode OK).
 */
export function CreezioUiBoot({
  children,
  desktopApiGlobal,
  productName,
  publicHostSuffix,
  login,
}: CreezioUiBootProps) {
  configureShellUiBrand({
    desktopApiGlobal,
    productName,
    publicHostSuffix,
    login,
  });
  useEffect(() => {
    installCreezioDataChangedFetch();
  }, []);
  return <>{children}</>;
}
