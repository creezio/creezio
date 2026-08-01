"use client";

import { useEffect, useState } from "react";

type Task = { id: string; title: string; status?: string; body?: string };

export default function Page() {
  const base =
    process.env.NEXT_PUBLIC_METIER_BASE_URL || "http://127.0.0.1:18791";
  const [tasks, setTasks] = useState<Task[]>([]);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    const res = await fetch(`${base}/api/v1/platform/platform-tasks/list`, {
      headers: { "x-creezio-user-id": "ui-user" },
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || res.statusText);
      return;
    }
    setTasks(data.tasks || []);
    setError(null);
  }

  useEffect(() => {
    void reload();
  }, []);

  async function createTask(ev: React.FormEvent) {
    ev.preventDefault();
    const res = await fetch(`${base}/api/v1/platform/platform-tasks/create`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-creezio-user-id": "ui-user",
      },
      body: JSON.stringify({ title }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || res.statusText);
      return;
    }
    setTitle("");
    await reload();
  }

  return (
    <section>
      <h1>Tâches (OS Creezio)</h1>
      <p>Monté par le kit — pas de logique tâches dans la marque.</p>
      <form onSubmit={createTask}>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Nouvelle tâche"
        />
        <button type="submit">Créer</button>
      </form>
      {error ? <p style={{ color: "#8b1e1e" }}>{error}</p> : null}
      <ul>
        {tasks.map((t) => (
          <li key={t.id}>
            {t.title} — {t.status || "open"}
          </li>
        ))}
      </ul>
    </section>
  );
}
