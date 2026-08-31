"use client";

/**
 * Page /grokbot côté serveur marque — compose les panneaux extraits :
 * - `grokbot-launch-form.tsx` (GROKBOT-1)
 * - `grokbot-usage-artifacts.tsx` (GROKBOT-1)
 * - `grokbot-agent-runs.tsx` (GROKBOT-2)
 *
 * API : /api/v1/modules/grokbot/* (mount natif @creezio/grokbot).
 */

import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card, Input } from "@creezio/shell-ui/ui/kit";
import { GrokbotLaunchForm } from "./grokbot-launch-form";
import { GrokbotUsageArtifacts } from "./grokbot-usage-artifacts";
import { GrokbotAgentRuns } from "./grokbot-agent-runs";

const API = "/api/v1/modules/grokbot";

type StatusView = {
  connected: boolean;
  apiKeyName?: string | null;
  userEmail?: string | null;
  reason?: string;
};

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

type ModelItem = { id: string; displayName?: string };

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

export function GrokbotClient() {
  const [status, setStatus] = useState<StatusView | null>(null);
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [models, setModels] = useState<ModelItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [token, setToken] = useState("");
  const [maskedToken, setMaskedToken] = useState<string | null>(null);

  const [prompt, setPrompt] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [modelId, setModelId] = useState("");
  const [autoCreatePR, setAutoCreatePR] = useState(false);

  const [openId, setOpenId] = useState<string | null>(null);
  const [runs, setRuns] = useState<RunItem[]>([]);
  const [followup, setFollowup] = useState("");

  const refresh = useCallback(async () => {
    try {
      const [s, c] = await Promise.all([
        fetch(`${API}/status`, { cache: "no-store" }).then((r) => r.json()),
        fetch(`${API}/config`, { cache: "no-store" }).then((r) => r.json()),
      ]);
      if (s?.ok) setStatus(s);
      if (c?.ok) setMaskedToken(c.config?.apiKey ?? null);
      if (s?.ok && s.connected) {
        const a = await fetch(`${API}/agents?limit=50`, { cache: "no-store" }).then(
          (r) => r.json(),
        );
        if (a?.ok) setAgents(a.items || []);
        if (models.length === 0) {
          const m = await fetch(`${API}/models`, { cache: "no-store" }).then((r) =>
            r.json(),
          );
          if (m?.ok) setModels(m.data?.items || []);
        }
      } else {
        const a = await fetch(`${API}/agents?source=local`, {
          cache: "no-store",
        }).then((r) => r.json());
        if (a?.ok) setAgents(a.items || []);
      }
      setError(null);
    } catch {
      setError("Module GrokBot injoignable");
    }
  }, [models.length]);

  const loadRuns = useCallback(async (agentId: string) => {
    setOpenId(agentId);
    setRuns([]);
    try {
      const r = await fetch(`${API}/agents/${encodeURIComponent(agentId)}/runs`, {
        cache: "no-store",
      });
      const j = await r.json();
      if (j?.ok) setRuns(j.data?.items || []);
    } catch {
      /* refresh au prochain poll */
    }
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => {
      void refresh();
      if (openId) void loadRuns(openId);
    }, 15000);
    return () => clearInterval(t);
  }, [refresh, openId, loadRuns]);

  const saveToken = useCallback(async () => {
    if (!token.trim()) return;
    setBusy(true);
    try {
      const r = await fetch(`${API}/config`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ apiKey: token.trim() }),
      });
      const j = await r.json();
      if (j?.ok) {
        setToken("");
        setNotice("Token Cursor enregistré.");
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  }, [token, refresh]);

  const launchAgent = useCallback(async () => {
    if (!prompt.trim()) return;
    setBusy(true);
    setNotice(null);
    try {
      const body: Record<string, unknown> = { text: prompt.trim() };
      if (repoUrl.trim()) body.repoUrl = repoUrl.trim();
      if (modelId) body.modelId = modelId;
      if (autoCreatePR) body.autoCreatePR = true;
      const r = await fetch(`${API}/agents`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (j?.ok) {
        setPrompt("");
        setNotice(`Agent lancé : ${j.agent?.name || j.agent?.id}`);
        await refresh();
        if (j.agent?.id) void loadRuns(j.agent.id);
      } else {
        setNotice(`Échec : ${j?.error || r.status}`);
      }
    } finally {
      setBusy(false);
    }
  }, [prompt, repoUrl, modelId, autoCreatePR, refresh, loadRuns]);

  const sendFollowup = useCallback(async () => {
    if (!openId || !followup.trim()) return;
    setBusy(true);
    try {
      const r = await fetch(`${API}/agents/${encodeURIComponent(openId)}/runs`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: followup.trim() }),
      });
      const j = await r.json();
      if (j?.ok) {
        setFollowup("");
        await loadRuns(openId);
      } else {
        setNotice(`Échec : ${j?.detail?.error?.message || j?.error || r.status}`);
      }
    } finally {
      setBusy(false);
    }
  }, [openId, followup, loadRuns]);

  const cancelRun = useCallback(
    async (runId: string) => {
      if (!openId) return;
      await fetch(
        `${API}/agents/${encodeURIComponent(openId)}/runs/${encodeURIComponent(runId)}/cancel`,
        { method: "POST" },
      );
      await loadRuns(openId);
    },
    [openId, loadRuns],
  );

  const archiveAgent = useCallback(
    async (agentId: string) => {
      await fetch(`${API}/agents/${encodeURIComponent(agentId)}/archive`, {
        method: "POST",
      });
      if (openId === agentId) setOpenId(null);
      await refresh();
    },
    [openId, refresh],
  );

  const open = agents.find((a) => a.id === openId) || null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">GrokBot</h1>
        <p className="text-sm text-muted-foreground">
          Pilotez vos agents cloud depuis l'app : lancez un agent sur un
          dépôt, suivez ses runs, envoyez des prompts de suivi.
        </p>
      </div>

      {error ? (
        <Card className="border-destructive p-4 text-sm text-destructive">
          {error}
        </Card>
      ) : null}
      {notice ? <Card className="p-4 text-sm">{notice}</Card> : null}

      <Card className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Connexion Cursor</h2>
          <Badge variant={status?.connected ? "default" : "destructive"}>
            {status?.connected
              ? `Connecté${status.userEmail ? ` — ${status.userEmail}` : ""}`
              : "Non connecté"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Input
            className="flex-1"
            type="password"
            placeholder={
              maskedToken
                ? `Token actuel : ${maskedToken} (remplacer…)`
                : "Token API Cursor (Dashboard → API Keys)"
            }
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <Button size="sm" onClick={saveToken} disabled={busy || !token.trim()}>
            Enregistrer
          </Button>
        </div>
      </Card>

      <GrokbotLaunchForm
        connected={Boolean(status?.connected)}
        busy={busy}
        prompt={prompt}
        onPromptChange={setPrompt}
        repoUrl={repoUrl}
        onRepoUrlChange={setRepoUrl}
        modelId={modelId}
        onModelIdChange={setModelId}
        models={models}
        autoCreatePR={autoCreatePR}
        onAutoCreatePRChange={setAutoCreatePR}
        onLaunch={() => void launchAgent()}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            Agents ({agents.length})
          </h2>
          {agents.length === 0 ? (
            <Card className="p-4 text-sm text-muted-foreground">
              Aucun agent pour l'instant.
            </Card>
          ) : null}
          {agents.map((a) => (
            <Card
              key={a.id}
              className={`cursor-pointer p-3 transition-colors hover:bg-accent ${
                openId === a.id ? "border-primary" : ""
              }`}
              onClick={() => void loadRuns(a.id)}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">
                  {a.name || a.id}
                </span>
                <Badge variant={statusVariant(a.status)}>{a.status || "?"}</Badge>
              </div>
              <div className="mt-1 truncate text-xs text-muted-foreground">
                {a.repo_url || "—"}
              </div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {fmtDate(a.createdAt || a.created_at)}
              </div>
            </Card>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {open ? (
            <GrokbotUsageArtifacts agentId={open.id} prUrl={open.pr_url} />
          ) : null}
          <GrokbotAgentRuns
            open={open}
            runs={runs}
            followup={followup}
            onFollowupChange={setFollowup}
            onSendFollowup={() => void sendFollowup()}
            onCancelRun={(id) => void cancelRun(id)}
            onArchive={(id) => void archiveAgent(id)}
            busy={busy}
          />
        </div>
      </div>
    </div>
  );
}
