"use client";

import { getShellDesktopApi, getShellUiBrand } from "@creezio/shell-ui";

/**
 * Lien vers le site d'un fournisseur.
 *
 * - App desktop (Electron) : ouvre immédiatement un ONGLET WORKSPACE (spinner
 *   dans le slot) puis charge la WebContentsView en arrière-plan.
 * - Navigateur web classique : simple lien target=_blank.
 */

import { useCallback, type MouseEvent, type ReactNode } from "react";
import { useTabWorkspaceOptional } from "../workspace/tab-workspace-host";

export function SiteLink({
  url,
  fournisseurId = 0,
  className,
  title,
  children,
  "data-tf2-aid": aid,
}: {
  url: string;
  /** Id du fournisseur (partition persistante). 0 = onglet générique (hash host). */
  fournisseurId?: number;
  className?: string;
  title?: string;
  children: ReactNode;
  "data-tf2-aid"?: string;
}) {
  const workspace = useTabWorkspaceOptional();

  const onClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      const api = getShellDesktopApi();
      if (!api) return; // web : laisse le target=_blank normal
      e.preventDefault();

      let tabTitle = (title || "").trim();
      if (!tabTitle) {
        try {
          tabTitle = new URL(url).hostname.replace(/^www\./, "");
        } catch {
          tabTitle = "Site fournisseur";
        }
      }

      // Onglet workspace tout de suite (évite le vide pendant openTab/load).
      if (workspace?.openSupplierSite) {
        workspace.openSupplierSite({
          fournisseurId,
          url,
          title: tabTitle,
          navigateUrl: true,
        });
        return;
      }

      // Hors shell workspace : fallback IPC puis navigation.
      api
        .openTab(fournisseurId, url)
        .then((res) => {
          window.location.assign(`/site/${res.fournisseurId || fournisseurId}`);
        })
        .catch(() => {
          window.open(url, "_blank", "noreferrer");
        });
    },
    [url, fournisseurId, title, workspace],
  );

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={className}
      title={title}
      onClick={onClick}
      data-tf2-aid={aid}
    >
      {children}
    </a>
  );
}
