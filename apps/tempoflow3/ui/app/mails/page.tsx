/** creezio:owned-by-brand */
"use client";

import { useEffect, useState } from "react";
import { metierBase } from "@/lib/metier-base";

type Mail = {
  id: string;
  to?: string;
  subject?: string;
  status?: string;
  body?: string;
};

export default function Page() {
  const base = metierBase();
  const [mails, setMails] = useState<Mail[]>([]);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function reload() {
    const res = await fetch(`${base}/api/v1/platform/platform-mails/list`, {
      headers: { "x-creezio-user-id": "ui-user" },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || res.statusText);
    setMails(data.mails || []);
  }

  useEffect(() => {
    void reload().catch((e) =>
      setError(e instanceof Error ? e.message : String(e)),
    );
  }, [base]);

  async function createDraft(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch(`${base}/api/v1/platform/platform-mails/draft`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-creezio-user-id": "ui-user",
      },
      body: JSON.stringify({ to, subject, body }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || res.statusText);
      return;
    }
    setTo("");
    setSubject("");
    setBody("");
    setMsg(`Brouillon ${data.mail?.id?.slice(0, 8)}`);
    await reload();
  }

  async function send(id: string) {
    setError(null);
    const res = await fetch(
      `${base}/api/v1/platform/platform-mails/${id}/send`,
      {
        method: "POST",
        headers: { "x-creezio-user-id": "ui-user" },
      },
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || res.statusText);
      return;
    }
    setMsg(`Envoyé ${id.slice(0, 8)}`);
    await reload();
  }

  return (
    <section>
      <h1>Mails</h1>
      <p>Inbox / brouillons OS (`@creezio/mails` file-sink).</p>
      <form
        onSubmit={(e) => void createDraft(e)}
        style={{ display: "grid", gap: "0.5rem", maxWidth: 480 }}
      >
        <input
          required
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="À"
        />
        <input
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Sujet"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Corps"
          rows={4}
        />
        <button type="submit">Créer brouillon</button>
      </form>
      {error ? <p style={{ color: "#8b1e1e" }}>{error}</p> : null}
      {msg ? <p style={{ color: "#0f3d32" }}>{msg}</p> : null}
      <ul>
        {mails.map((m) => (
          <li key={m.id} style={{ marginBottom: "0.5rem" }}>
            <strong>{m.subject}</strong> → {m.to} [{m.status || "draft"}]
            {m.status !== "sent" && m.status !== "queued" ? (
              <button type="button" onClick={() => void send(m.id)}>
                Envoyer
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      {!mails.length ? <p>Aucun mail.</p> : null}
    </section>
  );
}
