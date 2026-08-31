"use client";

/**
 * Formulaire « Lancer un agent » — possédé par GROKBOT-1.
 * GROKBOT-2 ne touche pas ce fichier.
 */

import { Button, Card, Input } from "@creezio/shell-ui/ui/kit";

export type GrokbotLaunchFormProps = {
  connected: boolean;
  busy: boolean;
  prompt: string;
  onPromptChange: (value: string) => void;
  repoUrl: string;
  onRepoUrlChange: (value: string) => void;
  modelId: string;
  onModelIdChange: (value: string) => void;
  models: Array<{ id: string; displayName?: string }>;
  autoCreatePR: boolean;
  onAutoCreatePRChange: (value: boolean) => void;
  onLaunch: () => void;
};

export function GrokbotLaunchForm({
  connected,
  busy,
  prompt,
  onPromptChange,
  repoUrl,
  onRepoUrlChange,
  modelId,
  onModelIdChange,
  models,
  autoCreatePR,
  onAutoCreatePRChange,
  onLaunch,
}: GrokbotLaunchFormProps) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <h2 className="text-base font-semibold">Lancer un agent</h2>
      <textarea
        className="min-h-24 w-full rounded-md border bg-transparent p-3 text-sm outline-none"
        placeholder="Décrivez la mission de l'agent…"
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
      />
      <div className="grid gap-3 md:grid-cols-3">
        <Input
          placeholder="https://github.com/org/repo (optionnel)"
          value={repoUrl}
          onChange={(e) => onRepoUrlChange(e.target.value)}
        />
        <select
          className="rounded-md border bg-transparent p-2 text-sm"
          value={modelId}
          onChange={(e) => onModelIdChange(e.target.value)}
        >
          <option value="">Modèle par défaut</option>
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.displayName || m.id}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={autoCreatePR}
            onChange={(e) => onAutoCreatePRChange(e.target.checked)}
          />
          Ouvrir une PR à la fin
        </label>
      </div>
      <div>
        <Button onClick={onLaunch} disabled={busy || !prompt.trim() || !connected}>
          Lancer l'agent
        </Button>
      </div>
    </Card>
  );
}
