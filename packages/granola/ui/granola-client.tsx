"use client";

/**
 * Page /granola côté serveur marque — configuration du connecteur Granola,
 * URL webhook à coller dans Granola, livraisons reçues et notes
 * synchronisées.
 *
 * API : /api/v1/modules/granola/* (mount natif @creezio/granola).
 */

import { useCallback, useEffect, useState } from "react";
import { Badge, Button, Card, Input } from "@creezio/shell-ui/ui/kit";

const API = "/api/v1/modules/granola";

type GranolaConfigView = {
  apiKey: string | null;
  signingSecret: string | null;
  publicBaseUrl: string | null;
  apiBaseUrl: string | null;
  webhookEndpointId: string | null;
};

type WebhookInfo = {
  url: string | null;
  apiKeyConfigured: boolean;
  signingSecretConfigured: boolean;
  webhookEndpointId: string | null;
};

type EventRow = {
  event_id: string;
  event_type: string;
  note_id: string | null;
  occurred_at: string | null;
  received_at: string;
  verified: number;
  deliveries: number;
};

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

export function GranolaClient() {
  const [config, setConfig] = useState<GranolaConfigView | null>(null);
  const [info, setInfo] = useState<WebhookInfo | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [openNote, setOpenNote] = useState<Record<string, unknown> | null>(null);

  const [apiKey, setApiKey] = useState("");
  const [signingSecret, setSigningSecret] = useState("");
  const [publicBaseUrl, setPublicBaseUrl] = useState("");

  const refresh = useCallback(async () => {
    try {
      const [c, i, e, n] = await Promise.all([
        fetch(`${API}/config`, { cache: "no-store" }).then((r) => r.json()),
        fetch(`${API}/webhook-info`, { cache: "no-store" }).then((r) => r.json()),
        fetch(`${API}/events?limit=50`, { cache: "no-store" }).then((r) => r.json()),
        fetch(`${API}/notes?limit=50`, { cache: "no-store" }).then((r) => r.json()),
      ]);
      if (c?.ok) setConfig(c.config);
      if (i?.ok) setInfo(i);
      if (e?.ok) setEvents(e.items || []);
      if (n?.ok) setNotes(n.items || []);
      setError(null);
    } catch {
      setError("Module Granola injoignable");
    }
  }, []);

  useEffect(() => {
    void refresh();
    const t = setInterval(() => void refresh(), 20000);
    return () => clearInterval(t);
  }, [refresh]);

  const saveConfig = useCallback(async () => {
    setBusy(true);
    setNotice(null);
    try {
      const body: Record<string, string> = {};
      if (apiKey.trim()) body.apiKey = apiKey.trim();
      if (signingSecret.trim()) body.signingSecret = signingSecret.trim();
      if (publicBaseUrl.trim()) body.publicBaseUrl = publicBaseUrl.trim();
      const r = await fetch(`${API}/config`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (j?.ok) {
        setApiKey("");
        setSigningSecret("");
        setPublicBaseUrl("");
        setNotice("Configuration enregistrée.");
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  }, [apiKey, signingSecret, publicBaseUrl, refresh]);

  const registerWebhook = useCallback(async () => {
    setBusy(true);
    setNotice(null);
    try {
      const r = await fetch(`${API}/register-webhook`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scopes: ["personal", "public"] }),
      });
      const j = await r.json();
      if (j?.ok) {
        setNotice(
          j.secretStored
            ? "Webhook enregistré côté Granola — signing secret stocké automatiquement."
            : "Webhook enregistré côté Granola.",
        );
      } else {
        setNotice(`Échec : ${j?.error || r.status}`);
      }
      await refresh();
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  const copyUrl = useCallback(async () => {
    if (!info?.url) return;
    try {
      await navigator.clipboard.writeText(info.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard indisponible */
    }
  }, [info]);

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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Granola</h1>
        <p className="text-sm text-muted-foreground">
          Recevez vos notes de réunion Granola directement ici : collez l'URL
          webhook dans Granola (Settings → Connectors → Webhooks) et chaque
          note générée ou éditée est synchronisée automatiquement.
        </p>
      </div>

      {error ? (
        <Card className="border-destructive p-4 text-sm text-destructive">
          {error}
        </Card>
      ) : null}
      {notice ? <Card className="p-4 text-sm">{notice}</Card> : null}

      <Card className="flex flex-col gap-3 p-4">
        <h2 className="text-base font-semibold">Adresse webhook</h2>
        {info?.url ? (
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-md bg-muted p-2 text-xs">
              {info.url}
            </code>
            <Button size="sm" variant="outline" onClick={copyUrl}>
              {copied ? "Copié !" : "Copier"}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Renseignez l'origine publique (publicBaseUrl) pour composer l'URL
            webhook.
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge variant={info?.apiKeyConfigured ? "default" : "outline"}>
            Clé API {info?.apiKeyConfigured ? "configurée" : "manquante"}
          </Badge>
          <Badge variant={info?.signingSecretConfigured ? "default" : "outline"}>
            Signature {info?.signingSecretConfigured ? "vérifiée" : "non configurée"}
          </Badge>
          {info?.webhookEndpointId ? (
            <Badge variant="secondary">Endpoint {info.webhookEndpointId}</Badge>
          ) : null}
        </div>
        <div>
          <Button
            size="sm"
            onClick={registerWebhook}
            disabled={busy || !info?.apiKeyConfigured || !info?.url}
          >
            Enregistrer le webhook via l'API Granola
          </Button>
        </div>
      </Card>

      <Card className="flex flex-col gap-3 p-4">
        <h2 className="text-base font-semibold">Configuration</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">
              Clé API Granola {config?.apiKey ? `(actuelle : ${config.apiKey})` : ""}
            </label>
            <Input
              type="password"
              placeholder="grn_…"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">
              Signing secret{" "}
              {config?.signingSecret ? `(actuel : ${config.signingSecret})` : ""}
            </label>
            <Input
              type="password"
              placeholder="whsec_…"
              value={signingSecret}
              onChange={(e) => setSigningSecret(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">
              Origine publique (HTTPS)
            </label>
            <Input
              placeholder={config?.publicBaseUrl || "https://crm.exemple.fr"}
              value={publicBaseUrl}
              onChange={(e) => setPublicBaseUrl(e.target.value)}
            />
          </div>
        </div>
        <div>
          <Button
            size="sm"
            onClick={saveConfig}
            disabled={
              busy ||
              (!apiKey.trim() && !signingSecret.trim() && !publicBaseUrl.trim())
            }
          >
            Enregistrer
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
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
              <div className="truncate text-sm font-medium">
                {n.title || n.id}
              </div>
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

        <div className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            Livraisons webhook ({events.length})
          </h2>
          {events.length === 0 ? (
            <Card className="p-4 text-sm text-muted-foreground">
              Aucune livraison reçue.
            </Card>
          ) : null}
          {events.map((e) => (
            <Card key={e.event_id} className="p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{e.event_type}</span>
                <div className="flex items-center gap-1">
                  <Badge variant={e.verified ? "default" : "outline"}>
                    {e.verified ? "signée" : "non vérifiée"}
                  </Badge>
                  {e.deliveries > 1 ? (
                    <Badge variant="secondary">×{e.deliveries}</Badge>
                  ) : null}
                </div>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {e.note_id || "—"} · {fmtDate(e.received_at)}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
