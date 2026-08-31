"use client";

/**
 * Panneau runs de l'agent ouvert — possédé par GROKBOT-2.
 * GROKBOT-1 l'extrait tel quel et ne l'enrichit pas (pas de poll fin,
 * unarchive, AlertDialog, skeletons).
 */

import { Badge, Button, Card } from "@creezio/shell-ui/ui/kit";

type AgentItem = {
  id: string;
  name?: string | null;
  status?: string | null;
  url?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
  latestRunId?: string | null;
  latest_run_id?: string | null;
  repo_url?: string | null;
  pr_url?: string | null;
};

type RunItem = {
  id: string;
  status: string;
  createdAt?: string;
  durationMs?: number;
  result?: string;
  git?: { branches?: Array<{ repoUrl?: string; branch?: string; prUrl?: string }> };
};

function statusVariant(
  status: string | null | undefined,
): "default" | "secondary" | "destructive" | "outline" {
  const s = (status || "").toUpperCase();
  if (s === "RUNNING" || s === "CREATING" || s === "ACTIVE") return "default";
  if (s === "FINISHED" || s === "IDLE") return "secondary";
  if (s === "ERROR" || s === "EXPIRED") return "destructive";
  return "outline";
}

function fmtDate(iso: string | null | undefined): string {
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

export type GrokbotAgentRunsProps = {
  open: AgentItem | null;
  runs: RunItem[];
  followup: string;
  onFollowupChange: (value: string) => void;
  onSendFollowup: () => void;
  onCancelRun: (runId: string) => void;
  onArchive: (agentId: string) => void;
  busy: boolean;
};

export function GrokbotAgentRuns({
  open,
  runs,
  followup,
  onFollowupChange,
  onSendFollowup,
  onCancelRun,
  onArchive,
  busy,
}: GrokbotAgentRunsProps) {
  if (!open) {
    return (
      <Card className="p-4 text-sm text-muted-foreground">
        Sélectionnez un agent pour voir ses runs.
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="truncate text-base font-semibold">{open.name || open.id}</h2>
        <div className="flex items-center gap-2">
          {open.url ? (
            <a
              className="text-xs underline"
              href={open.url}
              target="_blank"
              rel="noreferrer"
            >
              Ouvrir dans Cursor
            </a>
          ) : null}
          <Button size="sm" variant="outline" onClick={() => void onArchive(open.id)}>
            Archiver
          </Button>
        </div>
      </div>
      <div className="flex max-h-96 flex-col gap-2 overflow-y-auto">
        {runs.map((r) => (
          <div key={r.id} className="rounded-md bg-muted p-2 text-sm">
            <div className="flex items-center justify-between">
              <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted-foreground">
                  {fmtDate(r.createdAt)}
                </span>
                {r.status === "RUNNING" || r.status === "CREATING" ? (
                  <Button size="sm" variant="outline" onClick={() => void onCancelRun(r.id)}>
                    Annuler
                  </Button>
                ) : null}
              </div>
            </div>
            {r.result ? (
              <div className="mt-2 whitespace-pre-wrap text-xs">{r.result}</div>
            ) : null}
            {r.git?.branches?.length ? (
              <div className="mt-1 text-[11px] text-muted-foreground">
                {r.git.branches
                  .map((b) => b.prUrl || b.branch)
                  .filter(Boolean)
                  .join(" · ")}
              </div>
            ) : null}
          </div>
        ))}
        {runs.length === 0 ? (
          <div className="text-sm text-muted-foreground">Aucun run chargé.</div>
        ) : null}
      </div>
      <div className="flex flex-col gap-2">
        <textarea
          className="min-h-16 w-full rounded-md border bg-transparent p-2 text-sm outline-none"
          placeholder="Prompt de suivi…"
          value={followup}
          onChange={(e) => onFollowupChange(e.target.value)}
        />
        <div>
          <Button size="sm" onClick={onSendFollowup} disabled={busy || !followup.trim()}>
            Envoyer
          </Button>
        </div>
      </div>
    </Card>
  );
}
