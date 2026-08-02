"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Inbox,
  Loader2,
  Mail,
  MailOpen,
  Paperclip,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@creezio/shell-ui/ui/kit";
import { Input } from "@creezio/shell-ui/ui/kit";
import { ScrollArea } from "@creezio/shell-ui/ui/kit";
import { cn } from "@creezio/shell-ui";

type EmailRow = {
  id: string;
  from_addr: string;
  to_addr: string;
  subject: string;
  received_at: string;
  read_at: string | null;
  has_attachments: number;
  preview: string | null;
};

type AttachmentMeta = {
  id: string;
  filename: string;
  content_type: string;
  size_bytes: number;
};

type EmailDetail = EmailRow & {
  text_body: string | null;
  html_body: string | null;
  attachments: AttachmentMeta[];
};

export type MailInboxProps = {
  /** Base API (défaut `/api/v1/email`). */
  apiBase?: string;
  /** Override hint empty-state (sinon `/meta.emptyStateNoDomainHint`). */
  emptyStateNoDomainHint?: string;
};

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: d.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}

function fromLabel(from: string): string {
  const m = from.match(/^"?([^"<]+)"?\s*<|^([^<@]+)/);
  const name = (m?.[1] || m?.[2] || from).trim();
  return name || from;
}

function stripHtmlPreview(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function MailInbox(props: MailInboxProps = {}) {
  const apiBase = (props.apiBase || "/api/v1/email").replace(/\/$/, "");
  const [rows, setRows] = useState<EmailRow[]>([]);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [domain, setDomain] = useState<string | null>(null);
  const [emptyHint, setEmptyHint] = useState(
    props.emptyStateNoDomainHint ||
      "Réservez un tunnel pour activer une adresse mail d'instance.",
  );
  const [q, setQ] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<EmailDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadMeta = useCallback(async () => {
    try {
      const r = await fetch(`${apiBase}/meta`);
      if (!r.ok) return;
      const j = await r.json();
      setDomain(j.domain || null);
      if (!props.emptyStateNoDomainHint && j.emptyStateNoDomainHint) {
        setEmptyHint(String(j.emptyStateNoDomainHint));
      }
    } catch {
      /* ignore */
    }
  }, [apiBase, props.emptyStateNoDomainHint]);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "80" });
      if (q.trim()) params.set("q", q.trim());
      if (unreadOnly) params.set("unread", "1");
      const r = await fetch(`${apiBase}?${params}`);
      const j = await r.json();
      setRows(j.rows || []);
      setTotal(j.total || 0);
      setUnread(j.unread || 0);
    } finally {
      setLoading(false);
    }
  }, [apiBase, q, unreadOnly]);

  const loadDetail = useCallback(
    async (id: string) => {
      setDetailLoading(true);
      try {
        const r = await fetch(`${apiBase}/${id}`);
        if (!r.ok) {
          setDetail(null);
          return;
        }
        const j = (await r.json()) as EmailDetail;
        setDetail(j);
        if (!j.read_at) {
          await fetch(`${apiBase}/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ read: true }),
          });
          setRows((prev) =>
            prev.map((row) =>
              row.id === id ? { ...row, read_at: new Date().toISOString() } : row,
            ),
          );
          setUnread((u) => Math.max(0, u - 1));
          setDetail((d) =>
            d && d.id === id ? { ...d, read_at: new Date().toISOString() } : d,
          );
        }
      } finally {
        setDetailLoading(false);
      }
    },
    [apiBase],
  );

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    const t = window.setTimeout(() => void loadList(), 180);
    return () => window.clearTimeout(t);
  }, [loadList]);

  useEffect(() => {
    if (selectedId != null) void loadDetail(selectedId);
    else setDetail(null);
  }, [selectedId, loadDetail]);

  async function toggleRead() {
    if (!detail) return;
    setBusy(true);
    try {
      const read = !detail.read_at;
      const r = await fetch(`${apiBase}/${detail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read }),
      });
      if (r.ok) {
        const j = await r.json();
        setDetail(j);
        setRows((prev) =>
          prev.map((row) =>
            row.id === detail.id ? { ...row, read_at: j.read_at } : row,
          ),
        );
        void loadList();
      }
    } finally {
      setBusy(false);
    }
  }

  async function removeSelected() {
    if (!detail) return;
    setBusy(true);
    try {
      const r = await fetch(`${apiBase}/${detail.id}`, { method: "DELETE" });
      if (r.ok) {
        setSelectedId(null);
        setDetail(null);
        await loadList();
      }
    } finally {
      setBusy(false);
    }
  }

  const bodyHtml = detail?.html_body?.trim();
  const bodyText = detail?.text_body?.trim();

  return (
    <div className="flex h-[calc(100vh-8.5rem)] min-h-[420px] flex-col overflow-hidden rounded-2xl border border-[#e6e0d4] bg-white/80 shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b border-[#ebe4d8] px-4 py-3">
        <div className="flex items-center gap-2 text-[#14182f]">
          <Inbox className="h-4 w-4 text-sky-600" />
          <span className="text-sm font-semibold">Boîte de réception</span>
          {unread > 0 && (
            <span className="rounded-md bg-sky-100 px-1.5 py-0.5 text-[11px] font-semibold text-sky-800">
              {unread}
            </span>
          )}
        </div>
        {domain && <p className="text-xs text-[#5c6478]">*@{domain}</p>}
        <div className="relative ml-auto w-full max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#9aa1b2]" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher…"
            className="h-9 border-[#e6e0d4] bg-[#faf7f1]/60 pl-8"
          />
        </div>
        <button
          type="button"
          onClick={() => setUnreadOnly((v) => !v)}
          className={cn(
            "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
            unreadOnly
              ? "bg-[#14182f] text-white"
              : "bg-[#f3eee4] text-[#5c6478] hover:bg-[#ebe4d8]",
          )}
        >
          Non lus
        </button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => void loadList()}
          title="Actualiser"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
        </Button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(260px,34%)_1fr]">
        <div className="min-h-0 border-b border-[#ebe4d8] md:border-b-0 md:border-r">
          <ScrollArea className="h-full">
            {loading && rows.length === 0 ? (
              <div className="flex items-center justify-center gap-2 p-10 text-sm text-[#5c6478]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement…
              </div>
            ) : rows.length === 0 ? (
              <div className="space-y-2 p-8 text-center">
                <Mail className="mx-auto h-8 w-8 text-[#c9c2b4]" />
                <p className="text-sm font-medium text-[#14182f]">Aucun mail</p>
                <p className="text-xs text-[#5c6478]">
                  {domain
                    ? `Les messages envoyés à *@${domain} apparaîtront ici.`
                    : emptyHint}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-[#f0ebe1]">
                {rows.map((row) => {
                  const active = selectedId === row.id;
                  const unreadRow = !row.read_at;
                  return (
                    <li key={row.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(row.id)}
                        className={cn(
                          "flex w-full flex-col gap-0.5 px-4 py-3 text-left transition-colors",
                          active ? "bg-sky-50" : "hover:bg-[#faf7f1]",
                          unreadRow && "bg-[#fffaf3]",
                        )}
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span
                            className={cn(
                              "truncate text-sm",
                              unreadRow
                                ? "font-semibold text-[#14182f]"
                                : "font-medium text-[#3a4158]",
                            )}
                          >
                            {fromLabel(row.from_addr)}
                          </span>
                          <span className="shrink-0 text-[11px] tabular-nums text-[#9aa1b2]">
                            {formatWhen(row.received_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "truncate text-[13px]",
                              unreadRow
                                ? "font-medium text-[#14182f]"
                                : "text-[#5c6478]",
                            )}
                          >
                            {row.subject || "(sans objet)"}
                          </span>
                          {row.has_attachments > 0 && (
                            <Paperclip className="h-3 w-3 shrink-0 text-[#9aa1b2]" />
                          )}
                        </div>
                        {row.preview && (
                          <p className="truncate text-xs text-[#9aa1b2]">
                            {stripHtmlPreview(row.preview)}
                          </p>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </ScrollArea>
          <p className="border-t border-[#ebe4d8] px-4 py-2 text-[11px] text-[#9aa1b2]">
            {total.toLocaleString("fr-FR")} message{total > 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex min-h-0 flex-col bg-[#fcfbf8]">
          {!selectedId ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
              <MailOpen className="h-10 w-10 text-[#d5cec0]" />
              <p className="text-sm text-[#5c6478]">Sélectionnez un message</p>
            </div>
          ) : detailLoading && !detail ? (
            <div className="flex flex-1 items-center justify-center gap-2 text-sm text-[#5c6478]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Ouverture…
            </div>
          ) : detail ? (
            <>
              <div className="flex flex-wrap items-start gap-3 border-b border-[#ebe4d8] px-5 py-4">
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold tracking-tight text-[#14182f]">
                    {detail.subject || "(sans objet)"}
                  </h2>
                  <p className="mt-1 text-sm text-[#3a4158]">
                    <span className="font-medium">
                      {fromLabel(detail.from_addr)}
                    </span>
                    <span className="text-[#9aa1b2]">
                      {" "}
                      &lt;{detail.from_addr}&gt;
                    </span>
                  </p>
                  <p className="mt-0.5 text-xs text-[#9aa1b2]">
                    À {detail.to_addr} · {formatWhen(detail.received_at)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={busy}
                    onClick={() => void toggleRead()}
                  >
                    {detail.read_at ? "Marquer non lu" : "Marquer lu"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-red-600 hover:text-red-700"
                    disabled={busy}
                    onClick={() => void removeSelected()}
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {detail.attachments?.length > 0 && (
                <div className="flex flex-wrap gap-2 border-b border-[#ebe4d8] px-5 py-3">
                  {detail.attachments.map((att) => (
                    <a
                      key={att.id}
                      href={`${apiBase}/${detail.id}/attachments/${att.id}`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-[#e6e0d4] bg-white px-2.5 py-1.5 text-xs text-[#3a4158] transition-colors hover:border-sky-300 hover:text-sky-800"
                    >
                      <Paperclip className="h-3 w-3" />
                      {att.filename}
                      <span className="text-[#9aa1b2]">
                        ({Math.max(1, Math.round(att.size_bytes / 1024))} Ko)
                      </span>
                    </a>
                  ))}
                </div>
              )}

              <ScrollArea className="min-h-0 flex-1">
                <div className="px-5 py-4">
                  {bodyHtml ? (
                    <div
                      className="prose prose-sm max-w-none text-[#14182f] prose-a:text-sky-700"
                      dangerouslySetInnerHTML={{ __html: bodyHtml }}
                    />
                  ) : bodyText ? (
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-[#14182f]">
                      {bodyText}
                    </pre>
                  ) : (
                    <p className="text-sm text-[#9aa1b2]">(message vide)</p>
                  )}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-[#5c6478]">
              Message introuvable
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
