"use client";

import { getShellDesktopApi, getShellUiBrand } from "@creezio/shell-ui";

/**
 * Réindexation Meili GED — sans factory-reset.
 * Desktop uniquement (IPC search:reindex).
 */

import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../primitives/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../primitives/card";

type HealthPayload = {
  health?: { ok?: boolean; status?: string; error?: string };
  coherence?: {
    stale?: boolean;
    reason?: string;
    sql?: Record<string, number>;
    meili?: Record<string, number>;
  };
};

export function SearchReindexSettings() {
  const [desktop, setDesktop] = useState(false);
  const [busy, setBusy] = useState(false);
  const [health, setHealth] = useState<HealthPayload | null>(null);

  useEffect(() => {
    setDesktop(Boolean(getShellDesktopApi()?.reindexSearch));
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/v1/search/health");
        if (res.ok) setHealth((await res.json()) as HealthPayload);
      } catch {
        /* ignore */
      }
    })();
  }, []);

  if (!desktop && !health) return null;

  async function refreshHealth() {
    try {
      const res = await fetch("/api/v1/search/health");
      if (res.ok) setHealth((await res.json()) as HealthPayload);
    } catch {
      /* ignore */
    }
  }

  async function onReindex() {
    const api = getShellDesktopApi();
    if (!api?.reindexSearch) {
      toast.error("Réindexation disponible uniquement sur l’app desktop");
      return;
    }
    setBusy(true);
    try {
      const r = await api.reindexSearch();
      if (!r.ok) {
        toast.error(r.error || "Échec de la réindexation");
        return;
      }
      toast.success(
        r.ready
          ? "Recherche réindexée"
          : `Réindexation terminée (${r.reason || "vérifiez le health"})`,
      );
      await refreshHealth();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(false);
    }
  }

  const stale = Boolean(health?.coherence?.stale);
  const reason = health?.coherence?.reason;

  return (
    <Card className={stale ? "border-amber-300" : undefined}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Search className="h-4 w-4" /> Recherche (Meilisearch)
        </CardTitle>
        <CardDescription>
          Recalcule l&apos;index local (entreprises, contacts, dossiers, pièces)
          sans effacer vos données. Utile si Ctrl+K ne trouve plus un contact
          pourtant présent en base.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {health?.coherence ? (
          <p className="text-xs text-slate-500">
            État :{" "}
            <span className={stale ? "font-medium text-amber-700" : "text-emerald-700"}>
              {stale ? `désynchronisé (${reason})` : "cohérent"}
            </span>
            {health.coherence.sql ? (
              <>
                {" "}
                · SQL entreprises={health.coherence.sql.entreprises ?? "?"} /
                contacts={health.coherence.sql.contacts ?? "?"}
              </>
            ) : null}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {desktop ? (
            <Button type="button" onClick={() => void onReindex()} disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Indexation…
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" /> Réindexer la recherche
                </>
              )}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={() => void refreshHealth()}
            disabled={busy}
          >
            Actualiser l&apos;état
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
