"use client";

import { getShellDesktopApi, getShellUiBrand } from "@creezio/shell-ui";

/**
 * Pont desktop global (monté dans WorkspaceRoot, no-op en web).
 *
 * Écoute les demandes du process principal Electron :
 * - "supplier-tab-opened" : un onglet fournisseur vient d'être ouvert
 *   (lien externe, bot supplier_open_tab) → ouvrir/activer l'onglet
 *   workspace correspondant (plus de navigation forcée vers /navigateur).
 */

import { useEffect, useRef } from "react";
import {
  useTabWorkspaceOptional,
  type OpenSupplierSiteOpts,
} from "../workspace/tab-workspace-host";

function titleFromInfo(url: string, rawTitle?: string): string {
  const t = (rawTitle || "").trim();
  if (t) return t;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Site fournisseur";
  }
}

export function DesktopBridge() {
  const workspace = useTabWorkspaceOptional();
  const openRef = useRef(workspace?.openSupplierSite);
  const readyRef = useRef(Boolean(workspace?.ready));
  const pendingRef = useRef<OpenSupplierSiteOpts[]>([]);
  openRef.current = workspace?.openSupplierSite;
  readyRef.current = Boolean(workspace?.ready);

  // Rejouer les ouvertures reçues avant l'hydratation workspace.
  useEffect(() => {
    if (!workspace?.ready || !workspace.openSupplierSite) return;
    const pending = pendingRef.current;
    if (!pending.length) return;
    pendingRef.current = [];
    for (const opts of pending) workspace.openSupplierSite(opts);
  }, [workspace?.ready, workspace?.openSupplierSite, workspace]);

  useEffect(() => {
    const api = getShellDesktopApi();
    if (!api?.onSupplierTabOpened) return;
    return api.onSupplierTabOpened((info: {
      fournisseurId?: number;
      url: string;
      title?: string;
      electronTabId?: string;
    }) => {
      const opts: OpenSupplierSiteOpts = {
        fournisseurId: info.fournisseurId,
        url: info.url,
        title: titleFromInfo(info.url, info.title),
        electronTabId: info.tabId,
      };
      if (readyRef.current && openRef.current) {
        openRef.current(opts);
      } else {
        pendingRef.current.push(opts);
      }
    });
  }, []);

  return null;
}
