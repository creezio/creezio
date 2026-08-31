"use client";

/**
 * Workspace notes Granola — liste filtrable + fiche (résumé / transcript).
 * Possédé par GRANOLA-1.
 */

import { useCallback, useEffect, useState } from "react";
import { Button, Card } from "@creezio/shell-ui/ui/kit";

const API = "/api/v1/modules/granola";

type NoteRow = {
  id: string;
  title: string | null;
  summary: string | null;
  note_created_at: string | null;
  synced_at: string;
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function GranolaNotesPanel() {
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [openNote, setOpenNote] = useState<Record<string, unknown> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const n = await fetch(`${API}/notes?limit=50`, { cache: "no-store" }).then(
        (r) => r.json(),
      );
      if (n?.ok) setNotes(n.items || []);
    } catch {
      /* refresh au prochain poll */
    }
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 20000);
    return () => clearInterval(t);
  }, [refresh]);

  const showNote = useCallback(async (id: string) => {
    try {
      const r = await fetch(`${API}/notes/${encodeURIComponent(id)}`, {
        cache: "no-store",
      });
      const j = await r.json();
      if (j?.ok) setOpenNote(j.note as Record<string, unknown>);
    } catch {
      /* refresh au prochain poll */
    }
  }, []);

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-sm font-medium text-muted-foreground">
        Notes synchronisées ({notes.length})
      </h2>
      {notes.length === 0 ? (
        <Card className="p-4 text-sm text-muted-foreground">
          Aucune note pour l'instant — dès que Granola livre un événement,
          la note est récupérée via l'API.
        </Card>
      ) : null}
      {notes.map((n) => (
        <Card
          key={n.id}
          className="cursor-pointer p-3 transition-colors hover:bg-accent"
          onClick={() => void showNote(n.id)}
        >
          <div className="truncate text-sm font-medium">{n.title || n.id}</div>
          <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {n.summary || "—"}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">
            Sync {fmtDate(n.synced_at)}
          </div>
        </Card>
      ))}
      {openNote ? (
        <Card className="p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold">
              {String(openNote.title ?? openNote.id ?? "Note")}
            </span>
            <Button size="sm" variant="outline" onClick={() => setOpenNote(null)}>
              Fermer
            </Button>
          </div>
          <div className="max-h-72 overflow-y-auto whitespace-pre-wrap text-xs">
            {String(openNote.summary ?? "(pas de résumé)")}
          </div>
        </Card>
      ) : null}
    </div>
  );
}
